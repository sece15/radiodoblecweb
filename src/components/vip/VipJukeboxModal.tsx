"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { Upload, Sparkles, Check, Play, Pause, Loader2, FileAudio, Flame, Crown } from "lucide-react";
import { NeoModal } from "../common/NeoModal";
import { CoinRechargeModal } from "./CoinRechargeModal";
import { useAudio } from "@/hooks/useAudio";
import { useShallow } from "zustand/react/shallow";
import { isAdmin } from "@/lib/permissions";
import { injectVipSongToAzuraCast } from "@/services/vipJukeboxService";

interface VipJukeboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCoins?: number;
}

export const VipJukeboxModal = ({ isOpen, onClose, defaultCoins = 1000 }: VipJukeboxModalProps) => {
  const {
    userProfile,
    vipQueue,
    requestVipSong,
    puntosC,
    consumePuntosC,
    skipToNextVipSong,
    sendChatMessage,
  } = useAudio(
    useShallow((s) => ({
      userProfile: s.userProfile,
      vipQueue: s.vipQueue,
      requestVipSong: s.requestVipSong,
      puntosC: s.puntosC,
      consumePuntosC: s.consumePuntosC,
      skipToNextVipSong: s.skipToNextVipSong,
      sendChatMessage: s.sendChatMessage,
    }))
  );

  const userIsAdmin = isAdmin(userProfile?.role || "");
  const normRole = (userProfile?.role || "").toUpperCase();
  const isStaff = normRole.includes("ADMIN") || normRole.includes("STREAMER") || normRole.includes("MOD");

  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
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

  const baseCost = Math.max(1000, defaultCoins === 2000 ? 1000 : defaultCoins);
  const [customBidInput, setCustomBidInput] = useState<string>("");

  if (!isOpen) return null;

  const handleAudioFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isMp3 = file.name.toLowerCase().endsWith(".mp3") || file.type === "audio/mpeg" || file.type === "audio/mp3";
    if (!isMp3) {
      alert("⚠️ FORMATO NO ADMITIDO:\n\nPor favor sube únicamente archivos en formato MP3 (.mp3).\nLos formatos pesados como WAV no están permitidos para garantizar una transmisión al aire rápida y sin cortes.");
      e.target.value = "";
      return;
    }

    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      alert("⚠️ ARCHIVO DEMASIADO PESADO:\n\nEl tamaño máximo permitido para canciones MP3 es de 15MB.");
      e.target.value = "";
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

    if (!audioUrl || !audioFile || !title.trim() || !artist.trim()) {
      alert("Por favor sube tu archivo de audio MP3 e ingresa el título y artista de la canción.");
      return;
    }

    const parsedCustom = customBidInput ? parseInt(customBidInput, 10) : 0;
    const effectiveCost = parsedCustom >= 1000 ? parsedCustom : baseCost;
    const isRankingBid = effectiveCost > 1000;

    // Coins Verification (Only Admin has free pass, other users including streamers pay effectiveCost)
    if (!userIsAdmin) {
      if ((puntosC || 0) < effectiveCost) {
        setIsRechargeOpen(true);
        return;
      }
      consumePuntosC(effectiveCost);
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }

    setIsSubmitting(true);
    setUploadProgress(12);
    setUploadStepText("Cargando tema...");

    // Barra de progreso fluida y minimalista
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 40) {
          setUploadStepText("Enviando MP3 a la radio...");
          return prev + 6;
        }
        if (prev < 80) {
          setUploadStepText("Encolando canción al aire...");
          return prev + 4;
        }
        if (prev < 92) {
          setUploadStepText("Casi listo...");
          return prev + 2;
        }
        return prev;
      });
    }, 180);

    try {
      const res = await injectVipSongToAzuraCast({
        file: audioFile,
        title: title.trim(),
        artist: artist.trim(),
        requester: userProfile.name,
        dedication: dedication.trim() || undefined,
        userRole: userProfile.role,
        userId: userProfile.id,
        forceSkip: false,
        coinsPaid: effectiveCost,
      });

      console.log("[VIP MODAL SUBMIT RESULT]:", res);

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

      // Anuncio destacado en Chat solo cuando se puja por encima del precio base (> 1,000 C-Coins)
      if (isRankingBid) {
        try {
          if (sendChatMessage) {
            sendChatMessage(
              `👑 ¡PUJA EN LA ROCOLA! @${userProfile.name} aportó ${effectiveCost.toLocaleString()} C-Coins y puso al aire: "${title.trim()} - ${artist.trim()}"!`
            );
          }
        } catch (chatErr) {
          console.warn("Notice chat broadcast:", chatErr);
        }
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStepText("¡Listo! Canción enviada a la cola global de la radio ⭐");

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setUploadProgress(0);
        setUploadStepText("");
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
      alert("Hubo un detalle al enviar el pedido a la radio.");
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
      title="📻 ROCOLA EN VIVO • TRANSMISIÓN DE OYENTES"
      badgeText="⚡ BATALLA DE COINS"
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
            ¡TEMA ENCOLADO CON ÉXITO! 📻
          </h3>
          <p style={{ fontSize: "0.8rem", opacity: 0.9, margin: 0, maxWidth: "420px" }}>
            Tu pedido entró en la cola global de Radio Doble C y sonará para todos al terminar la canción en curso.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* User Status & Balance Pill */}
          <div
            style={{
              backgroundColor: "#FFDE82",
              border: "2px solid var(--primary)",
              padding: "8px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "3px 3px 0px var(--primary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Flame style={{ color: "#BA1A1A" }} size={20} />
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", display: "block" }}>
                  📻 ROCOLA EN VIVO • {userProfile?.name || "Oyente"}
                </span>
                <span style={{ fontSize: "0.6rem", opacity: 0.85 }}>
                  {userIsAdmin
                    ? "Acceso de Administrador (Pase libre)"
                    : "¡Sube tu música y haz que todos en la radio la escuchen!"}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--on-primary)",
                padding: "4px 9px",
                fontSize: "0.7rem",
                fontWeight: 900,
                border: "1.5px solid var(--primary-container)",
              }}
            >
              ⚡ {puntosC || 0} C-COINS
            </div>
          </div>

          {/* PRECIO BASE + PUJA OPCIONAL PARA RANKING #1 */}
          <div
            style={{
              backgroundColor: "#FFF8E1",
              color: "#111111",
              padding: "10px 12px",
              border: "2.5px solid var(--primary)",
              boxShadow: "3px 3px 0px var(--primary)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "5px" }}>
                <Crown size={15} style={{ color: "#BA1A1A", fill: "#FFB000" }} />
                COSTO BASE: 1,000 C-COINS
              </span>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  backgroundColor: "#111",
                  color: "#CCFF00",
                  padding: "2px 6px",
                }}
              >
                PUJA OPCIONAL PARA #1 + CHAT
              </span>
            </div>

            <p style={{ margin: 0, fontSize: "0.66rem", lineHeight: 1.35, opacity: 0.9 }}>
              Con <strong>1,000 C-Coins</strong> tu tema entra en la cola global de la radio. Si quieres liderar el{" "}
              <strong>Puesto #1 del ranking</strong> y activar un <strong>anuncio destacado en el chat</strong>, ingresa una puja mayor abajo.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label style={{ fontSize: "0.62rem", fontWeight: 900, whiteSpace: "nowrap" }}>
                PUJA OPCIONAL (MÍN. 1,000):
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                placeholder="1000 (Base) o más para #1"
                value={customBidInput}
                onChange={(e) => setCustomBidInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "5px 8px",
                  fontSize: "0.72rem",
                  border: "1.5px solid var(--primary)",
                  fontWeight: 900,
                  backgroundColor: customBidInput ? "#FFDE82" : "white",
                }}
              />
            </div>
          </div>

          {/* AVISO CLARO DE COLA GLOBAL EN VIVO (SOLO SUBIDA MP3) */}
          <div
            style={{
              backgroundColor: "var(--surface-container)",
              border: "2px solid var(--primary)",
              padding: "9px 11px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <FileAudio size={18} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "1px" }} />
            <div style={{ fontSize: "0.68rem", lineHeight: 1.4 }}>
              <strong style={{ display: "block", textTransform: "uppercase" }}>
                📻 COLA GLOBAL EN VIVO · SUBIDA DIRECTA EN MP3
              </strong>
              <span>
                Tu canción MP3 entra en la <strong>cola global de la radio</strong> y sonará para{" "}
                <strong>todos los oyentes al terminar la pista actual</strong>.
              </span>
            </div>
          </div>

          {/* FILE UPLOAD MP3 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 900, display: "block", marginBottom: "4px" }}>
                  ARCHIVO DE AUDIO (SOLO FORMATO MP3) *
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
                    accept="audio/mpeg,audio/mp3,.mp3"
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
                        Formato exclusivo: MP3 (.mp3) hasta 15MB
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
                    required
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
                    required
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
          {(() => {
            const parsedCustom = customBidInput ? parseInt(customBidInput, 10) : 0;
            const effectiveCost = parsedCustom >= 1000 ? parsedCustom : baseCost;
            const isRankingBid = effectiveCost > 1000;

            return (
              <button
                type="submit"
                disabled={isSubmitting}
                className="neo-button fun-hover-wobble"
                style={{
                  backgroundColor: isSubmitting ? "#E0E0E0" : isRankingBid ? "#FFDE82" : "#CCFF00",
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
                    <span>
                      {`ENCOLANDO EN LA RADIO (${Math.min(100, Math.round(uploadProgress))}%) 📡`}
                    </span>
                  </>
                ) : (
                  <>
                    {isRankingBid ? (
                      <Crown size={18} style={{ color: "#BA1A1A", fill: "#FFB000" }} />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    <span>
                      {isRankingBid
                        ? `👑 ENCOLAR + PUJAR AL #1 Y ANUNCIO CHAT (-${userIsAdmin ? "0" : effectiveCost.toLocaleString()} C-COINS)`
                        : `📻 ENCOLAR EN LA ROCOLA (-${userIsAdmin ? "0" : effectiveCost.toLocaleString()} C-COINS)`}
                    </span>
                  </>
                )}
              </button>
            );
          })()}
        </form>
      )}

      {/* MODAL RECARGA DE C-COINS */}
      <CoinRechargeModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
      />
    </NeoModal>
  );
};
