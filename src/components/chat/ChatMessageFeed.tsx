"use client";

import type { RefObject } from "react";
import { Ban, X } from "lucide-react";
import { ChatMessageContent } from "./ChatMessageContent";
import { getRoleBadgeColor, getRoleBadgeText } from "@/lib/chatUtils";
import type { ChatMessage } from "@/types/chat";

interface ChatMessageFeedProps {
  messageFeedRef: RefObject<HTMLDivElement | null>;
  chatMessages: ChatMessage[];
  currentUserName: string;
  bannedUsers: Set<string>;
  deletedMessageIds: Set<number>;
  hasModPrivileges: boolean;
  onDeleteMessage: (id: number) => void;
  onBanUser: (senderName: string) => void;
}

export function ChatMessageFeed({
  messageFeedRef,
  chatMessages,
  currentUserName,
  bannedUsers,
  deletedMessageIds,
  hasModPrivileges,
  onDeleteMessage,
  onBanUser,
}: ChatMessageFeedProps) {
  return (
    <div
      ref={messageFeedRef}
      className="neo-card"
      style={{
        flex: 1,
        backgroundColor: "var(--background)",
        color: "var(--on-background)",
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
          const isMyMsg = msg.senderName.toUpperCase() === currentUserName.toUpperCase();
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
                    ? "var(--primary-container)"
                    : isBanned || isDeleted
                      ? "rgba(186,26,26,0.14)"
                      : "var(--card-bg)",
                  color: isMyMsg ? "var(--on-primary-container)" : "var(--on-background)",
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
                      <span
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 900,
                          color: isMyMsg ? "var(--on-primary-container)" : "var(--primary)",
                        }}
                      >
                        {msg.senderName.toUpperCase()}
                      </span>

                      {hasModPrivileges && !isMyMsg && !isDeleted && !isBanned && (
                        <div style={{ display: "flex", gap: "2px" }}>
                          <button
                            onClick={() => onDeleteMessage(msg.id)}
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
                            onClick={() => onBanUser(msg.senderName)}
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
                            <Ban size={8} style={{ color: "var(--on-primary)" }} />
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
                      lineHeight: "1.1rem",
                      wordBreak: "break-word",
                      margin: 0,
                      color:
                        isBanned || isDeleted
                          ? "#F87171"
                          : isMyMsg
                            ? "var(--on-primary-container)"
                            : "var(--on-background)",
                      fontStyle: isBanned || isDeleted ? "italic" : "normal",
                    }}
                  >
                    {isBanned ? (
                      "⚠️ [USUARIO BANEADO DEL CHAT]"
                    ) : isDeleted ? (
                      "🗑️ [Mensaje borrado por moderación]"
                    ) : (
                      <ChatMessageContent text={msg.messageText} />
                    )}
                  </p>

                  {/* Playable Voice Greeting Audio Bubble */}
                  {msg.voiceAudioUrl && !isDeleted && !isBanned && (
                    <div
                      style={{
                        marginTop: "6px",
                        padding: "6px 8px",
                        backgroundColor: "#FFFBE5",
                        border: "1.5px solid var(--primary)",
                        boxShadow: "2px 2px 0px var(--primary)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "0.58rem", fontWeight: 900, color: "#BA1A1A" }}>
                          📻 SALUDO DE VOZ AL AIRE:
                        </span>
                      </div>
                      <audio
                        src={msg.voiceAudioUrl}
                        controls
                        style={{
                          width: "100%",
                          height: "28px",
                          borderRadius: "0px",
                          outline: "none",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
