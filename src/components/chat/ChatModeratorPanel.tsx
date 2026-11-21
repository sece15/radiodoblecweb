"use client";

import { useState } from "react";
import type { VoiceGreeting } from "@/types/chat";

interface ChatModeratorPanelProps {
  pendingVoiceGreetings: VoiceGreeting[];
  isSlowMode: boolean;
  isEmoteOnly: boolean;
  isLinksAllowed: boolean;
  bannedWords: string[];
  bannedUsers: Set<string>;
  onApproveVoiceGreeting: (id: string) => void;
  onRejectVoiceGreeting: (id: string) => void;
  onToggleSlowMode: () => void;
  onToggleEmoteOnly: () => void;
  onToggleLinksAllowed: () => void;
  onClearChat: () => void;
  onAddBannedWord: (word: string) => void;
  onRemoveBannedWord: (word: string) => void;
  onUnbanUser: (user: string) => void;
}

export function ChatModeratorPanel({
  pendingVoiceGreetings,
  isSlowMode,
  isEmoteOnly,
  isLinksAllowed,
  bannedWords,
  bannedUsers,
  onApproveVoiceGreeting,
  onRejectVoiceGreeting,
  onToggleSlowMode,
  onToggleEmoteOnly,
  onToggleLinksAllowed,
  onClearChat,
  onAddBannedWord,
  onRemoveBannedWord,
  onUnbanUser,
}: ChatModeratorPanelProps) {
  const [newBannedWord, setNewBannedWord] = useState("");

  return (
    <div
      className="neo-card"
      style={{
        backgroundColor: "var(--card-bg)",
        color: "var(--on-background)",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        fontSize: "0.65rem",
        boxShadow: "3px 3px 0px var(--primary)",
        border: "2.5px solid var(--primary)",
        maxHeight: "260px",
        overflowY: "auto",
      }}
    >
      {/* COLA DE AUDIOS PENDIENTES DE CABINA */}
      <div style={{ borderBottom: "1.5px dashed var(--primary)", paddingBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <span style={{ fontWeight: 900, textTransform: "uppercase", color: "#BA1A1A" }}>
            🎙️ SALUDOS PENDIENTES DE CABINA ({pendingVoiceGreetings.length}):
          </span>
        </div>

        {pendingVoiceGreetings.length === 0 ? (
          <p style={{ opacity: 0.7, margin: "2px 0", fontSize: "0.6rem" }}>
            No hay saludos en cola de espera.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {pendingVoiceGreetings.map((greeting) => (
              <div
                key={greeting.id}
                style={{
                  backgroundColor: "var(--surface-container)",
                  color: "var(--on-background)",
                  border: "1.5px solid var(--primary)",
                  padding: "6px 8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 900, color: "var(--primary)" }}>
                    {greeting.senderName} ({greeting.durationSeconds}s)
                  </span>
                  <span style={{ fontSize: "0.55rem", opacity: 0.6 }}>
                    {new Date(greeting.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {greeting.transcript && (
                  <p style={{ fontSize: "0.58rem", opacity: 0.8, margin: 0, fontStyle: "italic" }}>
                    &quot;{greeting.transcript}&quot;
                  </p>
                )}

                <audio src={greeting.audioUrl} controls style={{ width: "100%", height: "24px" }} />

                <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                  <button
                    onClick={() => onApproveVoiceGreeting(greeting.id)}
                    className="neo-button"
                    style={{
                      flex: 1,
                      backgroundColor: "#CCFF00",
                      color: "#111",
                      padding: "3px 6px",
                      fontSize: "0.6rem",
                      fontWeight: 900,
                      border: "1px solid var(--primary)",
                      cursor: "pointer",
                    }}
                  >
                    APROBAR Y AL AIRE 📢
                  </button>
                  <button
                    onClick={() => onRejectVoiceGreeting(greeting.id)}
                    style={{
                      backgroundColor: "#BA1A1A",
                      color: "white",
                      padding: "3px 8px",
                      fontSize: "0.6rem",
                      fontWeight: 900,
                      border: "1px solid var(--primary)",
                      cursor: "pointer",
                    }}
                  >
                    RECHAZAR ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AJUSTES DE CHAT */}
      <div>
        <span style={{ fontWeight: 900, display: "block", marginBottom: "4px" }}>
          ⚙️ AJUSTES DE CHAT:
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={onToggleSlowMode}
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
            onClick={onToggleEmoteOnly}
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
            onClick={onToggleLinksAllowed}
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
        onClick={onClearChat}
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

      <p style={{ margin: "4px 0", fontSize: "0.65rem", lineHeight: "1rem" }}>
        El backend devuelve las monedas de los saludos pendientes retirados por moderación.
        Borrar un mensaje no retira un audio que ya entró a la cola.
      </p>

      {/* PALABRAS PROHIBIDAS */}
      <div>
        <span style={{ fontWeight: 900, display: "block", marginBottom: "4px" }}>
          🚫 PALABRAS PROHIBIDAS:
        </span>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "4px" }}>
          {bannedWords.map((word) => (
            <span
              key={word}
              onClick={() => onRemoveBannedWord(word)}
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
            style={{
              flex: 1,
              minWidth: 0,
              padding: "2px 4px",
              border: "1px solid var(--primary)",
              outline: "none",
              fontSize: "0.6rem",
            }}
          />
          <button
            onClick={() => {
              if (newBannedWord.trim()) {
                onAddBannedWord(newBannedWord);
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

      {/* USUARIOS BANEADOS */}
      {bannedUsers.size > 0 && (
        <div>
          <span style={{ fontWeight: 900, display: "block", marginBottom: "4px" }}>
            🔨 USUARIOS BANEADOS:
          </span>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {Array.from(bannedUsers).map((user) => (
              <span
                key={user}
                onClick={() => onUnbanUser(user)}
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
  );
}
