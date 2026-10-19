import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function displayListeners(raw: number, now: number): number {
  // Hora de Lima (UTC-5)
  const limaOffsetMs = 5 * 3600 * 1000;
  const limaDate = new Date(now - limaOffsetMs);
  const hour = limaDate.getUTCHours() + limaDate.getUTCMinutes() / 60;

  // Curva diurna (pico entre las 11:00 y las 22:00, valle de madrugada entre 2:00 y 6:00)
  const diurnal = Math.sin(((hour - 7) / 24) * 2 * Math.PI); // pico ~13h (+1), valle ~1h (-1)
  const diurnalShift = diurnal * 5; // -5 a +5 según la hora del día

  // Ondas sinusoidales continuas de ciclo suave (sin saltos bruscos)
  const wave15m = Math.sin(now / 900000) * 4.2;      // Variación de 15 minutos (flujo general)
  const wave3m  = Math.sin(now / 210000 + 1.3) * 2.8; // Variación de 3.5 minutos (cambios de tema)
  const wave40s = Math.sin(now / 45000 + 2.7) * 1.4;  // Micro-ondulación de 45 segundos

  const baseCenter = 28; // Punto medio del rango 18 - 42
  const organicVariation = diurnalShift + wave15m + wave3m + wave40s;

  let calculated: number;
  if (raw <= 2) {
    // Si la radio tiene pocos oyentes directos, genera la audiencia creíble
    calculated = Math.round(baseCenter + organicVariation + raw);
  } else if (raw < 50) {
    // Escala natural sumando el tráfico real
    calculated = Math.round(baseCenter + organicVariation * 0.7 + raw * 1.15);
  } else {
    // Si la radio supera 50 oyentes reales, se prioriza el conteo real
    calculated = Math.round(raw + Math.max(0, organicVariation * 0.3));
  }

  // Garantizar que se mantenga en el rango activo y creíble [18, 42] durante tráfico base
  const floorMin = raw >= 35 ? raw : 18;
  const ceilMax  = raw >= 35 ? raw + 15 : 42;
  return Math.min(ceilMax, Math.max(floorMin, calculated));
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
