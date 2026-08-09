import { useState, useEffect, useRef, useCallback } from "react";
import { useAudio } from "@/hooks/useAudio";
import {
  fetchDriveFiles,
  getDriveStreamUrl,
  uploadDriveFile,
  deleteDriveFile,
  DriveFile,
} from "@/services/driveService";
import {
  Upload,
  Trash2,
  Play,
  Pause,
  Disc,
  FileAudio,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  HardDrive,
  Clock,
  X,
} from "lucide-react";

export const DriveArchiveSection = () => {
  const { userProfile, currentTrack, isPlaying, togglePlayPause, playPastBroadcast } = useAudio();
  const isAdmin = userProfile.role.toUpperCase() === "ADMIN";

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reloadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const driveFiles = await fetchDriveFiles();
      setFiles(driveFiles);
    } catch (err) {
      console.error("Error al recargar archivos de Drive:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchDriveFiles()
      .then((driveFiles) => {
        if (isMounted) {
          setFiles(driveFiles);
        }
      })
      .catch((err) => {
        console.error("Error al cargar archivos de Drive:", err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlayDriveFile = (file: DriveFile) => {
    const streamUrl = getDriveStreamUrl(file.id);
    const isCurrentFile = currentTrack.streamUrl === streamUrl;

    if (isCurrentFile) {
      togglePlayPause();
      return;
    }

    playPastBroadcast({
      id: file.id,
      programId: "google_drive",
      title: file.name.replace(/\.[^/.]+$/, ""),
      date: formatDate(file.createdTime),
      duration: formatFileSize(file.size),
      audioUrl: streamUrl,
    });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const uploaded = await uploadDriveFile(selectedFile, customTitle.trim() || undefined);
      setUploadSuccess(`¡"${uploaded.name || selectedFile.name}" subido con éxito a Google Drive!`);
      setSelectedFile(null);
      setCustomTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await reloadFiles();
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido al subir el archivo";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente "${fileName}" de Google Drive?`)) {
      return;
    }

    try {
      await deleteDriveFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      alert(`No se pudo eliminar el archivo: ${msg}`);
    }
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return "N/A";
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return "N/A";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Reciente";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "Reciente";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }}>
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
                backgroundColor: "var(--primary-container)",
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
              <HardDrive size={12} /> BÚNKER DE ARCHIVO
            </span>
            {isAdmin && (
              <span
                style={{
                  backgroundColor: "#FFB000",
                  color: "black",
                  border: "2px solid var(--primary)",
                  padding: "2px 8px",
                  fontSize: "0.65rem",
                  fontWeight: 900,
                }}
              >
                👑 MODO ADMIN
              </span>
            )}
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase" }}>
            GRABACIONES Y TRANSMISIONES EN GOOGLE DRIVE
          </h3>
          <p style={{ fontSize: "0.75rem", opacity: 0.75 }}>
            Audios, sesiones y transmisiones históricas alojadas en la nube.
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={reloadFiles}
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
            title="Recargar archivos de Drive"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> REFRESCAR
          </button>

          {/* ADMIN UPLOAD BUTTON */}
          {isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: "var(--primary-container)",
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
              <Upload size={16} /> SUBIR AUDIO AL DRIVE ⚡
            </button>
          )}

          <a
            href="https://drive.google.com/drive/folders/1OhBEPm-sb3L5ITUXi_5YkOVbRe42Acmk"
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
            CARPETA GOOGLE DRIVE <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Grid of Drive Audio Files */}
      {isLoading ? (
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
            gap: "12px",
          }}
        >
          <Disc size={36} className="animate-spin" style={{ color: "var(--primary)" }} />
          <p style={{ fontSize: "0.8rem", fontWeight: 900, textTransform: "uppercase" }}>
            Sincronizando transmisiones desde Google Drive...
          </p>
        </div>
      ) : files.length === 0 ? (
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
            gap: "12px",
          }}
        >
          <FileAudio size={40} style={{ opacity: 0.6 }} />
          <h4 style={{ fontSize: "1rem", fontWeight: 900 }}>NO HAY ARCHIVOS DISPONIBLES EN ESTE MOMENTO</h4>
          <p style={{ fontSize: "0.75rem", opacity: 0.75, maxWidth: "450px" }}>
            {isAdmin
              ? "Puedes subir archivos de audio (.mp3, .wav, .m4a, .mp4) usando el botón de arriba o soltándolos directamente en la carpeta compartida de Google Drive."
              : "Pronto subiremos las grabaciones y programas pasados para que los escuches a la carta."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {files.map((file, idx) => {
            const streamUrl = getDriveStreamUrl(file.id);
            const isThisPlaying = isPlaying && currentTrack.streamUrl === streamUrl;
            const rotations = [-0.5, 0.4, -0.3, 0.6];
            const rot = rotations[idx % rotations.length];

            return (
              <div
                key={file.id}
                className="neo-card store-card-hover"
                style={{
                  transform: isThisPlaying ? "translate(3px, 3px) rotate(0deg)" : `rotate(${rot}deg)`,
                  backgroundColor: isThisPlaying ? "var(--primary-container)" : "var(--surface-container)",
                  boxShadow: isThisPlaying ? "2px 2px 0px var(--primary)" : "5px 5px 0px var(--primary)",
                  border: "2.5px solid var(--primary)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                  position: "relative",
                }}
              >
                {/* Top Info: Icon + Name + Meta */}
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      backgroundColor: isThisPlaying ? "var(--primary)" : "var(--primary-container)",
                      color: isThisPlaying ? "var(--on-primary)" : "var(--primary)",
                      border: "2px solid var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "2px 2px 0px var(--primary)",
                    }}
                  >
                    {isThisPlaying ? (
                      <Disc size={24} className="animate-spin" />
                    ) : (
                      <FileAudio size={24} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                    <h4
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        lineHeight: "1.1rem",
                        wordBreak: "break-word",
                      }}
                      title={file.name}
                    >
                      {file.name.replace(/\.[^/.]+$/, "")}
                    </h4>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
                      <span
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: "bold",
                          opacity: 0.7,
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Clock size={10} /> {formatDate(file.createdTime)}
                      </span>
                      {file.size && (
                        <span
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: "bold",
                            backgroundColor: "rgba(0,0,0,0.06)",
                            padding: "1px 4px",
                            border: "1px solid var(--primary)",
                          }}
                        >
                          {formatFileSize(file.size)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: Play button for everyone + Delete for Admin */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    borderTop: "1.5px solid var(--primary)",
                    paddingTop: "10px",
                  }}
                >
                  <button
                    onClick={() => handlePlayDriveFile(file)}
                    className="neo-button fun-hover-wobble"
                    style={{
                      flex: 1,
                      backgroundColor: isThisPlaying ? "var(--primary)" : "var(--primary-container)",
                      color: isThisPlaying ? "var(--on-primary)" : "var(--primary)",
                      padding: "8px 12px",
                      fontSize: "0.7rem",
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {isThisPlaying ? (
                      <>
                        <Pause size={14} fill="currentColor" /> PAUSAR REPRODUCCIÓN
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" /> ESCUCHAR GRABACIÓN
                      </>
                    )}
                  </button>

                  {/* ADMIN DELETE BUTTON */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteFile(file.id, file.name)}
                      style={{
                        backgroundColor: "#FFDAD6",
                        color: "#BA1A1A",
                        border: "2px solid #BA1A1A",
                        padding: "7px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        boxShadow: "2px 2px 0px #BA1A1A",
                      }}
                      title="Eliminar archivo de Google Drive"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADMIN UPLOAD MODAL */}
      {isUploadModalOpen && isAdmin && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.75)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => !isUploading && setIsUploadModalOpen(false)}
        >
          <div
            className="neo-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              backgroundColor: "white",
              padding: "24px",
              boxShadow: "8px 8px 0px var(--primary)",
              border: "3.5px solid var(--primary)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    backgroundColor: "var(--primary-container)",
                    border: "1.5px solid var(--primary)",
                    padding: "2px 6px",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    width: "fit-content",
                  }}
                >
                  👑 HERRAMIENTA ADMIN
                </span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase" }}>
                  SUBIR AUDIO / PROGRAMA A DRIVE
                </h3>
              </div>

              {!isUploading && (
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  style={{
                    background: "var(--primary)",
                    color: "var(--on-primary)",
                    border: "2px solid var(--primary)",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Upload Form */}
            <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* File Input Box */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 900, display: "block", marginBottom: "6px" }}>
                  SELECCIONAR ARCHIVO (.MP3, .WAV, .M4A, .MP4)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/mp4"
                  required
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2.5px solid var(--primary)",
                    backgroundColor: "var(--surface-container)",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    outline: "none",
                  }}
                />
              </div>

              {/* Optional Custom Title */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 900, display: "block", marginBottom: "6px" }}>
                  TÍTULO DEL PROGRAMA O SESIÓN (OPCIONAL)
                </label>
                <input
                  type="text"
                  placeholder={selectedFile ? selectedFile.name : "Ej: Hits and Beats - Sesión 12"}
                  value={customTitle}
                  disabled={isUploading}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "2.5px solid var(--primary)",
                    backgroundColor: "white",
                    fontSize: "0.8rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Status alerts */}
              {uploadSuccess && (
                <div
                  style={{
                    backgroundColor: "#C4EED0",
                    border: "2px solid #00522B",
                    padding: "10px",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    color: "#00522B",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <CheckCircle size={16} /> {uploadSuccess}
                </div>
              )}

              {uploadError && (
                <div
                  style={{
                    backgroundColor: "#FFDAD6",
                    border: "2px solid #BA1A1A",
                    padding: "10px",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    color: "#BA1A1A",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={16} /> {uploadError}
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="neo-button fun-hover-wobble"
                  style={{
                    flex: 1,
                    backgroundColor: "var(--primary-container)",
                    padding: "12px",
                    fontSize: "0.8rem",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: isUploading || !selectedFile ? 0.6 : 1,
                    cursor: isUploading || !selectedFile ? "not-allowed" : "pointer",
                  }}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> SUBIENDO A GOOGLE DRIVE...
                    </>
                  ) : (
                    <>
                      <Upload size={16} /> CONFIRMAR Y SUBIR AL DRIVE 🚀
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadModalOpen(false)}
                  className="neo-button"
                  style={{
                    backgroundColor: "white",
                    padding: "12px",
                    fontSize: "0.8rem",
                    fontWeight: 900,
                  }}
                >
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
