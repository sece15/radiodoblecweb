import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint de streaming en memoria para C-Sampler y C-Digger.
 *
 * Extrae el audio real de la canción de YouTube seleccionada en C-Digger
 * utilizando múltiples gateways de alta velocidad (Invidious, Cobalt, Piped, Worker Local)
 * para cargarlo en el AudioBuffer de Web Audio en memoria RAM.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const youtubeId = searchParams.get("youtubeId");
  const bpm = parseInt(searchParams.get("bpm") || "95", 10);
  const key = searchParams.get("key") || "Am";
  const genre = searchParams.get("genre") || "funk";

  if (!youtubeId) {
    return NextResponse.json(
      { error: "Parámetro youtubeId es obligatorio" },
      { status: 400 }
    );
  }

  // 1. GATEWAY PRIORIDAD 1: Invidious Instances (Formatos de audio puros con alta tasa de éxito)
  const invidiousInstances = [
    `https://invidious.nerdvpn.de/api/v1/videos/${youtubeId}`,
    `https://yewtu.be/api/v1/videos/${youtubeId}`,
    `https://invidious.jing.rocks/api/v1/videos/${youtubeId}`,
    `https://invidious.private.coffee/api/v1/videos/${youtubeId}`,
    `https://iv.ggtyler.dev/api/v1/videos/${youtubeId}`,
    `https://invidious.projectsegfau.lt/api/v1/videos/${youtubeId}`,
    `https://inv.nadeko.net/api/v1/videos/${youtubeId}`,
  ];

  for (const gateway of invidiousInstances) {
    try {
      const res = await fetch(gateway, {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        const formats = data.adaptiveFormats || [];
        const audioStreams = formats.filter((f: { type?: string; mimeType?: string }) => {
          const type = f.type || f.mimeType || "";
          return type.includes("audio");
        });

        if (audioStreams.length > 0) {
          // Preferir formatos opus o mp4a con audio bitrate medio/alto
          const bestAudio = audioStreams[audioStreams.length - 1] || audioStreams[0];
          const directUrl = bestAudio?.url;
          if (directUrl) {
            const audioStreamRes = await fetch(directUrl, {
              headers: { "User-Agent": "Mozilla/5.0" },
              signal: AbortSignal.timeout(8000),
            });
            if (audioStreamRes.ok && audioStreamRes.body) {
              return new Response(audioStreamRes.body, {
                headers: {
                  "Content-Type": audioStreamRes.headers.get("Content-Type") || "audio/webm",
                  "Cache-Control": "public, max-age=86400",
                  "X-Sample-Source": "invidious-stream",
                },
              });
            }
          }
        }
      }
    } catch {
      // Probar siguiente gateway
    }
  }

  // 2. GATEWAY PRIORIDAD 2: Cobalt API (Extractor de audio MP3 de YouTube)
  const cobaltGateways = [
    "https://api.cobalt.tools",
    "https://co.wuk.sh",
    "https://cobalt-api.kwiatekm.tokyo",
  ];

  for (const cobaltHost of cobaltGateways) {
    try {
      const cRes = await fetch(cobaltHost, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${youtubeId}`,
          downloadMode: "audio",
          audioFormat: "mp3",
        }),
        signal: AbortSignal.timeout(3500),
      });

      if (cRes.ok) {
        const cData = await cRes.json();
        const directAudioUrl = cData.url;
        if (directAudioUrl) {
          const audioStreamRes = await fetch(directAudioUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(8000),
          });
          if (audioStreamRes.ok && audioStreamRes.body) {
            return new Response(audioStreamRes.body, {
              headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=86400",
                "X-Sample-Source": "cobalt-audio",
              },
            });
          }
        }
      }
    } catch {
      // Probar siguiente gateway
    }
  }

  // 3. GATEWAY PRIORIDAD 3: Piped Instances
  const pipedGateways = [
    `https://api.piped.privacy.com.de/streams/${youtubeId}`,
    `https://pipedapi.tokhmi.xyz/streams/${youtubeId}`,
    `https://piped-api.lunar.icu/streams/${youtubeId}`,
  ];

  for (const gateway of pipedGateways) {
    try {
      const res = await fetch(gateway, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const data = await res.json();
        const audioStreams = data.audioStreams || [];
        if (audioStreams.length > 0 && audioStreams[0].url) {
          const audioStreamRes = await fetch(audioStreams[0].url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(8000),
          });
          if (audioStreamRes.ok && audioStreamRes.body) {
            return new Response(audioStreamRes.body, {
              headers: {
                "Content-Type": audioStreamRes.headers.get("Content-Type") || "audio/webm",
                "Cache-Control": "public, max-age=86400",
                "X-Sample-Source": "piped-stream",
              },
            });
          }
        }
      }
    } catch {
      // Continuar
    }
  }

  // Fallback: Si todos los gateways de red externa fallan, indicar síntesis
  return NextResponse.json(
    {
      status: "synthesize_memory",
      source: "web-audio-engine",
      youtubeId,
      bpm,
      key,
      genre,
      message: "Gateway externo de YouTube en reposo. Para separar la canción exacta usa Meta Demucs v4 (Replicate o Worker Local) o sube el archivo de audio.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
