// Dynamic organic listener model
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function displayListeners(raw: number, now: number): number {
  // Hora de Lima (UTC-5)
  const limaOffsetMs = 5 * 3600 * 1000;
  const limaDate = new Date(now - limaOffsetMs);
  const hourFrac = limaDate.getUTCHours() + limaDate.getUTCMinutes() / 60;

  // 1. Envolvente circadiana diurna (Lima UTC-5)
  // Madrugada (04:00) valle profundo (~2-8 oyentes)
  // Mañana (10:00) subida gradual (~14-25 oyentes)
  // Tarde (15:00) tarde activa (~26-42 oyentes)
  // Noche (20:30) prime time pico (~38-55 oyentes)
  // Medianoche (01:00) bajada (~10-18 oyentes)
  const diurnal = Math.sin(((hourFrac - 10.0) / 24.0) * 2 * Math.PI);
  const nightBoost = Math.exp(-Math.pow(hourFrac - 20.5, 2) / 10.0) * 16.0;
  const dawnDrop = Math.exp(-Math.pow(hourFrac - 4.0, 2) / 8.0) * 14.0;

  const base = 24.0 + diurnal * 12.0 + nightBoost - dawnDrop;

  // 2. Macro-oleadas de ~48 minutos (programas, sets en vivo o temas virales que duran media hora)
  const waveMacro = Math.sin((now / (48 * 60000)) * 2 * Math.PI) * 11.0;

  // 3. Flujo y rotación de bloques ("se van 10 y se queda en 22")
  const waveBlock = Math.sin((now / (21 * 60000)) * 2 * Math.PI + 1.6) * 6.5;

  // 4. Valle ocasional ("baja a 2 no se por 5 min luego va subiendo"):
  // Cada ~85 minutos, durante 5 a 6 minutos se produce un momento valle
  const valleyKernel = Math.cos((now / (85 * 60000)) * 2 * Math.PI);
  let valleyFactor = 1.0;
  if (valleyKernel > 0.88) {
    const intensity = (valleyKernel - 0.88) / 0.12;
    const smooth = Math.sin((intensity * Math.PI) / 2);
    valleyFactor = 1.0 - smooth * 0.85; // reduce hasta 85% llevando el número a 2 - 5 oyentes
  }

  // 5. Micro-fluctuaciones naturales de 25-50 segundos (±1 o ±2 oyentes)
  const micro = Math.sin(now / 26000) * 1.6 + Math.sin(now / 51000 + 1.1) * 0.9;

  const total = (base + waveMacro + waveBlock + micro) * valleyFactor;
  let calculated = Math.round(total);

  // 6. Integración transparente con tráfico real raw de Icecast
  if (raw >= 50) {
    // Si la estación supera 50 oyentes reales, se prioriza el conteo real
    calculated = Math.round(raw + Math.max(0, micro));
  } else if (raw > 5 && raw > calculated) {
    calculated = Math.round(raw + Math.abs(micro));
  }

  // Límites orgánicos: mínimo 2 oyentes, máximo 56
  return Math.max(2, Math.min(56, calculated));
}

export async function GET() {
  const baseUrl = process.env.AZURACAST_URL || process.env.NEXT_PUBLIC_AZURACAST_URL;
  if (!baseUrl) return NextResponse.json({ error: "Radio no disponible." }, { status: 503 });

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/nowplaying`, {
      next: { revalidate: 15 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Radio unavailable");
    const stations = await response.json();
    const station = Array.isArray(stations) ? stations[0] : null;
    if (!station || typeof station !== "object") throw new Error("Invalid radio response");

    const count = station.listeners?.current;
    if (typeof count !== "number" || !Number.isFinite(count) || count < 0) {
      throw new Error("Invalid listener count");
    }
    const song = station.now_playing?.song;
    const text = (value: unknown) => typeof value === "string" ? value : "";
    const artwork = text(song?.art);
    const art = artwork.startsWith("/") ? new URL(artwork, baseUrl).toString() : artwork;
    // Only expose the fields used by the player, with the final display count.
    return NextResponse.json([{
      listeners: { current: displayListeners(Math.floor(count), Date.now()) },
      live: { is_live: Boolean(station.live?.is_live), streamer_name: text(station.live?.streamer_name) },
      now_playing: { song: {
        title: text(song?.title), artist: text(song?.artist),
        album: text(song?.album), art,
      } },
    }], { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo consultar la radio." }, { status: 502 });
  }
}
