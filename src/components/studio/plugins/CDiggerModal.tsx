"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useModalIsolation } from "@/hooks/useModalIsolation";
import type {
  DiggerTrack,
  LoadedSampleData,
  SamplerCuePoint,
  DiggerMiniPad,
  YTPlayer,
  PlayedHistoryItem,
} from "@/types/studio";
import { shuffleCratePool, loadYouTubeIframeAPI } from "@/lib/studio/crateEngine";
import {
  STORAGE_DIG_HISTORY,
  STORAGE_HEARD_IDS,
  STORAGE_UNPLAYED_POOL,
  STORAGE_FAVORITES,
  STORAGE_BLOCKED_VIDEOS,
  CRATE_DATABASE,
  getInitialHeardIds,
  getInitialTracksPool,
  getInitialPlayedHistory,
  getInitialBlockedIds,
} from "@/lib/studio/diggerStorage";
import { useAudio } from "@/hooks/useAudio";
import { DiggerHeaderBar } from "./digger/DiggerHeaderBar";
import { DiggerFiltersBar } from "./digger/DiggerFiltersBar";
import { DiggerPlayerStage } from "./digger/DiggerPlayerStage";
import { DiggerTrackDossier } from "./digger/DiggerTrackDossier";
import { DiggerCrateDrawer } from "./digger/DiggerCrateDrawer";
import { DiggerFooterBar } from "./digger/DiggerFooterBar";

interface CDiggerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSendToSampler: (sampleData: LoadedSampleData) => void;
  isStandalone?: boolean;
  onOpenSampler?: () => void;
}

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
    } catch { }
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
    } catch { }
  }, [playedHistory]);

  // 1b. Sincronizar registro maestro de IDs escuchados (hasta 5,000 IDs para evitar repeticiones entre días)
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && heardIds.length > 0) {
        localStorage.setItem(STORAGE_HEARD_IDS, JSON.stringify(heardIds.slice(-5000)));
      }
    } catch { }
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
    } catch { }
  }, [tracksPool, playedIdsSet, blockedVideoIds]);

  // 2. Sincronizar favoritos con localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(favorites));
      }
    } catch { }
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
        } catch { }
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

    if (unplayedCount > 4) return;

    const currentAlreadyHeard =
      playedIdsSet.has(currentTrack.id) || playedIdsSet.has(currentTrack.youtubeId);

    let cancelled = false;
    const timerId = window.setTimeout(() => {
      handleSearchYouTube("", true, true).then((freshTracks) => {
        if (cancelled || !Array.isArray(freshTracks) || freshTracks.length === 0) return;
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
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
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
      } catch { }
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
          } catch { }
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
        } catch { }

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
      } catch { }
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
                } catch { }
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
                  } catch { }

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
        } catch { }
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
          } catch { }
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
      } catch { }
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
          } catch { }
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
      <DiggerHeaderBar
        isStandalone={isStandalone}
        isAuthenticated={isAuthenticated}
        userName={userProfile.name}
        userAvatarUrl={userProfile.avatarUrl}
        showCrateDrawer={showCrateDrawer}
        playedHistoryCount={playedHistory.length}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
        onToggleHistoryDrawer={() => {
          setDrawerTab("history");
          setShowCrateDrawer((prev) => !prev);
        }}
        onOpenSampler={onOpenSampler}
        onClose={onClose}
      />

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
              <DiggerFiltersBar
                selectedGenre={selectedGenre}
                selectedCountry={selectedCountry}
                selectedDecade={selectedDecade}
                selectedObscurity={selectedObscurity}
                searchQuery={searchQuery}
                onChangeGenre={(v) => {
                  setSelectedGenre(v);
                  setCurrentTrackIndex(0);
                }}
                onChangeCountry={(v) => {
                  setSelectedCountry(v);
                  setCurrentTrackIndex(0);
                }}
                onChangeDecade={(v) => {
                  setSelectedDecade(v);
                  setCurrentTrackIndex(0);
                }}
                onChangeObscurity={(v) => {
                  setSelectedObscurity(v);
                  setCurrentTrackIndex(0);
                }}
                onClearFilters={handleClearFilters}
              />

              <DiggerPlayerStage
                currentTrack={currentTrack}
                isCurrentInHistory={isCurrentInHistory}
                activePadTime={activePadTime}
                isPlayerLoading={isPlayerLoading}
                skipNotice={skipNotice}
                isDiggingRandom={isDiggingRandom}
                onRandomDig={handleRandomDig}
              />

              <DiggerTrackDossier
                currentTrack={currentTrack}
                isCurrentFavorite={isCurrentFavorite}
                trackPads={trackPads}
                activePadId={activePadId}
                onToggleFavorite={handleToggleFavorite}
                onJumpToPad={handleJumpToPad}
              />
            </div>
          </div>

          {showCrateDrawer && (
            <DiggerCrateDrawer
              drawerTab={drawerTab}
              playedHistory={playedHistory}
              favorites={favorites}
              tracksPool={tracksPool}
              currentTrack={currentTrack}
              onChangeTab={setDrawerTab}
              onClose={() => setShowCrateDrawer(false)}
              onClearHistory={handleClearHistory}
              onSelectHistoryTrack={handleSelectHistoryTrack}
              onSelectFavoriteTrack={(fav) => {
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
            />
          )}
        </div>

        <DiggerFooterBar
          currentTrack={currentTrack}
          isExtracting={isExtracting}
          onSendToSampler={handleSendToSampler}
        />
      </div>
    </div>
  );
};