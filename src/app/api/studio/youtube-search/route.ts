import { NextRequest, NextResponse } from "next/server";
import type { DiggerTrack, DiggerMiniPad } from "@/types/studio";
import { EXPANDED_CRATE_DATABASE, GENRE_SEARCH_KEYWORDS } from "@/lib/studio/crateEngine";

export const dynamic = "force-dynamic";

// Memoria caché para búsquedas recientes de YouTube (TTL 5 minutos)
const searchCache = new Map<string, { tracks: DiggerTrack[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// Límites estrictos de duración de canciones para muestreo (1 min a 6 min)
const MIN_TRACK_DURATION_SEC = 60;  // 1 minuto
const MAX_TRACK_DURATION_SEC = 360; // 6 minutos máximo (omite canciones/mixes de 30m, 1h, etc.)

// Exclusión masiva de álbumes completos, compilaciones, sets largos y canales comerciales con bloqueo de embed (LatinAutor, UMPG, Vevo)
const NEGATIVE_CRATE_EXCLUSIONS =
  '-"full album" -"complete album" -"full vinyl" -"album completo" -"discografia" -"mix" -"compilation" -"playlist" -"session" -"1 hour" -"2 hour" -"30 min" -"45 min" -"side a" -"side b" -"dj mix" -"mixtape" -"vinyl set" -"vinyl session" -"all vinyl" -"rare grooves" -"breaks" -cover -karaoke -tutorial -review -podcast -vevo -" - Topic" -"provided to youtube" -"auto-generated" -"latinautor" -"umpg" -"universal music" -"sony music" -"warner" -"altafonte" -"the orchard"';

// Lista de IDs bloqueados por Content ID / Sellos discográficos (LatinAutor, UMPG, Sony, Warner)
const KNOWN_BLOCKED_YOUTUBE_IDS = new Set(["rdGMhD8Smbg", "CuHNqaN5CmU", "rhnx7ciyOBg"]);

function isTitleOrArtistExcluded(title: string, channelOrArtist?: string, youtubeId?: string): boolean {
  if (youtubeId && KNOWN_BLOCKED_YOUTUBE_IDS.has(youtubeId)) {
    return true;
  }
  const lower = title.toLowerCase();
  const lowerChannel = (channelOrArtist || "").toLowerCase();

  // Exclusión de álbumes largos, compilaciones, mixtapes y sets
  if (
    lower.includes("full album") ||
    lower.includes("complete album") ||
    lower.includes("full vinyl") ||
    lower.includes("album completo") ||
    lower.includes("discografia") ||
    lower.includes("compilation") ||
    lower.includes("1 hour") ||
    lower.includes("2 hour") ||
    lower.includes("side a") ||
    lower.includes("side b") ||
    lower.includes("30 min") ||
    lower.includes("45 min") ||
    lower.includes("live set") ||
    lower.includes("dj set") ||
    lower.includes("dj mix") ||
    lower.includes("mixtape") ||
    lower.includes("all vinyl") ||
    lower.includes("vinyl set") ||
    lower.includes("vinyl session") ||
    lower.includes("continuous mix") ||
    lower.includes("anthology") ||
    lower.includes("greatest hits") ||
    lower.includes("best of") ||
    lower.includes("part 1") ||
    lower.includes("part 2") ||
    lower.includes("vol.") ||
    lower.includes("vol ") ||
    lower.includes("volume ") ||
    /\b45s\b/.test(lower) ||
    (lower.includes("breaks") && (lower.includes("grooves") || lower.includes("samples") || lower.includes("classics")))
  ) {
    return true;
  }

  // Exclusión de canales comerciales de streaming que bloquean incrustación (LatinAutor, UMPG, VEVO, Topic)
  if (
    lower.includes("vevo") ||
    lower.includes("official video") ||
    lower.includes("latinautor") ||
    lower.includes("umpg") ||
    lower.includes("universal music") ||
    lower.includes("sony music") ||
    lower.includes("warner") ||
    lower.includes("altafonte") ||
    lower.includes("the orchard") ||
    lowerChannel.includes("vevo") ||
    lowerChannel.endsWith("- topic") ||
    lowerChannel.includes("auto-generated") ||
    lowerChannel.includes("latinautor") ||
    lowerChannel.includes("umpg") ||
    lowerChannel.includes("universal music") ||
    lowerChannel.includes("sony music") ||
    lowerChannel.includes("warner") ||
    lowerChannel.includes("altafonte") ||
    lowerChannel.includes("the orchard")
  ) {
    return true;
  }

  return false;
}

const MUSICAL_KEYS = ["Am", "Dm", "Em", "Gm", "Cm", "F#m", "Bm", "C", "G", "F", "D", "A"];

interface YouTubeApiSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    description?: string;
  };
}

interface InvidiousSearchItem {
  videoId?: string;
  title?: string;
  author?: string;
  lengthSeconds?: number;
  viewCount?: number;
  description?: string;
}

interface WebScrapeVideoRenderer {
  videoId?: string;
  title?: { runs?: Array<{ text?: string }> };
  ownerText?: { runs?: Array<{ text?: string }> };
  lengthText?: { simpleText?: string };
  viewCountText?: { simpleText?: string };
}

interface WebScrapeItemSection {
  videoRenderer?: WebScrapeVideoRenderer;
}

interface WebScrapeSection {
  itemSectionRenderer?: {
    contents?: WebScrapeItemSection[];
  };
}

interface WebScrapeInitialData {
  contents?: {
    twoColumnSearchResultsRenderer?: {
      primaryContents?: {
        sectionListRenderer?: {
          contents?: WebScrapeSection[];
        };
      };
    };
  };
}

function estimateBpmAndKey(genre: string, title: string): { bpm: number; key: string } {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const key = MUSICAL_KEYS[absHash % MUSICAL_KEYS.length];

  let baseBpm = 94;
  const g = genre.toLowerCase();
  if (g.includes("cumbia") || g.includes("chicha")) baseBpm = 98;
  else if (g.includes("jazz") || g.includes("bossa")) baseBpm = 88;
  else if (g.includes("funk") || g.includes("disco")) baseBpm = 112;
  else if (g.includes("electronic") || g.includes("synth")) baseBpm = 124;
  else if (g.includes("metal") || g.includes("heavy") || g.includes("hard rock")) baseBpm = 138;
  else if (g.includes("pop") || g.includes("italo")) baseBpm = 118;
  else if (g.includes("hip") || g.includes("boombap")) baseBpm = 90;
  else if (g.includes("reggae") || g.includes("dub")) baseBpm = 76;
  else if (g.includes("soul") || g.includes("ballad")) baseBpm = 82;
  else if (g.includes("rock") || g.includes("psych")) baseBpm = 118;
  else if (g.includes("salsa") || g.includes("boogaloo")) baseBpm = 104;
  else if (g.includes("ambient") || g.includes("new age")) baseBpm = 72;
  else if (g.includes("blues") || g.includes("gospel")) baseBpm = 84;
  else if (g.includes("punk")) baseBpm = 146;
  else if (g.includes("mambo")) baseBpm = 106;
  else if (g.includes("lofi") || g.includes("chill")) baseBpm = 84;
  else if (g.includes("classical") || g.includes("baroque")) baseBpm = 78;

  const bpm = baseBpm + (absHash % 17) - 8;
  return { bpm: Math.max(65, Math.min(160, bpm)), key };
}

function parseDurationToSec(durStr?: string): number {
  if (!durStr) return 0;
  const parts = durStr.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return 0;
}

function generateDefaultMiniPads(durationSec: number): DiggerMiniPad[] {
  const dur = Math.max(24, durationSec);
  return [
    { id: 1, timeSec: 0, label: "Intro / Tema", color: "#CCFF00" },
    { id: 2, timeSec: Math.floor(dur * 0.14), label: "Riff / Hook", color: "#FFFFFF" },
    { id: 3, timeSec: Math.floor(dur * 0.28), label: "Percusión Groove", color: "#CCFF00" },
    { id: 4, timeSec: Math.floor(dur * 0.42), label: "Breakbeat Solo", color: "#FFFFFF" },
    { id: 5, timeSec: Math.floor(dur * 0.56), label: "Solo / Arpegio", color: "#CCFF00" },
    { id: 6, timeSec: Math.floor(dur * 0.70), label: "Bajo / Puente", color: "#FFFFFF" },
    { id: 7, timeSec: Math.floor(dur * 0.82), label: "Drop / Clave", color: "#CCFF00" },
    { id: 8, timeSec: Math.floor(dur * 0.92), label: "Remate / Outro", color: "#FFFFFF" },
  ];
}

function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/|\/v\/|\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function extractPlaylistId(input: string): string | null {
  const match = input.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (/^(?:PL|UU|FL|RD|OLAK5uy_)[a-zA-Z0-9_-]{10,}$/.test(input.trim())) {
    return input.trim();
  }
  return null;
}

// Búsqueda de video individual por URL o ID directo
async function fetchDirectVideoTrack(youtubeId: string): Promise<DiggerTrack | null> {
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}&embeds_referring_euri=https%3A%2F%2Fradiodoblec.com%2F&embeds_referring_origin=https%3A%2F%2Fradiodoblec.com`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
    const res = await fetch(oembedUrl, {
      headers: {
        Referer: "https://radiodoblec.com/",
        Origin: "https://radiodoblec.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      const title = data.title || "YouTube Vinyl Track";
      const artist = data.author_name || "Vinilo Raro";
      const { bpm, key } = estimateBpmAndKey("vinyl sample", title);
      const durationSec = 180;

      return {
        id: youtubeId,
        title,
        artist,
        youtubeId,
        genre: "Vinyl Rare Sample",
        decade: "70s",
        country: "",
        bpm,
        key,
        views: "Verificado en YouTube",
        obscurity: "rare",
        description: `Importado directamente desde YouTube: ${title} por ${artist}.`,
        durationSec,
        miniPads: generateDefaultMiniPads(durationSec),
      };
    }
  } catch (err) {
    console.warn("Direct oEmbed fetch error:", err);
  }
  return null;
}

// Extracción masiva de pistas desde una Playlist de YouTube (Ahorra múltiples consultas)
async function fetchPlaylistTracks(
  playlistId: string,
  authCredential?: string,
  isOAuth = false,
  maxResults = 50
): Promise<DiggerTrack[]> {
  // Tier 1: YouTube Data API v3 playlistItems si hay credenciales
  if (authCredential) {
    try {
      const pUrl = isOAuth
        ? `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${maxResults}`
        : `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${maxResults}&key=${authCredential}`;
      const headers: HeadersInit = isOAuth ? { Authorization: `Bearer ${authCredential}` } : {};
      const res = await fetch(pUrl, { headers, signal: AbortSignal.timeout(4500) });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        const validTracks: DiggerTrack[] = [];
        for (const it of items) {
          const yId = it.contentDetails?.videoId || it.snippet?.resourceId?.videoId;
          const title = it.snippet?.title || "";
          const artist = it.snippet?.videoOwnerChannelTitle || it.snippet?.channelTitle || "Vinilo Raro";
          if (!yId || isTitleOrArtistExcluded(title, artist, yId)) continue;
          const { bpm, key } = estimateBpmAndKey("vinyl", title);
          validTracks.push({
            id: yId,
            title,
            artist,
            youtubeId: yId,
            genre: "Vinilo Playlist",
            decade: "70s",
            country: "",
            bpm,
            key,
            views: "YouTube Playlist Track",
            obscurity: "rare",
            description: `Pista de lista de reproducción de vinilos: ${title}`,
            durationSec: 195,
            miniPads: generateDefaultMiniPads(195),
          });
        }
        if (validTracks.length > 0) return validTracks;
      }
    } catch (err) {
      console.warn("PlaylistItems API notice:", err);
    }
  }

  // Tier 2: Invidious Open Gateway Playlists
  const invidiousEndpoints = [
    `https://inv.nadeko.net/api/v1/playlists/${playlistId}`,
    `https://vid.puffyan.us/api/v1/playlists/${playlistId}`,
    `https://yewtu.be/api/v1/playlists/${playlistId}`,
  ];
  for (const ep of invidiousEndpoints) {
    try {
      const res = await fetch(ep, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = await res.json();
        const videos = data.videos || [];
        if (Array.isArray(videos) && videos.length > 0) {
          return videos
            .filter((v: { title?: string; author?: string; videoId?: string }) => {
              return !isTitleOrArtistExcluded(v.title || "", v.author || "", v.videoId || "");
            })
            .slice(0, maxResults)
            .map((v: { videoId?: string; title?: string; author?: string; lengthSeconds?: number }) => {
              const yId = v.videoId || "";
              const title = v.title || "Vinilo Track";
              const artist = v.author || "Vinilo Raro";
              const durationSec = Math.min(MAX_TRACK_DURATION_SEC, Math.max(MIN_TRACK_DURATION_SEC, v.lengthSeconds || 195));
              const { bpm, key } = estimateBpmAndKey("vinyl", title);
              return {
                id: yId,
                title,
                artist,
                youtubeId: yId,
                genre: "Vinilo Playlist",
                decade: "70s",
                country: "",
                bpm,
                key,
                views: "Playlist Vinilos",
                obscurity: "rare",
                description: `Vinilo rescatado de lista de reproducción: ${title}`,
                durationSec,
                miniPads: generateDefaultMiniPads(durationSec),
              };
            });
        }
      }
    } catch {}
  }

  // Tier 3: Parse Web Scrape YouTube Playlist
  try {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
      if (match) {
        const data = JSON.parse(match[1]);
        const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
        const contents = tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;
        if (Array.isArray(contents)) {
          const tracks: DiggerTrack[] = [];
          for (const item of contents) {
            const v = item.playlistVideoRenderer;
            if (v?.videoId) {
              const yId = v.videoId;
              const title = v.title?.runs?.[0]?.text || "Vinilo Track";
              const artist = v.shortBylineText?.runs?.[0]?.text || "Vinilo Raro";
              if (isTitleOrArtistExcluded(title, artist, yId)) continue;
              const durationSec = parseDurationToSec(v.lengthText?.simpleText) || 195;
              const { bpm, key } = estimateBpmAndKey("vinyl", title);
              tracks.push({
                id: yId,
                title,
                artist,
                youtubeId: yId,
                genre: "Vinilo Playlist",
                decade: "70s",
                country: "",
                bpm,
                key,
                views: "YouTube Playlist",
                obscurity: "rare",
                description: `Pista de vinilo en lista de YouTube: ${title}`,
                durationSec,
                miniPads: generateDefaultMiniPads(durationSec),
              });
              if (tracks.length >= maxResults) break;
            }
          }
          if (tracks.length > 0) return tracks;
        }
      }
    }
  } catch (err) {
    console.warn("Playlist scraping notice:", err);
  }

  return [];
}

// Tier 1: YouTube Data API v3 Oficial (Soporta OAuth User Bearer Token o Server API Key)
async function queryYouTubeDataAPI(
  query: string,
  authCredential: string,
  isOAuth = false,
  maxResults = 12
): Promise<DiggerTrack[]> {
  const searchUrl = isOAuth
    ? `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoSyndicated=true&q=${encodeURIComponent(
        query
      )}&maxResults=${maxResults}`
    : `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoSyndicated=true&q=${encodeURIComponent(
        query
      )}&maxResults=${maxResults}&key=${authCredential}`;

  const searchHeaders: HeadersInit = isOAuth
    ? { Authorization: `Bearer ${authCredential}` }
    : {};

  const res = await fetch(searchUrl, {
    headers: searchHeaders,
    signal: AbortSignal.timeout(4500),
  });
  if (!res.ok) return [];

  const data = await res.json();
  const items = data.items || [];
  if (items.length === 0) return [];

  const videoIds = items.map((it: { id?: { videoId?: string } }) => it.id?.videoId).filter(Boolean);

  const durationsMap: Record<string, number> = {};
  try {
    const detailsUrl = isOAuth
      ? `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(",")}`
      : `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(
          ","
        )}&key=${authCredential}`;

    const dRes = await fetch(detailsUrl, {
      headers: searchHeaders,
      signal: AbortSignal.timeout(4000),
    });
    if (dRes.ok) {
      const dData = await dRes.json();
      for (const v of dData.items || []) {
        const iso = v.contentDetails?.duration || "";
        const m = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
        const mins = parseInt(m?.[1] || "0", 10);
        const secs = parseInt(m?.[2] || "0", 10);
        durationsMap[v.id] = mins * 60 + secs || 180;
      }
    }
  } catch {
    // Si falla la consulta de duraciones detalladas, se usa fallback
  }

  const validItems = items.filter((it: YouTubeApiSearchItem) => {
    const yId = it.id?.videoId || "";
    const title = it.snippet?.title || "";
    const channel = it.snippet?.channelTitle || "";
    if (isTitleOrArtistExcluded(title, channel, yId)) return false;

    const durationSec = durationsMap[yId];
    if (durationSec !== undefined) {
      if (durationSec < MIN_TRACK_DURATION_SEC || durationSec > MAX_TRACK_DURATION_SEC) {
        return false;
      }
    }
    return true;
  });

  return validItems.map((it: YouTubeApiSearchItem) => {
    const yId = it.id?.videoId || "";
    const title = it.snippet?.title || "Vinilo YouTube";
    const artist = it.snippet?.channelTitle || "Vinilo Raro";
    const durationSec = Math.min(MAX_TRACK_DURATION_SEC, Math.max(MIN_TRACK_DURATION_SEC, durationsMap[yId] || 195));
    const { bpm, key } = estimateBpmAndKey("vinyl", title);

    return {
      id: yId,
      title,
      artist,
      youtubeId: yId,
      genre: "Vinilo YouTube",
      decade: "70s",
      country: "",
      bpm,
      key,
      views: isOAuth ? "YouTube VIP Feed (OAuth)" : "YouTube Live Feed",
      obscurity: "rare",
      description: it.snippet?.description || `Vinilo encontrado en YouTube: ${title}`,
      durationSec,
      miniPads: generateDefaultMiniPads(durationSec),
    };
  });
}

// Tier 2: Open Gateways (Invidious / Piped)
async function queryYouTubeOpenGateways(query: string, maxResults = 12): Promise<DiggerTrack[]> {
  const instances = [
    `https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
    `https://vid.puffyan.us/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
    `https://yewtu.be/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
  ];

  for (const endpoint of instances) {
    try {
      const res = await fetch(endpoint, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data
            .filter((v: InvidiousSearchItem) => {
              const dur = v.lengthSeconds || 180;
              if (dur < MIN_TRACK_DURATION_SEC || dur > MAX_TRACK_DURATION_SEC) return false;
              if (isTitleOrArtistExcluded(v.title || "", v.author || "", v.videoId || "")) return false;
              return true;
            })
            .slice(0, maxResults)
            .map((v: InvidiousSearchItem) => {
              const yId = v.videoId || "";
              const title = v.title || "Track";
              const artist = v.author || "Vinilo Raro";
              const durationSec = Math.min(MAX_TRACK_DURATION_SEC, Math.max(MIN_TRACK_DURATION_SEC, v.lengthSeconds || 180));
              const { bpm, key } = estimateBpmAndKey("vinyl", title);

              return {
                id: yId,
                title,
                artist,
                youtubeId: yId,
                genre: "Vinilo YouTube",
                decade: "70s",
                country: "",
                bpm,
                key,
                views: `${(v.viewCount || 0).toLocaleString()} vistas`,
                obscurity: (v.viewCount || 0) < 50000 ? "ultra_rare" : "rare",
                description: v.description || `Pista rescatada de vinilo en YouTube: ${title}`,
                durationSec,
                miniPads: generateDefaultMiniPads(durationSec),
              };
            });
        }
      }
    } catch {
      // Intentar con el siguiente gateway
    }
  }

  return [];
}

// Tier 3: Parse Web HTML Search Results (ytInitialData)
async function queryYouTubeWebScrape(query: string, maxResults = 12): Promise<DiggerTrack[]> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return [];

    const html = await res.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (!match) return [];

    const data: WebScrapeInitialData = JSON.parse(match[1]);
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!Array.isArray(contents)) return [];

    const tracks: DiggerTrack[] = [];
    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents;
      if (Array.isArray(items)) {
        for (const item of items) {
          const v = item.videoRenderer;
          if (v?.videoId) {
            const yId = v.videoId;
            const title = v.title?.runs?.[0]?.text || "Vinilo YouTube";
            const artist = v.ownerText?.runs?.[0]?.text || "Vinilo Raro";
            if (isTitleOrArtistExcluded(title, artist, yId)) continue;

            const durStr = v.lengthText?.simpleText;
            const durationSec = parseDurationToSec(durStr);
            if (durationSec < MIN_TRACK_DURATION_SEC || durationSec > MAX_TRACK_DURATION_SEC) continue;

            const { bpm, key } = estimateBpmAndKey("vinyl", title);

            tracks.push({
              id: yId,
              title,
              artist,
              youtubeId: yId,
              genre: "Vinilo YouTube",
              decade: "70s",
              country: "",
              bpm,
              key,
              views: v.viewCountText?.simpleText || "YouTube Live",
              obscurity: "rare",
              description: `Descubierto en la biblioteca global de YouTube: ${title}.`,
              durationSec,
              miniPads: generateDefaultMiniPads(durationSec),
            });

            if (tracks.length >= maxResults) break;
          }
        }
      }
      if (tracks.length >= maxResults) break;
    }

    return tracks;
  } catch (err) {
    console.warn("YouTube web search notice:", err);
    return [];
  }
}

interface SearchParamsInput {
  q: string;
  genre: string;
  decade: string;
  country: string;
  curator: string;
  isRandom: boolean;
  excludeIds: Set<string>;
  maxResults: number;
}

const CRATE_STYLES = [
  "rare groove",
  "jazz funk",
  "library music",
  "chicha peruana",
  "cumbia psicodelica",
  "city pop",
  "bossa nova",
  "mpb",
  "afrobeat",
  "ethio jazz",
  "highlife",
  "zamrock",
  "anatolian rock",
  "italian soundtrack",
  "french library",
  "kosmische musik",
  "boogaloo",
  "salsa dura",
  "soul jazz",
  "spiritual jazz",
  "dub reggae",
  "roots reggae",
  "psychedelic soul",
  "sweet soul",
  "lovers rock",
  "disco boogie",
  "electro funk",
  "synth boogie",
  "samba soul",
  "latin soul",
  "desert blues",
  "organ trio",
  "rhodes funk",
  "jazz fusion",
  "latin jazz",
  "descarga",
  "deep funk",
  "northern soul",
  "modern soul",
  "cosmic disco",
  "cumbia amazonica",
  "acid jazz",
  "modal jazz",
  "folk funk",
];

const CRATE_SCENES_AND_LABELS = [
  "japan",
  "brazil",
  "peru",
  "colombia",
  "nigeria",
  "ghana",
  "ethiopia",
  "france",
  "italy",
  "germany",
  "turkey",
  "uk",
  "jamaica",
  "detroit",
  "philadelphia",
  "chicago",
  "new york",
  "fania",
  "strata east",
  "blue note",
  "infopesa",
  "soundway",
  "analog africa",
  "kpm",
  "de wolfe",
  "cti",
  "private press",
  "obscure",
  "rare",
  "underground",
  "studio one",
  "trojan",
];

const FORMAT_TOKENS = [
  '"33rpm"',
  '"45rpm"',
  '"vinyl single"',
  '"vinyl rip"',
  '"7 inch"',
  '"12 inch"',
  '"lp"',
  '"needle drop"',
  '"instrumental"',
];

function buildRandomCrateQuery(params: Pick<SearchParamsInput, "genre" | "decade" | "country" | "curator">): string {
  const { genre, decade, country, curator } = params;

  const pickedStyle = CRATE_STYLES[Math.floor(Math.random() * CRATE_STYLES.length)];
  const pickedScene = CRATE_SCENES_AND_LABELS[Math.floor(Math.random() * CRATE_SCENES_AND_LABELS.length)];

  let genreQueryToken = "";
  if (genre && genre !== "Todos") {
    const specialized = GENRE_SEARCH_KEYWORDS[genre];
    genreQueryToken = specialized ? specialized : `"${genre}"`;
  }

  let decadeYearToken = "";
  if (decade === "70s") {
    const years70s = ["1970", "1971", "1972", "1973", "1974", "1975", "1976", "1977", "1978", "1979"];
    decadeYearToken = `"${years70s[Math.floor(Math.random() * years70s.length)]}"`;
  } else if (decade === "80s") {
    const years80s = ["1980", "1981", "1982", "1983", "1984", "1985", "1986", "1987", "1988"];
    decadeYearToken = `"${years80s[Math.floor(Math.random() * years80s.length)]}"`;
  } else if (decade === "60s") {
    const years60s = ["1965", "1966", "1967", "1968", "1969"];
    decadeYearToken = `"${years60s[Math.floor(Math.random() * years60s.length)]}"`;
  } else if (decade === "90s") {
    const years90s = ["1990", "1991", "1992", "1993", "1994", "1995"];
    decadeYearToken = `"${years90s[Math.floor(Math.random() * years90s.length)]}"`;
  } else {
    // Año aleatorio amplio para maximizar diversidad diaria cuando no hay filtro de década
    const randomYear = 1966 + Math.floor(Math.random() * 28);
    decadeYearToken = `${randomYear}`;
  }

  const formatToken = FORMAT_TOKENS[Math.floor(Math.random() * FORMAT_TOKENS.length)];
  const countryFilter = country && country !== "Todos" ? ` "${country}"` : "";
  const curatorFilter = curator && curator !== "Todos" ? ` "${curator}"` : "";

  const baseSeed = genreQueryToken
    ? `${genreQueryToken} ${pickedScene}`
    : curatorFilter
    ? `${curatorFilter} vinyl single`
    : `${pickedStyle} ${pickedScene} ${formatToken}`;

  const decadeToken = decadeYearToken || (decade && decade !== "Todas" ? `"${decade}"` : "");
  return `${baseSeed} ${decadeToken} ${countryFilter} ${NEGATIVE_CRATE_EXCLUSIONS}`.replace(/\s+/g, " ").trim();
}

async function handleYouTubeSearchRequest(req: NextRequest, input: SearchParamsInput) {
  const { q, genre, decade, country, curator, isRandom, excludeIds, maxResults } = input;
  const fetchLimit = excludeIds.size > 0 ? Math.min(30, maxResults + 12) : maxResults;

  const filterExcluded = (items: DiggerTrack[]): DiggerTrack[] => {
    const seen = new Set<string>();
    return items.filter((t) => {
      if (excludeIds.has(t.youtubeId) || excludeIds.has(t.id)) return false;
      if (seen.has(t.youtubeId)) return false;
      seen.add(t.youtubeId);
      return true;
    });
  };

  // 1. Detección de Playlist de YouTube
  const playlistId = extractPlaylistId(q);
  if (playlistId) {
    const authHeader = req.headers.get("authorization");
    const userToken =
      req.headers.get("x-provider-token") ||
      (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);
    const serverKey = process.env.YOUTUBE_API_KEY || "";
    const auth = userToken || serverKey;
    const isOAuth = !!userToken;
    const playlistTracks = await fetchPlaylistTracks(playlistId, auth, isOAuth, 50);
    if (playlistTracks.length > 0) {
      return NextResponse.json({
        tracks: playlistTracks,
        total: playlistTracks.length,
        provider: "youtube_playlist",
        playlistId,
        query: q,
      });
    }
  }

  // 2. Detección de URL directa de video individual de YouTube o ID de 11 caracteres
  const directId = extractYouTubeId(q);
  if (directId) {
    const directTrack = await fetchDirectVideoTrack(directId);
    if (directTrack) {
      return NextResponse.json({
        tracks: [directTrack],
        total: 1,
        provider: "direct_youtube_url",
        query: q,
      });
    }
  }

  const buildQueryForAttempt = (): string => {
    let finalQuery = q.trim();
    if (!finalQuery || isRandom) {
      return buildRandomCrateQuery({ genre, decade, country, curator });
    }
    if (!finalQuery.toLowerCase().includes("vinyl") && !finalQuery.toLowerCase().includes("vinilo")) {
      finalQuery = `${finalQuery} vinyl single`;
    }
    return `${finalQuery} ${NEGATIVE_CRATE_EXCLUSIONS}`.replace(/\s+/g, " ").trim();
  };

  const firstQuery = buildQueryForAttempt();

  // 3. Revisar caché en memoria (en modo random evitamos caché para entregar variedad constante)
  const cacheKey = `${firstQuery}:${maxResults}`;
  if (!isRandom) {
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const filteredCached = filterExcluded(cached.tracks);
      if (filteredCached.length > 0) {
        return NextResponse.json({
          tracks: filteredCached,
          total: filteredCached.length,
          provider: "cache",
          query: firstQuery,
        });
      }
    }
  }

  const authHeader = req.headers.get("authorization");
  const userToken =
    req.headers.get("x-provider-token") ||
    (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);
  const apiKey = process.env.YOUTUBE_API_KEY;

  // Función auxiliar para consultar todos los proveedores en orden dado un query específico
  const queryProvidersOnce = async (
    queryStr: string
  ): Promise<{ tracks: DiggerTrack[]; provider: string } | null> => {
    if (userToken) {
      try {
        const oauthTracks = await queryYouTubeDataAPI(queryStr, userToken, true, fetchLimit);
        const filteredOAuth = filterExcluded(oauthTracks);
        if (filteredOAuth.length > 0) {
          return { tracks: filteredOAuth, provider: "youtube_oauth_user_session" };
        }
      } catch (e) {
        console.warn("YouTube OAuth query warning:", e);
      }
    }

    if (apiKey) {
      try {
        const apiTracks = await queryYouTubeDataAPI(queryStr, apiKey, false, fetchLimit);
        const filteredApi = filterExcluded(apiTracks);
        if (filteredApi.length > 0) {
          return { tracks: filteredApi, provider: "youtube_data_api_v3" };
        }
      } catch {
        // Ignorar error de API y pasar a los siguientes proveedores
      }
    }

    const gatewayTracks = await queryYouTubeOpenGateways(queryStr, fetchLimit);
    const filteredGateway = filterExcluded(gatewayTracks);
    if (filteredGateway.length > 0) {
      return { tracks: filteredGateway, provider: "youtube_open_gateway" };
    }

    const webTracks = await queryYouTubeWebScrape(queryStr, fetchLimit);
    const filteredWeb = filterExcluded(webTracks);
    if (filteredWeb.length > 0) {
      return { tracks: filteredWeb, provider: "youtube_web_search" };
    }

    return null;
  };

  // 4. En modo random, si la primera consulta trae pocos temas inéditos tras excluir historial, reintentar con otras combinaciones
  const maxAttempts = isRandom || !q.trim() ? 3 : 1;
  const accumulated: DiggerTrack[] = [];
  const accumulatedIds = new Set<string>();
  let usedProvider = "youtube_web_search";
  let lastQuery = firstQuery;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const attemptQuery = attempt === 0 ? firstQuery : buildQueryForAttempt();
    lastQuery = attemptQuery;
    const result = await queryProvidersOnce(attemptQuery);
    if (result && result.tracks.length > 0) {
      usedProvider = result.provider;
      for (const t of result.tracks) {
        if (!accumulatedIds.has(t.youtubeId)) {
          accumulatedIds.add(t.youtubeId);
          accumulated.push(t);
        }
      }
      if (accumulated.length >= Math.min(6, maxResults)) {
        break;
      }
    }
  }

  if (accumulated.length > 0) {
    if (!isRandom) {
      searchCache.set(cacheKey, { tracks: accumulated, timestamp: Date.now() });
    }
    return NextResponse.json({
      tracks: accumulated.slice(0, maxResults),
      total: accumulated.length,
      provider: usedProvider,
      query: lastQuery,
    });
  }

  // 5. Fallback Garantizado: Archivo curado local EXPANDED_CRATE_DATABASE (excluyendo historial)
  const fallbackFiltered = EXPANDED_CRATE_DATABASE.filter((t) => {
    if (excludeIds.has(t.youtubeId) || excludeIds.has(t.id)) return false;
    if (!q.trim() || isRandom) {
      const matchGenre = !genre || genre === "Todos" || t.genre === genre;
      const matchDecade = !decade || decade === "Todas" || t.decade === decade;
      const matchCountry = !country || country === "Todos" || t.country === country;
      const matchCurator = !curator || curator === "Todos" || t.curator === curator;
      return matchGenre && matchDecade && matchCountry && matchCurator;
    }
    const lower = q.toLowerCase();
    return (
      t.title.toLowerCase().includes(lower) ||
      t.artist.toLowerCase().includes(lower) ||
      t.genre.toLowerCase().includes(lower)
    );
  });

  const basePool =
    fallbackFiltered.length > 0
      ? fallbackFiltered
      : filterExcluded(EXPANDED_CRATE_DATABASE).length > 0
      ? filterExcluded(EXPANDED_CRATE_DATABASE)
      : EXPANDED_CRATE_DATABASE;

  const shuffledFallback = [...basePool].sort(() => Math.random() - 0.5);

  return NextResponse.json({
    tracks: shuffledFallback.slice(0, maxResults),
    total: shuffledFallback.length,
    provider: "curated_crate_archive",
    query: lastQuery,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const excludeParam = searchParams.get("exclude") || "";
  const excludeIds = new Set(
    excludeParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  return handleYouTubeSearchRequest(req, {
    q: searchParams.get("q") || "",
    genre: searchParams.get("genre") || "",
    decade: searchParams.get("decade") || "",
    country: searchParams.get("country") || "",
    curator: searchParams.get("curator") || "",
    isRandom: searchParams.get("random") === "true",
    excludeIds,
    maxResults: Math.min(24, Math.max(4, parseInt(searchParams.get("maxResults") || "12", 10))),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const excludeArray: unknown[] = Array.isArray(body.excludeIds) ? body.excludeIds : [];
  const excludeIds = new Set(
    excludeArray.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
  );

  return handleYouTubeSearchRequest(req, {
    q: typeof body.q === "string" ? body.q : "",
    genre: typeof body.genre === "string" ? body.genre : "",
    decade: typeof body.decade === "string" ? body.decade : "",
    country: typeof body.country === "string" ? body.country : "",
    curator: typeof body.curator === "string" ? body.curator : "",
    isRandom: Boolean(body.random),
    excludeIds,
    maxResults: Math.min(24, Math.max(4, parseInt(String(body.maxResults || "16"), 10) || 16)),
  });
}

