/// <reference lib="webworker" />
import * as ort from "onnxruntime-web";

const MODEL_CACHE_NAME = "c-studio-onnx-models-v1";

type SeparateRequestMessage = {
  type: "separate";
  id: string;
  modelUrl: string;
  sampleRate: number;
  leftChannel: Float32Array;
  rightChannel: Float32Array;
  chunkDurationSec?: number;
};

let cachedSessionUrl: string | null = null;
let cachedSession: ort.InferenceSession | null = null;
let activeBackend: "webgpu" | "wasm" = "wasm";

async function fetchWithProgressAndDecompress(
  modelUrl: string,
  onDownloadProgress?: (pct: number, loadedMb: number, totalMb: number | null) => void
): Promise<ArrayBuffer> {
  const res = await fetch(modelUrl);
  if (!res.ok) {
    throw new Error(`No se pudo descargar el modelo ONNX (${res.status})`);
  }

  const contentLength = Number(res.headers.get("content-length") || "0");
  const totalMb = contentLength > 0 ? contentLength / (1024 * 1024) : null;

  let rawBuffer: ArrayBuffer;
  if (res.body && onDownloadProgress) {
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.byteLength;
        const loadedMb = loaded / (1024 * 1024);
        const pct = contentLength > 0 ? Math.min(100, Math.round((loaded / contentLength) * 100)) : 50;
        onDownloadProgress(pct, loadedMb, totalMb);
      }
    }

    const merged = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    rawBuffer = merged.buffer;
  } else {
    rawBuffer = await res.arrayBuffer();
  }

  // Si el archivo viene comprimido (.onnx.gz), descomprimir nativamente en el navegador
  const isGzipUrl = modelUrl.toLowerCase().split("?")[0].endsWith(".gz");
  if (isGzipUrl && typeof DecompressionStream !== "undefined") {
    const ds = new DecompressionStream("gzip");
    const decompressedStream = new Response(rawBuffer).body!.pipeThrough(ds);
    return await new Response(decompressedStream).arrayBuffer();
  }

  return rawBuffer;
}

async function loadModelBufferWithCache(
  modelUrl: string,
  onDownloadProgress?: (pct: number, loadedMb: number, totalMb: number | null) => void
): Promise<ArrayBuffer> {
  if (typeof caches !== "undefined") {
    try {
      const cache = await caches.open(MODEL_CACHE_NAME);
      const cachedRes = await cache.match(modelUrl);
      if (cachedRes && cachedRes.ok) {
        return await cachedRes.arrayBuffer();
      }

      const decompressedBuffer = await fetchWithProgressAndDecompress(modelUrl, onDownloadProgress);
      // Guardamos el modelo ya descomprimido en caché para que los próximos arranques sean instantáneos
      await cache.put(
        modelUrl,
        new Response(decompressedBuffer.slice(0), {
          headers: { "Content-Type": "application/octet-stream" },
        })
      );
      return decompressedBuffer;
    } catch {
      // Fallback directo si Cache API está restringida (ej. modo incógnito estricto)
    }
  }

  return await fetchWithProgressAndDecompress(modelUrl, onDownloadProgress);
}

async function getOrCreateSession(
  modelUrl: string,
  onDownloadProgress?: (pct: number, loadedMb: number, totalMb: number | null) => void
): Promise<ort.InferenceSession> {
  if (cachedSession && cachedSessionUrl === modelUrl) {
    return cachedSession;
  }

  const modelBytes = await loadModelBufferWithCache(modelUrl, onDownloadProgress);
  const providers: Array<"webgpu" | "wasm"> =
    typeof navigator !== "undefined" && "gpu" in navigator ? ["webgpu", "wasm"] : ["wasm"];

  for (const provider of providers) {
    try {
      const session = await ort.InferenceSession.create(modelBytes, {
        executionProviders: [provider],
        graphOptimizationLevel: "all",
      });
      cachedSession = session;
      cachedSessionUrl = modelUrl;
      activeBackend = provider;
      return session;
    } catch {
      // Intentar siguiente proveedor (ej. WebGPU -> WASM)
    }
  }

  throw new Error("No se pudo inicializar onnxruntime-web (ni WebGPU ni WASM)");
}

const DEMUCS_SEGMENT_SAMPLES = 343980;
const DEMUCS_N_FFT = 4096;
const DEMUCS_HOP = 1024;
const DEMUCS_BINS = 2048;
const DEMUCS_FRAMES = 336;

// Ventana de Hann precalculada y tablas Radix-2 FFT para STFT [1, 4, 2048, 336]
const HANN_WINDOW = (() => {
  const w = new Float32Array(DEMUCS_N_FFT);
  for (let i = 0; i < DEMUCS_N_FFT; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / DEMUCS_N_FFT));
  }
  return w;
})();

function fftInPlace(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wReStep = Math.cos(angle);
    const wImStep = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j = 0; j < half; j++) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + half] * wRe - im[i + j + half] * wIm;
        const vIm = re[i + j + half] * wIm + im[i + j + half] * wRe;
        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + half] = uRe - vRe;
        im[i + j + half] = uIm - vIm;
        const nextRe = wRe * wReStep - wIm * wImStep;
        wIm = wRe * wImStep + wIm * wReStep;
        wRe = nextRe;
      }
    }
  }
}

function computeDemucsSpectrogram(left: Float32Array, right: Float32Array): Float32Array {
  // Shape [1, 4, 2048, 336]: canales = [L_re, L_im, R_re, R_im]
  const out = new Float32Array(4 * DEMUCS_BINS * DEMUCS_FRAMES);
  const halfFft = DEMUCS_N_FFT >> 1;
  const norm = 1 / Math.sqrt(DEMUCS_N_FFT);
  const re = new Float32Array(DEMUCS_N_FFT);
  const im = new Float32Array(DEMUCS_N_FFT);

  const processChannel = (ch: Float32Array, chBaseIdx: number) => {
    for (let f = 0; f < DEMUCS_FRAMES; f++) {
      const center = f * DEMUCS_HOP;
      const start = center - halfFft;
      re.fill(0);
      im.fill(0);
      for (let k = 0; k < DEMUCS_N_FFT; k++) {
        const idx = start + k;
        const sample = idx >= 0 && idx < ch.length ? ch[idx] : 0;
        re[k] = sample * HANN_WINDOW[k];
      }
      fftInPlace(re, im);
      for (let b = 0; b < DEMUCS_BINS; b++) {
        const outIdxRe = (chBaseIdx * DEMUCS_BINS + b) * DEMUCS_FRAMES + f;
        const outIdxIm = ((chBaseIdx + 1) * DEMUCS_BINS + b) * DEMUCS_FRAMES + f;
        out[outIdxRe] = re[b] * norm;
        out[outIdxIm] = im[b] * norm;
      }
    }
  };

  processChannel(left, 0);
  processChannel(right, 2);
  return out;
}

function extractStemPair(
  outputData: Float32Array,
  dims: readonly number[],
  stemIdx: number,
  chunkLen: number,
  strideLen: number
): { left: Float32Array; right: Float32Array } {
  const left = new Float32Array(chunkLen);
  const right = new Float32Array(chunkLen);

  // Formato [1, 4, 2, strideLen] (Demucs estándar)
  if (dims.length === 4 && dims[1] >= 4 && dims[2] === 2) {
    const stemOffset = stemIdx * 2 * strideLen;
    left.set(outputData.subarray(stemOffset, stemOffset + chunkLen));
    right.set(outputData.subarray(stemOffset + strideLen, stemOffset + strideLen + chunkLen));
    return { left, right };
  }

  // Formato [1, 2, strideLen] cuando cada stem es un tensor de salida separado
  if (dims.length === 3 && dims[1] === 2) {
    left.set(outputData.subarray(0, chunkLen));
    right.set(outputData.subarray(strideLen, strideLen + chunkLen));
    return { left, right };
  }

  return { left, right };
}

self.onmessage = async (event: MessageEvent<SeparateRequestMessage>) => {
  const msg = event.data;
  if (!msg || msg.type !== "separate") return;

  try {
    self.postMessage({ type: "progress", id: msg.id, progress: 2, stage: "Verificando modelo IA en caché local..." });
    const session = await getOrCreateSession(msg.modelUrl, (dlPct, loadedMb, totalMb) => {
      const totalTxt = totalMb ? `${totalMb.toFixed(0)} MB` : "...";
      const overallPct = Math.min(35, 2 + Math.round(dlPct * 0.33));
      self.postMessage({
        type: "progress",
        id: msg.id,
        progress: overallPct,
        stage: `Descargando modelo IA (${loadedMb.toFixed(1)} / ${totalTxt})...`,
      });
    });

    const totalSamples = msg.leftChannel.length;
    const hasDualInput = session.inputNames.length >= 2 && session.inputNames.includes("x");
    const chunkSamples = hasDualInput
      ? DEMUCS_SEGMENT_SAMPLES
      : Math.max(msg.sampleRate * 4, Math.floor((msg.chunkDurationSec ?? 8) * msg.sampleRate));
    const totalChunks = Math.max(1, Math.ceil(totalSamples / chunkSamples));

    const outDrumsL = new Float32Array(totalSamples);
    const outDrumsR = new Float32Array(totalSamples);
    const outBassL = new Float32Array(totalSamples);
    const outBassR = new Float32Array(totalSamples);
    const outMelodyL = new Float32Array(totalSamples);
    const outMelodyR = new Float32Array(totalSamples);
    const outVocalsL = new Float32Array(totalSamples);
    const outVocalsR = new Float32Array(totalSamples);

    const inputName = session.inputNames.includes("input") ? "input" : session.inputNames[0];

    for (let c = 0; c < totalChunks; c++) {
      const start = c * chunkSamples;
      const end = Math.min(totalSamples, start + chunkSamples);
      const len = end - start;
      const strideLen = hasDualInput ? DEMUCS_SEGMENT_SAMPLES : len;

      const leftChunk = new Float32Array(strideLen);
      const rightChunk = new Float32Array(strideLen);
      leftChunk.set(msg.leftChannel.subarray(start, end));
      rightChunk.set(msg.rightChannel.subarray(start, end));

      const stereoInput = new Float32Array(2 * strideLen);
      stereoInput.set(leftChunk, 0);
      stereoInput.set(rightChunk, strideLen);

      const feeds: Record<string, ort.Tensor> = {
        [inputName]: new ort.Tensor("float32", stereoInput, [1, 2, strideLen]),
      };

      if (hasDualInput) {
        const specData = computeDemucsSpectrogram(leftChunk, rightChunk);
        feeds["x"] = new ort.Tensor("float32", specData, [1, 4, DEMUCS_BINS, DEMUCS_FRAMES]);
      }

      const outputs = await session.run(feeds);

      // Orden Demucs estándar: 0=drums, 1=bass, 2=other(melody), 3=vocals
      const outputNames = session.outputNames;
      let drums: { left: Float32Array; right: Float32Array };
      let bass: { left: Float32Array; right: Float32Array };
      let melody: { left: Float32Array; right: Float32Array };
      let vocals: { left: Float32Array; right: Float32Array };

      if (outputNames.length >= 4) {
        const t0 = outputs[outputNames[0]];
        const t1 = outputs[outputNames[1]];
        const t2 = outputs[outputNames[2]];
        const t3 = outputs[outputNames[3]];
        drums = extractStemPair(t0.data as Float32Array, t0.dims, 0, len, strideLen);
        bass = extractStemPair(t1.data as Float32Array, t1.dims, 0, len, strideLen);
        melody = extractStemPair(t2.data as Float32Array, t2.dims, 0, len, strideLen);
        vocals = extractStemPair(t3.data as Float32Array, t3.dims, 0, len, strideLen);
      } else {
        // Buscar la salida en dominio del tiempo [1, 4, 2, samples] (ej. add_67 en htdemucs_embedded)
        const timeOutputName =
          outputNames.find((name) => {
            const d = outputs[name]?.dims;
            return d && d.length === 4 && d[1] >= 4 && d[2] === 2;
          }) || outputNames[0];
        const combined = outputs[timeOutputName];
        const data = combined.data as Float32Array;
        drums = extractStemPair(data, combined.dims, 0, len, strideLen);
        bass = extractStemPair(data, combined.dims, 1, len, strideLen);
        melody = extractStemPair(data, combined.dims, 2, len, strideLen);
        vocals = extractStemPair(data, combined.dims, 3, len, strideLen);
      }

      outDrumsL.set(drums.left, start);
      outDrumsR.set(drums.right, start);
      outBassL.set(bass.left, start);
      outBassR.set(bass.right, start);
      outMelodyL.set(melody.left, start);
      outMelodyR.set(melody.right, start);
      outVocalsL.set(vocals.left, start);
      outVocalsR.set(vocals.right, start);

      const pct = Math.min(98, Math.round(((c + 1) / totalChunks) * 90) + 8);
      self.postMessage({
        type: "progress",
        id: msg.id,
        progress: pct,
        stage: `Separando en tu PC (${activeBackend.toUpperCase()}) ${c + 1}/${totalChunks}...`,
      });
    }

    const transferables: Transferable[] = [
      outDrumsL.buffer,
      outDrumsR.buffer,
      outBassL.buffer,
      outBassR.buffer,
      outMelodyL.buffer,
      outMelodyR.buffer,
      outVocalsL.buffer,
      outVocalsR.buffer,
    ];

    self.postMessage(
      {
        type: "result",
        id: msg.id,
        backend: activeBackend,
        sampleRate: msg.sampleRate,
        stems: {
          drums: { left: outDrumsL, right: outDrumsR },
          bass: { left: outBassL, right: outBassR },
          melody: { left: outMelodyL, right: outMelodyR },
          vocals: { left: outVocalsL, right: outVocalsR },
        },
      },
      transferables
    );
  } catch (err) {
    self.postMessage({
      type: "error",
      id: msg.id,
      error: err instanceof Error ? err.message : "Error en inferencia ONNX en navegador",
    });
  }
};
