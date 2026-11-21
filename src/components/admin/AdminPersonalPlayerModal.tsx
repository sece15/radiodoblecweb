"use client";

import { useMemo, useRef, useState, ChangeEvent, FormEvent } from "react";
import {
  AlertTriangle,
  Check,
  FileAudio,
  ListMusic,
  Loader2,
  Mic,
  Plus,
  Radio,
  RefreshCw,
  Search,
  SkipForward,
  Upload,
} from "lucide-react";
import { NeoModal } from "@/components/common/NeoModal";
import { AdminVoiceRecorderPanel } from "@/components/admin/AdminVoiceRecorderPanel";
import { AdminLiveQueuePanel } from "@/components/admin/AdminLiveQueuePanel";
import { useAudio } from "@/hooks/useAudio";
import { useShallow } from "zustand/react/shallow";
import {
  ADMIN_MAX_UPLOAD_BYTES,
  type AdminRadioTrack,
} from "@/types/adminRadio";
import {
  useAdminEnqueueTrack,
  useAdminMediaCatalog,
  useAdminPlaylists,
  useAdminQueue,
  useAdminSkipNext,
  useAdminUploadTrack,
} from "@/hooks/useAdminRadioQuery";
import { useAdminRadioStore } from "@/store/useAdminRadioStore";

interface AdminPersonalPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPersonalPlayerModal = ({
  isOpen,
  onClose,
}: AdminPersonalPlayerModalProps) => {
  const { userProfile, liveTrackTitle, liveShowName } = useAudio(
    useShallow((s) => ({
      userProfile: s.userProfile,
      liveTrackTitle: s.liveTrackTitle,
      liveShowName: s.liveShowName,
    }))
  );

  const isExactAdmin = (userProfile?.role || "").toUpperCase() === "ADMIN";
  const queriesEnabled = isOpen && isExactAdmin;

  // Zustand store para estado persistente de UI del panel Admin
  const {
    activeTab,
    searchQuery,
    selectedFilterPlaylistId,
    enqueuingId,
    enqueuedIds,
    selectedUploadPlaylistId,
    uploadFolder,
    uploadArtist,
    uploadTitle,
    enqueueNext,
    lastUploadResult,
    feedback,
    setActiveTab,
    setSearchQuery,
    setSelectedFilterPlaylistId,
    setEnqueuingId,
    markTrackEnqueued,
    setSelectedUploadPlaylistId,
    setUploadFolder,
    setUploadArtist,
    setUploadTitle,
    setEnqueueNext,
    setLastUploadResult,
    setFeedback,
    resetUploadMetadata,
  } = useAdminRadioStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      searchQuery: s.searchQuery,
      selectedFilterPlaylistId: s.selectedFilterPlaylistId,
      enqueuingId: s.enqueuingId,
      enqueuedIds: s.enqueuedIds,
      selectedUploadPlaylistId: s.selectedUploadPlaylistId,
      uploadFolder: s.uploadFolder,
      uploadArtist: s.uploadArtist,
      uploadTitle: s.uploadTitle,
      enqueueNext: s.enqueueNext,
      lastUploadResult: s.lastUploadResult,
      feedback: s.feedback,
      setActiveTab: s.setActiveTab,
      setSearchQuery: s.setSearchQuery,
      setSelectedFilterPlaylistId: s.setSelectedFilterPlaylistId,
      setEnqueuingId: s.setEnqueuingId,
      markTrackEnqueued: s.markTrackEnqueued,
      setSelectedUploadPlaylistId: s.setSelectedUploadPlaylistId,
      setUploadFolder: s.setUploadFolder,
      setUploadArtist: s.setUploadArtist,
      setUploadTitle: s.setUploadTitle,
      setEnqueueNext: s.setEnqueueNext,
      setLastUploadResult: s.setLastUploadResult,
      setFeedback: s.setFeedback,
      resetUploadMetadata: s.resetUploadMetadata,
    }))
  );

  // TanStack React Query hooks (caché de servidor 5 min, filtrado local instantáneo)
  const playlistsQuery = useAdminPlaylists(queriesEnabled);
  const mediaQuery = useAdminMediaCatalog(queriesEnabled);
  const queueQuery = useAdminQueue(queriesEnabled);
  const skipNextMutation = useAdminSkipNext();
  const enqueueMutation = useAdminEnqueueTrack();
  const uploadMutation = useAdminUploadTrack();

  // Archivo local del input file
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Paginación progresiva en scroll (50 en 50 para no pintar 300+ nodos DOM de golpe)
  const PAGE_SIZE = 50;
  const filterKey = `${selectedFilterPlaylistId}::${searchQuery.trim().toLowerCase()}`;
  const [pagination, setPagination] = useState<{ key: string; count: number }>({
    key: "",
    count: PAGE_SIZE,
  });
  const visibleCount = pagination.key === filterKey ? pagination.count : PAGE_SIZE;

  const playlists = useMemo(
    () => playlistsQuery.data?.playlists ?? [],
    [playlistsQuery.data?.playlists]
  );
  const allTracks = useMemo(
    () => mediaQuery.data?.tracks ?? [],
    [mediaQuery.data?.tracks]
  );
  const totalTracks = mediaQuery.data?.total ?? allTracks.length;
  const uploadPlaylistId =
    selectedUploadPlaylistId ?? playlistsQuery.data?.default_upload_playlist_id ?? 22;

  // Mapa playlist_id -> carpeta real más frecuente de esa playlist
  const playlistDefaultFolderMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const pl of playlists) {
      const plNameLower = pl.name.toLowerCase();
      const counts = new Map<string, number>();
      for (const track of allTracks) {
        if (!track.path) continue;
        const trackPlaylists = Array.isArray(track.playlists) ? track.playlists : [];
        const belongs = trackPlaylists.some((entry) => {
          if (typeof entry === "number") return entry === pl.id;
          if (typeof entry === "string") {
            return entry === String(pl.id) || entry.toLowerCase() === plNameLower;
          }
          if (typeof entry === "object" && entry !== null) {
            const obj = entry as { id?: number | string; name?: string };
            return (
              (obj.id !== undefined && Number(obj.id) === pl.id) ||
              obj.name?.toLowerCase() === plNameLower
            );
          }
          return false;
        });
        if (!belongs) continue;
        const normalized = track.path.replace(/\\/g, "/").replace(/^\/+/, "");
        const lastSlash = normalized.lastIndexOf("/");
        if (lastSlash > 0) {
          const dir = normalized.slice(0, lastSlash);
          counts.set(dir, (counts.get(dir) || 0) + 1);
        }
      }
      let bestDir = "";
      let bestCount = 0;
      counts.forEach((c, dir) => {
        if (c > bestCount) {
          bestCount = c;
          bestDir = dir;
        }
      });
      if (bestDir) {
        map.set(pl.id, bestDir);
      } else if (pl.id === playlistsQuery.data?.default_upload_playlist_id) {
        map.set(pl.id, "lo_mas_nuevo");
      }
    }
    return map;
  }, [allTracks, playlists, playlistsQuery.data?.default_upload_playlist_id]);

  const handleSelectUploadPlaylist = (plId: number) => {
    setSelectedUploadPlaylistId(plId);
    const suggestedFolder = playlistDefaultFolderMap.get(plId) || "lo_mas_nuevo";
    setUploadFolder(suggestedFolder);
  };

  const resolvedUploadFolder =
    playlistDefaultFolderMap.get(uploadPlaylistId) || uploadFolder || "lo_mas_nuevo";

  const queryErrorText = useMemo(() => {
    const err = playlistsQuery.error || mediaQuery.error;
    if (!err) return null;
    return err instanceof Error ? err.message : "No se pudo cargar la biblioteca de la radio.";
  }, [playlistsQuery.error, mediaQuery.error]);

  // Local filtering by playlist_id and search text (instant, zero extra requests)
  const filteredTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const selectedPlIdNum = selectedFilterPlaylistId ? Number(selectedFilterPlaylistId) : null;
    const selectedPlObj =
      selectedPlIdNum !== null ? playlists.find((p) => p.id === selectedPlIdNum) : null;
    const selectedPlNameLower = selectedPlObj?.name?.toLowerCase() ?? null;

    return allTracks.filter((track) => {
      if (selectedPlIdNum !== null) {
        const trackPlaylists = Array.isArray(track.playlists) ? track.playlists : [];
        const matchesPlaylist = trackPlaylists.some((entry) => {
          if (typeof entry === "number") return entry === selectedPlIdNum;
          if (typeof entry === "string") {
            if (entry === String(selectedPlIdNum)) return true;
            if (selectedPlNameLower && entry.toLowerCase() === selectedPlNameLower) return true;
            return false;
          }
          if (typeof entry === "object" && entry !== null) {
            const obj = entry as { id?: number | string; name?: string };
            if (obj.id !== undefined && Number(obj.id) === selectedPlIdNum) return true;
            if (selectedPlNameLower && obj.name?.toLowerCase() === selectedPlNameLower) return true;
          }
          return false;
        });
        if (!matchesPlaylist) return false;
      }

      if (q) {
        const haystack =
          `${track.artist || ""} ${track.title || ""} ${track.text || ""} ${track.path || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [allTracks, playlists, searchQuery, selectedFilterPlaylistId]);

  const visibleTracks = useMemo(
    () => filteredTracks.slice(0, visibleCount),
    [filteredTracks, visibleCount]
  );
  const hasMoreTracks = visibleCount < filteredTracks.length;

  const handleLoadMoreTracks = () => {
    if (!hasMoreTracks) return;
    setPagination({
      key: filterKey,
      count: Math.min(filteredTracks.length, visibleCount + PAGE_SIZE),
    });
  };

  if (!isOpen || !isExactAdmin) return null;

  const isLoadingLibrary = playlistsQuery.isLoading || mediaQuery.isLoading;
  const isFetchingLibrary = playlistsQuery.isFetching || mediaQuery.isFetching;
  const activeBanner =
    feedback || (queryErrorText ? { type: "error" as const, text: queryErrorText } : null);

  const handleSkipNext = async () => {
    setFeedback(null);
    try {
      await skipNextMutation.mutateAsync();
      setFeedback({
        type: "success",
        text: "⏭ Canción saltada en vivo. Actualizando Now Playing...",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo pasar la canción.";
      setFeedback({ type: "error", text: msg });
    }
  };

  const handleEnqueueTrack = async (track: AdminRadioTrack) => {
    setFeedback(null);
    setEnqueuingId(track.id);
    try {
      await enqueueMutation.mutateAsync(track.id);
      markTrackEnqueued(track.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo encolar la canción.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setEnqueuingId(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isMp3 =
      file.name.toLowerCase().endsWith(".mp3") ||
      file.type === "audio/mpeg" ||
      file.type === "audio/mp3";
    if (!isMp3) {
      setFeedback({
        type: "error",
        text: "Formato inválido. Selecciona únicamente un archivo .mp3.",
      });
      e.target.value = "";
      return;
    }

    if (file.size > ADMIN_MAX_UPLOAD_BYTES) {
      setFeedback({
        type: "error",
        text: "El archivo supera el límite máximo de 45 MB (413).",
      });
      e.target.value = "";
      return;
    }

    setFeedback(null);
    setLastUploadResult(null);
    setUploadFile(file);

    const clean = file.name.replace(/\.[^/.]+$/, "");
    if (clean.includes(" - ")) {
      const [art, ...rest] = clean.split(" - ");
      if (!uploadArtist) setUploadArtist(art.trim());
      if (!uploadTitle) setUploadTitle(rest.join(" - ").trim());
    } else if (!uploadTitle) {
      setUploadTitle(clean);
    }
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setFeedback({ type: "error", text: "Selecciona un archivo .mp3 antes de subir." });
      return;
    }

    setFeedback(null);
    setLastUploadResult(null);
    try {
      const result = await uploadMutation.mutateAsync({
        file: uploadFile,
        playlist_id: uploadPlaylistId,
        folder: resolvedUploadFolder,
        artist: uploadArtist,
        title: uploadTitle,
        enqueue_next: enqueueNext,
      });
      setLastUploadResult(result);
      setFeedback({
        type: "success",
        text: result.enqueued
          ? `✅ Subida, normalizada a -16 LUFS y encolada como siguiente (${result.path}).`
          : `✅ Subida y normalizada a -16 LUFS en ${result.path}.`,
      });
      setUploadFile(null);
      resetUploadMetadata();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir la canción.";
      setFeedback({ type: "error", text: msg });
    }
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title="REPRODUCTOR PERSONAL ADMIN"
      titleSize="0.82rem"
      badgeText="SOLO ADMIN"
      maxWidth="1180px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* NOW PLAYING + NEXT BUTTON */}
        <div
          style={{
            backgroundColor: "var(--surface-container)",
            border: "2.5px solid var(--primary)",
            boxShadow: "4px 4px 0px var(--primary)",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: "var(--primary)",
                color: "var(--on-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Radio size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--on-surface-variant)",
                  display: "block",
                }}
              >
                AL AIRE AHORA · {liveShowName || "RADIO DOBLE C"}
              </span>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 900,
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={liveTrackTitle}
              >
                {liveTrackTitle || "RADIO DOBLE C - SEÑAL EN VIVO"}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={skipNextMutation.isPending}
            onClick={handleSkipNext}
            className="neo-button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              backgroundColor: "var(--primary-container)",
              color: "var(--on-primary-container)",
              border: "2px solid var(--primary)",
              boxShadow: "3px 3px 0px var(--primary)",
              fontSize: "0.74rem",
              fontWeight: 900,
              cursor: skipNextMutation.isPending ? "wait" : "pointer",
              flexShrink: 0,
            }}
          >
            {skipNextMutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <SkipForward size={15} />
            )}
            <span>{skipNextMutation.isPending ? "SALTANDO..." : "NEXT / PASAR CANCIÓN"}</span>
          </button>
        </div>

        {/* STATUS / ERROR FEEDBACK BANNER */}
        {activeBanner && (
          <div
            role="status"
            style={{
              padding: "8px 12px",
              border: "2px solid var(--primary)",
              backgroundColor:
                activeBanner.type === "error" ? "#FEE2E2" : "var(--primary-container)",
              color: activeBanner.type === "error" ? "#991B1B" : "var(--on-primary-container)",
              fontSize: "0.74rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {activeBanner.type === "error" ? (
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            ) : (
              <Check size={16} style={{ flexShrink: 0 }} />
            )}
            <span>{activeBanner.text}</span>
          </div>
        )}

        {/* TAB SWITCHER (4 SECCIONES) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            style={{
              padding: "9px 10px",
              backgroundColor:
                activeTab === "search" ? "var(--primary-container)" : "var(--card-bg)",
              color:
                activeTab === "search" ? "var(--on-primary-container)" : "var(--on-background)",
              border: "2px solid var(--primary)",
              boxShadow: activeTab === "search" ? "3px 3px 0px var(--primary)" : "none",
              fontSize: "0.72rem",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Search size={14} />
            <span>BUSCAR Y ENCOLAR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            style={{
              padding: "9px 10px",
              backgroundColor:
                activeTab === "upload" ? "var(--primary-container)" : "var(--card-bg)",
              color:
                activeTab === "upload" ? "var(--on-primary-container)" : "var(--on-background)",
              border: "2px solid var(--primary)",
              boxShadow: activeTab === "upload" ? "3px 3px 0px var(--primary)" : "none",
              fontSize: "0.72rem",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Upload size={14} />
            <span>SUBIR MP3</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("voice")}
            style={{
              padding: "9px 10px",
              backgroundColor:
                activeTab === "voice" ? "var(--primary-container)" : "var(--card-bg)",
              color:
                activeTab === "voice" ? "var(--on-primary-container)" : "var(--on-background)",
              border: "2px solid var(--primary)",
              boxShadow: activeTab === "voice" ? "3px 3px 0px var(--primary)" : "none",
              fontSize: "0.72rem",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Mic size={14} />
            <span>VOZ / PODCAST</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            style={{
              padding: "9px 10px",
              backgroundColor:
                activeTab === "queue" ? "var(--primary-container)" : "var(--card-bg)",
              color:
                activeTab === "queue" ? "var(--on-primary-container)" : "var(--on-background)",
              border: "2px solid var(--primary)",
              boxShadow: activeTab === "queue" ? "3px 3px 0px var(--primary)" : "none",
              fontSize: "0.72rem",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <ListMusic size={14} />
            <span>COLA EN VIVO ({queueQuery.data?.length ?? 0})</span>
          </button>
        </div>

        {/* TAB 1: SEARCH & QUEUE NEXT (2 COLUMNAS: IZQUIERDA PLAYLISTS | DERECHA BUSCADOR + LISTA) */}
        {activeTab === "search" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(250px, 310px) minmax(0, 1fr)",
              gap: "14px",
              alignItems: "start",
            }}
          >
            {/* COLUMNA IZQUIERDA: PLAYLISTS */}
            <div
              style={{
                border: "2px solid var(--primary)",
                backgroundColor: "var(--surface-container)",
                display: "flex",
                flexDirection: "column",
                maxHeight: "420px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "8px 10px",
                  borderBottom: "2px solid var(--primary)",
                  fontSize: "0.68rem",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>PLAYLISTS ({playlists.length})</span>
                <button
                  type="button"
                  disabled={isFetchingLibrary}
                  onClick={() => {
                    void playlistsQuery.refetch();
                    void mediaQuery.refetch();
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "transparent",
                    border: "none",
                    color: "var(--on-background)",
                    fontSize: "0.62rem",
                    fontWeight: 900,
                    cursor: isFetchingLibrary ? "wait" : "pointer",
                  }}
                  title="Sincronizar biblioteca desde el servidor"
                >
                  <RefreshCw size={12} className={isFetchingLibrary ? "animate-spin" : ""} />
                </button>
              </div>

              <div
                style={{
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  padding: "6px",
                  gap: "5px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedFilterPlaylistId("")}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 9px",
                    fontSize: "0.68rem",
                    fontWeight: 900,
                    border: "1.5px solid var(--primary)",
                    backgroundColor:
                      selectedFilterPlaylistId === ""
                        ? "var(--primary-container)"
                        : "var(--card-bg)",
                    color:
                      selectedFilterPlaylistId === ""
                        ? "var(--on-primary-container)"
                        : "var(--on-background)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span>TODAS LAS CANCIONES</span>
                  <span>{totalTracks}</span>
                </button>

                {playlists.map((pl) => {
                  const isActive = selectedFilterPlaylistId === String(pl.id);
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => setSelectedFilterPlaylistId(String(pl.id))}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 9px",
                        fontSize: "0.68rem",
                        fontWeight: 900,
                        border: "1.5px solid var(--primary)",
                        backgroundColor: isActive
                          ? "var(--primary-container)"
                          : "var(--card-bg)",
                        color: isActive
                          ? "var(--on-primary-container)"
                          : "var(--on-background)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {pl.name}
                      </span>
                      <span style={{ flexShrink: 0, opacity: 0.85 }}>{pl.num_songs}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLUMNA DERECHA: BUSCADOR + LISTA DE CANCIONES */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar al instante por artista, título o archivo..."
                  className="neo-input"
                  style={{
                    width: "100%",
                    padding: "8px 10px 8px 32px",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    border: "2px solid var(--primary)",
                    backgroundColor: "var(--card-bg)",
                    color: "var(--on-background)",
                  }}
                />
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    opacity: 0.7,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  color: "var(--on-surface-variant)",
                }}
              >
                <span>
                  <ListMusic size={12} style={{ display: "inline", marginRight: "4px" }} />
                  {isLoadingLibrary
                    ? "Cargando biblioteca completa de la radio..."
                    : `Mostrando ${visibleTracks.length} de ${filteredTracks.length} canciones (${totalTracks} en total)`}
                </span>
              </div>

              <div
                onScroll={(e) => {
                  if (!hasMoreTracks) return;
                  const el = e.currentTarget;
                  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
                    handleLoadMoreTracks();
                  }
                }}
                style={{
                  height: "352px",
                  overflowY: "auto",
                  border: "2px solid var(--primary)",
                  backgroundColor: "var(--card-bg)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {isLoadingLibrary && allTracks.length === 0 ? (
                  <div
                    style={{
                      padding: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontSize: "0.76rem",
                      fontWeight: 800,
                    }}
                  >
                    <Loader2 size={16} className="animate-spin" />
                    <span>Cargando canciones...</span>
                  </div>
                ) : visibleTracks.length === 0 ? (
                  <div
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      fontSize: "0.74rem",
                      opacity: 0.75,
                      fontWeight: 700,
                    }}
                  >
                    No se encontraron canciones con ese filtro.
                  </div>
                ) : (
                  <>
                    {visibleTracks.map((track) => {
                      const displayLabel =
                        track.artist && track.title
                          ? `${track.artist} - ${track.title}`
                          : track.text || track.path;
                      const isBusy = enqueuingId === track.id;
                      const isDone = Boolean(enqueuedIds[String(track.id)]);

                      return (
                        <div
                          key={String(track.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            padding: "8px 10px",
                            borderBottom: "1px solid var(--surface-container)",
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 900,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={displayLabel}
                            >
                              {displayLabel}
                            </div>
                            <div
                              style={{
                                fontSize: "0.62rem",
                                color: "var(--on-surface-variant)",
                                fontWeight: 700,
                                display: "flex",
                                gap: "8px",
                              }}
                            >
                              <span>⏱ {track.length_text || "--:--"}</span>
                              {track.path && (
                                <span
                                  style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {track.path}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleEnqueueTrack(track)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 10px",
                              backgroundColor: isDone
                                ? "var(--primary)"
                                : "var(--primary-container)",
                              color: isDone
                                ? "var(--on-primary)"
                                : "var(--on-primary-container)",
                              border: "1.5px solid var(--primary)",
                              fontSize: "0.64rem",
                              fontWeight: 900,
                              cursor: isBusy ? "wait" : "pointer",
                              flexShrink: 0,
                            }}
                          >
                            {isBusy ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : isDone ? (
                              <Check size={12} />
                            ) : (
                              <Plus size={12} />
                            )}
                            <span>{isBusy ? "..." : isDone ? "ENCOLADA" : "PONER SIGUIENTE"}</span>
                          </button>
                        </div>
                      );
                    })}
                    {hasMoreTracks && (
                      <button
                        type="button"
                        onClick={handleLoadMoreTracks}
                        style={{
                          padding: "9px 12px",
                          backgroundColor: "var(--surface-container)",
                          color: "var(--on-background)",
                          border: "none",
                          borderTop: "1.5px dashed var(--primary)",
                          fontSize: "0.68rem",
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        Desplaza o haz clic para cargar 50 canciones más ({filteredTracks.length - visibleTracks.length} restantes)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === "voice" ? (
          <AdminVoiceRecorderPanel
            playlists={playlists}
            defaultUploadPlaylistId={playlistsQuery.data?.default_upload_playlist_id ?? 22}
            onFeedback={setFeedback}
          />
        ) : activeTab === "queue" ? (
          <AdminLiveQueuePanel enabled={queriesEnabled} onFeedback={setFeedback} />
        ) : (
          /* TAB 2: UPLOAD NEW SONG (2 COLUMNAS: IZQUIERDA PLAYLIST DESTINO | DERECHA FORMULARIO MP3) */
          <form
            onSubmit={handleUploadSubmit}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(250px, 310px) minmax(0, 1fr)",
              gap: "14px",
              alignItems: "start",
            }}
          >
            {/* COLUMNA IZQUIERDA: PLAYLIST DESTINO */}
            <div
              style={{
                border: "2px solid var(--primary)",
                backgroundColor: "var(--surface-container)",
                display: "flex",
                flexDirection: "column",
                maxHeight: "420px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "8px 10px",
                  borderBottom: "2px solid var(--primary)",
                  fontSize: "0.68rem",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                PLAYLIST DESTINO
              </div>

              <div
                style={{
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  padding: "6px",
                  gap: "5px",
                }}
              >
                {playlists.map((pl) => {
                  const isActive = uploadPlaylistId === pl.id;
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      disabled={uploadMutation.isPending}
                      onClick={() => handleSelectUploadPlaylist(pl.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 9px",
                        fontSize: "0.68rem",
                        fontWeight: 900,
                        border: "1.5px solid var(--primary)",
                        backgroundColor: isActive
                          ? "var(--primary-container)"
                          : "var(--card-bg)",
                        color: isActive
                          ? "var(--on-primary-container)"
                          : "var(--on-background)",
                        cursor: uploadMutation.isPending ? "wait" : "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {pl.name}
                      </span>
                      <span style={{ flexShrink: 0, opacity: 0.85 }}>{pl.num_songs}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLUMNA DERECHA: ARCHIVO MP3 + METADATOS + SUBIR */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 900, display: "block", marginBottom: "4px" }}>
                  ARCHIVO MP3 (MÁX. 45 MB) *
                </label>
                <div
                  style={{
                    border: "2px dashed var(--primary)",
                    backgroundColor: "var(--card-bg)",
                    padding: "14px",
                    textAlign: "center",
                    position: "relative",
                    cursor: "pointer",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/mpeg,audio/mp3,.mp3"
                    onChange={handleFileChange}
                    disabled={uploadMutation.isPending}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      cursor: uploadMutation.isPending ? "wait" : "pointer",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <FileAudio size={22} />
                    <span style={{ fontSize: "0.74rem", fontWeight: 900 }}>
                      {uploadFile
                        ? `${uploadFile.name} (${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)`
                        : "Haz clic o arrastra un archivo .mp3 aquí"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.64rem",
                  fontWeight: 800,
                  color: "var(--on-surface-variant)",
                  padding: "4px 8px",
                  backgroundColor: "var(--surface-container)",
                  border: "1px solid var(--primary)",
                }}
              >
                Carpeta en servidor (automática): <strong>{resolvedUploadFolder}</strong>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
                    ARTISTA (OPCIONAL)
                  </label>
                  <input
                    type="text"
                    value={uploadArtist}
                    onChange={(e) => setUploadArtist(e.target.value)}
                    disabled={uploadMutation.isPending}
                    placeholder="Ej. Bad Bunny"
                    style={{
                      width: "100%",
                      padding: "7px 9px",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      border: "2px solid var(--primary)",
                      backgroundColor: "var(--card-bg)",
                      color: "var(--on-background)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
                    TÍTULO (OPCIONAL)
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    disabled={uploadMutation.isPending}
                    placeholder="Ej. Nuevo Single"
                    style={{
                      width: "100%",
                      padding: "7px 9px",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      border: "2px solid var(--primary)",
                      backgroundColor: "var(--card-bg)",
                      color: "var(--on-background)",
                    }}
                  />
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 10px",
                  backgroundColor: "var(--surface-container)",
                  border: "2px solid var(--primary)",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={enqueueNext}
                  onChange={(e) => setEnqueueNext(e.target.checked)}
                  disabled={uploadMutation.isPending}
                  style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
                />
                <span>Encolar como siguiente canción inmediatamente después de subirla</span>
              </label>

              {uploadMutation.isPending && (
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "var(--surface-container)",
                    border: "2px solid var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                  }}
                >
                  <Loader2 size={18} className="animate-spin" style={{ flexShrink: 0 }} />
                  <span>
                    Subiendo MP3 y normalizando audio a -16 LUFS en el servidor... espera un momento.
                  </span>
                </div>
              )}

              {lastUploadResult && (
                <div
                  style={{
                    padding: "8px 10px",
                    backgroundColor: "var(--card-bg)",
                    border: "2px solid var(--primary)",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                >
                  <div>Estado: {lastUploadResult.status}</div>
                  <div>Ruta: {lastUploadResult.path}</div>
                  <div>
                    Playlist ID: {lastUploadResult.playlist_id} · Media ID: {lastUploadResult.media_id} · Encolada:{" "}
                    {lastUploadResult.enqueued ? "Sí" : "No"}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploadMutation.isPending || !uploadFile}
                className="neo-button"
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "var(--primary-container)",
                  color: "var(--on-primary-container)",
                  border: "2.5px solid var(--primary)",
                  boxShadow: "4px 4px 0px var(--primary)",
                  fontSize: "0.78rem",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: uploadMutation.isPending || !uploadFile ? "not-allowed" : "pointer",
                  opacity: uploadMutation.isPending || !uploadFile ? 0.65 : 1,
                }}
              >
                {uploadMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                <span>
                  {uploadMutation.isPending
                    ? "NORMALIZANDO A -16 LUFS..."
                    : "SUBIR CANCIÓN A LA RADIO"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </NeoModal>
  );
};
