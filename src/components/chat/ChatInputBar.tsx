"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { EmojiPicker } from "../EmojiPicker";
import Image from "next/image";
import { MASCOT_REACTIONS } from "@/lib/mascotEmojis";
import { RichChatInput, RichChatInputRef } from "./RichChatInput";

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
  placeholder = "Escribe en el chat...",
  maxLength = 100,
  extraActions,
}: ChatInputBarProps) => {
  const [typedMessage, setTypedMessage] = useState("");
  const richInputRef = useRef<RichChatInputRef>(null);

  const handleSend = () => {
    const text = richInputRef.current?.getText() || typedMessage;
    const trimmed = text.trim();
    if (trimmed) {
      onSendMessage(trimmed);
      richInputRef.current?.clear();
      setTypedMessage("");
    }
  };

  const addReaction = (emoji: string) => {
    richInputRef.current?.insertEmoji(emoji);
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
            {MASCOT_REACTIONS.map((emoji) => (
              <button
                key={emoji.id}
                type="button"
                onClick={() => addReaction(emoji.token)}
                style={{
                  border: "1.5px solid var(--primary)",
                  borderRadius: "3px",
                  width: 28,
                  height: 28,
                  padding: 0,
                  cursor: "pointer",
                  backgroundColor: "transparent",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={emoji.label}
                aria-label={emoji.label}
              >
                <Image src={emoji.src} alt="" width={20} height={20} unoptimized style={{ imageRendering: "auto" }} />
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {extraActions}

            <RichChatInput
              ref={richInputRef}
              placeholder={placeholder}
              maxLength={maxLength}
              onSend={onSendMessage}
              onTextChange={setTypedMessage}
              showCounter={false}
              minHeight={32}
              maxHeight={60}
            />

            <EmojiPicker
              onSelectEmoji={(emoji) => addReaction(emoji)}
              dropDirection="up"
              buttonSize={20}
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
                border: "2px solid var(--primary)",
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
