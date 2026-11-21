"use client";

import type { RefObject } from "react";
import { FileAudio, Loader2, Upload } from "lucide-react";
import type { AdminRadioPlaylist, AdminUploadResponse } from "@/types/adminRadio";

interface AdminUploadTrackPanelProps {
  playlists: AdminRadioPlaylist[];
  uploadPlaylistId: number;
  resolvedUploadFolder: string;
  uploadFile: File | null;
  uploadArtist: string;
  uploadTitle: string;
  enqueueNext: boolean;
  isUploading: boolean;
  lastUploadResult: AdminUploadResponse | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSelectUploadPlaylist: (id: number) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeArtist: (val: string) => void;
  onChangeTitle: (val: string) => void;
  onChangeEnqueueNext: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AdminUploadTrackPanel({
  playlists,
  uploadPlaylistId,
  resolvedUploadFolder,
  uploadFile,
  uploadArtist,
  uploadTitle,
  enqueueNext,
  isUploading,
  lastUploadResult,
  fileInputRef,
  onSelectUploadPlaylist,
  onFileChange,
  onChangeArtist,
  onChangeTitle,
  onChangeEnqueueNext,
  onSubmit,
}: AdminUploadTrackPanelProps) {
  return (
    <form
      onSubmit={onSubmit}
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
          minWidth: 0,
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
                disabled={isUploading}
                onClick={() => onSelectUploadPlaylist(pl.id)}
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
                  backgroundColor: isActive ? "var(--primary-container)" : "var(--card-bg)",
                  color: isActive ? "var(--on-primary-container)" : "var(--on-background)",
                  cursor: isUploading ? "wait" : "pointer",
                  textAlign: "left",
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minWidth: 0,
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
              onChange={onFileChange}
              disabled={isUploading}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: isUploading ? "wait" : "pointer",
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
          <div style={{ minWidth: 0 }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
              ARTISTA (OPCIONAL)
            </label>
            <input
              type="text"
              value={uploadArtist}
              onChange={(e) => onChangeArtist(e.target.value)}
              disabled={isUploading}
              placeholder="Ej. Bad Bunny"
              style={{
                width: "100%",
                padding: "7px 9px",
                fontSize: "0.74rem",
                fontWeight: 700,
                border: "2px solid var(--primary)",
                backgroundColor: "var(--card-bg)",
                color: "var(--on-background)",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
              TÍTULO (OPCIONAL)
            </label>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => onChangeTitle(e.target.value)}
              disabled={isUploading}
              placeholder="Ej. Nuevo Single"
              style={{
                width: "100%",
                padding: "7px 9px",
                fontSize: "0.74rem",
                fontWeight: 700,
                border: "2px solid var(--primary)",
                backgroundColor: "var(--card-bg)",
                color: "var(--on-background)",
                boxSizing: "border-box",
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
            onChange={(e) => onChangeEnqueueNext(e.target.checked)}
            disabled={isUploading}
            style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
          />
          <span>Encolar como siguiente canción inmediatamente después de subirla</span>
        </label>

        {isUploading && (
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
          disabled={isUploading || !uploadFile}
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
            cursor: isUploading || !uploadFile ? "not-allowed" : "pointer",
            opacity: isUploading || !uploadFile ? 0.65 : 1,
          }}
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          <span>{isUploading ? "NORMALIZANDO A -16 LUFS..." : "SUBIR CANCIÓN A LA RADIO"}</span>
        </button>
      </div>
    </form>
  );
}
