import type { DiggerTrack, PlayedHistoryItem } from "@/types/studio";
import { EXPANDED_CRATE_DATABASE, shuffleCratePool } from "@/lib/studio/crateEngine";

export const STORAGE_DIG_HISTORY = "c_digger_played_history_v3";
export const STORAGE_HEARD_IDS = "c_digger_heard_ids_v1";
export const STORAGE_UNPLAYED_POOL = "c_digger_unplayed_pool_v1";
export const STORAGE_FAVORITES = "c_digger_favorites_v2";
export const STORAGE_BLOCKED_VIDEOS = "c_digger_blocked_videos_v2";

// Lista inicial de IDs restringidos por sellos discográficos (LatinAutor, UMPG, Sony, Warner)
const DEFAULT_KNOWN_BLOCKED_IDS = ["rdGMhD8Smbg", "CuHNqaN5CmU", "rhnx7ciyOBg"];

export const CRATE_DATABASE: DiggerTrack[] = EXPANDED_CRATE_DATABASE;

export const DIGGER_GENRES = [
  "Todos",
  "Jazz",
  "Funk",
  "Electronic",
  "Pop",
  "Metal",
  "Hip-Hop",
  "Chicha & Cumbia",
  "City Pop",
  "Soul & R&B",
  "Rock & Psych",
  "Bossa Nova & MPB",
  "Afrobeat & Highlife",
  "Reggae & Dub",
  "Salsa & Boogaloo",
  "Disco & Post-Disco",
  "Ambient & New Age",
  "Blues & Gospel",
  "Punk & Post-Punk",
  "Latin Jazz & Mambo",
  "Lo-Fi & Chillhop",
  "Classical & Baroque",
];

export const DIGGER_DECADES = ["Todas", "60s", "70s", "80s", "90s", "2000s"];

export const DIGGER_COUNTRIES = [
  "Todos",
  "Perú 🇵🇪",
  "Japón 🇯🇵",
  "USA 🇺🇸",
  "UK 🇬🇧",
  "Alemania 🇩🇪",
  "Brasil 🇧🇷",
  "Ghana 🇬🇭",
  "Francia 🇫🇷",
  "Jamaica 🇯🇲",
  "Colombia 🇨🇴",
];

export const DIGGER_OBSCURITIES = [
  { id: "all", label: "Todas las visitas" },
  { id: "ultra_rare", label: "Ultra Raro (< 10K vistas)" },
  { id: "rare", label: "Joya Oculta (10K - 50K)" },
  { id: "known", label: "Clásicos Populares (> 50K)" },
];

export function getInitialHeardIds(history: PlayedHistoryItem[]): string[] {
  const seen = new Set<string>();
  for (const h of history) {
    if (h.id) seen.add(h.id);
    if (h.youtubeId) seen.add(h.youtubeId);
  }
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_HEARD_IDS);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          for (const id of arr) {
            if (typeof id === "string" && id) seen.add(id);
          }
        }
      }
    } catch {}
  }
  return Array.from(seen).slice(-5000);
}

export function getInitialTracksPool(
  heardSet: Set<string>,
  blockedSet: Set<string>
): DiggerTrack[] {
  const combined: DiggerTrack[] = [];
  const seenYt = new Set<string>();

  if (typeof window !== "undefined") {
    try {
      const savedPool = localStorage.getItem(STORAGE_UNPLAYED_POOL);
      if (savedPool) {
        const parsed = JSON.parse(savedPool);
        if (Array.isArray(parsed)) {
          for (const t of parsed) {
            if (
              t &&
              typeof t.youtubeId === "string" &&
              !seenYt.has(t.youtubeId) &&
              !heardSet.has(t.youtubeId) &&
              !heardSet.has(t.id) &&
              !blockedSet.has(t.youtubeId)
            ) {
              seenYt.add(t.youtubeId);
              combined.push(t as DiggerTrack);
            }
          }
        }
      }
    } catch {}
  }

  for (const t of CRATE_DATABASE) {
    if (!seenYt.has(t.youtubeId) && !blockedSet.has(t.youtubeId)) {
      seenYt.add(t.youtubeId);
      combined.push(t);
    }
  }

  const unplayed = shuffleCratePool(
    combined.filter((t) => !heardSet.has(t.id) && !heardSet.has(t.youtubeId))
  );
  const played = shuffleCratePool(
    combined.filter((t) => heardSet.has(t.id) || heardSet.has(t.youtubeId))
  );
  return [...unplayed, ...played];
}

export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Hace un momento";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Hace ${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays}d`;
}

export function getInitialPlayedHistory(): PlayedHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const savedV3 = localStorage.getItem(STORAGE_DIG_HISTORY);
    if (savedV3) {
      const parsed = JSON.parse(savedV3);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    const savedV2 = localStorage.getItem("c_digger_played_history_v2");
    if (savedV2) {
      const parsed = JSON.parse(savedV2);
      if (Array.isArray(parsed)) {
        const migrated: PlayedHistoryItem[] = [];
        const seen = new Set<string>();
        for (const item of parsed) {
          if (typeof item === "string" && !seen.has(item)) {
            seen.add(item);
            const found = EXPANDED_CRATE_DATABASE.find(
              (t) => t.id === item || t.youtubeId === item
            );
            migrated.push({
              id: item,
              youtubeId: found ? found.youtubeId : item,
              title: found ? found.title : "Vinilo escuchado",
              artist: found ? found.artist : "Artista",
              genre: found ? found.genre : "Vinilo",
              country: found ? found.country : "Mundial",
              decade: found?.decade,
              bpm: found?.bpm,
              key: found?.key,
              playedAt: Date.now() - 3600000,
            });
          } else if (typeof item === "object" && item && item.id) {
            migrated.push(item as PlayedHistoryItem);
          }
        }
        return migrated.slice(0, 500);
      }
    }
  } catch {}
  return [];
}

export function getInitialBlockedIds(): Set<string> {
  const defaults = new Set<string>(DEFAULT_KNOWN_BLOCKED_IDS);
  if (typeof window === "undefined") return defaults;
  try {
    const saved = localStorage.getItem(STORAGE_BLOCKED_VIDEOS);
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) {
        arr.forEach((id) => defaults.add(id));
      }
    }
  } catch {}
  return defaults;
}
