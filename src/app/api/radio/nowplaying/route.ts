import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function displayListeners(raw: number, now: number) {
  if (raw >= 100) return raw;
  const weight = (1 - raw / 100) ** 3;
  const center = raw === 0 ? 16 : Math.round(raw + (3 * raw + 2) * weight);
  const min = raw === 0 ? 10 : Math.max(raw, Math.round(raw + 2 * raw * weight));
  const max = raw === 0 ? 35 : Math.min(99, Math.round(raw + (5 * raw + 10) * weight));
  const spread = Math.ceil(4 * weight);
  // A shared time bucket keeps the number consistent across visitors.
  const bucket = Math.floor(now / 7000);
  const seed = Math.sin(bucket * 12.9898) * 43758.5453;
  const variation = Math.floor((seed - Math.floor(seed)) * (spread * 2 + 1)) - spread;
  return Math.min(max, Math.max(min, center + variation));
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
