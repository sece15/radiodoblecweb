"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "@/types";
import { getRoleBadgeColor, getRoleBadgeText } from "@/lib/chatUtils";
import { Trash2, Ban } from "lucide-react";

interface ChatMessageListProps {
  messages: ChatMessage[];
  bannedUsers: Set<string>;
  deletedMessageIds: Set<number>;
  canModerate?: boolean;
  onDeleteMessage?: (id: number) => void;
  onBanUser?: (username: string) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  style?: React.CSSProperties;
}

export const ChatMessageList = ({
  messages,
  bannedUsers,
  deletedMessageIds,
  canModerate = false,
  onDeleteMessage,
  onBanUser,
  emptyTitle = "EL SILENCIO DE LAS ONDAS...",
  emptySubtitle = "Haz algo de ruido.",
  style,
}: ChatMessageListProps) => {
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={feedRef}
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--background)",
        ...style,
      }}
    >
      {messages.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", opacity: 0.5 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: "bold" }}>{emptyTitle}</p>
          <p style={{ fontSize: "0.6rem", marginTop: "4px" }}>{emptySubtitle}</p>
        </div>
      ) : (
        messages.map((msg) => {
          const isBanned = bannedUsers.has(msg.senderName.toUpperCase());
          const isDeleted = deletedMessageIds.has(msg.id);

          return (
            <div
              key={msg.id}
              style={{
                padding: "8px 12px",
                borderBottom: "1.5px solid var(--primary)",
                backgroundColor: "var(--card-bg)",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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

                  {/* Optional moderation actions */}
                  {canModerate && !isDeleted && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {onDeleteMessage && (
                        <button
                          onClick={() => onDeleteMessage(msg.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                          title="Borrar mensaje"
                          aria-label="Borrar mensaje"
                        >
                          <Trash2 size={11} color="var(--primary)" />
                        </button>
                      )}
                      {onBanUser && !isBanned && (
                        <button
                          onClick={() => onBanUser(msg.senderName)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                          title="Banear usuario"
                          aria-label="Banear usuario"
                        >
                          <Ban size={11} color="#BA1A1A" />
                        </button>
                      )}
                    </div>
                  )}
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
  );
};
