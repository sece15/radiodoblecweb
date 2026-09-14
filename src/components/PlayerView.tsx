import { useRef, useState, MouseEvent, TouchEvent } from "react";
import { useAudio } from "@/hooks/useAudio";
import { Play, Pause, Volume2, VolumeX, FastForward, User } from "lucide-react";
import { ChatMessageList } from "./chat/ChatMessageList";
import { ChatInputBar } from "./chat/ChatInputBar";
import { RadioImage } from "./common/RadioImage";
import { formatProgressTime, formatTotalTime } from "@/lib/audioFormatters";

interface PlayerViewProps {
  onClose: () => void;
  initialTab?: "player" | "chat";
}

export const PlayerView = ({ onClose, initialTab = "player" }: PlayerViewProps) => {
  const {
    isPlaying,
    currentTrack,
    progress,
    currentTime,
    totalTime,
    volume,
    isMuted,
    togglePlayPause,
    toggleMute,
    seekToProgress,
    seekToLiveEdge,
    chatMessages,
    sendChatMessage,
    listenersCount,
    isAuthenticated,
    signInWithGoogle,
    isCurrentUserBanned,
    bannedUsers,
    deletedMessageIds,
  } = useAudio();

  const progressTrackRef = useRef<HTMLDivElement>(null);
  const [mobileTab, setMobileTab] = useState<"player" | "chat">(initialTab);

  const progressTime = formatProgressTime(currentTrack.isLive, progress, currentTime, totalTime);
  const totalTimeStr = formatTotalTime(currentTrack.isLive, totalTime);

  // Click & Drag Progress Calculator
  const handleProgressAction = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if (!progressTrackRef.current) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    seekToProgress(newProgress);
  };

  return (
    <div
      className="player-view-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "var(--background)",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* BACKGROUND DECORATIONS (PUNK DRIPS & MELTING SMILEYS) */}
      <img
        src="/dripping_paint.svg"
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "min(240px, 40vw)",
          height: "auto",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <img
        src="/dripping_paint.svg"
        alt=""
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "min(240px, 40vw)",
          height: "auto",
          zIndex: 1,
          pointerEvents: "none",
          transform: "rotate(180deg)",
        }}
      />
      <img
        src="/melting_smiley.svg"
        alt=""
        style={{
          position: "absolute",
          top: "140px",
          left: "60px",
          width: "min(95px, 20vw)",
          height: "auto",
          zIndex: 1,
          pointerEvents: "none",
          transform: "rotate(12deg)",
        }}
      />
      <img
        src="/melting_smiley.svg"
        alt=""
        style={{
          position: "absolute",
          bottom: "80px",
          left: "40px",
          width: "min(90px, 18vw)",
          height: "auto",
          zIndex: 1,
          pointerEvents: "none",
          transform: "rotate(-15deg)",
        }}
      />
      <img
        src="/melting_smiley.svg"
        alt=""
        style={{
          position: "absolute",
          bottom: "120px",
          right: "60px",
          width: "min(95px, 20vw)",
          height: "auto",
          zIndex: 1,
          pointerEvents: "none",
          transform: "rotate(15deg)",
        }}
      />

      {/* A. CLOSE BUTTON */}
      <button
        onClick={onClose}
        className="player-close-button"
        style={{
          position: "absolute",
          top: "24px",
          right: "24px",
          backgroundColor: "var(--primary)",
          color: "var(--on-primary)",
          border: "3px solid var(--primary)",
          boxShadow: "3px 3px 0px var(--primary-container)",
          padding: "8px 16px",
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "0.85rem",
          fontWeight: 900,
          cursor: "pointer",
          transform: "rotate(2deg)",
          zIndex: 10,
        }}
      >
        CERRAR X
      </button>

      {/* MOBILE TABS (ONLY VISIBLE ON PHONES / TABLETS) */}
      <div className="player-mobile-tabs">
        <button
          onClick={() => setMobileTab("player")}
          className="neo-button"
          style={{
            flex: 1,
            padding: "8px 10px",
            fontSize: "0.72rem",
            backgroundColor: mobileTab === "player" ? "var(--primary)" : "var(--card-bg)",
            color: mobileTab === "player" ? "var(--on-primary)" : "var(--primary)",
            border: "3px solid var(--primary)",
            boxShadow: mobileTab === "player" ? "1px 1px 0px var(--primary)" : "3px 3px 0px var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            fontWeight: 900,
          }}
        >
          <span>💿</span>
          <span>REPRODUCTOR</span>
        </button>

        <button
          onClick={() => setMobileTab("chat")}
          className="neo-button"
          style={{
            flex: 1,
            padding: "8px 10px",
            fontSize: "0.72rem",
            backgroundColor: mobileTab === "chat" ? "var(--primary-container)" : "var(--card-bg)",
            color: "var(--primary)",
            border: "3px solid var(--primary)",
            boxShadow: mobileTab === "chat" ? "1px 1px 0px var(--primary)" : "3px 3px 0px var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            fontWeight: 900,
          }}
        >
          <span style={{ display: "inline-flex", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#BA1A1A" }} className="pulse-dot" />
          <span>CHAT EN VIVO</span>
        </button>
      </div>

      {/* SPLIT CONTAINER FOR SIDE-BY-SIDE VIEW */}
      <div
        className={`player-view-split-container tab-${mobileTab}`}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: "40px",
          width: "100%",
          maxWidth: "1000px",
          zIndex: 5,
        }}
      >
        {/* B. LADO IZQUIERDO: REPRODUCTOR (CUADRO DE AHORA) */}
        <div
          className="neo-card player-view-deck-panel"
          style={{
            backgroundColor: "var(--card-bg)",
            border: "4px solid var(--primary)",
            boxShadow: "8px 8px 0px var(--primary)",
            padding: "24px 32px 32px 32px",
            width: "100%",
            maxWidth: "430px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            position: "relative",
            transform: "rotate(-1deg)",
            flexShrink: 0,
          }}
        >
          {/* 1. SPINNING VINYL RECORD ART */}
          <div className="player-vinyl-disc-container" style={{ position: "relative", width: "220px", height: "220px", marginTop: "8px" }}>
            {/* Vinyl background disc */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                backgroundColor: "#111111",
                border: "8px double #333333",
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.8), 5px 5px 15px rgba(0,0,0,0.3)",
                animation: isPlaying ? "spin 6s linear infinite" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Vinyl grooves */}
              <div
                style={{
                  width: "80%",
                  height: "80%",
                  borderRadius: "50%",
                  border: "1px solid #222",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Album art cover at the center */}
                <div
                  className="player-vinyl-album-art"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    border: "4px solid #111",
                    overflow: "hidden",
                    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                  }}
                >
                  <RadioImage
                    src={currentTrack.imageUrl}
                    fallbackSrc="/RADIO.png"
                    alt="Carátula"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              </div>
              {/* Center spindle hole */}
              <div
                style={{
                  position: "absolute",
                  width: "12px",
                  height: "12px",
                  backgroundColor: "var(--background)",
                  borderRadius: "50%",
                  border: "2px solid #000",
                  zIndex: 5,
                }}
              ></div>
            </div>

            {/* Status sticker badge */}
            <div
              className="pulse-dot"
              style={{
                position: "absolute",
                top: "-10px",
                right: "-10px",
                backgroundColor: "var(--primary-container)",
                border: "2.5px solid var(--primary)",
                padding: "6px 12px",
                fontSize: "0.65rem",
                fontWeight: 900,
                color: "var(--primary)",
                transform: "rotate(5deg)",
                boxShadow: "2px 2px 0px var(--primary)",
              }}
            >
              {isPlaying ? "ON AIR 📡" : "MUTED ✕"}
            </div>
          </div>

          {/* 2. TRACK METADATA */}
          <div className="player-track-metadata" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "100%" }}>
            <h2
              className="player-track-title"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--on-primary)",
                fontSize: "1.1rem",
                fontWeight: 900,
                padding: "6px 16px",
                textAlign: "center",
                textTransform: "uppercase",
                width: "max-content",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transform: "rotate(1deg)",
              }}
            >
              {currentTrack.title}
            </h2>
            <p
              className="player-track-artist"
              style={{
                fontSize: "0.8rem",
                fontWeight: 900,
                color: "var(--secondary)",
                textAlign: "center",
              }}
            >
              {currentTrack.album || currentTrack.artist}
            </p>
          </div>

          {/* 3. SEEK PROGRESS BAR */}
          <div className="player-seek-container" style={{ display: "flex", width: "100%", alignItems: "center", gap: "10px", padding: "0 4px" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: "bold", width: "35px", textAlign: "right" }}>
              {progressTime}
            </span>

            <div
              ref={progressTrackRef}
              onClick={handleProgressAction}
              className="neo-slider-track"
              style={{ flex: 1 }}
            >
              <div className="neo-slider-fill" style={{ width: `${progress * 100}%` }}></div>
              <div className="neo-slider-thumb" style={{ left: `calc(${progress * 100}% - 10px)` }}></div>
            </div>

            <span style={{ fontSize: "0.65rem", fontWeight: "bold", width: "35px", textAlign: "left" }}>
              {totalTimeStr}
            </span>
          </div>

          {/* 4. CONTROL BUTTONS */}
          <div className="player-controls-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", width: "100%" }}>
            {/* Mute toggle button */}
            <button
              onClick={toggleMute}
              className="neo-button-circular player-control-btn-secondary"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "var(--card-bg)",
                border: "3.5px solid var(--primary)",
                boxShadow: "3px 3px 0px var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Large circular Play/Pause button */}
            <button
              onClick={togglePlayPause}
              className="neo-button-circular player-control-btn-main"
              style={{
                width: "72px",
                height: "72px",
                backgroundColor: "var(--primary-container)",
                border: "3.5px solid var(--primary)",
                boxShadow: "5px 5px 0px var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {isPlaying ? (
                <Pause size={28} style={{ fill: "var(--primary)", color: "var(--primary)" }} />
              ) : (
                <Play size={28} style={{ fill: "var(--primary)", color: "var(--primary)", marginLeft: "4px" }} />
              )}
            </button>

            {/* Catch-up Live button */}
            <button
              onClick={seekToLiveEdge}
              className="neo-button-circular player-control-btn-secondary"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "var(--card-bg)",
                border: "3.5px solid var(--primary)",
                boxShadow: "3px 3px 0px var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              disabled={!currentTrack.isLive}
            >
              <FastForward size={20} />
            </button>
          </div>

          {/* 5. BOTÓN ULTRA LLAMATIVO PARA CHAT EN MÓVIL */}
          <div className="player-mobile-chat-cta-wrapper">
            <button
              onClick={() => setMobileTab("chat")}
              className="player-mobile-chat-cta"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div
                  className="player-mobile-chat-cta-badge"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--on-primary)",
                    fontSize: "0.55rem",
                    fontWeight: 900,
                    padding: "2px 6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    letterSpacing: "0.05em",
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#FF0D43" }} className="pulse-dot" />
                  SALA EN DIRECTO
                </div>
                <div style={{ fontSize: "0.6rem", fontWeight: 900, color: "var(--primary)" }}>
                  👥 {listenersCount} OYENTES
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="player-mobile-chat-cta-icon" style={{ fontSize: "1.4rem" }}>💬</span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="player-mobile-chat-cta-title" style={{ fontSize: "0.95rem", fontWeight: 900, textTransform: "uppercase", lineHeight: "1.1rem" }}>
                      ¡ENTRAR AL CHAT EN VIVO!
                    </span>
                    <span className="player-mobile-chat-cta-sub" style={{ fontSize: "0.65rem", fontWeight: "bold", opacity: 0.85, marginTop: "2px" }}>
                      Envía saludos, pide tus temas y habla con la comunidad
                    </span>
                  </div>
                </div>
                <div
                  className="player-mobile-chat-cta-arrow"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--on-primary)",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    flexShrink: 0,
                    boxShadow: "2px 2px 0px var(--primary)",
                  }}
                >
                  👉
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* C. LADO DERECHO: CHAT EN VIVO */}
        {/* Outer frame: rotated for the tilted card look */}
        <div
          className="neo-card player-view-chat-panel"
          style={{
            border: "4px solid var(--primary)",
            boxShadow: "8px 8px 0px var(--primary)",
            width: "100%",
            maxWidth: "380px",
            height: "510px",
            transform: "rotate(1deg)",
            zIndex: 5,
            overflow: "visible",
            backgroundColor: "transparent",
          }}
        >
          {/* Inner wrapper: counter-rotates so content is axis-aligned — fixes caret clipping */}
          <div
            style={{
              transform: "rotate(-1deg)",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              backgroundColor: "var(--background)",
            }}
          >
            {/* Chat Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderBottom: "3px solid var(--primary)",
                backgroundColor: "var(--primary-container)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Mobile Back to Vinyl Button */}
                <button
                  onClick={() => setMobileTab("player")}
                  className="mobile-only-flex neo-button"
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.65rem",
                    backgroundColor: "var(--card-bg)",
                    color: "var(--primary)",
                    border: "2px solid var(--primary)",
                    boxShadow: "2px 2px 0px var(--primary)",
                    cursor: "pointer",
                  }}
                  title="Volver a ver el vinilo"
                >
                  💿 VOLVER
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", backgroundColor: "#BA1A1A", borderRadius: "50%" }} className="pulse-dot"></div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", color: "var(--primary)" }}>
                    CHAT EN VIVO
                  </span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "var(--primary)",
                  padding: "3px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.6rem",
                  color: "var(--on-primary)",
                  fontWeight: 900,
                  boxShadow: "1.5px 1.5px 0px var(--primary-container)",
                }}
              >
                <User size={10} style={{ color: "var(--on-primary)", fill: "var(--on-primary)" }} />
                <span>{listenersCount} OYENTES</span>
              </div>
            </div>

            {/* Mobile Mini Now Playing Bar */}
            <div
              className="mobile-only-flex"
              style={{
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 12px",
                backgroundColor: "var(--card-bg)",
                borderBottom: "2px solid var(--primary)",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: "1.5px solid var(--primary)",
                    overflow: "hidden",
                    flexShrink: 0,
                    animation: isPlaying ? "spin 5s linear infinite" : "none",
                  }}
                >
                  <img
                    src={currentTrack.imageUrl || "/RADIO.png"}
                    alt=""
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/RADIO.png";
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: "var(--primary)",
                    }}
                  >
                    {currentTrack.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.55rem",
                      fontWeight: "bold",
                      opacity: 0.7,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {currentTrack.artist}
                  </div>
                </div>
              </div>

              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-container)",
                  border: "2px solid var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: "1.5px 1.5px 0px var(--primary)",
                }}
                title={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? (
                  <Pause size={12} style={{ fill: "var(--primary)", color: "var(--primary)" }} />
                ) : (
                  <Play size={12} style={{ fill: "var(--primary)", color: "var(--primary)", marginLeft: "1px" }} />
                )}
              </button>
            </div>

            {/* Chat Feed */}
            <ChatMessageList
              messages={chatMessages}
              bannedUsers={bannedUsers}
              deletedMessageIds={deletedMessageIds}
            />

            {/* Chat Input */}
            <ChatInputBar
              onSendMessage={sendChatMessage}
              isAuthenticated={isAuthenticated}
              onSignInWithGoogle={signInWithGoogle}
              isCurrentUserBanned={isCurrentUserBanned}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default PlayerView;
