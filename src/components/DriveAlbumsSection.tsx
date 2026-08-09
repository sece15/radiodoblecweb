import { useState, useEffect, useCallback, useRef } from "react";
import { useAudio } from "@/hooks/useAudio";
import {
  fetchDriveAlbums,
  fetchAlbumTracks,
  createDriveAlbum,
  uploadTrackToAlbum,
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
  Upload,
  Trash2,
  RefreshCw,
  Music,
  ExternalLink,
  CheckCircle,
  AlertCircle,
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
  onNavigateToPlayer,
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

  const [isUploadTrackModalOpen, setUploadTrackModalOpen] = useState<boolean>(false);
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [trackCustomTitle, setTrackCustomTitle] = useState<string>("");
  const [isUploadingTrack, setIsUploadingTrack] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const trackFileInputRef = useRef<HTMLInputElement>(null);

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
    try {
      const tracks = await fetchAlbumTracks(album.id);
      setAlbumTracks(tracks);
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

    if (onNavigateToPlayer) {
      onNavigateToPlayer();
    }
  };

  // Play full album
  const handlePlayFullAlbum = () => {
    if (!selectedAlbum) return;
    if (requireVip && !userIsVip) {
      setSubscribeModalOpen(true);
      return;
    }

    const firstAudio =
      albumTracks.find((t) =>
        t.mimeType.startsWith("audio/") || t.name.endsWith(".mp3") || t.name.endsWith(".wav") || t.name.endsWith(".m4a")
      ) || albumTracks[0];

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

  // Upload Track to Album (Admin)
  const handleUploadTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackFile || !selectedAlbum) return;

    setIsUploadingTrack(true);
    setUploadMessage(null);

    try {
      const uploaded = await uploadTrackToAlbum(trackFile, selectedAlbum.id, trackCustomTitle.trim() || undefined);
      setUploadMessage({ type: "success", text: `¡"${uploaded.name || trackFile.name}" subida con éxito!` });
      setTrackFile(null);
      setTrackCustomTitle("");
      if (trackFileInputRef.current) trackFileInputRef.current.value = "";

      const updatedTracks = await fetchAlbumTracks(selectedAlbum.id);
      setAlbumTracks(updatedTracks);
      await reloadAlbums();

      setTimeout(() => {
        setUploadTrackModalOpen(false);
        setUploadMessage(null);
      }, 1600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir la pista";
      setUploadMessage({ type: "error", text: msg });
    } finally {
      setIsUploadingTrack(false);
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
              GOOGLE DRIVE CLOUD ☁️
            </span>
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase" }}>
            {requireVip ? "ÁLBUMES Y PRODUCCIONES DE ESTUDIO" : "DISCOS Y ÁLBUMES DE ESTUDIO"}
          </h3>
          <p style={{ fontSize: "0.75rem", opacity: 0.75 }}>
            {requireVip
              ? "Producciones discográficas completas para miembros VIP con descarga en alta fidelidad."
              : "Producciones discográficas completas organizadas por carpetas en Google Drive."}
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
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {albums.map((album, idx) => {
            const rot = getCardRotation(idx);

            return (
              <div
                key={album.id}
                className="neo-card store-card-hover"
                style={{
                  transform: `rotate(${rot}deg)`,
                  backgroundColor: "var(--surface-container)",
                  boxShadow: "6px 6px 0px var(--primary)",
                  border: "3px solid var(--primary)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => handleOpenAlbum(album)}
              >
                {/* Vinyl Art */}
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
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "70px",
                          height: "70px",
                          borderRadius: "50%",
                          backgroundColor: "#0A0A0A",
                          border: "3px solid #FFDE82",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Disc size={34} style={{ color: "#FFDE82" }} />
                      </div>
                      <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "white", textTransform: "uppercase" }}>
                        VINILO OFICIAL
                      </span>
                    </div>
                  )}

                  {/* VIP Access Badge */}
                  {requireVip && (
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        backgroundColor: hasAccess ? "var(--primary-container)" : "#BA1A1A",
                        color: hasAccess ? "var(--primary)" : "white",
                        border: "1.5px solid var(--primary)",
                        padding: "2px 6px",
                        fontSize: "0.6rem",
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
                      bottom: "8px",
                      left: "8px",
                      backgroundColor: "var(--primary-container)",
                      border: "1.5px solid var(--primary)",
                      padding: "2px 6px",
                      fontSize: "0.6rem",
                      fontWeight: 900,
                      color: "var(--primary)",
                    }}
                  >
                    🎵 {album.trackCount} {album.trackCount === 1 ? "PISTA" : "PISTAS"}
                  </div>
                </div>

                {/* Info & Button */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h4
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={album.name}
                  >
                    {album.name}
                  </h4>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="neo-button fun-hover-wobble"
                      style={{
                        flex: 1,
                        backgroundColor: hasAccess ? "var(--primary-container)" : "#FFF",
                        padding: "8px 10px",
                        fontSize: "0.75rem",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAlbum(album);
                      }}
                    >
                      {hasAccess ? <Play size={12} fill="currentColor" /> : <Lock size={12} />}
                      {hasAccess ? "VER DISCO 📂" : "DESBLOQUEAR VIP"}
                    </button>

                    {userIsAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(album.id, album.name, true);
                        }}
                        style={{
                          backgroundColor: "#FFDAD6",
                          color: "#BA1A1A",
                          border: "2px solid #BA1A1A",
                          padding: "6px 8px",
                          cursor: "pointer",
                        }}
                        title="Eliminar disco"
                      >
                        <Trash2 size={12} />
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
          maxWidth="760px"
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "24px",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* Left: Vinyl & Play Button */}
            <div
              style={{
                flex: "1 1 240px",
                maxWidth: "280px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                margin: "0 auto",
              }}
            >
              <div
                className="neo-card"
                style={{
                  width: "100%",
                  aspectRatio: "1/1",
                  backgroundColor: "#0A0A0A",
                  border: "3px solid var(--primary)",
                  boxShadow: "5px 5px 0px var(--primary)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selectedAlbum.coverUrl ? (
                  <img
                    src={selectedAlbum.coverUrl}
                    alt={selectedAlbum.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      backgroundColor: "#151515",
                      border: "4px solid #FFDE82",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Disc size={50} style={{ color: "#FFDE82" }} />
                  </div>
                )}
              </div>

              <button
                onClick={handlePlayFullAlbum}
                disabled={albumTracks.length === 0}
                className="neo-button fun-hover-wobble"
                style={{
                  backgroundColor: "var(--primary-container)",
                  padding: "12px",
                  fontSize: "0.8rem",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "4px 4px 0px var(--primary)",
                  opacity: albumTracks.length === 0 ? 0.6 : 1,
                  cursor: albumTracks.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                <Play size={16} fill="currentColor" /> REPRODUCIR DISCO COMPLETO
              </button>

              {userIsAdmin && (
                <button
                  onClick={() => setUploadTrackModalOpen(true)}
                  className="neo-button"
                  style={{
                    backgroundColor: "#FFB000",
                    color: "black",
                    padding: "10px",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    border: "2px solid var(--primary)",
                  }}
                >
                  <Upload size={14} /> SUBIR CANCIÓN AL DISCO
                </button>
              )}
            </div>

            {/* Right: Tracklist */}
            <div style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.8 }}>
                LISTA DE CANCIONES ({albumTracks.length})
              </span>

              {isLoadingTracks ? (
                <div style={{ padding: "24px", textAlign: "center" }}>
                  <Disc size={24} className="animate-spin" />
                  <p style={{ fontSize: "0.75rem", marginTop: "8px", fontWeight: "bold" }}>
                    Cargando canciones de Google Drive...
                  </p>
                </div>
              ) : albumTracks.length === 0 ? (
                <div
                  style={{
                    padding: "24px",
                    backgroundColor: "var(--surface-container)",
                    border: "2px dashed var(--primary)",
                    textAlign: "center",
                  }}
                >
                  <Music size={28} style={{ opacity: 0.5 }} />
                  <p style={{ fontSize: "0.75rem", fontWeight: "bold", marginTop: "6px" }}>
                    Aún no hay canciones en este disco.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "320px", overflowY: "auto" }}>
                  {albumTracks.map((track, trackIdx) => {
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
                          <span style={{ fontSize: "0.75rem", fontWeight: 900, opacity: 0.6, width: "20px" }}>
                            {String(trackIdx + 1).padStart(2, "0")}
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 900,
                                textTransform: "uppercase",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                margin: 0,
                              }}
                              title={track.name}
                            >
                              {cleanFileName(track.name)}
                            </p>
                            {track.size && (
                              <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>
                                {formatFileSize(track.size)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => handlePlayTrack(track, selectedAlbum.name)}
                            style={{
                              backgroundColor: isPlayingThis ? "var(--primary)" : "var(--primary-container)",
                              color: isPlayingThis ? "var(--on-primary)" : "var(--primary)",
                              border: "1.5px solid var(--primary)",
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontSize: "0.7rem",
                              fontWeight: 900,
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {isPlayingThis ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                          </button>

                          {requireVip && (
                            <button
                              onClick={() => handleDownloadTrack(track)}
                              style={{
                                backgroundColor: "white",
                                border: "1.5px solid var(--primary)",
                                padding: "6px 10px",
                                cursor: "pointer",
                                fontSize: "0.7rem",
                                fontWeight: 900,
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title="Descargar MP3"
                            >
                              <Download size={12} />
                            </button>
                          )}

                          {userIsAdmin && (
                            <button
                              onClick={() => handleDeleteItem(track.id, track.name, false)}
                              style={{
                                backgroundColor: "#FFDAD6",
                                color: "#BA1A1A",
                                border: "1.5px solid #BA1A1A",
                                padding: "6px",
                                cursor: "pointer",
                              }}
                              title="Eliminar pista"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

      {/* MODAL 3: ADMIN UPLOAD TRACK */}
      <NeoModal
        isOpen={isUploadTrackModalOpen && userIsAdmin && Boolean(selectedAlbum)}
        onClose={() => !isUploadingTrack && setUploadTrackModalOpen(false)}
        title="Subir Canción al Disco"
        badgeText={`DISCO: ${selectedAlbum?.name || ""}`}
        maxWidth="480px"
      >
        <form onSubmit={handleUploadTrackSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 900, display: "block", marginBottom: "6px" }}>
              SELECCIONAR ARCHIVO (.MP3, .WAV, .M4A O COVER.JPG)
            </label>
            <input
              ref={trackFileInputRef}
              type="file"
              accept="audio/*,image/*,video/mp4"
              required
              disabled={isUploadingTrack}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setTrackFile(e.target.files[0]);
                }
              }}
              style={{
                width: "100%",
                padding: "8px",
                border: "2px solid var(--primary)",
                backgroundColor: "var(--surface-container)",
                fontSize: "0.75rem",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 900, display: "block", marginBottom: "6px" }}>
              TÍTULO DE LA CANCIÓN / NOMBRE (OPCIONAL)
            </label>
            <input
              type="text"
              placeholder={trackFile ? trackFile.name : "Ej: 01 - Fauces del Ritmo"}
              value={trackCustomTitle}
              disabled={isUploadingTrack}
              onChange={(e) => setTrackCustomTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "2px solid var(--primary)",
                fontSize: "0.8rem",
                outline: "none",
              }}
            />
          </div>

          {uploadMessage && (
            <div
              style={{
                backgroundColor: uploadMessage.type === "success" ? "#C4EED0" : "#FFDAD6",
                border: `2px solid ${uploadMessage.type === "success" ? "#00522B" : "#BA1A1A"}`,
                padding: "8px",
                fontSize: "0.75rem",
                fontWeight: 900,
                color: uploadMessage.type === "success" ? "#00522B" : "#BA1A1A",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {uploadMessage.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {uploadMessage.text}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button
              type="submit"
              disabled={isUploadingTrack || !trackFile}
              className="neo-button"
              style={{
                flex: 1,
                backgroundColor: "var(--primary-container)",
                padding: "10px",
                fontSize: "0.75rem",
                fontWeight: 900,
              }}
            >
              {isUploadingTrack ? "SUBIENDO AL DISCO..." : "SUBIR CANCIÓN 🎵"}
            </button>

            <button
              type="button"
              disabled={isUploadingTrack}
              onClick={() => setUploadTrackModalOpen(false)}
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
