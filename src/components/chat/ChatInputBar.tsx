"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { EmojiPicker } from "../EmojiPicker";
import { CHAT_QUICK_REACTIONS } from "@/lib/chatUtils";

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  isAuthenticated: boolean;
  onSignInWithGoogle: () => void;
  isCurrentUserBanned?: boolean;
  placeholder?: string;
  maxLength?: number;
  extraActions?: React.ReactNode;
}

export const ChatInputBar = ({
  onSendMessage,
  isAuthenticated,
  onSignInWithGoogle,
  isCurrentUserBanned = false,
  placeholder = "Escribe algo...",
  maxLength = 100,
  extraActions,
}: ChatInputBarProps) => {
  const [typedMessage, setTypedMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    if (typedMessage.trim()) {
      onSendMessage(typedMessage);
      setTypedMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addReaction = (emoji: string) => {
    setTypedMessage((prev) => (prev + emoji).slice(0, maxLength));
  };

  return (
    <div
      style={{
        padding: "10px 12px",
        borderTop: "3px solid var(--primary)",
        backgroundColor: "var(--card-bg)",
      }}
    >
      {!isAuthenticated ? (
        <button
          onClick={onSignInWithGoogle}
          className="neo-button"
          style={{
            width: "100%",
            backgroundColor: "var(--primary-container)",
            padding: "8px",
            textAlign: "center",
            color: "var(--primary)",
            fontWeight: 900,
            fontSize: "0.68rem",
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
            fontSize: "0.68rem",
            border: "2px solid var(--primary)",
          }}
        >
          ESTÁS BANEADO DE LA SALA
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
          {/* Quick Reactions Bar */}
          <div style={{ display: "flex", gap: "4px", alignItems: "center", overflowX: "auto", paddingBottom: "2px" }}>
            <span style={{ fontSize: "0.55rem", fontWeight: 900, opacity: 0.7, flexShrink: 0 }}>REACCIÓN:</span>
            {CHAT_QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addReaction(emoji)}
                style={{
                  background: "none",
                  border: "1.5px solid var(--primary)",
                  borderRadius: "3px",
                  padding: "1px 4px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  backgroundColor: "var(--card-bg)",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                title={`Reaccionar con ${emoji}`}
                aria-label={`Reaccionar con ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {extraActions}

            <input
              type="text"
              className="chat-input-player"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value.slice(0, maxLength))}
              onKeyDown={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={maxLength}
              placeholder={placeholder}
              aria-label="Mensaje de chat"
              style={{
                flex: 1,
                height: "32px",
                padding: "4px 8px 4px 12px",
                border: isFocused
                  ? "2.5px solid var(--primary)"
                  : "2px solid var(--primary)",
                outline: "none",
                fontSize: "0.72rem",
                fontFamily: "inherit",
                backgroundColor: "#FFFFFF",
                color: "#111111",
                caretColor: "#111111",
                cursor: "text",
                boxShadow: isFocused
                  ? "0 0 0 2px var(--primary-container), 2px 2px 0px var(--primary)"
                  : "none",
                transition: "box-shadow 0.15s ease, border 0.15s ease",
              }}
            />
            <EmojiPicker
              onSelectEmoji={(emoji) => addReaction(emoji)}
              dropDirection="up"
              buttonSize={12}
            />
            <button
              onClick={handleSend}
              className="neo-button"
              aria-label="Enviar mensaje"
              title="Enviar mensaje"
              style={{
                height: "32px",
                padding: "0 10px",
                backgroundColor: "var(--primary-container)",
                boxShadow: "2px 2px 0px var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Send size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
