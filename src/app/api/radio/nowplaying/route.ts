import { NextResponse } from "next/server";
import type { NowPlayingStationPayload } from "@/types/radio";

export const dynamic = "force-dynamic";

// Caché en memoria para evitar saturar AzuraCast con consultas innecesarias
let cachedPayload: NowPlayingStationPayload[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 15000; // 15 segundos

export async function GET() {
  const baseUrl =
    process.env.AZURACAST_URL ||
    process.env.NEXT_PUBLIC_AZURACAST_URL || "";

  if (!baseUrl) {
    return NextResponse.json({ error: "Radio no disponible." }, { status: 503 });
  }

  const now = Date.now();
  if (cachedPayload && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json(cachedPayload, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    });
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/nowplaying`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error("Radio unavailable");
    const stations = await response.json();
    const station = Array.isArray(stations) ? stations[0] : null;
    if (!station || typeof station !== "object") throw new Error("Invalid radio response");

    const isLive = Boolean(station.live?.is_live);
    const rawCount = station.listeners?.current;
    if (typeof rawCount !== "number" || !Number.isFinite(rawCount) || rawCount < 0) {
      throw new Error("Invalid listener count");
    }

    // Regla basada en hechos reales: si hay oyentes reales, se multiplica x4
    const realCount = Math.floor(rawCount);
    const finalCount = realCount > 0 ? realCount * 4 : 0;

    const song = station.now_playing?.song;
    const text = (value: unknown) => (typeof value === "string" ? value : "");
    const artwork = text(song?.art);
    const art = artwork.startsWith("/") ? new URL(artwork, baseUrl).toString() : artwork;

    const payload = [
      {
        listeners: { current: finalCount, real: realCount },
        live: { is_live: isLive, streamer_name: text(station.live?.streamer_name) },
        now_playing: {
          song: {
            title: text(song?.title),
            artist: text(song?.artist),
            album: text(song?.album),
            art,
          },
        },
      },
    ];

    cachedPayload = payload;
    lastFetchTime = now;

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    });
  } catch {
    if (cachedPayload) {
      return NextResponse.json(cachedPayload, {
        headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
      });
    }
    return NextResponse.json({ error: "No se pudo consultar la radio." }, { status: 502 });
  }
}
