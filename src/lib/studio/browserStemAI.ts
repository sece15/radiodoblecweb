import type { StemsSeparationResult } from "@/types/studio";

export interface BrowserAISeparationOptions {
  modelUrl?: string;
  windowStartSec?: number;
  windowDurationSec?: number;
  baseStems?: StemsSeparationResult;
  /** Si es true, solo ejecuta IA en el navegador si el modelo ONNX ya está en caché local (evita descargas lentas en cortes cortos). */
  cachedOnly?: boolean;
  /** Tiempo máximo en ms antes de hacer fallback automático al separador DSP instantáneo. */
  timeoutMs?: number;
  onProgress?: (progress: number, stage: string) => void;
}

export interface BrowserAISeparationOutcome {
  stems: StemsSeparationResult;
  backend: "webgpu" | "wasm";
}

const DEFAULT_PUBLIC_ONNX_MODEL_URL =
  "https://huggingface.co/sece24/radio-doble-c-stems/resolve/main/htdemucs_embedded.onnx";
const MODEL_CACHE_NAME = "c-studio-onnx-models-v1";
const YT_AUDIO_CACHE_NAME = "c-studio-yt-audio-v1";

/**
 * Verifica si el modelo ONNX ya existe en CacheStorage del navegador
 * para decidir si la separación IA será instantánea sin descargar ~170 MB.
 */
export async function isOnnxModelCached(modelUrl?: string): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  const resolved = getConfiguredOnnxModelUrl(modelUrl);
  if (!resolved) return false;
  try {
    const cache = await caches.open(MODEL_CACHE_NAME);
    const match = await cache.match(resolved);
    return Boolean(match && match.ok);
  } catch {
    return false;
  }
}

/**
 * Guarda audio binario de YouTube en la Cache API del navegador del usuario
 * para reutilizarlo al instante sin volver a consultar gateways externos.
 */
export async function saveYouTubeAudioToBrowserCache(
  youtubeId: string,
  data: ArrayBuffer,
  contentType = "audio/mpeg"
): Promise<void> {
  if (typeof caches === "undefined" || !youtubeId) return;
  try {
    const cache = await caches.open(YT_AUDIO_CACHE_NAME);
    const key = `/__c_studio_yt_cache__/${encodeURIComponent(youtubeId)}`;
    await cache.put(
      key,
      new Response(data.slice(0), {
        headers: { "Content-Type": contentType },
      })
    );
  } catch {
    // Ignorar si el navegador restringe Cache API
  }
}

/**
 * Recupera audio binario de YouTube previamente guardado en la PC del usuario.
 */
export async function loadYouTubeAudioFromBrowserCache(youtubeId: string): Promise<ArrayBuffer | null> {
  if (typeof caches === "undefined" || !youtubeId) return null;
  try {
    const cache = await caches.open(YT_AUDIO_CACHE_NAME);
    const key = `/__c_studio_yt_cache__/${encodeURIComponent(youtubeId)}`;
    const match = await cache.match(key);
    if (match && match.ok) {
      return await match.arrayBuffer();
    }
  } catch {}
  return null;
}

export async function clearYouTubeAudioFromBrowserCache(youtubeId: string): Promise<void> {
  if (typeof caches === "undefined" || !youtubeId) return;
  try {
    const cache = await caches.open(YT_AUDIO_CACHE_NAME);
    const key = `/__c_studio_yt_cache__/${encodeURIComponent(youtubeId)}`;
    await cache.delete(key);
  } catch {}
}

/**
 * Exporta un AudioBuffer (completo o un corte [startSec, endSec]) a formato WAV PCM 16-bit
 * para descargarlo directamente a la PC del usuario.
 */
export function encodeAudioBufferToWavBlob(
  buffer: AudioBuffer,
  startSec = 0,
  endSec?: number
): Blob {
  const sr = buffer.sampleRate;
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const startSample = Math.max(0, Math.min(buffer.length - 1, Math.floor(startSec * sr)));
  const endSample =
    endSec !== undefined
      ? Math.max(startSample + 1, Math.min(buffer.length, Math.floor(endSec * sr)))
      : buffer.length;
  const frameCount = endSample - startSample;

  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < frameCount; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][startSample + i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([wavBuffer], { type: "audio/wav" });
}

function getConfiguredOnnxModelUrl(overrideUrl?: string): string | null {
  const url = overrideUrl ?? process.env.NEXT_PUBLIC_STEMS_ONNX_MODEL_URL ?? DEFAULT_PUBLIC_ONNX_MODEL_URL;
  return url && url.trim().length > 0 ? url.trim() : null;
}

function createStereoAudioBuffer(
  sampleRate: number,
  left: Float32Array,
  right: Float32Array,
  totalLength?: number,
  startSample = 0,
  baseBuffer?: AudioBuffer | null
): AudioBuffer {
  const outLen = totalLength ?? left.length;
  const ctx = new OfflineAudioContext(2, outLen, sampleRate);
  const buffer = ctx.createBuffer(2, outLen, sampleRate);

  if (baseBuffer && baseBuffer.length === outLen) {
    buffer.copyToChannel(new Float32Array(baseBuffer.getChannelData(0)), 0);
    buffer.copyToChannel(
      new Float32Array(
        baseBuffer.numberOfChannels > 1 ? baseBuffer.getChannelData(1) : baseBuffer.getChannelData(0)
      ),
      1
    );
  }

  const outL = buffer.getChannelData(0);
  const outR = buffer.getChannelData(1);
  const copyLen = Math.min(left.length, Math.max(0, outLen - startSample));
  if (copyLen > 0) {
    outL.set(left.subarray(0, copyLen), startSample);
    outR.set(right.subarray(0, copyLen), startSample);
  }
  return buffer;
}

/**
 * Ejecuta separación de stems con IA (onnxruntime-web: WebGPU / WASM)
 * dentro de un Web Worker en la PC del usuario sin cargar el servidor VPS.
 * Retorna null si no hay modelo ONNX configurado o si el dispositivo no lo soporta,
 * permitiendo hacer fallback limpio al separador DSP de Web Audio.
 */
export async function separateAudioInBrowserWorker(
  sourceBuffer: AudioBuffer,
  options: BrowserAISeparationOptions = {}
): Promise<BrowserAISeparationOutcome | null> {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return null;
  }

  const modelUrl = getConfiguredOnnxModelUrl(options.modelUrl);
  if (!modelUrl) {
    return null;
  }

  if (options.cachedOnly) {
    const hasCached = await isOnnxModelCached(modelUrl);
    if (!hasCached) {
      return null;
    }
  }

  const sr = sourceBuffer.sampleRate;
  const totalSamples = sourceBuffer.length;
  const startSample =
    options.windowStartSec !== undefined
      ? Math.max(0, Math.min(totalSamples - 1, Math.floor(options.windowStartSec * sr)))
      : 0;
  const windowSamples =
    options.windowDurationSec !== undefined
      ? Math.max(1, Math.min(totalSamples - startSample, Math.floor(options.windowDurationSec * sr)))
      : totalSamples - startSample;
  const endSample = startSample + windowSamples;

  const fullLeft = sourceBuffer.getChannelData(0);
  const fullRight =
    sourceBuffer.numberOfChannels > 1 ? sourceBuffer.getChannelData(1) : sourceBuffer.getChannelData(0);

  const leftCopy = new Float32Array(fullLeft.subarray(startSample, endSample));
  const rightCopy = new Float32Array(fullRight.subarray(startSample, endSample));

  const worker = new Worker(new URL("../../workers/stemSeparator.worker.ts", import.meta.url), {
    type: "module",
  });

  const requestId = `stem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    return await new Promise<BrowserAISeparationOutcome | null>((resolve) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let settled = false;
      const cleanup = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        try {
          worker.terminate();
        } catch {}
      };

      if (options.timeoutMs && options.timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          if (settled) return;
          settled = true;
          console.warn(`[BrowserStemAI] Timeout (${options.timeoutMs}ms), fallback a DSP`);
          cleanup();
          resolve(null);
        }, options.timeoutMs);
      }

      worker.onmessage = (event: MessageEvent) => {
        if (settled) return;
        const data = event.data;
        if (!data || data.id !== requestId) return;

        if (data.type === "progress") {
          options.onProgress?.(data.progress ?? 0, data.stage ?? "Procesando...");
          return;
        }

        if (data.type === "result" && data.stems) {
          const outSr = data.sampleRate || sourceBuffer.sampleRate;
          const stems: StemsSeparationResult = {
            drums: createStereoAudioBuffer(
              outSr,
              data.stems.drums.left,
              data.stems.drums.right,
              totalSamples,
              startSample,
              options.baseStems?.drums
            ),
            bass: createStereoAudioBuffer(
              outSr,
              data.stems.bass.left,
              data.stems.bass.right,
              totalSamples,
              startSample,
              options.baseStems?.bass
            ),
            melody: createStereoAudioBuffer(
              outSr,
              data.stems.melody.left,
              data.stems.melody.right,
              totalSamples,
              startSample,
              options.baseStems?.melody
            ),
            vocals: createStereoAudioBuffer(
              outSr,
              data.stems.vocals.left,
              data.stems.vocals.right,
              totalSamples,
              startSample,
              options.baseStems?.vocals
            ),
            durationSec: sourceBuffer.duration,
            sampleRate: outSr,
          };
          settled = true;
          cleanup();
          resolve({ stems, backend: data.backend === "webgpu" ? "webgpu" : "wasm" });
          return;
        }

        if (data.type === "error") {
          console.warn("[BrowserStemAI] Fallback a DSP:", data.error);
          settled = true;
          cleanup();
          resolve(null);
        }
      };

      worker.onerror = (err) => {
        if (settled) return;
        console.warn("[BrowserStemAI] Worker error, fallback a DSP:", err.message);
        settled = true;
        cleanup();
        resolve(null);
      };

      worker.postMessage(
        {
          type: "separate",
          id: requestId,
          modelUrl,
          sampleRate: sourceBuffer.sampleRate,
          leftChannel: leftCopy,
          rightChannel: rightCopy,
        },
        [leftCopy.buffer, rightCopy.buffer]
      );
    });
  } catch {
    try {
      worker.terminate();
    } catch {}
    return null;
  }
}

/**
 * Solicita captura de audio de la pestaña actual del navegador (getDisplayMedia)
 * para grabar en vivo la reproducción de YouTube sin depender de servidores externos.
 */
export async function requestTabAudioStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Tu navegador no soporta captura de audio de pestaña.");
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
    preferCurrentTab: true,
  } as DisplayMediaStreamOptions);

  // Detenemos el track de video de inmediato; solo necesitamos el audio de la pestaña
  for (const vTrack of stream.getVideoTracks()) {
    vTrack.stop();
    stream.removeTrack(vTrack);
  }

  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    throw new Error("Marca la casilla 'Compartir audio de la pestaña' en la ventana del navegador.");
  }

  return new MediaStream(audioTracks);
}

/**
 * Decodifica un Blob grabado por MediaRecorder a un AudioBuffer listo para editar y separar stems.
 */
export async function decodeMediaBlobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  } finally {
    await ctx.close().catch(() => {});
  }
}
