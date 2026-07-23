import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useAudio } from "@/hooks/useAudio";
import { Send, User, Ban, X } from "lucide-react";

interface ChatSidebarProps {
  onClose: () => void;
}

export const ChatSidebar = ({ onClose }: ChatSidebarProps) => {
  const {
    chatMessages,
    sendChatMessage,
    bannedWords,
    bannedUsers,
    deletedMessageIds,
    isSlowMode,
    isEmoteOnly,
    isLinksAllowed,
    isCurrentUserBanned,
    isModPanelVisible,
    setModPanelVisible,
    toggleSlowMode,
    toggleEmoteOnly,
    toggleLinksAllowed,
    addBannedWord,
    removeBannedWord,
    banUser,
    unbanUser,
    deleteMessage,
    clearChat,
    userProfile,
    listenersCount,
    isAuthenticated,
    signInWithGoogle,
  } = useAudio();

  const [typedMessage, setTypedMessage] = useState("");
  const [newBannedWord, setNewBannedWord] = useState("");
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const messageFeedRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom when new messages arrive
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

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasModPrivileges =
    userProfile.role.includes("STREAMER") ||
    userProfile.role.includes("MOD") ||
    userProfile.role.includes("ADMIN");

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

  return (
    <div className="chat-sidebar-container">
      {/* A. HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "4px solid var(--primary)",
          backgroundColor: "var(--background)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", backgroundColor: "#BA1A1A", borderRadius: "50%" }}></div>
          <span style={{ fontSize: "0.8rem", fontWeight: 900, textTransform: "uppercase" }}>
            CHAT EN VIVO
          </span>
          <div
            style={{
              backgroundColor: "var(--primary)",
              padding: "1px 6px",
              display: "flex",
              alignItems: "center",
              gap: "2px",
              fontSize: "0.6rem",
              color: "var(--on-primary)",
              fontWeight: 900,
            }}
          >
            <User size={10} style={{ color: "var(--on-primary)", fill: "var(--on-primary)" }} />
            {listenersCount}
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {hasModPrivileges && (
            <button
              onClick={() => setModPanelVisible(!isModPanelVisible)}
              style={{
                backgroundColor: "var(--primary-container)",
                border: "1.5px solid var(--primary)",
                padding: "4px 8px",
                fontSize: "0.6rem",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              🛡️ {isModPanelVisible ? "OCULTAR MOD" : "MOD"}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              border: "1.5px solid var(--primary)",
              padding: "4px 8px",
              fontSize: "0.6rem",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* B. CONTENT WRAPPER */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "12px 12px 0 12px",
          gap: "12px",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* C. MODERATOR SETTINGS PANEL */}
        {hasModPrivileges && isModPanelVisible && (
          <div
            className="neo-card"
            style={{
              backgroundColor: "#FFFBE5",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "0.65rem",
              boxShadow: "3px 3px 0px var(--primary)",
              border: "2px solid var(--primary)",
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >

            <div>
              <span style={{ fontWeight: 900, display: "block", marginBottom: "4px" }}>
                ⚙️ AJUSTES DE CHAT:
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={toggleSlowMode}
                  style={{
                    flex: 1,
                    padding: "4px 2px",
                    backgroundColor: isSlowMode ? "#BA1A1A" : "white",
                    color: isSlowMode ? "white" : "black",
                    border: "1px solid var(--primary)",
                    fontWeight: "bold",
                    fontSize: "0.55rem",
                    cursor: "pointer",
                  }}
                >
                  LENTO [{isSlowMode ? "ON" : "OFF"}]
                </button>

                <button
                  onClick={toggleEmoteOnly}
                  style={{
                    flex: 1,
                    padding: "4px 2px",
                    backgroundColor: isEmoteOnly ? "#BA1A1A" : "white",
                    color: isEmoteOnly ? "white" : "black",
                    border: "1px solid var(--primary)",
                    fontWeight: "bold",
                    fontSize: "0.55rem",
                    cursor: "pointer",
                  }}
                >
                  EMOJIS [{isEmoteOnly ? "ON" : "OFF"}]
                </button>

                <button
                  onClick={toggleLinksAllowed}
                  style={{
                    flex: 1,
                    padding: "4px 2px",
                    backgroundColor: isLinksAllowed ? "var(--primary-container)" : "#BA1A1A",
                    color: isLinksAllowed ? "black" : "white",
                    border: "1px solid var(--primary)",
                    fontWeight: "bold",
                    fontSize: "0.55rem",
                    cursor: "pointer",
                  }}
                >
                  LINKS [{isLinksAllowed ? "SÍ" : "NO"}]
                </button>
              </div>
            </div>

            <button
              onClick={clearChat}
              style={{
                width: "100%",
                backgroundColor: "#BA1A1A",
                color: "white",
                border: "1.5px solid var(--primary)",
                padding: "4px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ⚠️ LIMPIAR CHAT (LOCAL)
            </button>

            <div>
              <span style={{ fontWeight: 900, display: "block", marginBottom: "4px" }}>
                🚫 PALABRAS PROHIBIDAS:
              </span>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "4px" }}>
                {bannedWords.map((word) => (
                  <span
                    key={word}
                    onClick={() => removeBannedWord(word)}
                    style={{
                      backgroundColor: "white",
                      border: "1px solid var(--primary)",
                      padding: "1px 4px",
                      borderRadius: "2px",
                      cursor: "pointer",
                      color: "#BA1A1A",
                      fontWeight: "bold",
                    }}
                  >
                    {word} ✕
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={newBannedWord}
                  onChange={(e) => setNewBannedWord(e.target.value)}
                  placeholder="Añadir..."
                  style={{ flex: 1, padding: "2px 4px", border: "1px solid var(--primary)", outline: "none", fontSize: "0.6rem" }}
                />
                <button
                  onClick={() => {
                    if (newBannedWord.trim()) {
                      addBannedWord(newBannedWord);
                      setNewBannedWord("");
                    }
                  }}
                  style={{
                    backgroundColor: "var(--primary-container)",
                    border: "1.5px solid var(--primary)",
                    padding: "2px 8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {bannedUsers.size > 0 && (
              <div>
                <span style={{ fontWeight: 900, display: "block", marginBottom: "4px" }}>
                  🔨 USUARIOS BANEADOS:
                </span>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {Array.from(bannedUsers).map((user) => (
                    <span
                      key={user}
                      onClick={() => unbanUser(user)}
                      style={{
                        backgroundColor: "#BA1A1A",
                        color: "white",
                        border: "1px solid var(--primary)",
                        padding: "1px 4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      {user} ✕
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* D. MESSAGE FEED */}
        <div
          ref={messageFeedRef}
          className="neo-card"
          style={{
            flex: 1,
            backgroundColor: "white",
            border: "2px solid var(--primary)",
            boxShadow: "3px 3px 0px var(--primary)",
            padding: "8px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            minHeight: "150px",
          }}
        >
          {chatMessages.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                fontSize: "0.75rem",
                fontWeight: "bold",
                opacity: 0.6,
                textAlign: "center",
                padding: "16px",
              }}
            >
              El canal está en silencio. Sé el primero en mandar un mensaje.
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isMyMsg = msg.senderName.toUpperCase() === userProfile.name.toUpperCase();
              const upperSender = msg.senderName.toUpperCase();
              const isBanned = bannedUsers.has(upperSender);
              const isDeleted = msg.isDeleted || deletedMessageIds.has(msg.id);

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: isMyMsg ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    className="neo-card"
                    style={{
                      maxWidth: "92%",
                      boxShadow: "2px 2px 0px var(--primary)",
                      border: "2px solid var(--primary)",
                      padding: "8px",
                      transform: `rotate(${isMyMsg ? 0.5 : -0.8}deg)`,
                      backgroundColor: isMyMsg
                        ? "#E8FCDF"
                        : isBanned || isDeleted
                        ? "#FFFFEEEE"
                        : "#F7F7F7",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "2px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "var(--primary)" }}>
                            {msg.senderName.toUpperCase()}
                          </span>

                          {hasModPrivileges && !isMyMsg && !isDeleted && !isBanned && (
                            <div style={{ display: "flex", gap: "2px" }}>
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "50%",
                                  backgroundColor: "#BA1A1A",
                                  border: "1px solid var(--primary)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                              >
                                <X size={8} style={{ color: "white" }} />
                              </button>
                              <button
                                onClick={() => banUser(msg.senderName)}
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "50%",
                                  backgroundColor: "var(--primary)",
                                  border: "1px solid var(--primary-container)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                              >
                                <Ban size={8} style={{ color: "var(--primary-container)" }} />
                              </button>
                            </div>
                          )}
                        </div>

                        {getRoleBadgeText(msg.senderRole) !== "OYENTE" && (
                          <span
                            style={{
                              backgroundColor: getRoleBadgeColor(msg.senderRole),
                              border: "1px solid var(--primary)",
                              padding: "1px 4px",
                              fontSize: "0.55rem",
                              fontWeight: "black",
                              color: "white",
                            }}
                          >
                            {getRoleBadgeText(msg.senderRole)}
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: isBanned || isDeleted ? "bold" : "normal",
                          color: isBanned || isDeleted ? "#BA1A1A" : "var(--primary)",
                          wordBreak: "break-word",
                        }}
                      >
                        {isBanned
                          ? "⚠️ [USUARIO BANEADO DEL CHAT]"
                          : isDeleted
                          ? "🗑️ [Mensaje borrado por moderación]"
                          : msg.messageText}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* E. CHAT TEXT INPUT */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          padding: "12px",
          borderTop: "3.5px solid var(--primary)",
          backgroundColor: "var(--background)",
          position: "relative",
          zIndex: 5,
        }}
      >
          {!isAuthenticated ? (
            <button
              onClick={signInWithGoogle}
              className="neo-button fun-hover-wobble"
              style={{
                width: "100%",
                backgroundColor: "var(--primary-container)",
                padding: "10px",
                textAlign: "center",
                color: "var(--primary)",
                fontWeight: 900,
                fontSize: "0.75rem",
                boxShadow: "3px 3px 0px var(--primary)",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              🔑 INICIAR SESIÓN CON GOOGLE PARA CHATEAR
            </button>
          ) : isCurrentUserBanned ? (
            <div
              style={{
                width: "100%",
                backgroundColor: "#BA1A1A",
                padding: "8px",
                textAlign: "center",
                color: "white",
                fontWeight: 900,
                fontSize: "0.7rem",
                border: "2px solid var(--primary)",
              }}
            >
              ESTÁS BANEADO DEL CHAT
            </div>
          ) : (
            <>
              <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
                <textarea
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value.slice(0, 150))}
                  onKeyDown={handleKeyPress}
                  onFocus={() => setIsChatInputFocused(true)}
                  onBlur={() => setIsChatInputFocused(false)}
                  maxLength={150}
                  placeholder="Escribe en la sintonía..."
                  style={{
                    width: "100%",
                    height: "36px",
                    minHeight: "36px",
                    maxHeight: "80px",
                    padding: "6px 8px 6px 8px",
                    paddingRight: "45px",
                    border: isChatInputFocused
                      ? "2.5px solid var(--primary)"
                      : "2px solid var(--primary)",
                    outline: "none",
                    fontSize: "0.7rem",
                    resize: "none",
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
                <span
                  style={{
                    position: "absolute",
                    bottom: "4px",
                    right: "6px",
                    fontSize: "0.55rem",
                    fontWeight: 900,
                    color: typedMessage.length >= 135 ? "#BA1A1A" : "gray",
                    pointerEvents: "none",
                    opacity: typedMessage.length > 0 ? 0.7 : 0,
                    transition: "opacity 0.2s, color 0.2s",
                    fontFamily: "monospace",
                  }}
                >
                  {typedMessage.length}/150
                </span>
              </div>

              <button
                onClick={handleSend}
                className="neo-button"
                style={{
                  height: "36px",
                  padding: "0 12px",
                  backgroundColor: "var(--primary-container)",
                  boxShadow: "2px 2px 0px var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Send size={12} />
              </button>
            </>
          )}
      </div>
    </div>
  );
};
