"use client";

import { useMemo, useRef, useState, ChangeEvent, FormEvent } from "react";
import { NeoModal } from "@/components/common/NeoModal";
import { AdminVoiceRecorderPanel } from "@/components/admin/AdminVoiceRecorderPanel";
import { AdminLiveQueuePanel } from "@/components/admin/AdminLiveQueuePanel";
import { AdminPlayerTopSection } from "@/components/admin/player/AdminPlayerTopSection";
import { AdminLibrarySearchPanel } from "@/components/admin/player/AdminLibrarySearchPanel";
import { AdminUploadTrackPanel } from "@/components/admin/player/AdminUploadTrackPanel";
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
        <AdminPlayerTopSection
          liveShowName={liveShowName}
          liveTrackTitle={liveTrackTitle}
          isSkipping={skipNextMutation.isPending}
          activeBanner={activeBanner}
          activeTab={activeTab}
          queueCount={queueQuery.data?.length ?? 0}
          onSkipNext={handleSkipNext}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            setFeedback(null);
          }}
        />

        {activeTab === "search" ? (
          <AdminLibrarySearchPanel
            playlists={playlists}
            selectedFilterPlaylistId={selectedFilterPlaylistId}
            totalTracks={totalTracks}
            allTracksCount={allTracks.length}
            filteredTracksCount={filteredTracks.length}
            visibleTracks={visibleTracks}
            hasMoreTracks={hasMoreTracks}
            isLoadingLibrary={isLoadingLibrary}
            isFetchingLibrary={isFetchingLibrary}
            searchQuery={searchQuery}
            enqueuingId={enqueuingId}
            enqueuedIds={enqueuedIds}
            onSelectPlaylist={setSelectedFilterPlaylistId}
            onRefreshLibrary={() => {
              playlistsQuery.refetch();
              mediaQuery.refetch();
            }}
            onChangeSearch={setSearchQuery}
            onEnqueueTrack={handleEnqueueTrack}
            onLoadMoreTracks={handleLoadMoreTracks}
          />
        ) : activeTab === "voice" ? (
          <AdminVoiceRecorderPanel
            playlists={playlists}
            defaultUploadPlaylistId={playlistsQuery.data?.default_upload_playlist_id ?? 22}
            onFeedback={setFeedback}
          />
        ) : activeTab === "queue" ? (
          <AdminLiveQueuePanel enabled={queriesEnabled} onFeedback={setFeedback} />
        ) : (
          <AdminUploadTrackPanel
            playlists={playlists}
            uploadPlaylistId={uploadPlaylistId}
            resolvedUploadFolder={resolvedUploadFolder}
            uploadFile={uploadFile}
            uploadArtist={uploadArtist}
            uploadTitle={uploadTitle}
            enqueueNext={enqueueNext}
            isUploading={uploadMutation.isPending}
            lastUploadResult={lastUploadResult}
            fileInputRef={fileInputRef}
            onSelectUploadPlaylist={handleSelectUploadPlaylist}
            onFileChange={handleFileChange}
            onChangeArtist={setUploadArtist}
            onChangeTitle={setUploadTitle}
            onChangeEnqueueNext={setEnqueueNext}
            onSubmit={handleUploadSubmit}
          />
        )}
      </div>
    </NeoModal>
  );
};
