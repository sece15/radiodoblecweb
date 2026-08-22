"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { Upload, Crown, Sparkles, Check, Play, Pause, Loader2, Video, FileAudio, Link2 } from "lucide-react";
import { NeoModal } from "../common/NeoModal";
import { useAudio } from "@/hooks/useAudio";
import { isVip } from "@/lib/permissions";
import { injectVipSongToAzuraCast } from "@/services/vipJukeboxService";

interface VipJukeboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VipJukeboxModal = ({ isOpen, onClose }: VipJukeboxModalProps) => {
  const {
    userProfile,
    vipQueue,
    requestVipSong,
    puntosC,
    consumePuntosC,
    skipToNextVipSong,
  } = useAudio();

  const userIsVip = isVip(userProfile?.role || "");
  const normRole = (userProfile?.role || "").toUpperCase();
  const isStaff = normRole.includes("ADMIN") || normRole.includes("STREAMER") || normRole.includes("MOD");

  const [activeTab, setActiveTab] = useState<"youtube" | "file">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [dedication, setDedication] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState("");
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepText, setUploadStepText] = useState("");

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleAudioFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Por favor selecciona un archivo de audio válido (.mp3, .wav, .m4a, .ogg)");
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioFile(file);
    setAudioUrl(url);
    setAudioFileName(file.name);

    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    if (cleanName.includes("-")) {
      const parts = cleanName.split("-");
      if (!artist) setArtist(parts[0].trim());
      if (!title) setTitle(parts.slice(1).join("-").trim());
    } else if (!title) {
      setTitle(cleanName);
    }

    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      setAudioDuration(Math.round(tempAudio.duration));
    };
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current && audioUrl) {
      previewAudioRef.current = new Audio(audioUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }

    if (previewAudioRef.current) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        previewAudioRef.current.play();
        setIsPlayingPreview(true);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (activeTab === "youtube") {
      if (!youtubeUrl.trim()) {
        alert("Por favor pega el enlace de YouTube o SoundCloud.");
        return;
      }
    } else {
      if (!audioUrl || !audioFile || !title.trim() || !artist.trim()) {
        alert("Por favor sube tu archivo de audio e ingresa el título y artista de la canción.");
        return;
      }
    }

    // VIP / Coins Verification
    if (!userIsVip && !isStaff) {
      if ((puntosC || 0) < 150) {
        alert(
          `🔒 LA ROCKOLA VIP ES EXCLUSIVA PARA MIEMBROS VIP O CANJE CON 150 C-COINS.\n(Tienes: ${
            puntosC || 0
          } C-Coins).\n\n📻 ¡Escucha la radio o sube de nivel para acumular más C-Coins!`
        );
        return;
      }
      consumePuntosC(150);
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }

    setIsSubmitting(true);
    setUploadProgress(12);
    setUploadStepText(
      activeTab === "youtube"
        ? "Conectando con el extractor antibloqueo... 🔗"
        : "Preparando y empaquetando audio... 📁"
    );

    // Barra de progreso interactiva y fluida
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 35) {
          setUploadStepText("Transmitiendo al servidor de Radio Doble C... 📡");
          return prev + 6;
        }
        if (prev < 68) {
          setUploadStepText("Optimizando flujo de audio a 320kbps... ⚡");
          return prev + 4;
        }
        if (prev < 88) {
          setUploadStepText("Inyectando en la cola de AzuraCast AutoDJ... 📻");
          return prev + 2;
        }
        return prev;
      });
    }, 180);

    try {
      if (activeTab === "youtube") {
        const effectiveTitle = title.trim() || "Tema YouTube";
        const effectiveArtist = artist.trim() || "YouTube / Web";

        const res = await injectVipSongToAzuraCast({
          url: youtubeUrl.trim(),
          title: effectiveTitle,
          artist: effectiveArtist,
          requester: userProfile.name,
          dedication: dedication.trim() || undefined,
        });

        requestVipSong({
          title: effectiveTitle,
          artist: effectiveArtist,
          requestedBy: userProfile.name,
          userAvatar: userProfile.avatarUrl,
          dedication: dedication.trim() || undefined,
          audioUrl: res.url || "https://stream.andrealvarado.dev/radio.mp3",
          coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop",
        });
      } else {
        const res = await injectVipSongToAzuraCast({
          file: audioFile,
          title: title.trim(),
          artist: artist.trim(),
          requester: userProfile.name,
          dedication: dedication.trim() || undefined,
        });

        requestVipSong({
          title: title.trim(),
          artist: artist.trim(),
          requestedBy: userProfile.name,
          userAvatar: userProfile.avatarUrl,
          dedication: dedication.trim() || undefined,
          audioUrl: res.url || audioUrl!,
          coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop",
          durationSeconds: audioDuration,
        });
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStepText("¡Listo! Canción encolada al aire ⭐");

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setUploadProgress(0);
        setUploadStepText("");
        setYoutubeUrl("");
        setTitle("");
        setArtist("");
        setDedication("");
        setAudioFile(null);
        setAudioUrl(null);
        setAudioFileName("");
        onClose();
      }, 2200);
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Error al procesar pedido VIP:", err);
      alert("Hubo un detalle al enviar el pedido, pero se intentará encolar en el reproductor.");
    } finally {
      clearInterval(progressInterval);
      setIsSubmitting(false);
    }
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={() => {
        if (previewAudioRef.current) {
          previewAudioRef.current.pause();
          setIsPlayingPreview(false);
        }
        onClose();
      }}
      title="⭐ LA ROCKOLA VIP • TRANSMISIÓN AL AIRE"
      badgeText="👑 VIP JUKEBOX"
      maxWidth="550px"
      backgroundColor="var(--background)"
    >
      {isSuccess ? (
        <div
          style={{
            textAlign: "center",
            padding: "30px 10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#CCFF00",
              border: "3.5px solid var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "4px 4px 0px var(--primary)",
            }}
          >
            <Check size={36} color="black" />
          </div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
            ¡TEMA ENCOLADO CON ÉXITO! ⭐
          </h3>
          <p style={{ fontSize: "0.8rem", opacity: 0.9, margin: 0, maxWidth: "420px" }}>
            Tu pedido está encolado en la fila VIP de AzuraCast. Sonará automáticamente en la transmisión al
            terminar la canción que está actualmente al aire.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* VIP Status Pill */}
          <div
            style={{
              backgroundColor: userIsVip || isStaff ? "#FFF8E1" : "var(--surface-container)",
              border: "2px solid var(--primary)",
              padding: "8px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "3px 3px 0px var(--primary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Crown style={{ color: "#BA1A1A", fill: "#FFB000" }} size={20} />
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", display: "block" }}>
                  {userIsVip || isStaff ? "PASE VIP ACTIVO (ILIMITADO)" : "ACCESO GENERAL"}
                </span>
                <span style={{ fontSize: "0.6rem", opacity: 0.8 }}>
                  {userIsVip || isStaff
                    ? "Tus pedidos suenan con prioridad VIP al terminar la canción actual."
                    : "Costo: 150 C-Coins o Membresía VIP para sonar al aire."}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--on-primary)",
                padding: "3px 8px",
                fontSize: "0.65rem",
                fontWeight: 900,
              }}
            >
              ⚡ {puntosC || 0} C-COINS
            </div>
          </div>

          {/* TAB SELECTOR */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("youtube")}
              style={{
                padding: "8px 10px",
                fontSize: "0.72rem",
                fontWeight: 900,
                backgroundColor: activeTab === "youtube" ? "var(--primary-container)" : "white",
                border: "2px solid var(--primary)",
                boxShadow: activeTab === "youtube" ? "2.5px 2.5px 0px var(--primary)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Video size={15} color="#BA1A1A" />
              <span>LINK DE YOUTUBE</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("file")}
              style={{
                padding: "8px 10px",
                fontSize: "0.72rem",
                fontWeight: 900,
                backgroundColor: activeTab === "file" ? "var(--primary-container)" : "white",
                border: "2px solid var(--primary)",
                boxShadow: activeTab === "file" ? "2.5px 2.5px 0px var(--primary)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <FileAudio size={15} color="var(--primary)" />
              <span>SUBIR ARCHIVO MP3</span>
            </button>
          </div>

          {/* TAB 1: YOUTUBE LINK */}
          {activeTab === "youtube" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 900, display: "block", marginBottom: "4px" }}>
                  ENLACE DEL VIDEO DE YOUTUBE O SOUNDCLOUD *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    key="input-youtube-url"
                    type="url"
                    required
                    value={youtubeUrl || ""}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="neo-input"
                    style={{
                      width: "100%",
                      padding: "8px 10px 8px 32px",
                      fontSize: "0.75rem",
                      border: "2px solid var(--primary)",
                      fontWeight: "bold",
                      backgroundColor: "white",
                    }}
                  />
                  <Link2
                    size={16}
                    style={{
                      position: "absolute",
                      left: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--primary)",
                    }}
                  />
                </div>
                <span style={{ fontSize: "0.6rem", opacity: 0.75, marginTop: "2px", display: "block" }}>
                  💡 El extractor antibloqueo obtendrá el audio en 320kbps y lo meterá a AzuraCast AutoDJ.
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
                    TÍTULO (OPCIONAL)
                  </label>
                  <input
                    key="input-youtube-title"
                    type="text"
                    value={title || ""}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Demolición"
                    className="neo-input"
                    style={{
                      width: "100%",
                      padding: "7px 9px",
                      fontSize: "0.72rem",
                      border: "2px solid var(--primary)",
                      backgroundColor: "white",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
                    ARTISTA (OPCIONAL)
                  </label>
                  <input
                    key="input-youtube-artist"
                    type="text"
                    value={artist || ""}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Ej. Los Saicos"
                    className="neo-input"
                    style={{
                      width: "100%",
                      padding: "7px 9px",
                      fontSize: "0.72rem",
                      border: "2px solid var(--primary)",
                      backgroundColor: "white",
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: FILE UPLOAD */
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 900, display: "block", marginBottom: "4px" }}>
                  ARCHIVO DE AUDIO (MP3, WAV, M4A) *
                </label>
                <div
                  style={{
                    border: "2px dashed var(--primary)",
                    backgroundColor: "white",
                    padding: "14px",
                    textAlign: "center",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <input
                    key="input-file-audio"
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.ogg"
                    onChange={handleAudioFileChange}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                  <Upload size={22} style={{ margin: "0 auto 4px auto", color: "var(--primary)" }} />
                  {audioFileName ? (
                    <div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 900, display: "block", color: "#008800" }}>
                        ✓ {audioFileName}
                      </span>
                      {audioDuration > 0 && (
                        <span style={{ fontSize: "0.6rem", opacity: 0.75 }}>
                          Duración: {Math.floor(audioDuration / 60)}:
                          {(audioDuration % 60).toString().padStart(2, "0")} min
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 900, display: "block" }}>
                        HAZ CLICK O ARRASTRA TU CANCIÓN AQUÍ
                      </span>
                      <span style={{ fontSize: "0.58rem", opacity: 0.7 }}>
                        Archivos de audio de alta fidelidad hasta 25MB
                      </span>
                    </div>
                  )}
                </div>

                {audioUrl && (
                  <button
                    type="button"
                    onClick={togglePreviewPlay}
                    className="neo-button"
                    style={{
                      marginTop: "6px",
                      padding: "3px 8px",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      backgroundColor: "var(--primary-container)",
                      border: "1.5px solid var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      cursor: "pointer",
                    }}
                  >
                    {isPlayingPreview ? <Pause size={12} /> : <Play size={12} />}
                    <span>{isPlayingPreview ? "PAUSAR PREESCUCHA" : "PREESCUCHAR AUDIO"}</span>
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
                    TÍTULO *
                  </label>
                  <input
                    key="input-file-title"
                    type="text"
                    required={activeTab === "file"}
                    value={title || ""}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Demolición"
                    className="neo-input"
                    style={{
                      width: "100%",
                      padding: "7px 9px",
                      fontSize: "0.72rem",
                      border: "2px solid var(--primary)",
                      fontWeight: "bold",
                      backgroundColor: "white",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
                    ARTISTA *
                  </label>
                  <input
                    type="text"
                    required={activeTab === "file"}
                    value={artist || ""}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Ej. Los Saicos"
                    className="neo-input"
                    style={{
                      width: "100%",
                      padding: "7px 9px",
                      fontSize: "0.72rem",
                      border: "2px solid var(--primary)",
                      fontWeight: "bold",
                      backgroundColor: "white",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* DEDICATION (Shared) */}
          <div>
            <label style={{ fontSize: "0.68rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
              DEDICATORIA O SALUDO AL AIRE (OPCIONAL)
            </label>
            <input
              key="input-dedication"
              type="text"
              value={dedication || ""}
              onChange={(e) => setDedication(e.target.value)}
              placeholder="Ej. Un saludo para toda la gente en sintonía 📻"
              className="neo-input"
              style={{
                width: "100%",
                padding: "7px 9px",
                fontSize: "0.72rem",
                border: "2px solid var(--primary)",
                fontWeight: "bold",
                backgroundColor: "white",
              }}
            />
          </div>

          {/* QUEUE STATUS */}
          {vipQueue.length > 0 && (
            <div
              style={{
                backgroundColor: "#FFFBE5",
                border: "1.5px solid var(--primary)",
                padding: "6px 8px",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 900, color: "var(--primary)" }}>
                  🎵 EN FILA VIP ({vipQueue.length}):
                </span>
                {isStaff && (
                  <button
                    type="button"
                    onClick={skipToNextVipSong}
                    style={{
                      padding: "1px 5px",
                      fontSize: "0.52rem",
                      fontWeight: 900,
                      backgroundColor: "#CCFF00",
                      border: "1px solid var(--primary)",
                      cursor: "pointer",
                    }}
                  >
                    FORZAR AL AIRE ⚡
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {vipQueue.slice(0, 3).map((item, idx) => (
                  <span key={item.id} style={{ fontSize: "0.6rem", opacity: 0.85 }}>
                    #{idx + 1} <strong>{item.title}</strong> ({item.artist}) • Pedido por{" "}
                    <em>{item.requestedBy}</em>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* PROGRESS BAR (when uploading) */}
          {isSubmitting && (
            <div
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "2px solid var(--primary)",
                padding: "8px 10px",
                boxShadow: "3px 3px 0px var(--primary)",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 900, color: "var(--primary)" }}>
                  {uploadStepText || "PROCESANDO PEDIDO..."}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 900,
                    backgroundColor: "#CCFF00",
                    padding: "1px 6px",
                    border: "1px solid var(--primary)",
                  }}
                >
                  {Math.min(100, Math.round(uploadProgress))}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "12px",
                  backgroundColor: "white",
                  border: "1.5px solid var(--primary)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: "100%",
                    backgroundColor: "#CCFF00",
                    transition: "width 0.25s ease-out",
                    backgroundImage:
                      "linear-gradient(45deg, rgba(0,0,0,0.12) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.12) 75%, transparent 75%, transparent)",
                    backgroundSize: "16px 16px",
                  }}
                />
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="neo-button fun-hover-wobble"
            style={{
              backgroundColor: isSubmitting ? "#E0E0E0" : "#CCFF00",
              color: "#111111",
              padding: "11px",
              fontSize: "0.82rem",
              fontWeight: 900,
              border: "2.5px solid var(--primary)",
              boxShadow: "3.5px 3.5px 0px var(--primary)",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "2px",
              opacity: isSubmitting ? 0.8 : 1,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>TRANSMITIENDO Y PROGRAMANDO ({Math.min(100, Math.round(uploadProgress))}%) 📡</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>ENVIAR CANCIÓN A LA ROCKOLA VIP ⭐</span>
              </>
            )}
          </button>
        </form>
      )}
    </NeoModal>
  );
};
