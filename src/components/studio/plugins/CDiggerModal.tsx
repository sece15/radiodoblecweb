"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useModalIsolation } from "@/hooks/useModalIsolation";
import {
  X,
  Scissors,
  ExternalLink,
  Dices,
  Check,
  Heart,
  Bookmark,
  ArrowLeft,
  ArrowRight,
  Loader2,
  History,
  Trash2,
  Sparkles,
  Music2,
} from "lucide-react";
import type {
  DiggerTrack,
  LoadedSampleData,
  SamplerCuePoint,
  DiggerMiniPad,
  YTPlayer,
  PlayedHistoryItem,
} from "@/types/studio";
import {
  EXPANDED_CRATE_DATABASE,
  shuffleCratePool,
  buildSampletteYouTubeWatchUrl,
  loadYouTubeIframeAPI,
} from "@/lib/studio/crateEngine";
import { useAudio } from "@/hooks/useAudio";

const STORAGE_DIG_HISTORY = "c_digger_played_history_v3";
const STORAGE_HEARD_IDS = "c_digger_heard_ids_v1";
const STORAGE_UNPLAYED_POOL = "c_digger_unplayed_pool_v1";
const STORAGE_FAVORITES = "c_digger_favorites_v2";
const STORAGE_BLOCKED_VIDEOS = "c_digger_blocked_videos_v2";

function getInitialHeardIds(history: PlayedHistoryItem[]): string[] {
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

function getInitialTracksPool(heardSet: Set<string>, blockedSet: Set<string>): DiggerTrack[] {
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

  // Priorizar pistas inéditas al inicio (barajadas) y dejar las ya escuchadas al final
  const unplayed = shuffleCratePool(
    combined.filter((t) => !heardSet.has(t.id) && !heardSet.has(t.youtubeId))
  );
  const played = shuffleCratePool(
    combined.filter((t) => heardSet.has(t.id) || heardSet.has(t.youtubeId))
  );
  return [...unplayed, ...played];
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Hace un momento";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Hace ${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays}d`;
}

function getInitialPlayedHistory(): PlayedHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const savedV3 = localStorage.getItem("c_digger_played_history_v3");
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
            const found = EXPANDED_CRATE_DATABASE.find((t) => t.id === item || t.youtubeId === item);
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

// Lista inicial de IDs restringidos por sellos discográficos (LatinAutor, UMPG, Sony, Warner)
const DEFAULT_KNOWN_BLOCKED_IDS = ["rdGMhD8Smbg", "CuHNqaN5CmU", "rhnx7ciyOBg"];

function getInitialBlockedIds(): Set<string> {
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

interface CDiggerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSendToSampler: (sampleData: LoadedSampleData) => void;
  isStandalone?: boolean;
  onOpenSampler?: () => void;
}

// Curated Crate-Digging vinyl records collection (powered by Crate Engine)
const CRATE_DATABASE: DiggerTrack[] = EXPANDED_CRATE_DATABASE;

const GENRES = [
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

const DECADES = ["Todas", "60s", "70s", "80s", "90s", "2000s"];
const COUNTRIES = [
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
const OBSCURITIES = [
  { id: "all", label: "Todas las visitas" },
  { id: "ultra_rare", label: "Ultra Raro (< 10K vistas)" },
  { id: "rare", label: "Joya Oculta (10K - 50K)" },
  { id: "known", label: "Clásicos Populares (> 50K)" },
];

export const CDiggerModal = ({
  isOpen = true,
  onClose,
  onSendToSampler,
  isStandalone = false,
  onOpenSampler,
}: CDiggerModalProps) => {
  // Autenticación Supabase / Google OAuth para cuotas ampliadas y crate persistente
  const isAuthenticated = useAudio((s) => s.isAuthenticated);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const { isTopModal } = useModalIsolation(isOpen && !isStandalone, modalContainerRef, {
    onEscape: onClose,
    captureSpace: false,
  });
  const userProfile = useAudio((s) => s.userProfile);
  const signInWithGoogle = useAudio((s) => s.signInWithGoogle);
  const signOut = useAudio((s) => s.signOut);

  // Filters state (100% libre de restricciones de estilo para máxima variedad)
  const [selectedGenre, setSelectedGenre] = useState<string>("Todos");
  const [selectedDecade, setSelectedDecade] = useState<string>("Todas");
  const [selectedCountry, setSelectedCountry] = useState<string>("Todos");
  const [selectedObscurity, setSelectedObscurity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Lista negra persistente de videos bloqueados por sellos (LatinAutor, UMPG, Error 150)
  const [blockedVideoIds, setBlockedVideoIds] = useState<Set<string>>(getInitialBlockedIds);

  // Historial estructurado de vinilos reproducidos (con metadata y marca temporal)
  const [playedHistory, setPlayedHistory] = useState<PlayedHistoryItem[]>(getInitialPlayedHistory);
  // Registro ilimitado persistente (hasta 5,000 IDs) para no repetir canciones entre días ni sesiones
  const [heardIds, setHeardIds] = useState<string[]>(() => getInitialHeardIds(playedHistory));

  // Navigation & Track Selection: Hidrata primero descubrimientos inéditos en caché y luego el archivo curado
  const [tracksPool, setTracksPool] = useState<DiggerTrack[]>(() => {
    const initialHeard = new Set(getInitialHeardIds(playedHistory));
    return getInitialTracksPool(initialHeard, blockedVideoIds);
  });

  const [drawerTab, setDrawerTab] = useState<"favorites" | "history">("history");
  const [isDiggingRandom, setIsDiggingRandom] = useState<boolean>(false);

  // Set reactivo para consulta instantánea O(1) de todas las canciones escuchadas (historial + registro histórico)
  const playedIdsSet = useMemo(() => {
    const set = new Set<string>(heardIds);
    for (const item of playedHistory) {
      if (item.id) set.add(item.id);
      if (item.youtubeId) set.add(item.youtubeId);
    }
    return set;
  }, [heardIds, playedHistory]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_FAVORITES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Identificador fijado de la pista actual: comienza en la primera pista inédita disponible del pool
  const [currentTrackId, setCurrentTrackId] = useState<string>(() => {
    const first = tracksPool[0] || CRATE_DATABASE[0];
    return first.id || first.youtubeId;
  });

  // Inicialización directa del índice para evitar cascading renders con setState en useEffect
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);

  const isFullscreen = false;
  const [activePadTime, setActivePadTime] = useState<number | null>(null);
  const [activePadId, setActivePadId] = useState<number | null>(null);
  const [providerNotice, setProviderNotice] = useState<string | null>(null);
  const [showCrateDrawer, setShowCrateDrawer] = useState<boolean>(false);

  // 1. Sincronizar historial estructurado con localStorage (hasta 500 entradas visibles en el drawer)
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && playedHistory.length > 0) {
        localStorage.setItem(STORAGE_DIG_HISTORY, JSON.stringify(playedHistory.slice(0, 500)));
      }
    } catch {}
  }, [playedHistory]);

  // 1b. Sincronizar registro maestro de IDs escuchados (hasta 5,000 IDs para evitar repeticiones entre días)
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && heardIds.length > 0) {
        localStorage.setItem(STORAGE_HEARD_IDS, JSON.stringify(heardIds.slice(-5000)));
      }
    } catch {}
  }, [heardIds]);

  // 1c. Persistir descubrimientos inéditos pendientes de escuchar para arrancar al instante en la próxima sesión
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const unplayedExtras = tracksPool
          .filter(
            (t) =>
              !playedIdsSet.has(t.id) &&
              !playedIdsSet.has(t.youtubeId) &&
              !blockedVideoIds.has(t.youtubeId) &&
              !CRATE_DATABASE.some((db) => db.youtubeId === t.youtubeId)
          )
          .slice(0, 80);
        localStorage.setItem(STORAGE_UNPLAYED_POOL, JSON.stringify(unplayedExtras));
      }
    } catch {}
  }, [tracksPool, playedIdsSet, blockedVideoIds]);

  // 2. Sincronizar favoritos con localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(favorites));
      }
    } catch {}
  }, [favorites]);

  // Extraction state (Prepares for Steps 2 & 3)
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  // Consultar la biblioteca global de YouTube en tiempo real mediante nuestro servidor Next.js (vía POST para excluir miles de IDs)
  const lastRandomSearchTime = useRef<number>(0);
  const handleSearchYouTube = useCallback(
    async (
      queryText?: string,
      isRandomCrate = false,
      forceImmediate = false
    ): Promise<DiggerTrack[]> => {
      const query = queryText !== undefined ? queryText : searchQuery;

      // Throttle en background para random crate (mínimo 2.5s entre peticiones salvo forzado)
      if (isRandomCrate && !forceImmediate && Date.now() - lastRandomSearchTime.current < 2500) {
        return [];
      }
      if (isRandomCrate) {
        lastRandomSearchTime.current = Date.now();
      }

      if (!isRandomCrate) {
        setProviderNotice("Consultando YouTube global...");
      }

      try {
        const token =
          typeof window !== "undefined"
            ? sessionStorage.getItem("google_provider_token") || localStorage.getItem("google_provider_token")
            : null;
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(token ? { "x-provider-token": token } : {}),
        };

        const res = await fetch("/api/studio/youtube-search", {
          method: "POST",
          headers,
          body: JSON.stringify({
            q: query,
            genre: selectedGenre,
            decade: selectedDecade,
            country: selectedCountry,
            random: isRandomCrate,
            maxResults: 20,
            excludeIds: Array.from(playedIdsSet).slice(-4000),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tracks) && data.tracks.length > 0) {
            let newlyAdded: DiggerTrack[] = [];
            setTracksPool((prev) => {
              const existingIds = new Set(prev.map((t) => t.youtubeId));
              const freshTracks = data.tracks.filter(
                (t: DiggerTrack) => !existingIds.has(t.youtubeId) && !blockedVideoIds.has(t.youtubeId)
              );
              newlyAdded = freshTracks;
              if (freshTracks.length === 0) return prev;
              const randomizedFresh = shuffleCratePool(freshTracks);
              // Si es búsqueda manual o playlist, colocar al frente barajadas; si es enriquecimiento en background, agregar al final
              return isRandomCrate
                ? [...prev, ...randomizedFresh]
                : [...randomizedFresh, ...prev.filter((t) => !existingIds.has(t.youtubeId))];
            });

            if (!isRandomCrate) {
              setCurrentTrackId("");
              setCurrentTrackIndex(0);
              const label =
                data.provider === "youtube_playlist"
                  ? `Playlist de YouTube: ${data.tracks.length} vinilos cargados para reproducción aleatoria`
                  : data.provider === "direct_youtube_url"
                  ? "Enlace de YouTube importado"
                  : data.provider === "youtube_oauth_user_session"
                  ? `Google OAuth: ${data.tracks.length} vinilos exclusivos cargados`
                  : data.provider === "youtube_data_api_v3"
                  ? `YouTube API: ${data.tracks.length} vinilos encontrados`
                  : `YouTube Live: ${data.tracks.length} vinilos cargados`;

              setProviderNotice(label);
            }
            return newlyAdded.length > 0 ? newlyAdded : data.tracks;
          } else if (!isRandomCrate) {
            setProviderNotice("Sin resultados nuevos en YouTube");
          }
        }
      } catch (err) {
        console.warn("Error consultando servidor de YouTube:", err);
        if (!isRandomCrate) {
          setProviderNotice("Error conectando con YouTube");
        }
      } finally {
        if (!isRandomCrate) {
          setTimeout(() => setProviderNotice(null), 3500);
        }
      }
      return [];
    },
    [searchQuery, selectedGenre, selectedDecade, selectedCountry, playedIdsSet, blockedVideoIds]
  );

  // Filtered tracks memo a partir de la biblioteca dinámica de YouTube y del crate (excluyendo videos bloqueados)
  const filteredTracks = useMemo(() => {
    return tracksPool.filter((t) => {
      // Excluir automáticamente videos bloqueados por sellos (LatinAutor, UMPG, Error 150)
      if (blockedVideoIds.has(t.youtubeId) || blockedVideoIds.has(t.id)) {
        return false;
      }

      // Comparación flexible de género para soportar subcategorías
      const matchGenre =
        selectedGenre === "Todos" ||
        t.genre.toLowerCase().includes(selectedGenre.toLowerCase()) ||
        selectedGenre.toLowerCase().includes(t.genre.toLowerCase());

      const matchDecade = selectedDecade === "Todas" || t.decade === selectedDecade;

      const cleanCountry = selectedCountry
        .replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, "")
        .trim()
        .toLowerCase();
      const matchCountry =
        selectedCountry === "Todos" || t.country.toLowerCase().includes(cleanCountry);

      const matchObscurity =
        selectedObscurity === "all" || t.obscurity === selectedObscurity;
      const matchQuery =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.includes(searchQuery.trim()) ||
        t.youtubeId.includes(searchQuery.trim());
      return matchGenre && matchDecade && matchCountry && matchObscurity && matchQuery;
    });
  }, [tracksPool, blockedVideoIds, selectedGenre, selectedDecade, selectedCountry, selectedObscurity, searchQuery]);

  // Current track pointer (prioriza el ID anclado para evitar saltos involuntarios cuando la lista se actualiza en segundo plano)
  const currentTrack = useMemo(() => {
    const pool = filteredTracks.length > 0 ? filteredTracks : tracksPool.length > 0 ? tracksPool : CRATE_DATABASE;
    if (currentTrackId) {
      const match = pool.find((t) => t.id === currentTrackId || t.youtubeId === currentTrackId);
      if (match) return match;
    }
    const safeIdx = Math.max(0, Math.min(currentTrackIndex, pool.length - 1));
    return pool[safeIdx] || pool[0] || CRATE_DATABASE[0];
  }, [filteredTracks, currentTrackIndex, tracksPool, currentTrackId]);

  // Función atómica para seleccionar un vinilo fijando tanto su ID como su índice en el pool
  const selectTrack = useCallback(
    (track: DiggerTrack, targetPool?: DiggerTrack[]) => {
      if (!track) return;
      setCurrentTrackId(track.id || track.youtubeId);
      const pool = targetPool || (filteredTracks.length > 0 ? filteredTracks : tracksPool);
      const idx = pool.findIndex((t) => t.id === track.id || t.youtubeId === track.youtubeId);
      if (idx >= 0) {
        setCurrentTrackIndex(idx);
      }
    },
    [filteredTracks, tracksPool]
  );

  // Registrar de forma persistente cada vinilo reproducido en el historial de sesión, registro maestro y localStorage
  // Se programa asíncronamente con setTimeout para evitar cascading renders síncronos
  useEffect(() => {
    if (!currentTrack?.id || !currentTrack?.youtubeId) return;
    const timerId = setTimeout(() => {
      setHeardIds((prev) => {
        if (prev.includes(currentTrack.youtubeId) && prev.includes(currentTrack.id)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(currentTrack.id);
        next.add(currentTrack.youtubeId);
        return Array.from(next).slice(-5000);
      });

      setPlayedHistory((prev) => {
        // Si la pista actual ya es la primera del historial (más reciente), no duplicar
        if (
          prev.length > 0 &&
          (prev[0].id === currentTrack.id || prev[0].youtubeId === currentTrack.youtubeId)
        ) {
          return prev;
        }
        const filtered = prev.filter(
          (h) => h.id !== currentTrack.id && h.youtubeId !== currentTrack.youtubeId
        );
        const newItem: PlayedHistoryItem = {
          id: currentTrack.id,
          youtubeId: currentTrack.youtubeId,
          title: currentTrack.title,
          artist: currentTrack.artist,
          genre: currentTrack.genre,
          country: currentTrack.country,
          decade: currentTrack.decade,
          bpm: currentTrack.bpm,
          key: currentTrack.key,
          playedAt: Date.now(),
        };
        const updated = [newItem, ...filtered].slice(0, 500);
        try {
          localStorage.setItem(STORAGE_DIG_HISTORY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }, 0);
    return () => clearTimeout(timerId);
  }, [
    currentTrack?.id,
    currentTrack?.youtubeId,
    currentTrack?.title,
    currentTrack?.artist,
    currentTrack?.genre,
    currentTrack?.country,
    currentTrack?.decade,
    currentTrack?.bpm,
    currentTrack?.key,
  ]);

  // Auto-hidratación al abrir en sesiones futuras (Día 2+):
  // Si el usuario ya escuchó el catálogo inicial, busca automáticamente nuevos vinilos inéditos en YouTube
  const hasAutoHydratedRef = useRef<boolean>(false);
  useEffect(() => {
    if ((!isOpen && !isStandalone) || hasAutoHydratedRef.current) return;
    hasAutoHydratedRef.current = true;

    const unplayedCount = tracksPool.filter(
      (t) => !playedIdsSet.has(t.id) && !playedIdsSet.has(t.youtubeId) && !blockedVideoIds.has(t.youtubeId)
    ).length;

    if (unplayedCount <= 4) {
      const currentAlreadyHeard =
        playedIdsSet.has(currentTrack.id) || playedIdsSet.has(currentTrack.youtubeId);

      handleSearchYouTube("", true, true).then((freshTracks) => {
        if (!Array.isArray(freshTracks) || freshTracks.length === 0) return;
        const brandNew = freshTracks.find(
          (t) =>
            !playedIdsSet.has(t.id) &&
            !playedIdsSet.has(t.youtubeId) &&
            !blockedVideoIds.has(t.youtubeId)
        );
        if (brandNew && currentAlreadyHeard) {
          selectTrack(brandNew);
        }
      });
    }
  }, [
    isOpen,
    isStandalone,
    tracksPool,
    playedIdsSet,
    blockedVideoIds,
    currentTrack.id,
    currentTrack.youtubeId,
    handleSearchYouTube,
    selectTrack,
  ]);

  // Verificar si la pista actual ya fue escuchada en el historial previo (para mostrar insignia)
  const isCurrentInHistory = useMemo(() => {
    return playedHistory.some(
      (h, idx) => idx > 0 && (h.id === currentTrack.id || h.youtubeId === currentTrack.youtubeId)
    );
  }, [playedHistory, currentTrack.id, currentTrack.youtubeId]);

  // 8 Pads Dinámicos para cada Vinilo (PAD 1 a PAD 8)
  const trackPads = useMemo<DiggerMiniPad[]>(() => {
    const dur = Math.max(30, currentTrack.durationSec || 180);
    const existing = currentTrack.miniPads || [];
    const pads: DiggerMiniPad[] = [];

    const defaultLabels = [
      "Intro / Tema",
      "Riff Principal",
      "Breakbeat Groove",
      "Melodía Hook",
      "Arpegio / Vientos",
      "Línea de Bajo",
      "Drop / Clave",
      "Remate / Outro",
    ];

    for (let i = 1; i <= 8; i++) {
      const found = existing.find((p) => p.id === i);
      if (found) {
        pads.push({
          ...found,
          color: i % 2 === 1 ? "#CCFF00" : "#FFFFFF",
        });
      } else {
        const factor = (i - 1) / 8;
        const timeSec = Math.floor(dur * factor);
        pads.push({
          id: i,
          timeSec,
          label: defaultLabels[i - 1] || `Corte #${i}`,
          color: i % 2 === 1 ? "#CCFF00" : "#FFFFFF",
        });
      }
    }
    return pads;
  }, [currentTrack]);

  // Reset pad preview when track changes
  const prevTrackId = useRef(currentTrack?.id);
  useEffect(() => {
    if (prevTrackId.current !== currentTrack?.id) {
      prevTrackId.current = currentTrack?.id;
      setActivePadTime(null);
      setActivePadId(null);
    }
  }, [currentTrack]);

  // DIG RANDOM TRACK: Algoritmo Estricto de C-Studio Sin Repetición
  // 1. Prioriza canciones inéditas en memoria que nunca han pasado por el historial
  // 2. Si se agotan las inéditas en memoria, consulta YouTube en vivo excluyendo todas las escuchadas
  // 3. Si se agota todo el catálogo disponible, rota usando LRU (la pista escuchada hace más tiempo)
  const handleRandomDig = useCallback(async () => {
    if (isDiggingRandom) return;

    const pool = filteredTracks.length > 0 ? filteredTracks : tracksPool.length > 0 ? tracksPool : CRATE_DATABASE;

    // 1. Filtrar pistas que no sean la actual (por ID y YouTube ID)
    const otherTracks = pool.filter(
      (t) => t.id !== currentTrack.id && t.youtubeId !== currentTrack.youtubeId
    );

    // 2. Filtrar aquellas que NUNCA hayan sido reproducidas en el historial
    const unplayed = otherTracks.filter(
      (t) => !playedIdsSet.has(t.id) && !playedIdsSet.has(t.youtubeId)
    );

    // CASO 1: Hay vinilos inéditos disponibles de inmediato en memoria
    if (unplayed.length > 0) {
      const targetTrack = unplayed[Math.floor(Math.random() * unplayed.length)];
      selectTrack(targetTrack, pool);

      // Si quedan 4 o menos vinilos sin reproducir en este filtro, enriquecer en background
      if (unplayed.length <= 4) {
        handleSearchYouTube("", true, false);
      }
      return;
    }

    // CASO 2: Vinilos en memoria agotados para el filtro actual -> Búsqueda activa en YouTube
    setIsDiggingRandom(true);
    setProviderNotice("Buscando nuevo vinilo inédito en YouTube...");

    try {
      const freshTracks = await handleSearchYouTube("", true, true);
      // Filtrar estrictamente solo aquellas que jamás se han reproducido
      const trulyNewTracks = freshTracks.filter(
        (t) =>
          !playedIdsSet.has(t.id) &&
          !playedIdsSet.has(t.youtubeId) &&
          t.youtubeId !== currentTrack.youtubeId &&
          !blockedVideoIds.has(t.youtubeId)
      );

      if (trulyNewTracks.length > 0) {
        const chosen = trulyNewTracks[Math.floor(Math.random() * trulyNewTracks.length)];
        setCurrentTrackId(chosen.id || chosen.youtubeId);
        setTracksPool((prev) => {
          const existingIdx = prev.findIndex((t) => t.youtubeId === chosen.youtubeId || t.id === chosen.id);
          if (existingIdx >= 0) {
            setCurrentTrackIndex(existingIdx);
            return prev;
          } else {
            setCurrentTrackIndex(prev.length);
            return [...prev, chosen];
          }
        });
        setProviderNotice(`¡Vinilo inédito descubierto: ${chosen.title.slice(0, 32)}...!`);
        setTimeout(() => setProviderNotice(null), 3000);
        return;
      }
    } catch (err) {
      console.warn("Aviso en búsqueda aleatoria de YouTube:", err);
    } finally {
      setIsDiggingRandom(false);
    }

    // CASO 3: Si no hay nuevas en YouTube o ya se escuchó absolutamente todo el catálogo
    // Para no alternar entre 1 o 2 pistas, seleccionamos mediante LRU (la pista escuchada hace más tiempo)
    if (otherTracks.length > 0) {
      const scored = otherTracks.map((track) => {
        const historyIdx = playedHistory.findIndex(
          (h) => h.id === track.id || h.youtubeId === track.youtubeId
        );
        return {
          track,
          score: historyIdx === -1 ? 999999 : historyIdx, // Mayor score = escuchada hace más tiempo
        };
      });

      scored.sort((a, b) => b.score - a.score);
      const candidatesCount = Math.max(1, Math.min(6, Math.floor(scored.length * 0.4)));
      const oldestCandidates = scored.slice(0, candidatesCount);
      const chosenTrack = oldestCandidates[Math.floor(Math.random() * oldestCandidates.length)].track;

      selectTrack(chosenTrack, pool);
      setProviderNotice("Catálogo completado. Rotando vinilos más antiguos...");
      setTimeout(() => setProviderNotice(null), 3500);
    } else {
      const freshPool = shuffleCratePool(CRATE_DATABASE.filter((t) => !blockedVideoIds.has(t.youtubeId)));
      setTracksPool(freshPool);
      if (freshPool[0]) {
        selectTrack(freshPool[0], freshPool);
      }
    }
  }, [
    isDiggingRandom,
    filteredTracks,
    tracksPool,
    currentTrack.id,
    currentTrack.youtubeId,
    playedIdsSet,
    playedHistory,
    blockedVideoIds,
    handleSearchYouTube,
    selectTrack,
  ]);

  const handleRandomDigRef = useRef(handleRandomDig);
  useEffect(() => {
    handleRandomDigRef.current = handleRandomDig;
  }, [handleRandomDig]);

  // NAVIGATION ACTIONS (Siguiente: nuevo vinilo no repetido; Anterior: volver en historial de escucha)
  const handleNextTrack = useCallback(() => {
    handleRandomDig();
  }, [handleRandomDig]);

  const handlePrevTrack = useCallback(() => {
    const pool = filteredTracks.length > 0 ? filteredTracks : tracksPool;
    const currentIndexInHist = playedHistory.findIndex(
      (h) => h.id === currentTrack.id || h.youtubeId === currentTrack.youtubeId
    );
    if (currentIndexInHist >= 0 && currentIndexInHist + 1 < playedHistory.length) {
      const prevItem = playedHistory[currentIndexInHist + 1];
      const foundTrack = pool.find((t) => t.id === prevItem.id || t.youtubeId === prevItem.youtubeId);
      if (foundTrack) {
        selectTrack(foundTrack, pool);
        return;
      }
    }
    const newIdx = (currentTrackIndex - 1 + pool.length) % pool.length;
    if (pool[newIdx]) {
      selectTrack(pool[newIdx], pool);
    }
  }, [filteredTracks, tracksPool, playedHistory, currentTrack.id, currentTrack.youtubeId, currentTrackIndex, selectTrack]);

  // Selección directa desde el historial visual
  const handleSelectHistoryTrack = useCallback(
    (item: PlayedHistoryItem) => {
      if (currentTrack.id === item.id || currentTrack.youtubeId === item.youtubeId) {
        return;
      }

      let targetTrack = tracksPool.find((t) => t.id === item.id || t.youtubeId === item.youtubeId);
      if (!targetTrack) {
        const inDb = CRATE_DATABASE.find((t) => t.id === item.id || t.youtubeId === item.youtubeId);
        targetTrack = inDb || {
          id: item.id,
          youtubeId: item.youtubeId,
          title: item.title,
          artist: item.artist,
          genre: item.genre,
          country: item.country,
          decade: item.decade || "70s",
          bpm: item.bpm || 95,
          key: item.key || "Am",
          description: `Vinilo recuperado del historial: ${item.title} — ${item.artist}`,
          durationSec: 180,
        };
        setTracksPool((prev) => [targetTrack!, ...prev]);
      }

      setSelectedGenre("Todos");
      setSelectedCountry("Todos");
      setSelectedDecade("Todas");
      setSelectedObscurity("all");
      setSearchQuery("");
      selectTrack(targetTrack);
      setProviderNotice(`Reproduciendo del historial: ${item.title.slice(0, 30)}...`);
      setTimeout(() => setProviderNotice(null), 3000);
    },
    [currentTrack.id, currentTrack.youtubeId, tracksPool, selectTrack]
  );

  // Limpiar el historial de escucha y el registro histórico completo
  const handleClearHistory = useCallback(() => {
    if (window.confirm("¿Deseas reiniciar tu historial de vinilos escuchados? Esto permitirá volver a descubrirlos en modo aleatorio.")) {
      setPlayedHistory([]);
      setHeardIds([]);
      try {
        localStorage.removeItem(STORAGE_DIG_HISTORY);
        localStorage.removeItem(STORAGE_HEARD_IDS);
        localStorage.removeItem(STORAGE_UNPLAYED_POOL);
        localStorage.removeItem("c_digger_played_history_v2");
      } catch {}
      setProviderNotice("Historial de vinilos limpiado");
      setTimeout(() => setProviderNotice(null), 2500);
    }
  }, []);

  // ==========================================
  // REPRODUCTOR YOUTUBE OFICIAL (ARQUITECTURA SAMPLETTE & MODO ROCOLA)
  // ==========================================
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const playerReadyRef = useRef<boolean>(false);
  const isSkippingRef = useRef<boolean>(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState<boolean>(true);
  const [skipNotice, setSkipNotice] = useState<string | null>(null);

  // Referencia mutable al track actual para evitar closures obsoletas (stale closures) en callbacks de YouTube
  const currentTrackRef = useRef<DiggerTrack>(currentTrack);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Watchdog de reproducción: Si una pista tarda más de 3.8s sin emitir PLAYING (data === 1),
  // significa que YouTube la bloqueó silenciosamente (Error 150 / LatinAutor / UMPG).
  // El escudo permanece activo (el usuario nunca ve la pantalla rota) y se descarta automáticamente.
  const playbackWatchdogRef = useRef<NodeJS.Timeout | null>(null);
  const clearPlaybackWatchdog = useCallback(() => {
    if (playbackWatchdogRef.current) {
      clearTimeout(playbackWatchdogRef.current);
      playbackWatchdogRef.current = null;
    }
  }, []);

  // Descarte de pistas con restricción de derechos de autor (LatinAutor, UMPG, Sony, Error 150)
  const handleBanishTrack = useCallback(
    (trackToBanish?: DiggerTrack, reason = "Restricción de derechos de autor (LatinAutor / UMPG / Error 150)", permanent = false) => {
      const track = trackToBanish || currentTrackRef.current;
      if (!track || !track.youtubeId) return;

      console.warn(`[C-DIGGER 🛡️ Anti-Bloqueo] Descartando ${track.youtubeId} (${track.title}): ${reason}`);
      clearPlaybackWatchdog();

      // 1. Guardar en Blacklist persistente solo si es un bloqueo fatal confirmado (Error 150 / 101)
      if (permanent) {
        setBlockedVideoIds((prev) => {
          const next = new Set(prev);
          next.add(track.youtubeId);
          next.add(track.id);
          try {
            localStorage.setItem(STORAGE_BLOCKED_VIDEOS, JSON.stringify(Array.from(next)));
          } catch {}
          return next;
        });
      }

      // 2. Descartar del pool de reproducción en memoria para esta sesión
      setTracksPool((prev) => prev.filter((t) => t.youtubeId !== track.youtubeId && t.id !== track.id));

      // 3. Activar de inmediato el escudo visual sobre el reproductor
      setIsPlayerLoading(true);
      setSkipNotice("🛡️ [Escudo Anti-Bloqueo] Sintonizando siguiente vinilo...");

      // 4. Saltar a la siguiente pista automáticamente sin demora
      setTimeout(() => {
        handleRandomDigRef.current();
      }, 150);
    },
    [clearPlaybackWatchdog]
  );
  const handleBanishTrackRef = useRef(handleBanishTrack);
  useEffect(() => {
    handleBanishTrackRef.current = handleBanishTrack;
  }, [handleBanishTrack]);

  const startPlaybackWatchdog = useCallback(
    (ytId: string) => {
      clearPlaybackWatchdog();
      setIsPlayerLoading(true);
      setSkipNotice(null);

      // Watchdog de 7.5s (tiempo prudente para conexiones normales y buffering)
      playbackWatchdogRef.current = setTimeout(() => {
        // ANTES de descartar: verificar si el reproductor ya empezó a sonar o reproducirse
        try {
          const state = ytPlayerRef.current?.getPlayerState();
          const curTime = ytPlayerRef.current?.getCurrentTime();
          // Si el estado es 1 (PLAYING) o el tiempo de reproducción ya avanzó (>0.05s), ¡el audio está sonando!
          if (state === 1 || (typeof curTime === "number" && curTime > 0.05)) {
            clearPlaybackWatchdog();
            setIsPlayerLoading(false);
            setSkipNotice(null);
            return;
          }
          // Si está en 3 (BUFFERING), no cortar la reproducción, el reproductor está cargando datos
          if (state === 3) {
            clearPlaybackWatchdog();
            setIsPlayerLoading(false);
            return;
          }
        } catch {}

        console.warn(`[C-DIGGER 🛡️ Watchdog] Timeout en ${ytId}: la pista no inició reproducción tras 7.5s. Descartando...`);
        handleBanishTrackRef.current(
          currentTrackRef.current,
          "Timeout de reproducción (no inició audio tras 7.5s)",
          false
        );
      }, 7500);
    },
    [clearPlaybackWatchdog]
  );

  // Escuchador global de postMessage para capturar errores nativos de iframes de YouTube en tiempo real
  useEffect(() => {
    const handleWindowMessage = (e: MessageEvent) => {
      try {
        if (typeof e.origin === "string" && !e.origin.includes("youtube.com")) return;

        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (!data || typeof data !== "object") return;

        // IMPORTANTE: Distinguir onStateChange (info: 2 es PAUSED) de un error real.
        // Solo descartar cuando es explícitamente onError
        const isErrorEvent = data.event === "onError";
        if (!isErrorEvent) return;

        const isEmbedBlocked = data.info === 150 || data.info === 101;
        const isFatalError = data.info === 2 || data.info === 5 || data.info === 100;

        if (isEmbedBlocked || isFatalError) {
          console.warn("[C-DIGGER 🛡️ PostMessage] Error de reproducción detectado:", data);
          setIsPlayerLoading(true);
          handleBanishTrackRef.current(
            currentTrackRef.current,
            `Error ${data.info || "150"} en YouTube (LatinAutor / UMPG)`,
            isEmbedBlocked
          );
        }
      } catch {}
    };
    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, []);

  // Inicializar YouTube IFrame API una sola vez cuando se monta el componente
  useEffect(() => {
    if (!isOpen && !isStandalone) return;
    let isCancelled = false;

    loadYouTubeIframeAPI()
      .then((YT) => {
        if (isCancelled) return;
        const targetEl = document.getElementById("cdigger-yt-player-target");
        if (!targetEl || ytPlayerRef.current) return;

        const origin =
          typeof window !== "undefined" && window.location.origin
            ? window.location.origin
            : "https://radiodoblec.com";
        const euri = `${origin}/`;

        try {
          ytPlayerRef.current = new YT.Player("cdigger-yt-player-target", {
            videoId: currentTrackRef.current.youtubeId,
            host: "https://www.youtube.com",
            playerVars: {
              rel: 0,
              playsinline: 1,
              enablejsapi: 1,
              iv_load_policy: 3,
              autoplay: 1,
              origin: origin,
              widget_referrer: euri,
              embeds_referring_origin: origin,
              embeds_referring_euri: euri,
              start: 0,
            },
            events: {
              onReady: (event) => {
                if (isCancelled) return;
                playerReadyRef.current = true;
                // NOTA CLAVE: No bajamos el escudo aquí.
                // El escudo permanece activo hasta que el video alcance el estado 1 (PLAYING).
                try {
                  event.target.playVideo();
                } catch {}
                startPlaybackWatchdog(currentTrackRef.current.youtubeId);
              },
              onStateChange: (event) => {
                if (isCancelled) return;
                // 1: PLAYING, 2: PAUSED, 0: ENDED, 3: BUFFERING, 5: CUED
                if (event.data === 1) {
                  // Confirmar que el video realmente está reproduciendo audio y desactivar watchdog
                  clearPlaybackWatchdog();
                  setTimeout(() => {
                    if (isCancelled) return;
                    try {
                      const state = ytPlayerRef.current?.getPlayerState();
                      if (state === 1) {
                        setIsPlayerLoading(false);
                        setSkipNotice(null);
                      }
                    } catch {
                      setIsPlayerLoading(false);
                      setSkipNotice(null);
                    }
                  }, 150);
                } else if (event.data === 2) {
                  // 2 = PAUSED: El usuario pausó la pista intencionalmente.
                  clearPlaybackWatchdog();
                  setIsPlayerLoading(false);
                  setSkipNotice(null);
                } else if (event.data === 3) {
                  // 3 = BUFFERING: Está cargando fragmentos de audio, no cortar la reproducción
                  setIsPlayerLoading(false);
                  setSkipNotice(null);
                } else if (event.data === 0) {
                  // Fin de pista natural: solo avanzar si la pista REALMENTE se reprodujo
                  // (evita que un evento ENDED fantasma/residual del video anterior corte la canción que acaba de empezar a sonar)
                  try {
                    const curTime = ytPlayerRef.current?.getCurrentTime() || 0;
                    const duration = ytPlayerRef.current?.getDuration() || 0;
                    if (curTime < 10 && duration > 20) {
                      console.warn("[C-DIGGER] Evento ENDED prematuro o residual ignorado.");
                      return;
                    }
                  } catch {}

                  setIsPlayerLoading(true);
                  setTimeout(() => {
                    if (!isCancelled) {
                      handleRandomDigRef.current();
                    }
                  }, 500);
                }
              },
              onError: (event) => {
                if (isCancelled || isSkippingRef.current) return;
                console.warn(
                  `[C-DIGGER 🛡️ Escudo Anti-Bloqueo] Error ${event.data} en YouTube Player para ${currentTrackRef.current.youtubeId} (LatinAutor / UMPG). Saltando automáticamente como Samplette...`
                );
                isSkippingRef.current = true;
                setIsPlayerLoading(true);
                setSkipNotice("🛡️ [Escudo Anti-Bloqueo] Restricción de derechos de autor. Sintonizando siguiente vinilo...");
                const isEmbedBlocked = event.data === 150 || event.data === 101;
                handleBanishTrackRef.current(
                  currentTrackRef.current,
                  `Error ${event.data} en YouTube (LatinAutor / UMPG / Embed Restringido)`,
                  isEmbedBlocked
                );
                setTimeout(() => {
                  isSkippingRef.current = false;
                }, 800);
              },
            },
          });
        } catch (e) {
          console.warn("[C-DIGGER] Error instanciando YT.Player:", e);
        }
      })
      .catch((err) => {
        console.warn("[C-DIGGER] Error cargando YouTube API:", err);
      });

    return () => {
      isCancelled = true;
      clearPlaybackWatchdog();
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === "function") {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
        playerReadyRef.current = false;
      }
    };
  }, [isOpen, isStandalone, clearPlaybackWatchdog, startPlaybackWatchdog]);

  // Cargar nuevo video en el reproductor existente cada vez que cambia el vinilo y reproducir automáticamente
  const lastLoadedYtId = useRef<string>(currentTrack.youtubeId);
  useEffect(() => {
    if (lastLoadedYtId.current === currentTrack.youtubeId) return;
    lastLoadedYtId.current = currentTrack.youtubeId;

    startPlaybackWatchdog(currentTrack.youtubeId);

    if (ytPlayerRef.current && playerReadyRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
      try {
        // loadVideoById inicia automáticamente la reproducción en la API de YouTube
        ytPlayerRef.current.loadVideoById({
          videoId: currentTrack.youtubeId,
          startSeconds: 0,
        });
        // Refuerzo inmediato para asegurar autoplay al dar random
        setTimeout(() => {
          try {
            ytPlayerRef.current?.playVideo();
          } catch {}
        }, 120);
      } catch (e) {
        console.warn("[C-DIGGER] Error en loadVideoById:", e);
      }
    }
  }, [currentTrack.youtubeId, startPlaybackWatchdog]);

  // Si el usuario hace clic en un CUE mini-pad: seek directo en el reproductor
  useEffect(() => {
    if (activePadTime !== null && ytPlayerRef.current && playerReadyRef.current) {
      try {
        ytPlayerRef.current.seekTo(activePadTime, true);
        ytPlayerRef.current.playVideo();
      } catch {}
    }
  }, [activePadTime]);

  // Keyboard shortcut for Digging (Left/Right Arrows)
  useEffect(() => {
    if (!isStandalone && !isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isStandalone && !isTopModal()) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable) {
        return;
      }
      if (e.code === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        handleNextTrack();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        handlePrevTrack();
      } else if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === "function") {
          try {
            const state = ytPlayerRef.current.getPlayerState();
            if (state === 1) {
              ytPlayerRef.current.pauseVideo();
            } else {
              ytPlayerRef.current.playVideo();
            }
          } catch {}
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, isStandalone, isTopModal, handleNextTrack, handlePrevTrack]);

  // 2. TOGGLE FAVORITE
  const handleToggleFavorite = (trackId: string) => {
    setFavorites((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  // 4. TRIGGER MINI-PAD JUMP (Samplette signature feature)
  const handleJumpToPad = (pad: DiggerMiniPad) => {
    setActivePadTime(pad.timeSec);
    setActivePadId(pad.id);
  };

  // 6. CLEAR ALL FILTERS
  const handleClearFilters = () => {
    setSelectedGenre("Todos");
    setSelectedDecade("Todas");
    setSelectedCountry("Todos");
    setSelectedObscurity("all");
    setSearchQuery("");
    const freshPool = shuffleCratePool(CRATE_DATABASE);
    setTracksPool(freshPool);
    if (freshPool[0]) {
      selectTrack(freshPool[0], freshPool);
    } else {
      setCurrentTrackId("");
      setCurrentTrackIndex(0);
    }
  };

  // 8. SEND TO C-SAMPLER (8 PADS EN SERATO SLICER & MPC MAP)
  const handleSendToSampler = async () => {
    setIsExtracting(true);
    setActivePadTime(null); // Pausar preescucha local en C-Digger al transferir a C-Sampler

    try {
      let buffer: AudioBuffer | null = null;

      // 1. Intentar obtener stream de audio en memoria RAM directamente de la canción de YouTube
      try {
        const streamUrl = `/api/studio/stream-sample?youtubeId=${currentTrack.youtubeId}&bpm=${currentTrack.bpm}&key=${currentTrack.key}&genre=${encodeURIComponent(currentTrack.genre)}`;
        const res = await fetch(streamUrl, { signal: AbortSignal.timeout(4500) });
        const contentType = res.headers.get("Content-Type") || "";
        if (res.ok && (contentType.includes("audio") || contentType.includes("octet-stream"))) {
          const arrayBuffer = await res.arrayBuffer();
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioCtx();
          buffer = await ctx.decodeAudioData(arrayBuffer);
        }
      } catch {
        // Transferencia al reproductor de C-Sampler
      }

      const trackDuration = currentTrack.durationSec || 180;
      // Los 8 Cues se mapean directamente de los 8 pads visibles de C-Digger
      const cues: SamplerCuePoint[] = trackPads.map((pad, idx) => {
        const nextPad = trackPads[idx + 1];
        const endSec = nextPad ? nextPad.timeSec : trackDuration;
        return {
          id: pad.id,
          name: pad.label.toUpperCase(),
          startSec: pad.timeSec,
          endSec: Math.max(pad.timeSec + 2, endSec),
          color: pad.id % 2 === 1 ? "#CCFF00" : "#FFFFFF",
          active: true,
          keyNote: currentTrack.key,
        };
      });

      const sampleData: LoadedSampleData = {
        name: `${currentTrack.artist || "Vinilo"} - ${currentTrack.title}`,
        buffer: buffer, // Si hubo buffer real de audio, se pasa; de lo contrario null para que suene la canción real de YouTube
        cues,
        trackInfo: currentTrack,
      };

      onSendToSampler(sampleData);
    } catch (err) {
      console.error("Error sending to sampler:", err);
      // Fallback: guaranteed transition to C-Sampler
      onSendToSampler({
        name: `${currentTrack.artist || "Vinilo"} - ${currentTrack.title}`,
        buffer: null,
        trackInfo: currentTrack,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const isCurrentFavorite = favorites.includes(currentTrack.id);

  if (!isStandalone && !isOpen) return null;

  return (
    <div
      ref={modalContainerRef}
      tabIndex={-1}
      role={isStandalone ? undefined : "dialog"}
      aria-modal={isStandalone ? undefined : true}
      suppressHydrationWarning
      style={
        isStandalone
          ? {
            minHeight: "100vh",
            width: "100%",
            backgroundColor: "#080A0F",
            backgroundImage: "radial-gradient(#1E2436 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            color: "#F9FBE5",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 20px",
            boxSizing: "border-box",
            fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
          }
          : {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(6, 8, 12, 0.95)",
            backdropFilter: "blur(12px)",
            zIndex: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: isFullscreen ? "0" : "16px",
            fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
          }
      }
    >
      {/* 0. OUTSIDE TOP BAR: Volver a la radio, Crate, y Ver DAW (Solo fuera del contorno) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "1200px",
          marginBottom: "10px",
          flexShrink: 0,
          gap: "12px",
        }}
      >
        {isStandalone ? (
          <Link
            href="/"
            className="neo-button fun-hover-wobble"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              backgroundColor: "#161922",
              color: "#CCFF00",
              border: "2px solid #CCFF00",
              boxShadow: "2px 2px 0px #CCFF00",
              borderRadius: "4px",
              fontSize: "0.7rem",
              fontWeight: 900,
              textDecoration: "none",
              cursor: "pointer",
            }}
            title="Volver a la señal en vivo de Radio Doble C"
          >
            <ArrowLeft size={13} />
            <span>VOLVER A LA RADIO</span>
          </Link>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 900, color: "#CCFF00", letterSpacing: "1px" }}>
              C-DIGGER
            </span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "#94A3B8", letterSpacing: "0.5px" }}>
            RADIO DOBLE C · <span style={{ color: "#CCFF00" }}>STUDIO</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Supabase Google OAuth Cloud Badge / Connect Button */}
          {isAuthenticated ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 8px",
                backgroundColor: "#161B26",
                border: "1px solid #232838",
                borderRadius: "4px",
              }}
              title={`Conectado como ${userProfile.name}. Cuota personal activa.`}
            >
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid #CCFF00",
                }}
              />
              <span style={{ fontSize: "0.68rem", fontWeight: 900, color: "#CCFF00", letterSpacing: "0.5px" }}>
                {userProfile.name.split(" ")[0]} · VINCULADO
              </span>
              <button
                type="button"
                onClick={signOut}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94A3B8",
                  fontSize: "0.6rem",
                  cursor: "pointer",
                  padding: "0 2px",
                }}
                title="Desconectar cuenta"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                backgroundColor: "#161B26",
                color: "#CCFF00",
                border: "1px solid #CCFF00",
                borderRadius: "4px",
                fontSize: "0.68rem",
                fontWeight: 900,
                cursor: "pointer",
              }}
              title="Vincular tu cuenta de Google / Supabase"
            >
              <span>⚡</span>
              <span>VINCULAR GOOGLE</span>
            </button>
          )}

          {/* Drawer Toggle: Historial y Guardados */}
          <button
            onClick={() => {
              setDrawerTab("history");
              setShowCrateDrawer((prev) => !prev);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              backgroundColor: showCrateDrawer ? "#CCFF00" : "#161B26",
              color: showCrateDrawer ? "#000000" : "#FFFFFF",
              border: "1px solid #232838",
              borderRadius: "4px",
              fontSize: "0.7rem",
              fontWeight: 800,
              cursor: "pointer",
            }}
            title="Abrir historial de vinilos escuchados y pistas guardadas"
          >
            <History size={13} />
            <span>HISTORIAL ({playedHistory.length})</span>
          </button>

          {onOpenSampler && (
            <button
              onClick={onOpenSampler}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                backgroundColor: "#101D24",
                color: "#00E5FF",
                border: "1px solid #00E5FF",
                borderRadius: "4px",
                fontSize: "0.7rem",
                fontWeight: 900,
                cursor: "pointer",
              }}
              title="Ir al laboratorio de sampleo y stems C-Sampler"
            >
              <span>🎚️</span>
              <span>C-SAMPLER</span>
            </button>
          )}

          {!isStandalone && onClose && (
            <button
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 10px",
                backgroundColor: "#161B26",
                color: "#FFFFFF",
                border: "1px solid #232838",
                borderRadius: "4px",
                fontSize: "0.7rem",
                fontWeight: 900,
                cursor: "pointer",
              }}
              title="Cerrar C-Digger"
            >
              <X size={14} />
              <span>SALIR</span>
            </button>
          )}
        </div>
      </div>

      {/* THE CONTOURED MODAL CARD (Compact & Centered) */}
      <div
        style={
          isStandalone
            ? {
              width: "100%",
              maxWidth: "1200px",
              maxHeight: "88vh",
              backgroundColor: "#0B0D13",
              border: "2px solid #232838",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 70px rgba(0,0,0,0.95)",
              overflow: "hidden",
            }
            : {
              width: isFullscreen ? "100vw" : "100%",
              maxWidth: isFullscreen ? "100vw" : "1200px",
              height: isFullscreen ? "100vh" : "auto",
              maxHeight: isFullscreen ? "100vh" : "88vh",
              backgroundColor: "#0B0D13",
              border: isFullscreen ? "none" : "2px solid #232838",
              borderRadius: isFullscreen ? "0" : "8px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 90px rgba(0,0,0,0.98)",
              overflow: "hidden",
            }
        }
      >
        {/* STYLES FOR RESPONSIVE DIGGER 3-COLUMN STAGE (PERFECT SYMMETRY) */}
        <style>{`
          .digger-stage-grid {
            display: grid;
            grid-template-columns: 240px 1fr 240px;
            gap: 16px;
            align-items: stretch;
          }
          @media (max-width: 960px) {
            .digger-stage-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        {/* ======================================================== */}
        {/* 1. MAIN STAGE (3 COLUMNS: FILTERS | PLAYER | DOSSIER)     */}
        {/* ======================================================== */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Main Content Area */}
          <div
            style={{
              flex: 1,
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              overflowY: "auto",
            }}
          >
            {/* Aviso dinámico de archivistas o conexión (si existe) */}
            {providerNotice && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  alignSelf: "center",
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  color: "#CCFF00",
                  backgroundColor: "#11141C",
                  border: "1px solid #1E2332",
                  padding: "4px 12px",
                  borderRadius: "4px",
                }}
              >
                <span>📻</span>
                <span>{providerNotice}</span>
              </div>
            )}

            {/* 3-Column Studio Grid: 1. Filtros | 2. Reproductor Centrado | 3. Dossier & Mini-Pads Simétricos */}
            <div className="digger-stage-grid">
              {/* 1. Left Column: Filtros (Género, País, Época, Visitas) */}
              <div
                style={{
                  backgroundColor: "#11141C",
                  border: "2px solid #1E2332",
                  borderRadius: "6px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "9px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #1E2332",
                    paddingBottom: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "#CCFF00",
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontSize: "0.68rem", fontWeight: 900, color: "#CCFF00", letterSpacing: "0.5px" }}>
                      FILTROS
                    </span>
                  </div>
                </div>

                {/* Género */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94A3B8" }}>GÉNERO</label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => {
                      setSelectedGenre(e.target.value);
                      setCurrentTrackIndex(0);
                    }}
                    style={{
                      backgroundColor: "#161B26",
                      color: "#FFFFFF",
                      border: "1px solid #232838",
                      borderRadius: "3px",
                      padding: "5px 6px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      outline: "none",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* País */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94A3B8" }}>PAÍS</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      setCurrentTrackIndex(0);
                    }}
                    style={{
                      backgroundColor: "#161B26",
                      color: "#FFFFFF",
                      border: "1px solid #232838",
                      borderRadius: "3px",
                      padding: "5px 6px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      outline: "none",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Época */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94A3B8" }}>ÉPOCA</label>
                  <select
                    value={selectedDecade}
                    onChange={(e) => {
                      setSelectedDecade(e.target.value);
                      setCurrentTrackIndex(0);
                    }}
                    style={{
                      backgroundColor: "#161B26",
                      color: "#FFFFFF",
                      border: "1px solid #232838",
                      borderRadius: "3px",
                      padding: "5px 6px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      outline: "none",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    {DECADES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visitas / Rareza */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94A3B8" }}>VISITAS</label>
                  <select
                    value={selectedObscurity}
                    onChange={(e) => {
                      setSelectedObscurity(e.target.value);
                      setCurrentTrackIndex(0);
                    }}
                    style={{
                      backgroundColor: "#161B26",
                      color: "#FFFFFF",
                      border: "1px solid #232838",
                      borderRadius: "3px",
                      padding: "5px 6px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      outline: "none",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    {OBSCURITIES.map((obs) => (
                      <option key={obs.id} value={obs.id}>
                        {obs.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Limpiar filtros */}
                {(selectedGenre !== "Todos" ||
                  selectedDecade !== "Todas" ||
                  selectedCountry !== "Todos" ||
                  selectedObscurity !== "all" ||
                  searchQuery !== "") && (
                  <button
                    onClick={handleClearFilters}
                    style={{
                      backgroundColor: "transparent",
                      color: "#FFFFFF",
                      border: "1px dashed #CCFF00",
                      borderRadius: "3px",
                      padding: "4px 8px",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      marginTop: "auto",
                    }}
                  >
                    ✕ Limpiar filtros
                  </button>
                )}
              </div>

              {/* 2. Center Column: YouTube Embed Player (Perfectamente Centrado) */}
              <div
                style={{
                  backgroundColor: "#11141C",
                  border: "2px solid #1E2332",
                  borderRadius: "6px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  alignItems: "stretch",
                  justifyContent: "space-between",
                }}
              >
                {/* Header de Reproducción y Estado */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          backgroundColor: "#CCFF00",
                          display: "inline-block",
                        }}
                      />
                      <span style={{ fontSize: "0.70rem", fontWeight: 900, color: "#CCFF00", letterSpacing: "0.5px" }}>
                        GÉNERO: {currentTrack.genre.toUpperCase()}
                      </span>
                    </div>

                    {/* Insignia visual: Escuchado vs Nuevo */}
                    {isCurrentInHistory ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 7px",
                          backgroundColor: "#161E2E",
                          border: "1px solid #3B82F6",
                          borderRadius: "3px",
                          color: "#60A5FA",
                          fontSize: "0.62rem",
                          fontWeight: 800,
                        }}
                        title="Este vinilo ya fue escuchado y registrado en tu historial"
                      >
                        <Check size={10} />
                        <span>✓ EN HISTORIAL</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 7px",
                          backgroundColor: "#1C2611",
                          border: "1px solid #CCFF00",
                          borderRadius: "3px",
                          color: "#CCFF00",
                          fontSize: "0.62rem",
                          fontWeight: 800,
                        }}
                        title="Primer contacto con este vinilo: totalmente inédito"
                      >
                        <Sparkles size={10} />
                        <span>NUEVO DESCUBRIMIENTO</span>
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <a
                      href={buildSampletteYouTubeWatchUrl(currentTrack.youtubeId, activePadTime || 0)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.68rem",
                        color: "#94A3B8",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        textDecoration: "none",
                      }}
                      title="Abrir video original en YouTube"
                    >
                      <span>Abrir en YouTube</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>

                {/* Direct Video Player Screen (Centrado Prominente) */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "260px",
                    backgroundColor: "#000000",
                    borderRadius: "4px",
                    overflow: "hidden",
                    border: "1.5px solid #1E2332",
                  }}
                >
                  {/* Contenedor objetivo permanente para YouTube IFrame API */}
                  <div
                    id="cdigger-yt-player-target"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  />

                  {/* Samplette Loader Overlay: Spinner animado y escudo protector contra pantallas de error */}
                  {(isPlayerLoading || skipNotice) && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#0A0C12",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        zIndex: 35,
                        textAlign: "center",
                        padding: "16px",
                      }}
                    >
                      {/* Disco de vinilo giratorio estilo Samplette */}
                      <div
                        className="animate-spin"
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          border: "3px solid #1E2332",
                          borderTopColor: "#CCFF00",
                          borderRightColor: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            backgroundColor: "#CCFF00",
                          }}
                        />
                      </div>

                      {skipNotice ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          <span
                            style={{
                              color: "#CCFF00",
                              fontWeight: 900,
                              fontSize: "0.80rem",
                              letterSpacing: "0.5px",
                            }}
                          >
                            ESCUDO ANTI-BLOQUEO
                          </span>
                          <span
                            style={{
                              color: "#94A3B8",
                              fontSize: "0.72rem",
                              maxWidth: "320px",
                              lineHeight: 1.3,
                            }}
                          >
                            {skipNotice}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span
                            style={{
                              color: "#CCFF00",
                              fontSize: "0.76rem",
                              fontWeight: 800,
                              letterSpacing: "1px",
                            }}
                          >
                            SINTONIZANDO VINILO...
                          </span>
                          <span
                            style={{
                              color: "#94A3B8",
                              fontSize: "0.68rem",
                              maxWidth: "280px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {currentTrack.title} — {currentTrack.artist}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Control Inferior: Botón Hero C-RANDOM-SAMPLE e Indicador de Rocola */}
                <div
                  style={{
                    padding: "8px 10px",
                    backgroundColor: "#161B26",
                    border: "1px solid #1E2332",
                    borderRadius: "5px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {/* Single Hero C-RANDOM-SAMPLE Button */}
                  <button
                    onClick={handleRandomDig}
                    disabled={isDiggingRandom}
                    className="neo-button fun-hover-wobble"
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      backgroundColor: isDiggingRandom ? "#8CAE00" : "#CCFF00",
                      color: "#000000",
                      border: "2px solid #000000",
                      boxShadow: "2.5px 2.5px 0px #FFFFFF",
                      borderRadius: "4px",
                      fontSize: "0.82rem",
                      fontWeight: 900,
                      cursor: isDiggingRandom ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      letterSpacing: "0.5px",
                      opacity: isDiggingRandom ? 0.85 : 1,
                    }}
                    title="Descubrir un nuevo sample de vinilo al azar desde YouTube excluyendo los ya escuchados"
                  >
                    {isDiggingRandom ? (
                      <>
                        <Loader2 size={16} className="animate-spin" style={{ color: "#000000" }} />
                        <span>BUSCANDO NUEVO VINILO EN YOUTUBE...</span>
                      </>
                    ) : (
                      <>
                        <Dices size={16} style={{ color: "#000000" }} />
                        <span>C-RANDOM-SAMPLE 🎲</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3. Right Column: Track Metadata Dossier + Mini Pads Simétricos */}
              <div
                style={{
                  backgroundColor: "#11141C",
                  border: "2px solid #1E2332",
                  borderRadius: "6px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "9px",
                }}
              >
                {/* Track Title, Artist & Favorite Button */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ overflow: "hidden" }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "0.92rem",
                        fontWeight: 900,
                        color: "#FFFFFF",
                        letterSpacing: "0.5px",
                        lineHeight: 1.25,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {currentTrack.title}
                    </h2>
                    {currentTrack.artist &&
                      !currentTrack.artist.toLowerCase().includes("desconocid") &&
                      !currentTrack.artist.toLowerCase().includes("canal de") && (
                        <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#CCFF00", marginTop: "2px" }}>
                          👤 {currentTrack.artist}
                        </div>
                      )}
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={() => handleToggleFavorite(currentTrack.id)}
                    style={{
                      padding: "6px 8px",
                      backgroundColor: isCurrentFavorite ? "#CCFF00" : "#161B26",
                      color: isCurrentFavorite ? "#000000" : "#FFFFFF",
                      border: "1px solid #232838",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title={isCurrentFavorite ? "Guardado en favoritos" : "Guardar en favoritos"}
                  >
                    <Heart size={14} fill={isCurrentFavorite ? "#000000" : "none"} />
                  </button>
                </div>

                {/* Minimalist Key Metadata Badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  <span
                    style={{
                      padding: "3px 6px",
                      backgroundColor: "#161B26",
                      border: "1px solid #232838",
                      color: "#FFFFFF",
                      borderRadius: "3px",
                      fontSize: "0.64rem",
                      fontWeight: 800,
                    }}
                  >
                    {currentTrack.year || currentTrack.decade}
                  </span>
                  <span
                    style={{
                      padding: "3px 6px",
                      backgroundColor: "#161B26",
                      border: "1px solid #232838",
                      color: "#CCFF00",
                      borderRadius: "3px",
                      fontSize: "0.64rem",
                      fontWeight: 800,
                    }}
                  >
                    ⚡ {currentTrack.bpm} BPM
                  </span>
                  <span
                    style={{
                      padding: "3px 6px",
                      backgroundColor: "#161B26",
                      border: "1px solid #232838",
                      color: "#FFFFFF",
                      borderRadius: "3px",
                      fontSize: "0.64rem",
                      fontWeight: 800,
                    }}
                  >
                    🎵 {currentTrack.key}
                  </span>
                  {currentTrack.country &&
                    !currentTrack.country.toLowerCase().includes("mundial") &&
                    currentTrack.country !== "Todos" && (
                      <span
                        style={{
                          padding: "3px 6px",
                          backgroundColor: "#161B26",
                          border: "1px solid #232838",
                          color: "#94A3B8",
                          borderRadius: "3px",
                          fontSize: "0.64rem",
                          fontWeight: 800,
                        }}
                      >
                        📍 {currentTrack.country}
                      </span>
                    )}
                </div>

                {/* Minimalist Compact 8 Mini Pads (Grid 2x4) */}
                <div
                  style={{
                    backgroundColor: "#0B0E14",
                    border: "1px solid #1E2332",
                    borderRadius: "4px",
                    padding: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.64rem", fontWeight: 800, color: "#94A3B8" }}>
                      8 PADS DE CORTE
                    </span>
                    <span style={{ fontSize: "0.58rem", color: "#CCFF00", fontWeight: 700 }}>
                      Preescucha en vivo
                    </span>
                  </div>

                  {/* 2-Column Compact 8-Pads Grid (4 filas x 2 columnas) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "5px",
                    }}
                  >
                    {trackPads.map((pad) => {
                      const isSelected = activePadId === pad.id;
                      return (
                        <button
                          key={pad.id}
                          onClick={() => handleJumpToPad(pad)}
                          style={{
                            padding: "4px 6px",
                            backgroundColor: isSelected ? "#CCFF00" : "#161B26",
                            color: isSelected ? "#000000" : "#FFFFFF",
                            border: isSelected ? "1px solid #CCFF00" : "1px solid #232838",
                            borderRadius: "3px",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "1px",
                            transition: "all 0.1s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                            <span style={{ fontSize: "0.60rem", fontWeight: 900 }}>
                              PAD {pad.id}
                            </span>
                            <span style={{ fontSize: "0.56rem", fontFamily: "monospace", opacity: 0.85 }}>
                              {Math.floor(pad.timeSec / 60)}:{(pad.timeSec % 60).toString().padStart(2, "0")}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "0.58rem",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              width: "100%",
                              textAlign: "left",
                              opacity: isSelected ? 1 : 0.85,
                            }}
                          >
                            {pad.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.70rem",
                    color: "#94A3B8",
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {currentTrack.description}
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 5. RIGHT DRAWER: HISTORIAL & GUARDADOS                   */}
          {/* ======================================================== */}
          {showCrateDrawer && (
            <div
              style={{
                width: "300px",
                backgroundColor: "#0D1017",
                borderLeft: "2px solid #1E2332",
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                padding: "12px",
                gap: "10px",
              }}
            >
              {/* Drawer Top Header: Tabs Selector & Close Button */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                <div style={{ display: "flex", gap: "4px", flex: 1 }}>
                  <button
                    onClick={() => setDrawerTab("history")}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      backgroundColor: drawerTab === "history" ? "#CCFF00" : "#161B26",
                      color: drawerTab === "history" ? "#000000" : "#94A3B8",
                      border: "1px solid #232838",
                      borderRadius: "4px",
                      fontSize: "0.68rem",
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <History size={12} />
                    <span>HISTORIAL ({playedHistory.length})</span>
                  </button>

                  <button
                    onClick={() => setDrawerTab("favorites")}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      backgroundColor: drawerTab === "favorites" ? "#CCFF00" : "#161B26",
                      color: drawerTab === "favorites" ? "#000000" : "#94A3B8",
                      border: "1px solid #232838",
                      borderRadius: "4px",
                      fontSize: "0.68rem",
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <Bookmark size={12} />
                    <span>GUARDADOS ({favorites.length})</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowCrateDrawer(false)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  title="Cerrar panel lateral"
                >
                  <X size={14} />
                </button>
              </div>

              {/* TAB 1: HISTORIAL DE ESCUCHA */}
              {drawerTab === "history" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#94A3B8" }}>
                      VINILOS REPRODUCIDOS
                    </span>
                    {playedHistory.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#EF4444",
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          padding: "2px 4px",
                        }}
                        title="Limpiar registro de historial"
                      >
                        <Trash2 size={10} />
                        <span>Limpiar</span>
                      </button>
                    )}
                  </div>

                  {playedHistory.length === 0 ? (
                    <div
                      style={{
                        padding: "20px 12px",
                        textAlign: "center",
                        color: "#94A3B8",
                        fontSize: "0.72rem",
                        backgroundColor: "#11141C",
                        border: "1px dashed #1E2332",
                        borderRadius: "4px",
                      }}
                    >
                      <Music2 size={24} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
                      <p style={{ margin: 0 }}>Aún no has reproducido vinilos en esta sesión.</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.66rem", color: "#CCFF00" }}>
                        ¡Presiona C-RANDOM-SAMPLE 🎲 para comenzar!
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {playedHistory.map((item, index) => {
                        const isCurrent =
                          currentTrack.id === item.id || currentTrack.youtubeId === item.youtubeId;
                        return (
                          <button
                            key={`${item.youtubeId || item.id}-${item.playedAt || index}`}
                            onClick={() => handleSelectHistoryTrack(item)}
                            style={{
                              padding: "7px 9px",
                              backgroundColor: isCurrent ? "#161E2E" : "#11141C",
                              border: isCurrent ? "1.5px solid #CCFF00" : "1px solid #1E2332",
                              borderRadius: "4px",
                              cursor: "pointer",
                              textAlign: "left",
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                              transition: "all 0.12s ease",
                            }}
                            title="Haz clic para volver a escuchar este vinilo"
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  color: isCurrent ? "#CCFF00" : "#FFFFFF",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  flex: 1,
                                }}
                              >
                                {item.title}
                              </span>
                              {isCurrent && (
                                <span style={{ fontSize: "0.58rem", fontWeight: 900, color: "#000000", backgroundColor: "#CCFF00", padding: "1px 4px", borderRadius: "2px" }}>
                                  ACTUAL
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                              <span style={{ fontSize: "0.64rem", color: "#94A3B8" }}>
                                👤 {item.artist} {item.country ? `· ${item.country}` : ""}
                              </span>
                              <span style={{ fontSize: "0.58rem", color: "#64748B", fontFamily: "monospace" }}>
                                {formatRelativeTime(item.playedAt)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FAVORITOS GUARDADOS */}
              {drawerTab === "favorites" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#94A3B8" }}>
                    VINILOS GUARDADOS EN TU CRATE
                  </span>
                  {favorites.length === 0 ? (
                    <div
                      style={{
                        padding: "20px 12px",
                        textAlign: "center",
                        color: "#94A3B8",
                        fontSize: "0.72rem",
                        backgroundColor: "#11141C",
                        border: "1px dashed #1E2332",
                        borderRadius: "4px",
                      }}
                    >
                      <Bookmark size={24} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
                      <p style={{ margin: 0 }}>No tienes vinilos guardados aún.</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.66rem", color: "#CCFF00" }}>
                        Guarda tus pistas favoritas con el botón de corazón ❤️
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {tracksPool
                        .filter((t) => favorites.includes(t.id))
                        .concat(
                          CRATE_DATABASE.filter(
                            (t) => favorites.includes(t.id) && !tracksPool.some((p) => p.id === t.id)
                          )
                        )
                        .map((fav) => {
                          const isCurrent = fav.id === currentTrack.id;
                          return (
                            <button
                              key={fav.id}
                              onClick={() => {
                                const idx = filteredTracks.findIndex((t) => t.id === fav.id);
                                if (idx >= 0) {
                                  selectTrack(fav, filteredTracks);
                                } else {
                                  setSelectedGenre("Todos");
                                  setSelectedCountry("Todos");
                                  setSelectedDecade("Todas");
                                  setSelectedObscurity("all");
                                  setSearchQuery("");
                                  const exists = tracksPool.some((t) => t.id === fav.id);
                                  if (!exists) {
                                    setTracksPool((prev) => [fav, ...prev]);
                                  }
                                  selectTrack(fav);
                                }
                              }}
                              style={{
                                padding: "7px 9px",
                                backgroundColor: isCurrent ? "#161E2E" : "#11141C",
                                border: isCurrent ? "1.5px solid #CCFF00" : "1px solid #1E2332",
                                borderRadius: "4px",
                                cursor: "pointer",
                                textAlign: "left",
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                              }}
                            >
                              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {fav.title}
                              </span>
                              <span style={{ fontSize: "0.64rem", color: "#CCFF00" }}>
                                {fav.artist} ({fav.country})
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. BOTTOM ACTION BAR: SIGUIENTE                          */}
        {/* ======================================================== */}
        <div
          style={{
            backgroundColor: "#0D1017",
            borderTop: "2px solid #1E2332",
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          {/* Current Track Summary Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.74rem", color: "#94A3B8" }}>
            <span style={{ color: "#CCFF00", fontWeight: 900, letterSpacing: "0.5px" }}>PISTA:</span>
            <span style={{ color: "#FFFFFF", fontWeight: 800 }}>{currentTrack.artist}</span>
            <span>—</span>
            <span style={{ color: "#FFFFFF", fontWeight: 800 }}>{currentTrack.title}</span>
            <span style={{ fontSize: "0.68rem", opacity: 0.8, fontFamily: "monospace" }}>
              ({currentTrack.bpm} BPM · {currentTrack.key})
            </span>
          </div>

          {/* Siguiente Button */}
          <button
            onClick={handleSendToSampler}
            disabled={isExtracting}
            className="neo-button fun-hover-wobble"
            style={{
              minWidth: "180px",
              padding: "10px 22px",
              backgroundColor: "#CCFF00",
              color: "#000000",
              border: "2px solid #000000",
              boxShadow: "3px 3px 0px #FFFFFF",
              borderRadius: "4px",
              fontSize: "0.85rem",
              fontWeight: 900,
              cursor: isExtracting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              letterSpacing: "0.8px",
              opacity: isExtracting ? 0.7 : 1,
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            title="Avanzar al siguiente paso: samplear y cortar en C-Sampler"
          >
            {isExtracting ? (
              <>
                <Scissors size={17} />
                <span>CARGANDO EN MEMORIA RAM...</span>
              </>
            ) : (
              <>
                <span>SIGUIENTE</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
