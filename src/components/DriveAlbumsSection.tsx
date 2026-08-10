import { useState, useEffect, useCallback } from "react";
import { useAudio } from "@/hooks/useAudio";
import {
  fetchDriveAlbums,
  fetchAlbumTracks,
  createDriveAlbum,
  deleteDriveFile,
  getDriveStreamUrl,
  DriveAlbum,
  DriveFile,
} from "@/services/driveService";
import { isAdmin, isVip } from "@/lib/permissions";
import { formatFileSize, cleanFileName } from "@/lib/formatters";
import { downloadFileFromUrl } from "@/lib/downloadUtils";
import { getCardRotation } from "@/lib/styleUtils";
import { NeoModal } from "./common/NeoModal";
import {
  Disc,
  Play,
  Pause,
  FolderPlus,
  Trash2,
  RefreshCw,
  Music,
  ExternalLink,
  Download,
  Lock,
  Unlock,
} from "lucide-react";

export interface DriveAlbumsSectionProps {
  requireVip?: boolean;
  onNavigateToPlayer?: () => void;
}

export const DriveAlbumsSection = ({
  requireVip = false,
}: DriveAlbumsSectionProps) => {
  const { userProfile, currentTrack, isPlaying, togglePlayPause, playPastBroadcast } = useAudio();

  const userIsAdmin = isAdmin(userProfile.role);
  const userIsVip = isVip(userProfile.role);
  const hasAccess = !requireVip || userIsVip;

  const [albums, setAlbums] = useState<DriveAlbum[]>([]);
  const [discosFolderId, setDiscosFolderId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedAlbum, setSelectedAlbum] = useState<DriveAlbum | null>(null);
  const [albumTracks, setAlbumTracks] = useState<DriveFile[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);

  // Modals state
  const [isNewAlbumModalOpen, setNewAlbumModalOpen] = useState<boolean>(false);
  const [newAlbumName, setNewAlbumName] = useState<string>("");
  const [isCreatingAlbum, setIsCreatingAlbum] = useState<boolean>(false);
  const [isSubscribeModalOpen, setSubscribeModalOpen] = useState<boolean>(false);

  // Initial Fetch
  useEffect(() => {
    let isMounted = true;

    fetchDriveAlbums()
      .then((data) => {
        if (isMounted) {
          setAlbums(data.albums);
          setDiscosFolderId(data.discosFolderId);
        }
      })
      .catch((err) => console.error("Error al cargar álbumes de Drive:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const reloadAlbums = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchDriveAlbums();
      setAlbums(data.albums);
      setDiscosFolderId(data.discosFolderId);
    } catch (err) {
      console.error("Error al recargar álbumes:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Open Album & Load its Tracks
  const handleOpenAlbum = async (album: DriveAlbum) => {
    if (requireVip && !userIsVip) {
      setSubscribeModalOpen(true);
      return;
    }

    setSelectedAlbum(album);
    setIsLoadingTracks(true);
    setAlbumTracks([]);

    try {
      const tracks = await fetchAlbumTracks(album.id);
      setAlbumTracks(tracks);

      // Search for portada / cover image in album files
      const coverFile = tracks.find((t) => {
        const lower = t.name.toLowerCase();
        return (
          lower.includes("portada") ||
          lower.includes("cover") ||
          lower.includes("folder") ||
          t.mimeType.startsWith("image/") ||
          Boolean(lower.match(/\.(jpg|jpeg|png|webp)$/i))
        );
      });

      if (coverFile) {
        const coverUrl = getDriveStreamUrl(coverFile.id);
        setSelectedAlbum((prev) => (prev ? { ...prev, coverUrl, coverFileId: coverFile.id } : null));
        setAlbums((prev) =>
          prev.map((a) => (a.id === album.id ? { ...a, coverUrl, coverFileId: coverFile.id } : a))
        );
      }
    } catch (err) {
      console.error("Error al cargar canciones del disco:", err);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  // Play a specific track
  const handlePlayTrack = (track: DriveFile, albumName: string) => {
    if (requireVip && !userIsVip) {
      setSubscribeModalOpen(true);
      return;
    }

    const streamUrl = getDriveStreamUrl(track.id);
    const isCurrent = currentTrack.streamUrl === streamUrl;

    if (isCurrent) {
      togglePlayPause();
      return;
    }

    playPastBroadcast({
      id: track.id,
      programId: "drive_album",
      title: cleanFileName(track.name),
      date: albumName,
      duration: formatFileSize(track.size),
      audioUrl: streamUrl,
    });
  };

  // Play full album
  const handlePlayFullAlbum = () => {
    if (!selectedAlbum) return;
    if (requireVip && !userIsVip) {
      setSubscribeModalOpen(true);
      return;
    }

    const playableTracks = albumTracks.filter(
      (t) => !t.mimeType.startsWith("image/") && !Boolean(t.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|svg)$/i))
    );

    const firstAudio =
      playableTracks.find((t) =>
        t.mimeType.startsWith("audio/") || t.name.endsWith(".mp3") || t.name.endsWith(".wav") || t.name.endsWith(".m4a")
      ) || playableTracks[0];

    if (firstAudio) {
      handlePlayTrack(firstAudio, selectedAlbum.name);
    }
  };

  // Download Track
  const handleDownloadTrack = (track: DriveFile) => {
    if (requireVip && !userIsVip) {
      setSubscribeModalOpen(true);
      return;
    }
    const streamUrl = getDriveStreamUrl(track.id);
    downloadFileFromUrl(streamUrl, track.name);
  };

  // Create Album (Admin)
  const handleCreateAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    setIsCreatingAlbum(true);
    try {
      await createDriveAlbum(newAlbumName.trim(), discosFolderId || undefined);
      setNewAlbumName("");
      setNewAlbumModalOpen(false);
      await reloadAlbums();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear el disco";
      alert(`No se pudo crear el disco: ${msg}`);
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  // Delete Item (Admin)
  const handleDeleteItem = async (itemId: string, itemName: string, isAlbum = false) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente "${itemName}" de Google Drive?`)) {
      return;
    }

    try {
      await deleteDriveFile(itemId);
      if (isAlbum) {
        setAlbums((prev) => prev.filter((a) => a.id !== itemId));
        if (selectedAlbum?.id === itemId) setSelectedAlbum(null);
      } else {
        setAlbumTracks((prev) => prev.filter((t) => t.id !== itemId));
      }
      await reloadAlbums();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      alert(`No se pudo eliminar: ${msg}`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                backgroundColor: "#FFDE82",
                border: "2px solid var(--primary)",
                padding: "2px 8px",
                fontSize: "0.65rem",
                fontWeight: 900,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Disc size={12} /> {requireVip ? "DISCOTECA VIP EXCLUSIVA" : "DISCOTECA DOBLE C"}
            </span>
            <span
              style={{
                backgroundColor: "var(--primary-container)",
                border: "1.5px solid var(--primary)",
                padding: "2px 6px",
                fontSize: "0.65rem",
                fontWeight: 900,
              }}
            >
              RADIO DOBLE C 📻
            </span>
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase" }}>
            {requireVip ? "ÁLBUMES Y PRODUCCIONES DE ESTUDIO" : "DISCOS Y ÁLBUMES DE ESTUDIO"}
          </h3>
          <p style={{ fontSize: "0.75rem", opacity: 0.75 }}>
            {requireVip
              ? "Producciones discográficas completas para miembros VIP con descarga en alta fidelidad."
              : "Producciones discográficas completas organizadas en la discoteca de Radio Doble C."}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={reloadAlbums}
            className="neo-button"
            style={{
              backgroundColor: "white",
              padding: "8px 12px",
              fontSize: "0.7rem",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> REFRESCAR
          </button>

          {/* Admin Create Album */}
          {userIsAdmin && (
            <button
              onClick={() => setNewAlbumModalOpen(true)}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: "#FFB000",
                color: "black",
                padding: "8px 16px",
                fontSize: "0.75rem",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "2.5px solid var(--primary)",
                boxShadow: "4px 4px 0px var(--primary)",
              }}
            >
              <FolderPlus size={16} /> CREAR DISCO 📁
            </button>
          )}

          {userIsAdmin && (
            <a
              href="https://drive.google.com/drive/folders/1tH8ZVfaRp6wYkmweDRaMO8zuszrtLDY-"
              target="_blank"
              rel="noopener noreferrer"
              className="neo-button"
              style={{
                backgroundColor: "var(--surface-container)",
                padding: "8px 12px",
                fontSize: "0.7rem",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              CARPETA DRIVE <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div
          className="neo-card"
          style={{
            padding: "36px",
            textAlign: "center",
            backgroundColor: "var(--surface-container)",
            border: "2px dashed var(--primary)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Disc size={36} className="animate-spin" style={{ color: "var(--primary)" }} />
          <p style={{ fontSize: "0.8rem", fontWeight: 900, textTransform: "uppercase" }}>
            Sincronizando discografía desde Google Drive...
          </p>
        </div>
      ) : albums.length === 0 ? (
        <div
          className="neo-card"
          style={{
            padding: "32px",
            textAlign: "center",
            backgroundColor: "var(--surface-container)",
            border: "2px dashed var(--primary)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Music size={36} style={{ opacity: 0.6 }} />
          <h4 style={{ fontSize: "0.95rem", fontWeight: 900 }}>NO HAY DISCOS DISPONIBLES</h4>
          <p style={{ fontSize: "0.75rem", opacity: 0.75 }}>
            {userIsAdmin
              ? "Crea tu primer disco con el botón 'CREAR DISCO' para comenzar."
              : "Pronto el equipo subirá nuevas producciones discográficas."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "16px",
          }}
        >
          {albums.map((album, idx) => {
            const rot = getCardRotation(idx);
            const coverImage = album.coverUrl || "/hitsandbeats.jpg";

            return (
              <div
                key={album.id}
                className="neo-card store-card-hover"
                style={{
                  transform: `rotate(${rot}deg)`,
                  backgroundColor: "var(--surface-container)",
                  boxShadow: "4px 4px 0px var(--primary)",
                  border: "2.5px solid var(--primary)",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "10px",
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => handleOpenAlbum(album)}
              >
                {/* Album Cover Art */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1/1",
                    backgroundColor: "#111",
                    border: "2px solid var(--primary)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={coverImage}
                    alt={album.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/hitsandbeats.jpg";
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {/* VIP Access Badge */}
                  {requireVip && (
                    <div
                      style={{
                        position: "absolute",
                        top: "6px",
                        right: "6px",
                        backgroundColor: hasAccess ? "var(--primary-container)" : "#BA1A1A",
                        color: hasAccess ? "var(--primary)" : "white",
                        border: "1.5px solid var(--primary)",
                        padding: "2px 5px",
                        fontSize: "0.55rem",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      {hasAccess ? <Unlock size={10} /> : <Lock size={10} />}
                      {hasAccess ? "VIP" : "BLOQUEADO"}
                    </div>
                  )}

                  {/* Track count */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "6px",
                      left: "6px",
                      backgroundColor: "rgba(0, 0, 0, 0.75)",
                      color: "white",
                      border: "1px solid var(--primary)",
                      padding: "1px 5px",
                      fontSize: "0.55rem",
                      fontWeight: 900,
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    🎵 {album.trackCount} {album.trackCount === 1 ? "PISTA" : "PISTAS"}
                  </div>
                </div>

                {/* Info & Button */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <h4
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      lineHeight: "1rem",
                      margin: 0,
                    }}
                    title={album.name}
                  >
                    {album.name}
                  </h4>

                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      className="neo-button fun-hover-wobble"
                      style={{
                        flex: 1,
                        backgroundColor: "var(--primary-container)",
                        padding: "6px 8px",
                        fontSize: "0.65rem",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        boxShadow: "2px 2px 0px var(--primary)",
                      }}
                    >
                      <Play size={11} fill="currentColor" /> EXPLORAR
                    </button>

                    {/* Admin Delete Album */}
                    {userIsAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(album.id, album.name, true);
                        }}
                        style={{
                          backgroundColor: "#BA1A1A",
                          color: "white",
                          border: "1.5px solid var(--primary)",
                          padding: "6px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "2px 2px 0px var(--primary)",
                        }}
                        title="Eliminar disco"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ALBUM DETAILS & TRACKLIST */}
      {selectedAlbum && (
        <NeoModal
          isOpen={Boolean(selectedAlbum)}
          onClose={() => setSelectedAlbum(null)}
          title={selectedAlbum.name}
          badgeText={requireVip ? "👑 DISCO VIP EXCLUSIVO" : "💽 DISCO OFICIAL"}
          maxWidth="960px"
          bodyOverflow="hidden"
          backgroundColor="var(--background)"
          footer={
            <button
              onClick={() => setSelectedAlbum(null)}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: "white",
                padding: "8px 22px",
                fontSize: "0.75rem",
                fontWeight: 900,
                boxShadow: "3px 3px 0px var(--primary)",
                border: "2px solid var(--primary)",
                cursor: "pointer",
              }}
            >
              CERRAR VENTANA
            </button>
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "24px",
              alignItems: "flex-start",
              height: "100%",
              overflow: "hidden",
            }}
          >
            {/* Left: Fixed Cover Art & Play Button (Inmóvil, no hace scroll) */}
            <div
              style={{
                flex: "0 0 180px",
                maxWidth: "180px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                alignItems: "center",
                marginTop: "8px",
                flexShrink: 0,
              }}
            >
              <div
                className="neo-card"
                style={{
                  width: "180px",
                  height: "180px",
                  backgroundColor: "#0A0A0A",
                  border: "2.5px solid var(--primary)",
                  boxShadow: "3px 3px 0px var(--primary)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <img
                  src={selectedAlbum.coverUrl || "/hitsandbeats.jpg"}
                  alt={selectedAlbum.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/hitsandbeats.jpg";
                  }}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <button
                onClick={handlePlayFullAlbum}
                disabled={albumTracks.length === 0}
                className="neo-button fun-hover-wobble"
                style={{
                  width: "100%",
                  backgroundColor: "var(--primary-container)",
                  padding: "8px 8px",
                  fontSize: "0.68rem",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  boxShadow: "3px 3px 0px var(--primary)",
                  opacity: albumTracks.length === 0 ? 0.6 : 1,
                  cursor: albumTracks.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                <Play size={13} fill="currentColor" /> REPRODUCIR DISCO
              </button>
            </div>

            {/* Right: Tracklist (Única sección con Scroll Independiente) */}
            <div
              style={{
                flex: "1 1 540px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                minWidth: "280px",
                marginTop: "8px",
                height: "100%",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {(() => {
                const playableTracks = albumTracks.filter(
                  (t) =>
                    !t.mimeType.startsWith("image/") &&
                    !Boolean(t.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|svg)$/i))
                );

                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Disc size={14} style={{ color: "var(--primary)" }} /> LISTA DE CANCIONES ({playableTracks.length})
                      </span>
                      <span
                        style={{
                          backgroundColor: "#FFDE82",
                          border: "1px solid var(--primary)",
                          padding: "1px 6px",
                          fontSize: "0.6rem",
                          fontWeight: 900,
                        }}
                      >
                        DISCOGRAFÍA
                      </span>
                    </div>

                    {isLoadingTracks ? (
                      <div style={{ padding: "28px", textAlign: "center", backgroundColor: "var(--surface-container)", border: "2px dashed var(--primary)" }}>
                        <Disc size={24} className="animate-spin" style={{ margin: "0 auto 8px auto", color: "var(--primary)" }} />
                        <p style={{ fontSize: "0.75rem", fontWeight: "bold", margin: 0 }}>
                          Cargando canciones...
                        </p>
                      </div>
                    ) : playableTracks.length === 0 ? (
                      <div
                        style={{
                          padding: "24px",
                          backgroundColor: "var(--surface-container)",
                          border: "2px dashed var(--primary)",
                          textAlign: "center",
                        }}
                      >
                        <Music size={28} style={{ opacity: 0.5, margin: "0 auto 6px auto" }} />
                        <p style={{ fontSize: "0.75rem", fontWeight: "bold", margin: 0 }}>
                          Aún no hay canciones subidas en este disco.
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "7px",
                          overflowY: "auto",
                          maxHeight: "310px",
                          paddingRight: "6px",
                        }}
                      >
                        {playableTracks.map((track, trackIdx) => {
                          const streamUrl = getDriveStreamUrl(track.id);
                          const isPlayingThis = isPlaying && currentTrack.streamUrl === streamUrl;

                          return (
                            <div
                              key={track.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "8px 12px",
                                backgroundColor: isPlayingThis ? "var(--primary-container)" : "var(--surface-container)",
                                border: "2px solid var(--primary)",
                                boxShadow: isPlayingThis ? "2px 2px 0px var(--primary)" : "none",
                                gap: "10px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: "0.7rem", fontWeight: 900, opacity: 0.6, width: "20px", flexShrink: 0 }}>
                                  {String(trackIdx + 1).padStart(2, "0")}
                                </span>
                                <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <p
                                    style={{
                                      fontSize: "0.68rem",
                                      fontWeight: 900,
                                      textTransform: "uppercase",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      margin: 0,
                                      lineHeight: "1.25",
                                      letterSpacing: "0.2px",
                                    }}
                                    title={track.name}
                                  >
                                    {cleanFileName(track.name)}
                                  </p>
                                  {track.size && (
                                    <span style={{ fontSize: "0.58rem", opacity: 0.7 }}>
                                      {formatFileSize(track.size)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                <button
                                  onClick={() => handlePlayTrack(track, selectedAlbum.name)}
                                  style={{
                                    backgroundColor: isPlayingThis ? "var(--primary)" : "var(--primary-container)",
                                    color: isPlayingThis ? "var(--on-primary)" : "var(--primary)",
                                    border: "1.5px solid var(--primary)",
                                    padding: "5px 9px",
                                    cursor: "pointer",
                                    fontSize: "0.68rem",
                                    fontWeight: 900,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  {isPlayingThis ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
                                  {isPlayingThis ? "PAUSAR" : "REPRODUCIR"}
                                </button>

                                {requireVip && (
                                  <button
                                    onClick={() => handleDownloadTrack(track)}
                                    style={{
                                      backgroundColor: "white",
                                      border: "1.5px solid var(--primary)",
                                      padding: "5px 8px",
                                      cursor: "pointer",
                                      fontSize: "0.68rem",
                                      fontWeight: 900,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                    title="Descargar MP3"
                                  >
                                    <Download size={11} />
                                  </button>
                                )}

                                {userIsAdmin && (
                                  <button
                                    onClick={() => handleDeleteItem(track.id, track.name, false)}
                                    style={{
                                      backgroundColor: "#FFDAD6",
                                      color: "#BA1A1A",
                                      border: "1.5px solid #BA1A1A",
                                      padding: "5px 7px",
                                      cursor: "pointer",
                                    }}
                                    title="Eliminar pista"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </NeoModal>
      )}

      {/* MODAL 2: ADMIN CREATE ALBUM */}
      <NeoModal
        isOpen={isNewAlbumModalOpen && userIsAdmin}
        onClose={() => !isCreatingAlbum && setNewAlbumModalOpen(false)}
        title="Crear Nuevo Disco"
        badgeText="📁 GOOGLE DRIVE"
        maxWidth="460px"
      >
        <form onSubmit={handleCreateAlbumSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 900, display: "block", marginBottom: "6px" }}>
              NOMBRE DEL DISCO / ÁLBUM
            </label>
            <input
              type="text"
              placeholder="Ej: Fauces del Ritmo Vol. 2"
              value={newAlbumName}
              required
              disabled={isCreatingAlbum}
              onChange={(e) => setNewAlbumName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "2.5px solid var(--primary)",
                backgroundColor: "white",
                fontSize: "0.85rem",
                fontWeight: "bold",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button
              type="submit"
              disabled={isCreatingAlbum || !newAlbumName.trim()}
              className="neo-button"
              style={{
                flex: 1,
                backgroundColor: "var(--primary-container)",
                padding: "10px",
                fontSize: "0.75rem",
                fontWeight: 900,
              }}
            >
              {isCreatingAlbum ? "CREANDO EN DRIVE..." : "CREAR DISCO 🚀"}
            </button>

            <button
              type="button"
              disabled={isCreatingAlbum}
              onClick={() => setNewAlbumModalOpen(false)}
              className="neo-button"
              style={{
                backgroundColor: "white",
                padding: "10px",
                fontSize: "0.75rem",
                fontWeight: 900,
              }}
            >
              CANCELAR
            </button>
          </div>
        </form>
      </NeoModal>

      {/* MODAL 4: VIP SUBSCRIPTION PROMO */}
      <NeoModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setSubscribeModalOpen(false)}
        title="Únete al Club VIP Doble C"
        badgeText="👑 MEMBRESÍA PREMIUM"
        maxWidth="500px"
      >
        <p style={{ fontSize: "0.8rem", lineHeight: "1.25rem", color: "#333", margin: 0 }}>
          Al suscribirte al <strong>Club VIP</strong> de Radio Doble C desbloqueas inmediatamente:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            "💽 Discografía completa de Google Drive a la carta.",
            "📥 Descargas ilimitadas de canciones en MP3 de alta fidelidad.",
            "🎙️ Acceso prioritario a pedidos en vivo en el chat.",
            "👑 Distintivo dorado VIP exclusivo junto a tu nombre.",
          ].map((benefit, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "var(--surface-container)",
                border: "2px solid var(--primary)",
                padding: "8px 12px",
                fontSize: "0.75rem",
                fontWeight: 900,
              }}
            >
              {benefit}
            </div>
          ))}
        </div>

        <a
          href="https://wa.me/51999999999?text=Hola%2C%20quiero%20suscribirme%20al%20Club%20VIP%20de%20Radio%20Doble%20C"
          target="_blank"
          rel="noopener noreferrer"
          className="neo-button fun-hover-wobble"
          style={{
            backgroundColor: "var(--primary-container)",
            padding: "14px",
            fontSize: "0.85rem",
            fontWeight: 900,
            textAlign: "center",
            textDecoration: "none",
            color: "inherit",
            display: "block",
            boxShadow: "4px 4px 0px var(--primary)",
            marginTop: "6px",
          }}
        >
          SOLICITAR MEMBRESÍA VIP POR WHATSAPP ⚡
        </a>
      </NeoModal>
    </div>
  );
};
