import { useRef, useState, useEffect, MouseEvent, TouchEvent, KeyboardEvent } from "react";
import { useAudio } from "@/context/AudioContext";
import { Play, Pause, Volume2, VolumeX, FastForward, Send, User } from "lucide-react";

interface PlayerViewProps {
  onClose: () => void;
}

export const PlayerView = ({ onClose }: PlayerViewProps) => {
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
  const [typedMessage, setTypedMessage] = useState("");
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const messageFeedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageFeedRef.current) {
      messageFeedRef.current.scrollTop = messageFeedRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = () => {
    if (typedMessage.trim()) {
      sendChatMessage(typedMessage);
      setTypedMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const r = role.toUpperCase();
    if (r.includes("ADMIN")) return "#FFB000";
    if (r.includes("STREAMER") || r.includes("BROADCASTER")) return "#BA1A1A";
    if (r.includes("MOD") || r.includes("MODERADOR")) return "#E87A00";
    if (r.includes("VIP")) return "#008B8B";
    if (r.includes("BOT")) return "#1A1D10";
    return "#444933";
  };

  const getRoleBadgeText = (role: string) => {
    const r = role.toUpperCase();
    if (r.includes("ADMIN")) return "👑 ADMIN";
    if (r.includes("STREAMER") || r.includes("BROADCASTER")) return "🎙️ STREAMER";
    if (r.includes("MOD") || r.includes("MODERADOR")) return "🛡️ MOD";
    if (r.includes("VIP")) return "⭐ VIP";
    if (r.includes("BOT")) return "🤖 BOT";
    return "OYENTE";
  };

  // Format time MM:SS or negative timeshift offset
  const formatTime = (secs: number) => {
    if (secs < 0) return secs.toString();
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatProgressTime = () => {
    if (currentTrack.isLive) {
      if (progress >= 0.95) {
        return "LIVE";
      } else {
        const offsetSecs = Math.round((progress - 1) * totalTime);
        return formatTime(offsetSecs);
      }
    }
    return formatTime(currentTime);
  };

  const formatTotalTime = () => {
    if (currentTrack.isLive) return "LIVE";
    return formatTime(totalTime);
  };

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
        justifyContent: "center",
        padding: "40px 24px",
        overflow: "hidden",
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

      {/* SPLIT CONTAINER FOR SIDE-BY-SIDE VIEW */}
      <div
        className="player-view-split-container"
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
          className="neo-card"
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
          {/* Stickers overlays */}
          <div
            style={{
              position: "absolute",
              top: "-20px",
              left: "20px",
              backgroundColor: "var(--primary-container)",
              color: "var(--primary)",
              padding: "4px 10px",
              fontSize: "0.65rem",
              fontWeight: "black",
              border: "2px solid var(--primary)",
              transform: "rotate(-8deg)",
              boxShadow: "2px 2px 0px var(--primary)",
            }}
          >
            ★ REPRODUCTOR PUNK ★
          </div>

          {/* 1. SPINNING VINYL RECORD ART */}
          <div style={{ position: "relative", width: "220px", height: "220px", marginTop: "8px" }}>
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
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    border: "4px solid #111",
                    overflow: "hidden",
                    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                  }}
                >
                  <img
                    src={currentTrack.imageUrl}
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "100%" }}>
            <h2
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
          <div style={{ display: "flex", width: "100%", alignItems: "center", gap: "10px", padding: "0 4px" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: "bold", width: "35px", textAlign: "right" }}>
              {formatProgressTime()}
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
              {formatTotalTime()}
            </span>
          </div>

          {/* 4. CONTROL BUTTONS */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", width: "100%" }}>
            {/* Mute toggle button */}
            <button
              onClick={toggleMute}
              className="neo-button-circular"
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
              className="neo-button-circular"
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
              className="neo-button-circular"
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
                padding: "12px 16px",
                borderBottom: "3px solid var(--primary)",
                backgroundColor: "var(--primary-container)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", backgroundColor: "#BA1A1A", borderRadius: "50%" }}></div>
                <span style={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", color: "var(--primary)" }}>
                  CHAT EN VIVO
                </span>
                <div
                  style={{
                    backgroundColor: "var(--primary)",
                    padding: "1px 6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    fontSize: "0.55rem",
                    color: "var(--on-primary)",
                    fontWeight: 900,
                  }}
                >
                  <User size={8} style={{ color: "var(--on-primary)", fill: "var(--on-primary)" }} />
                  {listenersCount}
                </div>
              </div>
            </div>

            {/* Chat Feed */}
            <div
              ref={messageFeedRef}
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "var(--background)",
              }}
            >
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", opacity: 0.5 }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: "bold" }}>EL SILENCIO DE LAS ONDAS...</p>
                  <p style={{ fontSize: "0.6rem", marginTop: "4px" }}>Haz algo de ruido.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isBanned = bannedUsers.has(msg.senderName.toUpperCase());
                  const isDeleted = deletedMessageIds.has(msg.id);
                  return (
                    <div
                      key={msg.id}
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1.5px solid var(--primary)",
                        backgroundColor: "var(--card-bg)",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              backgroundColor: getRoleBadgeColor(msg.senderRole),
                              color: "white",
                              fontSize: "0.5rem",
                              fontWeight: "black",
                              padding: "1px 4px",
                            }}
                          >
                            {getRoleBadgeText(msg.senderRole)}
                          </span>
                          <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase" }}>
                            {msg.senderName}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "0.65rem",
                            marginTop: "2px",
                            fontWeight: isBanned || isDeleted ? "bold" : "normal",
                            color: isBanned || isDeleted ? "#BA1A1A" : "var(--primary)",
                            wordBreak: "break-word",
                          }}
                        >
                          {isBanned
                            ? "⚠️ [USUARIO BANEADO]"
                            : isDeleted
                              ? "🗑️ [Mensaje borrado]"
                              : msg.messageText}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <div
              style={{
                padding: "12px",
                borderTop: "3px solid var(--primary)",
                backgroundColor: "var(--card-bg)",
              }}
            >
              {!isAuthenticated ? (
                <button
                  onClick={signInWithGoogle}
                  className="neo-button"
                  style={{
                    width: "100%",
                    backgroundColor: "var(--primary-container)",
                    padding: "8px",
                    textAlign: "center",
                    color: "var(--primary)",
                    fontWeight: 900,
                    fontSize: "0.65rem",
                    boxShadow: "2px 2px 0px var(--primary)",
                    cursor: "pointer",
                  }}
                >
                  🔑 GOOGLE SIGN-IN PARA CHATEAR
                </button>
              ) : isCurrentUserBanned ? (
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "#BA1A1A",
                    padding: "6px",
                    textAlign: "center",
                    color: "white",
                    fontWeight: 900,
                    fontSize: "0.65rem",
                    border: "2px solid var(--primary)",
                  }}
                >
                  ESTÁS BANEADO
                </div>
              ) : (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    className="chat-input-player"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value.slice(0, 100))}
                    onKeyDown={handleKeyPress}
                    onFocus={() => setIsChatInputFocused(true)}
                    onBlur={() => setIsChatInputFocused(false)}
                    maxLength={100}
                    placeholder="Escribe algo..."
                    style={{
                      flex: 1,
                      height: "32px",
                      padding: "4px 8px 4px 12px",
                      border: isChatInputFocused
                        ? "2.5px solid var(--primary)"
                        : "2px solid var(--primary)",
                      outline: "none",
                      fontSize: "0.7rem",
                      fontFamily: "inherit",
                      backgroundColor: "#FFFFFF",
                      color: "#111111",
                      caretColor: "#111111",
                      cursor: "text",
                      boxShadow: isChatInputFocused
                        ? "0 0 0 2px var(--primary-container), 2px 2px 0px var(--primary)"
                        : "none",
                      transition: "box-shadow 0.15s ease, border 0.15s ease",
                    }}
                  />
                  <button
                    onClick={handleSend}
                    className="neo-button"
                    style={{
                      height: "32px",
                      padding: "0 10px",
                      backgroundColor: "var(--primary-container)",
                      boxShadow: "2px 2px 0px var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Send size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PlayerView;
