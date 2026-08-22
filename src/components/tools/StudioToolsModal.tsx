"use client";

import { useState, useRef } from "react";
import { Moon, Mic, Check, Square, Send } from "lucide-react";
import { NeoModal } from "../common/NeoModal";
import { useSleepTimer } from "@/hooks/useSleepTimer";

interface StudioToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ToolTab = "timer" | "voice";

export const StudioToolsModal = ({ isOpen, onClose }: StudioToolsModalProps) => {
  const [activeTab, setActiveTab] = useState<ToolTab>("timer");

  // 1. Sleep Timer Hook
  const {
    isActive: isTimerActive,
    timerMinutes,
    formattedTime,
    startTimer,
    cancelTimer,
  } = useSleepTimer();
  const [customMinutes, setCustomMinutes] = useState<number>(30);

  // 2. Voice Message State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [voiceSenderName, setVoiceSenderName] = useState<string>("");
  const [voiceSubmitted, setVoiceSubmitted] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startVoiceRecording = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("⚠️ Tu navegador no soporta grabación de audio o estás en un entorno no seguro (requiere HTTPS).");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Detect supported MIME type across browsers (Safari iOS, Chrome, Firefox, Edge)
      let selectedMimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          selectedMimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          selectedMimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          selectedMimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/aac")) {
          selectedMimeType = "audio/aac";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          selectedMimeType = "audio/ogg";
        }
      }

      audioChunksRef.current = [];
      const options = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType || "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      alert("Por favor permite el acceso al micrófono en tu navegador para grabar tu saludo 🎙️");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendVoiceGreeting = () => {
    if (!voiceSenderName.trim()) {
      alert("Por favor escribe tu nombre o alias para enviar el saludo 📻");
      return;
    }
    setVoiceSubmitted(true);
    setTimeout(() => {
      setVoiceSubmitted(false);
      setRecordedAudioUrl(null);
      setVoiceSenderName("");
    }, 4000);
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title="HERRAMIENTAS DOBLE C"
      badgeText="⚡ CONTROL"
      maxWidth="500px"
      backgroundColor="var(--background)"
    >
      {/* TABS NAVIGATION */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "3px solid var(--primary)",
          paddingBottom: "12px",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={() => setActiveTab("timer")}
          className="neo-button"
          style={{
            flex: 1,
            backgroundColor: activeTab === "timer" ? "var(--primary-container)" : "white",
            color: "var(--primary)",
            padding: "8px 10px",
            fontSize: "0.75rem",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: activeTab === "timer" ? "2px 2px 0px var(--primary)" : "none",
            border: "2px solid var(--primary)",
          }}
        >
          <Moon size={14} />
          <span>APAGADO 🌙</span>
        </button>

        <button
          onClick={() => setActiveTab("voice")}
          className="neo-button"
          style={{
            flex: 1,
            backgroundColor: activeTab === "voice" ? "var(--primary-container)" : "white",
            color: "var(--primary)",
            padding: "8px 10px",
            fontSize: "0.75rem",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: activeTab === "voice" ? "2px 2px 0px var(--primary)" : "none",
            border: "2px solid var(--primary)",
          }}
        >
          <Mic size={14} />
          <span>SALUDO AL AIRE 🎙️</span>
        </button>
      </div>

      {/* TAB 1: SLEEP TIMER */}
      {activeTab === "timer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              backgroundColor: "var(--surface-container)",
              border: "2px solid var(--primary)",
              padding: "12px",
              boxShadow: "3px 3px 0px var(--primary)",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.8 }}>
              TEMPORIZADOR AUTOMÁTICO
            </span>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, fontFamily: "monospace", margin: "6px 0", color: "var(--primary)" }}>
              {isTimerActive ? formattedTime : "00:00"}
            </div>
            <p style={{ fontSize: "0.7rem", opacity: 0.85, margin: 0 }}>
              {isTimerActive
                ? `La radio se pausará automáticamente en ${timerMinutes} minutos.`
                : "Programa la radio para que se apague automáticamente mientras duermes."}
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label style={{ fontSize: "0.68rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              TIEMPO RÁPIDO:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => startTimer(mins)}
                  className="neo-button"
                  style={{
                    padding: "8px 4px",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    backgroundColor: isTimerActive && timerMinutes === mins ? "var(--primary)" : "white",
                    color: isTimerActive && timerMinutes === mins ? "var(--on-primary)" : "var(--primary)",
                    border: "2px solid var(--primary)",
                    boxShadow: "2px 2px 0px var(--primary)",
                  }}
                >
                  {mins} MIN
                </button>
              ))}
            </div>
          </div>

          {/* Custom Slider */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", fontWeight: 900 }}>
              <span>PERSONALIZADO:</span>
              <span>{customMinutes} MINUTOS</span>
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary)" }}
            />
            <button
              onClick={() => startTimer(customMinutes)}
              className="neo-button"
              style={{
                padding: "8px",
                fontSize: "0.72rem",
                fontWeight: 900,
                backgroundColor: "var(--primary-container)",
                border: "2px solid var(--primary)",
                boxShadow: "2px 2px 0px var(--primary)",
              }}
            >
              INICIAR {customMinutes} MIN ⚡
            </button>
          </div>

          {isTimerActive && (
            <button
              onClick={cancelTimer}
              className="neo-button"
              style={{
                padding: "8px",
                fontSize: "0.72rem",
                fontWeight: 900,
                backgroundColor: "#BA1A1A",
                color: "white",
                border: "2px solid var(--primary)",
                boxShadow: "2px 2px 0px var(--primary)",
              }}
            >
              CANCELAR TEMPORIZADOR ✕
            </button>
          )}
        </div>
      )}

      {/* TAB 2: VOICE GREETING */}
      {activeTab === "voice" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {voiceSubmitted ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-container)",
                  border: "3px solid var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={28} style={{ color: "var(--primary)" }} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
                ¡SALUDO ENVIADO A CABINA! 📻
              </h3>
              <p style={{ fontSize: "0.75rem", opacity: 0.85, margin: 0 }}>
                Tu nota de voz ha sido recibida por los locutores de Radio Doble C para sonar en vivo.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  backgroundColor: "var(--surface-container)",
                  border: "2px solid var(--primary)",
                  padding: "12px",
                  boxShadow: "2px 2px 0px var(--primary)",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "0.75rem", fontWeight: "bold", margin: 0 }}>
                  🎙️ Graba un saludo de 10 a 15 segundos para que los locutores lo pasen al aire durante la transmisión.
                </p>
              </div>

              {/* Nombre */}
              <div>
                <label style={{ fontSize: "0.68rem", fontWeight: 900, display: "block", marginBottom: "4px" }}>
                  TU NOMBRE O ALIAS *
                </label>
                <input
                  type="text"
                  value={voiceSenderName}
                  onChange={(e) => setVoiceSenderName(e.target.value)}
                  placeholder="Ej. Carlos de Huánuco"
                  className="neo-input"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "0.75rem",
                    border: "2px solid var(--primary)",
                    fontWeight: "bold",
                    backgroundColor: "white",
                  }}
                />
              </div>

              {/* Record Controls */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="neo-button fun-hover-wobble"
                    style={{
                      backgroundColor: "#BA1A1A",
                      color: "white",
                      padding: "10px 20px",
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      border: "2.5px solid var(--primary)",
                      boxShadow: "3px 3px 0px var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <Mic size={16} /> GRABAR NOTA DE VOZ
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="neo-button"
                    style={{
                      backgroundColor: "#CCFF00",
                      color: "#111",
                      padding: "10px 20px",
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      border: "2.5px solid var(--primary)",
                      boxShadow: "3px 3px 0px var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      animation: "pulse 1s infinite ease-in-out",
                    }}
                  >
                    <Square size={16} fill="currentColor" /> DETENER GRABACIÓN (GRABANDO...)
                  </button>
                )}

                {recordedAudioUrl && (
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
                    <audio src={recordedAudioUrl} controls style={{ width: "100%" }} />
                    <button
                      type="button"
                      onClick={handleSendVoiceGreeting}
                      className="neo-button fun-hover-wobble"
                      style={{
                        backgroundColor: "var(--primary-container)",
                        color: "var(--primary)",
                        padding: "10px",
                        fontSize: "0.75rem",
                        fontWeight: 900,
                        border: "2.5px solid var(--primary)",
                        boxShadow: "3px 3px 0px var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <Send size={15} /> ENVIAR SALUDO A CABINA 📡
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </NeoModal>
  );
};
