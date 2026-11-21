"use client";

import type { RefObject } from "react";
import { Coffee, Mic, Pizza, Send, Square, X } from "lucide-react";
import Image from "next/image";
import { EmojiPicker } from "../EmojiPicker";
import { RichChatInput, type RichChatInputRef } from "./RichChatInput";
import { LunaGreetingPanel } from "./LunaGreetingPanel";
import { MASCOT_REACTIONS } from "@/lib/mascotEmojis";
import type { SponsorBusiness } from "@/services/sponsorService";
import type { LunaGreetingsController } from "@/hooks/useLunaGreetings";

interface ChatComposerFooterProps {
  isAuthenticated: boolean;
  isCurrentUserBanned: boolean;
  isRecordingVoice: boolean;
  recordingSeconds: number;
  voiceAudioUrl: string | null;
  voiceGreetingSent: boolean;
  puntosC: number;
  isSponsorAccordionOpen: boolean;
  sponsorsList: SponsorBusiness[];
  typedMessage: string;
  greetingActive: boolean;
  userName: string;
  lunaGreetings: LunaGreetingsController | null;
  richInputRef: RefObject<RichChatInputRef | null>;
  onSignInWithGoogle: () => void;
  onStartVoiceRecording: () => void;
  onStopVoiceRecording: () => void;
  onCancelVoiceRecording: () => void;
  onSendVoiceGreeting: () => void;
  onToggleSponsorAccordion: () => void;
  onSelectSponsor: (slug: string) => void;
  onTextChange: (text: string) => void;
  onSend: () => boolean | void;
  onDismissGreeting: () => void;
}

export function ChatComposerFooter({
  isAuthenticated,
  isCurrentUserBanned,
  isRecordingVoice,
  recordingSeconds,
  voiceAudioUrl,
  voiceGreetingSent,
  puntosC,
  isSponsorAccordionOpen,
  sponsorsList,
  typedMessage,
  greetingActive,
  userName,
  lunaGreetings,
  richInputRef,
  onSignInWithGoogle,
  onStartVoiceRecording,
  onStopVoiceRecording,
  onCancelVoiceRecording,
  onSendVoiceGreeting,
  onToggleSponsorAccordion,
  onSelectSponsor,
  onTextChange,
  onSend,
  onDismissGreeting,
}: ChatComposerFooterProps) {
  return (
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
          onClick={onSignInWithGoogle}
          className="neo-button fun-hover-wobble"
          style={{
            width: "100%",
            backgroundColor: "var(--primary-container)",
            padding: "10px",
            textAlign: "center",
            color: "var(--on-primary-container)",
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
      ) : isRecordingVoice ? (
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 10px",
            backgroundColor: "#FFE5E5",
            border: "2px solid #BA1A1A",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#BA1A1A",
                animation: "pulse 0.8s infinite ease-in-out",
              }}
            />
            <span style={{ fontSize: "0.68rem", fontWeight: 900, color: "#BA1A1A" }}>
              GRABANDO {recordingSeconds.toString().padStart(2, "0")}/15s
            </span>
          </div>

          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={onStopVoiceRecording}
              className="neo-button"
              style={{
                padding: "4px 8px",
                fontSize: "0.62rem",
                fontWeight: 900,
                backgroundColor: "#CCFF00",
                border: "1.5px solid var(--primary)",
                cursor: "pointer",
              }}
            >
              <Square size={10} fill="currentColor" /> LISTO
            </button>
            <button
              onClick={onCancelVoiceRecording}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "#BA1A1A",
              }}
              title="Cancelar"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : voiceAudioUrl ? (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            padding: "6px 8px",
            backgroundColor: "var(--surface-container)",
            border: "2px solid var(--primary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 900 }}>🎙️ NOTA DE VOZ LISTA:</span>
            <button
              onClick={onCancelVoiceRecording}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              title="Descartar"
            >
              <X size={13} />
            </button>
          </div>
          <audio src={voiceAudioUrl} controls style={{ width: "100%", height: "28px" }} />
          <button
            onClick={onSendVoiceGreeting}
            className="neo-button fun-hover-wobble"
            style={{
              backgroundColor: "var(--primary-container)",
              color: "var(--on-primary-container)",
              padding: "6px",
              fontSize: "0.68rem",
              fontWeight: 900,
              border: "2px solid var(--primary)",
              boxShadow: "2px 2px 0px var(--primary)",
              cursor: "pointer",
            }}
          >
            ENVIAR SALUDO AL CHAT 🚀
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", minWidth: 0 }}>
          {voiceGreetingSent && (
            <div
              style={{
                backgroundColor: "#CCFF00",
                border: "1.5px solid var(--primary)",
                padding: "6px 8px",
                fontSize: "0.65rem",
                fontWeight: 900,
                textAlign: "center",
              }}
            >
              ⏳ ¡SALUDO ENVIADO A CABINA! El locutor lo revisará antes de lanzarlo al aire (-100 C-Coins). 📻
            </div>
          )}

          {/* Points & Quick Reactions Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              paddingBottom: "2px",
              width: "100%",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "4px",
                alignItems: "center",
                overflowX: "auto",
                maxWidth: "calc(100% - 140px)",
                minWidth: 0,
                scrollbarWidth: "none",
              }}
            >
              <span style={{ fontSize: "0.58rem", fontWeight: 900, opacity: 0.8, flexShrink: 0 }}>
                REACCIÓN:
              </span>
              {MASCOT_REACTIONS.map((emoji) => (
                <button
                  key={emoji.id}
                  type="button"
                  title={emoji.label}
                  aria-label={emoji.label}
                  onClick={() => richInputRef.current?.insertEmoji(emoji)}
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
                >
                  <Image
                    src={emoji.src}
                    alt={emoji.label}
                    width={20}
                    height={20}
                    unoptimized
                    style={{ imageRendering: "pixelated" }}
                  />
                </button>
              ))}
            </div>

            {/* Puntos C Balance Pill */}
            <div
              style={{
                backgroundColor: "#CCFF00",
                border: "1.5px solid var(--primary)",
                boxShadow: "2px 2px 0px var(--primary)",
                padding: "2px 6px",
                fontSize: "0.62rem",
                fontWeight: 900,
                color: "#111111",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              title="Tus C-Coins diarias acumuladas por sintonía y ruleta."
            >
              ⚡ {puntosC || 0}
            </div>

            {/* Acordeón Toggle de Auspiciadores & Pedidos */}
            <button
              type="button"
              onClick={onToggleSponsorAccordion}
              style={{
                backgroundColor: isSponsorAccordionOpen
                  ? "var(--primary-container)"
                  : "var(--surface-container, #181818)",
                color: isSponsorAccordionOpen ? "var(--primary)" : "var(--foreground)",
                border: "1.5px solid var(--primary)",
                borderRadius: "3px",
                padding: "2px 7px",
                fontSize: "0.62rem",
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: isSponsorAccordionOpen
                  ? "2px 2px 0px var(--primary)"
                  : "1.5px 1.5px 0px var(--primary)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              title="Abrir pedidos a auspiciadores oficiales (Pizzas)"
            >
              <span style={{ color: isSponsorAccordionOpen ? "var(--primary)" : "var(--foreground)" }}>
                🍕 PEDIDOS
              </span>
              <span
                style={{
                  fontSize: "0.55rem",
                  color: isSponsorAccordionOpen ? "var(--primary)" : "var(--foreground)",
                }}
              >
                {isSponsorAccordionOpen ? "▲" : "▼"}
              </span>
            </button>
          </div>

          {/* Acordeón Desplegable de Auspiciadores */}
          {isSponsorAccordionOpen && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                maxHeight: "76px",
                overflowY: "auto",
                padding: "4px 6px",
                backgroundColor: "var(--surface-container, #161616)",
                border: "1.5px solid var(--primary)",
                boxShadow: "2px 2px 0px var(--primary)",
                borderRadius: "3px",
                marginBottom: "3px",
                animation: "fadeIn 0.15s ease",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {sponsorsList
                .filter((s) => s.category === "comida" || s.category === "bebidas")
                .map((sponsor) => {
                  const isBeverage = sponsor.category === "bebidas";
                  const bg = isBeverage ? "#CCFF00" : "#FF5500";
                  const textColor = isBeverage ? "#111111" : "#FFFFFF";

                  return (
                    <button
                      key={sponsor.id}
                      type="button"
                      onClick={() => onSelectSponsor(sponsor.slug)}
                      className="neo-button"
                      style={{
                        width: "100%",
                        fontSize: "0.60rem",
                        fontWeight: 900,
                        backgroundColor: bg,
                        color: textColor,
                        border: "1.5px solid var(--primary)",
                        padding: "3px 6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "4px",
                        cursor: "pointer",
                        boxShadow: "1.5px 1.5px 0px var(--primary)",
                        transform: "none",
                        flexShrink: 0,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          color: textColor,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                        }}
                      >
                        {isBeverage ? (
                          <Coffee size={11} style={{ color: "#BA1A1A", flexShrink: 0 }} />
                        ) : (
                          <Pizza size={11} style={{ flexShrink: 0 }} />
                        )}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {sponsor.name.toUpperCase()}
                        </span>
                      </span>
                      <span
                        style={{
                          backgroundColor: "#111111",
                          color: bg,
                          padding: "1px 4px",
                          fontSize: "0.52rem",
                          borderRadius: "2px",
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        PRÓX.
                      </span>
                    </button>
                  );
                })}
            </div>
          )}

          {/* Input Row */}
          <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", minWidth: 0 }}>
            <RichChatInput
              ref={richInputRef}
              placeholder="Escribe en el chat..."
              maxLength={150}
              onSend={onSend}
              onTextChange={onTextChange}
            />

            <button
              type="button"
              onClick={onStartVoiceRecording}
              className="neo-button"
              style={{
                height: "32px",
                padding: "0 8px",
                backgroundColor: "var(--card-bg)",
                border: "2px solid var(--primary)",
                boxShadow: "2px 2px 0px var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
              title="Grabar saludo de voz para cabina (Cuesta 100 C-Coins)"
            >
              <Mic size={13} style={{ color: "#BA1A1A" }} />
            </button>

            <EmojiPicker
              onSelectEmoji={(emoji) => richInputRef.current?.insertEmoji(emoji)}
              dropDirection="up"
              buttonSize={20}
            />

            <button
              onClick={onSend}
              className="neo-button"
              aria-label="Enviar mensaje"
              disabled={
                greetingActive
                  ? !isAuthenticated || !lunaGreetings?.connected || lunaGreetings?.checking
                  : false
              }
              style={{
                height: "32px",
                padding: "0 10px",
                backgroundColor: "var(--primary-container)",
                color: "var(--on-primary-container)",
                border: "2px solid var(--primary)",
                boxShadow: "2px 2px 0px var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Send size={12} />
            </button>
          </div>

          <LunaGreetingPanel
            luna={lunaGreetings}
            messageText={typedMessage}
            senderName={userName}
            active={greetingActive}
            authenticated={isAuthenticated}
            onDismiss={onDismissGreeting}
          />
        </div>
      )}
    </div>
  );
}
