"use client";

import { useState, useRef } from "react";
import { Moon, Volume2, Mic, Check, Square, Send } from "lucide-react";
import { NeoModal } from "../common/NeoModal";
import { useSleepTimer } from "@/hooks/useSleepTimer";
import { useSoundboard, SoundEffectType } from "@/hooks/useSoundboard";

interface StudioToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ToolTab = "timer" | "soundboard" | "voice";

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

  // 2. Soundboard Hook
  const { playSoundEffect } = useSoundboard();

  // 3. Voice Message State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [voiceSenderName, setVoiceSenderName] = useState<string>("");
  const [voiceSubmitted, setVoiceSubmitted] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      alert("Por favor permite el acceso al micrófono para grabar tu saludo 🎙️");
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

  const SOUND_EFFECTS: { id: SoundEffectType; name: string; icon: string; desc: string }[] = [
    { id: "airhorn", name: "AIRHORN", icon: "📢", desc: "Clásico reggae de radio" },
    { id: "scratch", name: "VINIL SCRATCH", icon: "⚡", desc: "Rasguño de tornamesa" },
    { id: "siren", name: "SIRENA DUB", icon: "🚨", desc: "Alerta dub & sound system" },
    { id: "static", name: "ESTÁTICA CRT", icon: "📻", desc: "Interferencia analógica" },
    { id: "bell", name: "CAMPANA", icon: "🛎️", desc: "Campana de ring" },
    { id: "laser", name: "LASER ZAP", icon: "👾", desc: "Efecto retro 80s" },
  ];

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title="ESTUDIO & HERRAMIENTAS DOBLE C"
      badgeText="⚡ CONTROL ROOM"
      maxWidth="540px"
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
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setActiveTab("timer")}
          className="neo-button"
          style={{
            flex: "1 1 120px",
            backgroundColor: activeTab === "timer" ? "var(--primary-container)" : "white",
            color: "var(--primary)",
            padding: "8px 10px",
            fontSize: "0.7rem",
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
          onClick={() => setActiveTab("soundboard")}
          className="neo-button"
          style={{
            flex: "1 1 120px",
            backgroundColor: activeTab === "soundboard" ? "var(--primary-container)" : "white",
            color: "var(--primary)",
            padding: "8px 10px",
            fontSize: "0.7rem",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: activeTab === "soundboard" ? "2px 2px 0px var(--primary)" : "none",
            border: "2px solid var(--primary)",
          }}
        >
          <Volume2 size={14} />
          <span>SOUNDBOARD 🔊</span>
        </button>

        <button
          onClick={() => setActiveTab("voice")}
          className="neo-button"
          style={{
            flex: "1 1 120px",
            backgroundColor: activeTab === "voice" ? "var(--primary-container)" : "white",
            color: "var(--primary)",
            padding: "8px 10px",
            fontSize: "0.7rem",
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

      {/* TAB 2: SOUNDBOARD */}
      {activeTab === "soundboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: "bold", opacity: 0.85, margin: 0, textAlign: "center" }}>
            Haz click para disparar efectos de sonido clásicos de la radio en vivo:
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "10px",
            }}
          >
            {SOUND_EFFECTS.map((fx) => (
              <button
                key={fx.id}
                onClick={() => playSoundEffect(fx.id)}
                className="neo-button fun-hover-wobble"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  padding: "14px 8px",
                  backgroundColor: "white",
                  border: "2.5px solid var(--primary)",
                  boxShadow: "3px 3px 0px var(--primary)",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>{fx.icon}</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase" }}>
                  {fx.name}
                </span>
                <span style={{ fontSize: "0.55rem", opacity: 0.7, textAlign: "center" }}>
                  {fx.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VOICE GREETING */}
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
