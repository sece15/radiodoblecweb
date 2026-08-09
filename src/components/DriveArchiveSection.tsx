import { useState, useEffect, useRef, useCallback } from "react";
import { useAudio } from "@/hooks/useAudio";
import {
  fetchDriveFiles,
  getDriveStreamUrl,
  uploadDriveFile,
  deleteDriveFile,
  DriveFile,
} from "@/services/driveService";
import { isAdmin } from "@/lib/permissions";
import { formatFileSize, formatDate, cleanFileName } from "@/lib/formatters";
import { getCardRotation } from "@/lib/styleUtils";
import { NeoModal } from "./common/NeoModal";
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
} from "lucide-react";

export const DriveArchiveSection = () => {
  const { userProfile, currentTrack, isPlaying, togglePlayPause, playPastBroadcast } = useAudio();
  const userIsAdmin = isAdmin(userProfile.role);

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
      title: cleanFileName(file.name),
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
      }, 1800);
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
            <span
              style={{
                backgroundColor: "#FFDE82",
                border: "1.5px solid var(--primary)",
                padding: "2px 6px",
                fontSize: "0.65rem",
                fontWeight: 900,
              }}
            >
              NUBE GOOGLE DRIVE ☁️
            </span>
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase" }}>
            GRABACIONES Y AUDIOS DE GOOGLE DRIVE
          </h3>
          <p style={{ fontSize: "0.75rem", opacity: 0.75 }}>
            Audios, sesiones y transmisiones en diferido sintonizados directamente desde Google Drive.
          </p>
        </div>

        {/* Action Buttons */}
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
          {userIsAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
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
              <Upload size={16} /> SUBIR AUDIO MP3 ⚡
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
            ABRIR CARPETA EN DRIVE <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Files Feed */}
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
            Sincronizando archivos desde Google Drive...
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
          <h4 style={{ fontSize: "1rem", fontWeight: 900 }}>NO HAY ARCHIVOS DE AUDIO EN ESTE MOMENTO</h4>
          <p style={{ fontSize: "0.75rem", opacity: 0.75, maxWidth: "450px" }}>
            {userIsAdmin
              ? "Sube tu primer archivo MP3 con el botón 'SUBIR AUDIO MP3' o arrastra canciones a la carpeta de Google Drive."
              : "Pronto el equipo subirá nuevas grabaciones para escuchar en diferido."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {files.map((file, idx) => {
            const streamUrl = getDriveStreamUrl(file.id);
            const isPlayingThis = isPlaying && currentTrack.streamUrl === streamUrl;
            const rot = getCardRotation(idx);

            return (
              <div
                key={file.id}
                className="neo-card store-card-hover"
                style={{
                  transform: `rotate(${rot}deg)`,
                  backgroundColor: isPlayingThis ? "var(--primary-container)" : "var(--surface-container)",
                  boxShadow: isPlayingThis ? "6px 6px 0px var(--primary)" : "4px 4px 0px var(--primary)",
                  border: "2.5px solid var(--primary)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                  position: "relative",
                }}
              >
                {/* Top Info */}
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      backgroundColor: isPlayingThis ? "var(--primary)" : "white",
                      color: isPlayingThis ? "var(--on-primary)" : "var(--primary)",
                      border: "2px solid var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FileAudio size={22} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        lineHeight: "1.15rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        margin: 0,
                      }}
                      title={file.name}
                    >
                      {cleanFileName(file.name)}
                    </h4>

                    <div style={{ display: "flex", gap: "10px", marginTop: "4px", fontSize: "0.65rem", opacity: 0.8 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <Clock size={10} /> {formatDate(file.createdTime)}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Controls */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    onClick={() => handlePlayDriveFile(file)}
                    className="neo-button fun-hover-wobble"
                    style={{
                      flex: 1,
                      backgroundColor: isPlayingThis ? "var(--primary)" : "var(--primary-container)",
                      color: isPlayingThis ? "var(--on-primary)" : "var(--primary)",
                      padding: "8px 12px",
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {isPlayingThis ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    {isPlayingThis ? "PAUSAR REPRODUCCIÓN" : "SINTONIZAR GRABACIÓN"}
                  </button>

                  {/* ADMIN DELETE BUTTON */}
                  {userIsAdmin && (
                    <button
                      onClick={() => handleDeleteFile(file.id, file.name)}
                      style={{
                        backgroundColor: "#FFDAD6",
                        color: "#BA1A1A",
                        border: "2px solid #BA1A1A",
                        padding: "6px 8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
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
      <NeoModal
        isOpen={isUploadModalOpen && userIsAdmin}
        onClose={() => !isUploading && setIsUploadModalOpen(false)}
        title="Subir Archivo de Audio a Google Drive"
        badgeText="⚡ ADMINISTRADOR"
        maxWidth="500px"
      >
        <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 900, display: "block", marginBottom: "6px" }}>
              SELECCIONAR ARCHIVO DE AUDIO (.MP3, .WAV, .M4A, .MP4)
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
                padding: "8px",
                border: "2px solid var(--primary)",
                backgroundColor: "var(--surface-container)",
                fontSize: "0.8rem",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 900, display: "block", marginBottom: "6px" }}>
              TÍTULO O NOMBRE PERSONALIZADO (OPCIONAL)
            </label>
            <input
              type="text"
              placeholder={selectedFile ? selectedFile.name : "Ej: Hits and Beats - Sesion 04"}
              value={customTitle}
              disabled={isUploading}
              onChange={(e) => setCustomTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "2px solid var(--primary)",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
          </div>

          {uploadSuccess && (
            <div
              style={{
                backgroundColor: "#C4EED0",
                border: "2px solid #00522B",
                padding: "8px 12px",
                fontSize: "0.75rem",
                fontWeight: 900,
                color: "#00522B",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <CheckCircle size={16} />
              {uploadSuccess}
            </div>
          )}

          {uploadError && (
            <div
              style={{
                backgroundColor: "#FFDAD6",
                border: "2px solid #BA1A1A",
                padding: "8px 12px",
                fontSize: "0.75rem",
                fontWeight: 900,
                color: "#BA1A1A",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AlertCircle size={16} />
              {uploadError}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="neo-button"
              style={{
                flex: 1,
                backgroundColor: "var(--primary-container)",
                padding: "10px",
                fontSize: "0.8rem",
                fontWeight: 900,
              }}
            >
              {isUploading ? "SUBIENDO A GOOGLE DRIVE..." : "SUBIR AHORA 🚀"}
            </button>

            <button
              type="button"
              disabled={isUploading}
              onClick={() => setIsUploadModalOpen(false)}
              className="neo-button"
              style={{
                backgroundColor: "white",
                padding: "10px 16px",
                fontSize: "0.8rem",
                fontWeight: 900,
              }}
            >
              CANCELAR
            </button>
          </div>
        </form>
      </NeoModal>
    </div>
  );
};
