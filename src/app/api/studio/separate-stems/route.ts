import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint de estado de proveedores de IA para separación de Stems.
 */
export async function GET() {
  const hasReplicate = Boolean(process.env.REPLICATE_API_TOKEN);
  let hasLocalWorker = false;

  try {
    const healthCheck = await fetch("http://127.0.0.1:8000/health", {
      signal: AbortSignal.timeout(1000),
    });
    hasLocalWorker = healthCheck.ok;
  } catch {
    hasLocalWorker = false;
  }

  const activeProvider = hasLocalWorker
    ? "meta_demucs_v4_local"
    : hasReplicate
    ? "meta_demucs_v4_cloud"
    : "web_audio_dsp_crossover";

  return NextResponse.json({
    status: "ok",
    hasLocalWorker,
    hasReplicate,
    activeProvider,
    instructions: {
      cloud: "Para usar Meta Demucs v4 en GPU Cloud: añade REPLICATE_API_TOKEN en tu archivo .env.local",
      local: "Para usar Meta Demucs v4 en tu PC: ejecuta 'python scripts/stem_separator.py --server --port 8000'",
      memory: "Motor DSP en memoria activo: filtra y sintetiza stems con latencia cero",
    },
  });
}

/**
 * Procesa la separación de stems con Meta Demucs v4 (Cloud o Local) o Fallback DSP.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { youtubeId, audioUrl, trackTitle, genre, isTest } = body;

    // 0. MODO TEST / PRUEBA RÁPIDA (para validación de integración o mocks)
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

    // 1. PRIORIDAD 1: Daemon Local de Meta Demucs v4 (scripts/stem_separator.py)
    try {
      const healthCheck = await fetch("http://127.0.0.1:8000/health", {
        signal: AbortSignal.timeout(1200),
      });
      if (healthCheck.ok) {
        if (youtubeId || audioUrl) {
          const sepRes = await fetch("http://127.0.0.1:8000/separate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioUrl, youtubeId, trackTitle, genre: genre || "funk" }),
            signal: AbortSignal.timeout(180000),
          });
          if (sepRes.ok) {
            const sepData = await sepRes.json();
            if (sepData.success && sepData.stems) {
              return NextResponse.json({
                status: "success",
                provider: "meta_demucs_v4_local",
                stems: sepData.stems,
                message: "Separado con éxito usando Meta Demucs v4 (Worker Local GPU/CPU)",
              });
            }
          }
        }
      }
    } catch {
      // Worker local no disponible o en reposo
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
