"use client";

import { useEffect, useRef, useState, ChangeEvent, FormEvent } from "react";
import {
  Check,
  FileAudio,
  Loader2,
  Mic,
  Radio,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import {
  ADMIN_MAX_VOICE_BYTES,
  type AdminRadioPlaylist,
  type AdminVoiceNoteResponse,
} from "@/types/adminRadio";
import { useAdminVoiceNote } from "@/hooks/useAdminRadioQuery";

interface AdminVoiceRecorderPanelProps {
  playlists: AdminRadioPlaylist[];
  defaultUploadPlaylistId: number;
  onFeedback: (fb: { type: "success" | "error"; text: string } | null) => void;
}

type VoiceMode = "capsule" | "podcast";

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function detectRecorderFormat(): { mimeType: string; extension: "mp4" | "webm" } {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "audio/webm", extension: "webm" };
  }
  const isSafariIos =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
        MediaRecorder.isTypeSupported("audio/mp4")));

  if (isSafariIos && MediaRecorder.isTypeSupported("audio/mp4")) {
    return { mimeType: "audio/mp4", extension: "mp4" };
  }
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return { mimeType: "audio/webm;codecs=opus", extension: "webm" };
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return { mimeType: "audio/webm", extension: "webm" };
  }
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return { mimeType: "audio/mp4", extension: "mp4" };
  }
  return { mimeType: "", extension: "webm" };
}

export const AdminVoiceRecorderPanel = ({
  playlists,
  defaultUploadPlaylistId,
  onFeedback,
}: AdminVoiceRecorderPanelProps) => {
  const voiceMutation = useAdminVoiceNote();

  const [mode, setMode] = useState<VoiceMode>("capsule");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedFilename, setRecordedFilename] = useState<string>("grabacion.webm");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Podcast mode fields
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [podcastTitle, setPodcastTitle] = useState("");
  const [podcastArtist, setPodcastArtist] = useState("");
  const defaultPodcastPlaylistId =
    playlists.find((p) => p.id === 19)?.id ??
    playlists.find((p) => p.id === 22)?.id ??
    defaultUploadPlaylistId ??
    19;
  const [podcastPlaylistId, setPodcastPlaylistId] = useState<number | null>(null);
  const [podcastEnqueueNext, setPodcastEnqueueNext] = useState(false);
  const [lastResult, setLastResult] = useState<AdminVoiceNoteResponse | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activePodcastPlaylistId = podcastPlaylistId ?? defaultPodcastPlaylistId;

  const stopTracks = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      stopTracks();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearRecording = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRecordedBlob(null);
    setUploadedAudioFile(null);
    setElapsedSec(0);
    setLastResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStartRecording = async () => {
    onFeedback(null);
    setLastResult(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onFeedback({
        type: "error",
        text: "Tu navegador no soporta grabación desde micrófono (requiere HTTPS o localhost).",
      });
      return;
    }

    try {
      clearRecording();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const { mimeType, extension } = detectRecorderFormat();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = () => {
        stopTracks();
        setIsRecording(false);
        const finalType = mimeType || recorder.mimeType || (extension === "mp4" ? "audio/mp4" : "audio/webm");
        const blob = new Blob(chunks, { type: finalType });
        if (blob.size === 0) {
          onFeedback({ type: "error", text: "No se capturó audio del micrófono." });
          return;
        }
        const nextUrl = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedFilename(`grabacion.${extension}`);
        setPreviewUrl(nextUrl);
      };

      mediaRecorderRef.current = recorder;
      setElapsedSec(0);
      setIsRecording(true);
      recorder.start(250);

      timerRef.current = window.setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    } catch {
      stopTracks();
      setIsRecording(false);
      onFeedback({
        type: "error",
        text: "No se pudo acceder al micrófono. Verifica los permisos del navegador.",
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handlePodcastFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > ADMIN_MAX_VOICE_BYTES) {
      onFeedback({
        type: "error",
        text: "El archivo supera el límite máximo de 95 MB (413).",
      });
      e.target.value = "";
      return;
    }

    onFeedback(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setUploadedAudioFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    const clean = file.name.replace(/\.[^/.]+$/, "");
    if (!podcastTitle) setPodcastTitle(clean);
  };

  const handleSubmitVoice = async (e: FormEvent) => {
    e.preventDefault();
    onFeedback(null);
    setLastResult(null);

    const activeBlobOrFile = mode === "podcast" && uploadedAudioFile ? uploadedAudioFile : recordedBlob;
    if (!activeBlobOrFile) {
      onFeedback({
        type: "error",
        text:
          mode === "capsule"
            ? "Graba primero un saludo o cápsula con el micrófono."
            : "Graba con el micrófono o selecciona un archivo de audio (máx. 95 MB).",
      });
      return;
    }

    const filename =
      mode === "podcast" && uploadedAudioFile ? uploadedAudioFile.name : recordedFilename;

    try {
      const res = await voiceMutation.mutateAsync({
        file: activeBlobOrFile,
        filename,
        enqueue_next: mode === "capsule" ? true : podcastEnqueueNext,
        voice_enhance: true,
        playlist_id: mode === "capsule" ? null : activePodcastPlaylistId,
        title: mode === "podcast" ? podcastTitle : undefined,
        artist: mode === "podcast" ? podcastArtist : undefined,
      });

      setLastResult(res);
      onFeedback({
        type: "success",
        text:
          mode === "capsule"
            ? "✅ Cápsula procesada (-16 LUFS) y encolada para sonar tras la canción actual."
            : res.enqueued
            ? "✅ Podcast procesado (-16 LUFS), guardado en playlist y encolado siguiente."
            : "✅ Podcast procesado (-16 LUFS) y guardado en la playlist destino.",
      });
      clearRecording();
      if (mode === "podcast") {
        setPodcastTitle("");
        setPodcastArtist("");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar el audio de voz/podcast.";
      onFeedback({ type: "error", text: msg });
    }
  };

  const hasAudioReady = Boolean(recordedBlob || (mode === "podcast" && uploadedAudioFile));

  return (
    <form onSubmit={handleSubmitVoice} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Selector de modo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <button
          type="button"
          disabled={isRecording || voiceMutation.isPending}
          onClick={() => {
            setMode("capsule");
            clearRecording();
          }}
          style={{
            padding: "8px 10px",
            backgroundColor: mode === "capsule" ? "var(--primary-container)" : "var(--card-bg)",
            color: mode === "capsule" ? "var(--on-primary-container)" : "var(--on-background)",
            border: "2px solid var(--primary)",
            boxShadow: mode === "capsule" ? "3px 3px 0px var(--primary)" : "none",
            fontSize: "0.72rem",
            fontWeight: 900,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Mic size={14} />
            <span>SALUDO / CÁPSULA RÁPIDA</span>
          </div>
          <div style={{ fontSize: "0.60rem", opacity: 0.8, marginTop: "2px", fontWeight: 700 }}>
            Suena tras la canción actual sin repetirse (voice_enhance + enqueue_next)
          </div>
        </button>

        <button
          type="button"
          disabled={isRecording || voiceMutation.isPending}
          onClick={() => {
            setMode("podcast");
            clearRecording();
          }}
          style={{
            padding: "8px 10px",
            backgroundColor: mode === "podcast" ? "var(--primary-container)" : "var(--card-bg)",
            color: mode === "podcast" ? "var(--on-primary-container)" : "var(--on-background)",
            border: "2px solid var(--primary)",
            boxShadow: mode === "podcast" ? "3px 3px 0px var(--primary)" : "none",
            fontSize: "0.72rem",
            fontWeight: 900,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Radio size={14} />
            <span>PODCAST / ENTREVISTA LARGA</span>
          </div>
          <div style={{ fontSize: "0.60rem", opacity: 0.8, marginTop: "2px", fontWeight: 700 }}>
            Graba o sube audio (hasta 95 MB) directo a Historias & Podcasts o playlist
          </div>
        </button>
      </div>

      {/* Grabadora de Micrófono + Subida opcional (en modo Podcast) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mode === "podcast" ? "1fr 1fr" : "1fr",
          gap: "10px",
        }}
      >
        <div
          style={{
            padding: "14px",
            border: "2px solid var(--primary)",
            backgroundColor: "var(--surface-container)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 900,
              fontFamily: "monospace",
              letterSpacing: "2px",
              color: isRecording ? "#BA1A1A" : "var(--on-background)",
            }}
          >
            {isRecording ? "● " : ""}
            {formatDuration(elapsedSec)}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            {!isRecording ? (
              <button
                type="button"
                disabled={voiceMutation.isPending}
                onClick={handleStartRecording}
                className="neo-button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "#BA1A1A",
                  color: "#FFFFFF",
                  border: "2px solid var(--primary)",
                  boxShadow: "3px 3px 0px var(--primary)",
                  fontSize: "0.74rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                <Mic size={15} />
                <span>{recordedBlob ? "GRABAR DE NUEVO" : "GRABAR MICRÓFONO"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopRecording}
                className="neo-button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "var(--primary)",
                  color: "var(--on-primary)",
                  border: "2px solid var(--primary)",
                  boxShadow: "3px 3px 0px var(--primary-container)",
                  fontSize: "0.74rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                <Square size={14} fill="currentColor" />
                <span>DETENER GRABACIÓN</span>
              </button>
            )}

            {hasAudioReady && !isRecording && (
              <button
                type="button"
                onClick={clearRecording}
                disabled={voiceMutation.isPending}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 10px",
                  backgroundColor: "var(--card-bg)",
                  color: "var(--on-background)",
                  border: "2px solid var(--primary)",
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={14} />
                <span>DESCARTAR</span>
              </button>
            )}
          </div>
        </div>

        {mode === "podcast" && (
          <div
            style={{
              border: "2px dashed var(--primary)",
              backgroundColor: "var(--card-bg)",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              position: "relative",
              cursor: "pointer",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.mp4,.wav,.webm,.ogg"
              onChange={handlePodcastFileChange}
              disabled={isRecording || voiceMutation.isPending}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: isRecording || voiceMutation.isPending ? "not-allowed" : "pointer",
              }}
            />
            <FileAudio size={24} />
            <span style={{ fontSize: "0.72rem", fontWeight: 900, marginTop: "6px" }}>
              {uploadedAudioFile
                ? `${uploadedAudioFile.name} (${(uploadedAudioFile.size / (1024 * 1024)).toFixed(2)} MB)`
                : "O sube audio grabado desde tu celular (máx. 95 MB)"}
            </span>
          </div>
        )}
      </div>

      {/* Preview de audio capturado/cargado */}
      {previewUrl && !isRecording && (
        <div
          style={{
            padding: "8px 10px",
            border: "2px solid var(--primary)",
            backgroundColor: "var(--card-bg)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <span style={{ fontSize: "0.64rem", fontWeight: 900, color: "var(--on-surface-variant)" }}>
            PREESCUCHA ({mode === "podcast" && uploadedAudioFile ? uploadedAudioFile.name : recordedFilename})
          </span>
          <audio controls src={previewUrl} style={{ width: "100%", height: "34px" }} />
        </div>
      )}

      {/* Campos adicionales en modo Podcast / Entrevista */}
      {mode === "podcast" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <div>
              <label style={{ fontSize: "0.66rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
                TÍTULO DEL EPISODIO
              </label>
              <input
                type="text"
                value={podcastTitle}
                onChange={(e) => setPodcastTitle(e.target.value)}
                disabled={voiceMutation.isPending}
                placeholder="Ej. Ep. 12 - Historias Nocturnas"
                style={{
                  width: "100%",
                  padding: "7px 8px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  border: "2px solid var(--primary)",
                  backgroundColor: "var(--card-bg)",
                  color: "var(--on-background)",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.66rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
                LOCUTOR / ARTISTA
              </label>
              <input
                type="text"
                value={podcastArtist}
                onChange={(e) => setPodcastArtist(e.target.value)}
                disabled={voiceMutation.isPending}
                placeholder="Ej. Luna / Invitado"
                style={{
                  width: "100%",
                  padding: "7px 8px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  border: "2px solid var(--primary)",
                  backgroundColor: "var(--card-bg)",
                  color: "var(--on-background)",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.66rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
                PLAYLIST DESTINO
              </label>
              <select
                value={activePodcastPlaylistId}
                onChange={(e) => setPodcastPlaylistId(Number(e.target.value))}
                disabled={voiceMutation.isPending}
                style={{
                  width: "100%",
                  padding: "7px 8px",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  border: "2px solid var(--primary)",
                  backgroundColor: "var(--card-bg)",
                  color: "var(--on-background)",
                }}
              >
                {playlists.length === 0 ? (
                  <>
                    <option value={19}>Especial Luna: Historias &amp; Podcasts (ID 19)</option>
                    <option value={22}>Lo Más Nuevo (ID 22)</option>
                  </>
                ) : (
                  playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} (ID {pl.id})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 10px",
              backgroundColor: "var(--surface-container)",
              border: "2px solid var(--primary)",
              fontSize: "0.7rem",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={podcastEnqueueNext}
              onChange={(e) => setPodcastEnqueueNext(e.target.checked)}
              disabled={voiceMutation.isPending}
              style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
            />
            <span>Encolar como siguiente al terminar de procesar (enqueue_next)</span>
          </label>
        </div>
      )}

      {/* Indicador de procesamiento -16 LUFS */}
      {voiceMutation.isPending && (
        <div
          style={{
            padding: "10px 12px",
            backgroundColor: "var(--surface-container)",
            border: "2px solid var(--primary)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.74rem",
            fontWeight: 900,
          }}
        >
          <Loader2 size={18} className="animate-spin" style={{ flexShrink: 0 }} />
          <span>Procesando audio de estudio (-16 LUFS)...</span>
        </div>
      )}

      {lastResult && !voiceMutation.isPending && (
        <div
          style={{
            padding: "8px 10px",
            backgroundColor: "var(--card-bg)",
            border: "2px solid var(--primary)",
            fontSize: "0.68rem",
            fontWeight: 700,
            fontFamily: "monospace",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Check size={14} />
          <span>
            {lastResult.status || "OK"}
            {lastResult.path ? ` · ${lastResult.path}` : ""}
            {lastResult.enqueued ? " · Encolado al aire" : ""}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={!hasAudioReady || isRecording || voiceMutation.isPending}
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
          cursor: !hasAudioReady || isRecording || voiceMutation.isPending ? "not-allowed" : "pointer",
          opacity: !hasAudioReady || isRecording || voiceMutation.isPending ? 0.65 : 1,
        }}
      >
        {voiceMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        <span>
          {voiceMutation.isPending
            ? "PROCESANDO AUDIO DE ESTUDIO (-16 LUFS)..."
            : mode === "capsule"
            ? "ENVIAR CÁPSULA AL AIRE (SIGUIENTE)"
            : "SUBIR PODCAST / ENTREVISTA"}
        </span>
      </button>
    </form>
  );
};
