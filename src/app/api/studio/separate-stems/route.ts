import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

type SeparatedStemsMap = {
  drums: string;
  bass: string;
  melody: string;
  vocals: string;
};

// Deduplicación en vuelo por youtubeId para evitar lanzar Demucs dos veces sobre la misma canción
const inFlightSeparations = new Map<string, Promise<SeparatedStemsMap | null>>();

function isValidYouTubeId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{6,20}$/.test(id);
}

async function getCachedStemsFromDisk(youtubeId: string): Promise<SeparatedStemsMap | null> {
  const baseDir = path.join(process.cwd(), "public", "stems_cache", `yt_${youtubeId}`, "htdemucs", "input");
  const files = ["drums.wav", "bass.wav", "other.wav", "vocals.wav"];
  try {
    await Promise.all(files.map((f) => access(path.join(baseDir, f))));
    const prefix = `/stems_cache/yt_${youtubeId}/htdemucs/input`;
    return {
      drums: `${prefix}/drums.wav`,
      bass: `${prefix}/bass.wav`,
      melody: `${prefix}/other.wav`,
      vocals: `${prefix}/vocals.wav`,
    };
  } catch {
    return null;
  }
}

function runLocalPythonDemucs(youtubeId: string): Promise<SeparatedStemsMap | null> {
  const existing = inFlightSeparations.get(youtubeId);
  if (existing) return existing;

  const task = new Promise<SeparatedStemsMap | null>((resolve) => {
    const scriptPath = path.join(process.cwd(), "scripts", "stem_separator.py");
    const child = spawn("python", [scriptPath, "--youtube-id", youtubeId, "--json"], {
      cwd: process.cwd(),
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdoutData = "";
    let stderrData = "";
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {}
      resolve(null);
    }, 300000); // 5 minutos máximo para descarga + separación IA en CPU

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutData += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderrData += chunk.toString();
    });

    child.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        if (stderrData) {
          console.warn("[separate-stems] Python Demucs stderr:", stderrData.slice(-500));
        }
        resolve(null);
        return;
      }

      try {
        const lines = stdoutData.trim().split(/\r?\n/).filter(Boolean);
        const lastLine = lines[lines.length - 1];
        const parsed = JSON.parse(lastLine);
        if (parsed?.success && parsed?.stems) {
          resolve(parsed.stems as SeparatedStemsMap);
          return;
        }
      } catch {}
      resolve(null);
    });
  }).finally(() => {
    inFlightSeparations.delete(youtubeId);
  });

  inFlightSeparations.set(youtubeId, task);
  return task;
}

/**
 * Endpoint de estado de proveedores de IA para separación de Stems.
 * En producción (VPS de AzuraCast) el procesamiento pesado en servidor está desactivado
 * por defecto para proteger la transmisión en vivo y delegar el cómputo a la PC del usuario.
 */
export async function GET() {
  const allowServerDemucs =
    process.env.NODE_ENV !== "production" || process.env.ENABLE_SERVER_DEMUCS === "true";
  const hasReplicate = Boolean(process.env.REPLICATE_API_TOKEN);
  let hasLocalWorker = false;

  if (allowServerDemucs) {
    try {
      const healthCheck = await fetch("http://127.0.0.1:8010/health", {
        signal: AbortSignal.timeout(1000),
      });
      hasLocalWorker = healthCheck.ok;
    } catch {
      try {
        await access(path.join(process.cwd(), "scripts", "stem_separator.py"));
        hasLocalWorker = true;
      } catch {
        hasLocalWorker = false;
      }
    }
  }

  const activeProvider = hasLocalWorker
    ? "meta_demucs_v4_local"
    : hasReplicate
    ? "meta_demucs_v4_cloud"
    : "web_audio_dsp_crossover";

  return NextResponse.json({
    status: "ok",
    allowServerDemucs,
    hasLocalWorker,
    hasReplicate,
    activeProvider,
    instructions: {
      clientPc:
        "Para usar Meta Demucs v4 en tu propia PC sin cargar el servidor: ejecuta 'python scripts/stem_separator.py --server --port 8010'",
      cloud: "Para usar Meta Demucs v4 en GPU Cloud: añade REPLICATE_API_TOKEN en tu archivo .env.local",
      memory: "Motor DSP en navegador activo: separa los 4 stems en la PC del usuario sin carga al VPS",
    },
  });
}

/**
 * Procesa la separación de stems en 4 canales (Bajo, Batería, Melodía, Voz)
 * descargando de YouTube con yt-dlp + separando con Meta Demucs v4.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { youtubeId, audioUrl, trackTitle, genre, isTest } = body;

    // 0. MODO TEST / PRUEBA RÁPIDA
    if (Boolean(isTest)) {
      return NextResponse.json({
        status: "success",
        provider: "synthetic_test",
        stems: {
          drums: "/samples/stems/test_drums.wav",
          bass: "/samples/stems/test_bass.wav",
          melody: "/samples/stems/test_melody.wav",
          vocals: "/samples/stems/test_vocals.wav",
        },
        genre: typeof genre === "string" ? genre : "funk",
        message: "Modo test activo: stems sintéticos verificados con éxito",
      });
    }

    const allowServerDemucs =
      process.env.NODE_ENV !== "production" || process.env.ENABLE_SERVER_DEMUCS === "true";

    if (allowServerDemucs) {
      // 0.5 CACHÉ EN DISCO INSTANTÁNEA (si ya se separó antes este YouTube ID)
      if (isValidYouTubeId(youtubeId)) {
        const diskStems = await getCachedStemsFromDisk(youtubeId);
        if (diskStems) {
          return NextResponse.json({
            status: "success",
            provider: "meta_demucs_v4_local",
            cached: true,
            stems: diskStems,
            message: "4 canales cargados desde caché local de Meta Demucs v4",
          });
        }
      }

      // 1. PRIORIDAD 1: Worker FastAPI de Meta Demucs v4 (configurado vía DEMUCS_WORKER_URL)
      const demucsWorkerUrl = (process.env.DEMUCS_WORKER_URL || "").trim().replace(/\/+$/, "");
      if (demucsWorkerUrl) {
        try {
          const healthCheck = await fetch(`${demucsWorkerUrl}/health`, {
            signal: AbortSignal.timeout(1200),
          });
          if (healthCheck.ok) {
            if (youtubeId || audioUrl) {
              const sepRes = await fetch(`${demucsWorkerUrl}/separate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audioUrl, youtubeId, trackTitle, genre: genre || "funk" }),
                signal: AbortSignal.timeout(300000),
              });
              if (sepRes.ok) {
                const sepData = await sepRes.json();
                if (sepData.success && sepData.stems) {
                  return NextResponse.json({
                    status: "success",
                    provider: "meta_demucs_v4_local",
                    stems: sepData.stems,
                    message: "Separado en 4 canales con Meta Demucs v4 (Worker)",
                  });
                }
              }
            }
          }
        } catch {
          // Worker remoto/local no disponible; continuamos a ejecución directa bajo demanda
        }
      }

      // 1.5 EJECUCIÓN DIRECTA BAJO DEMANDA: yt-dlp + Meta Demucs v4 (htdemucs)
      if (isValidYouTubeId(youtubeId)) {
        const localStems = await runLocalPythonDemucs(youtubeId);
        if (localStems) {
          return NextResponse.json({
            status: "success",
            provider: "meta_demucs_v4_local",
            cached: false,
            stems: localStems,
            message: "Descargado con yt-dlp y separado en 4 canales (Bajo, Batería, Melodía, Voz) con Meta Demucs v4",
          });
        }
      }
    }

    // 2. PRIORIDAD 2: Replicate API Cloud con Meta HTDemucs v4
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (replicateToken && (audioUrl || youtubeId)) {
      try {
        // Obtenemos URL de audio directa para Replicate
        let inputAudio = audioUrl;
        if (!inputAudio && youtubeId) {
          inputAudio = `https://www.youtube.com/watch?v=${youtubeId}`;
        }

        if (inputAudio) {
          // Iniciar predicción en Replicate (cjwbw/demucs v4)
          const repRes = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
              Authorization: `Token ${replicateToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              version: "25a173bb03f31ad042d1e7d80e6b614c0c715443763e735495dd60773785043c",
              input: {
                audio: inputAudio,
                stem: "none", // 4 stems completos
                shifts: 1,
              },
            }),
            signal: AbortSignal.timeout(8000),
          });

          if (repRes.ok) {
            const prediction = await repRes.json();
            const pollUrl = prediction.urls?.get;
            let status = prediction.status;

            const startTime = Date.now();
            while (status !== "succeeded" && status !== "failed" && status !== "canceled") {
              if (Date.now() - startTime > 45000) break;
              await new Promise((resolve) => setTimeout(resolve, 2000));
              const pollRes = await fetch(pollUrl, {
                headers: { Authorization: `Token ${replicateToken}` },
                signal: AbortSignal.timeout(5000),
              });
              if (!pollRes.ok) break;
              const pollData = await pollRes.json();
              status = pollData.status;

              if (status === "succeeded" && pollData.output) {
                return NextResponse.json({
                  status: "success",
                  provider: "meta_demucs_v4_cloud",
                  stems: {
                    drums: pollData.output.drums,
                    bass: pollData.output.bass,
                    melody: pollData.output.other,
                    vocals: pollData.output.vocals,
                  },
                  message: "Separación completada con Meta Demucs v4 (Nube Replicate GPU A100)",
                });
              }
            }
          }
        }
      } catch (repErr) {
        console.warn("Replicate API Demucs error:", repErr);
      }
    }

    // 3. RESPUESTA ESTÁNDAR / DSP EN MEMORIA
    return NextResponse.json({
      status: "ready_browser_dsp",
      provider: "web_audio_dsp_crossover",
      message: "Motor DSP en memoria activo. Para activar Demucs v4 con IA, agrega REPLICATE_API_TOKEN en tu .env.local o ejecuta el servidor local.",
      hasReplicate: Boolean(replicateToken),
      youtubeId,
      trackTitle,
      genre: typeof genre === "string" ? genre : "funk",
      stems: ["drums", "bass", "melody", "vocals"],
      colors: {
        drums: "#00E5FF",
        bass: "#CCFF00",
        melody: "#FF007A",
        vocals: "#FFD600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Error en el servidor de stems", details: String(err) },
      { status: 500 }
    );
  }
}
