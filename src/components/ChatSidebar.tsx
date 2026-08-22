import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useAudio } from "@/hooks/useAudio";
import { Send, User, Ban, X, Mic, Square } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";

interface ChatSidebarProps {
  onClose: () => void;
}

interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
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
    puntosC,
    consumePuntosC,
    pendingVoiceGreetings,
    submitVoiceGreeting,
    approveVoiceGreeting,
    rejectVoiceGreeting,
  } = useAudio();

  const [typedMessage, setTypedMessage] = useState("");
  const [newBannedWord, setNewBannedWord] = useState("");
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const messageFeedRef = useRef<HTMLDivElement>(null);

  // In-Chat Voice Greeting State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const [voiceGreetingSent, setVoiceGreetingSent] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);

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

  // Voice recording handlers (with Security Phase 1: Points & Speech Filter)
  const handleStartVoiceRecording = async () => {
    const normRole = (userProfile.role || "").toUpperCase();
    const isImmune = normRole.includes("VIP") || normRole.includes("MOD") || normRole.includes("STREAMER") || normRole.includes("ADMIN");

    if (!isImmune && (puntosC || 0) < 100) {
      alert(`🔒 REQUIERE AL MENOS 100 C-COINS PARA ENVIAR SALUDOS AL AIRE (Tienes: ${puntosC || 0} C-Coins).\n\n📻 ¡Entra a diario, gira la Tornamesa C o escucha la radio para acumular más C-Coins!`);
      return;
    }

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
        setVoiceAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      // FASE 1: Web Speech Recognition Filter (si el navegador lo soporta)
      const speechWin = typeof window !== "undefined" ? (window as unknown as WindowWithSpeech) : null;
      const SpeechRecognition = speechWin?.SpeechRecognition || speechWin?.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = "es-ES";
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: SpeechRecognitionEventLike) => {
            let fullText = "";
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + " ";
            }
            const cleanText = fullText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            setVoiceTranscript(fullText.trim());

            // Check against banned words in real time
            const hasBannedWord = bannedWords.some((bw) => cleanText.includes(bw.toLowerCase()));
            if (hasBannedWord && !isImmune) {
              handleCancelVoiceRecording();
              alert("⚠️ ALERTA DE CABINA: Se detectó lenguaje inapropiado o palabras no permitidas en el audio. El saludo fue cancelado.");
            }
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch {
          // Speech recognition optional fallback
        }
      }

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 14) {
            handleStopVoiceRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      alert("Por favor permite el acceso al micrófono en tu navegador para enviar notas de voz al aire 🎙️");
    }
  };

  const handleStopVoiceRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
    }
  };

  const handleCancelVoiceRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
    setVoiceAudioUrl(null);
    setVoiceTranscript("");
  };

  // FASE 2: Enviar saludo a la cola de moderación de cabina
  const handleSendVoiceGreeting = () => {
    if (!voiceAudioUrl) return;

    // Consumir 100 C-Coins
    const success = consumePuntosC(100);
    if (!success) {
      alert("No tienes suficientes C-Coins (requiere 100 C-Coins)");
      return;
    }

    // Enviar a cola de cabina
    submitVoiceGreeting(voiceAudioUrl, recordingSeconds, voiceTranscript || "Nota de voz grabada por el oyente");

    setVoiceGreetingSent(true);
    setVoiceAudioUrl(null);
    setRecordingSeconds(0);
    setVoiceTranscript("");
    setTimeout(() => {
      setVoiceGreetingSent(false);
    }, 4500);
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
        {/* C. MODERATOR SETTINGS & CABIN QUEUE PANEL */}
        {hasModPrivileges && isModPanelVisible && (
          <div
            className="neo-card"
            style={{
              backgroundColor: "#FFFBE5",
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
            {/* FASE 3: COLA DE AUDIOS PENDIENTES DE CABINA */}
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
                        backgroundColor: "white",
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
                          onClick={() => approveVoiceGreeting(greeting.id)}
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
                          onClick={() => rejectVoiceGreeting(greeting.id)}
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
                          lineHeight: "1.1rem",
                          wordBreak: "break-word",
                          margin: 0,
                          color: isBanned || isDeleted ? "#BA1A1A" : "var(--primary)",
                          fontStyle: isBanned || isDeleted ? "italic" : "normal",
                        }}
                      >
                        {isBanned
                          ? "⚠️ [USUARIO BANEADO DEL CHAT]"
                          : isDeleted
                          ? "🗑️ [Mensaje borrado por moderación]"
                          : msg.messageText}
                      </p>

                      {/* Playable Voice Greeting Audio Bubble */}
                      {msg.voiceAudioUrl && !isDeleted && !isBanned && (
                        <div style={{ marginTop: "4px", padding: "4px", backgroundColor: "#FFFFFF", border: "1.5px solid var(--primary)" }}>
                          <audio src={msg.voiceAudioUrl} controls style={{ width: "100%", height: "26px" }} />
                        </div>
                      )}
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
          ) : isRecordingVoice ? (
            /* In-Chat Voice Recording Panel */
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
                  onClick={handleStopVoiceRecording}
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
                  onClick={handleCancelVoiceRecording}
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
            /* Recorded Audio Preview & Send */
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
                  onClick={handleCancelVoiceRecording}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  title="Descartar"
                >
                  <X size={13} />
                </button>
              </div>
              <audio src={voiceAudioUrl} controls style={{ width: "100%", height: "28px" }} />
              <button
                onClick={handleSendVoiceGreeting}
                className="neo-button fun-hover-wobble"
                style={{
                  backgroundColor: "var(--primary-container)",
                  color: "var(--primary)",
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
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", paddingBottom: "2px" }}>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.58rem", fontWeight: 900, opacity: 0.8 }}>REACCIÓN:</span>
                  {["🔥", "📻", "⚡"].map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setTypedMessage((prev) => (prev + e).slice(0, 150))}
                      style={{
                        background: "none",
                        border: "1.5px solid var(--primary)",
                        borderRadius: "3px",
                        padding: "1px 5px",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        backgroundColor: "var(--card-bg)",
                        lineHeight: 1,
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                {/* Puntos C Balance Pill - Destacado y Espacioso */}
                <div
                  style={{
                    backgroundColor: "#CCFF00",
                    border: "1.5px solid var(--primary)",
                    boxShadow: "2px 2px 0px var(--primary)",
                    padding: "2px 8px",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    color: "#111111",
                    whiteSpace: "nowrap",
                  }}
                  title="Puntos C acumulados por entrar a diario (+1 pt) y escuchar 30 min de radio (+1 pt). ¡Canjeables por saludos y merch!"
                >
                  ⚡ {puntosC || 0} PUNTOS C
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
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

                {/* Mic Audio Greeting Button */}
                <button
                  type="button"
                  onClick={handleStartVoiceRecording}
                  className="neo-button"
                  style={{
                    height: "32px",
                    padding: "0 8px",
                    backgroundColor: "white",
                    border: "2px solid var(--primary)",
                    boxShadow: "2px 2px 0px var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title="Grabar saludo de voz para cabina (Cuesta 100 C-Coins)"
                >
                  <Mic size={13} style={{ color: "#BA1A1A" }} />
                </button>

                <EmojiPicker
                  onSelectEmoji={(emoji) => setTypedMessage((prev) => (prev + emoji).slice(0, 150))}
                  dropDirection="up"
                  buttonSize={14}
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
                  <Send size={12} />
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};
