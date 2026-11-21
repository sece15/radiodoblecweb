"use client";

import { useRef, useState } from "react";

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

interface UseChatVoiceRecorderParams {
  userRole: string;
  puntosC: number;
  bannedWords: string[];
  consumePuntosC: (amount: number) => boolean;
  submitVoiceGreeting: (audioUrl: string, durationSeconds: number, transcript: string) => void;
}

export function useChatVoiceRecorder({
  userRole,
  puntosC,
  bannedWords,
  consumePuntosC,
  submitVoiceGreeting,
}: UseChatVoiceRecorderParams) {
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const [voiceGreetingSent, setVoiceGreetingSent] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const handleStopVoiceRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      speechRecognitionRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
    }
  };

  const handleCancelVoiceRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      speechRecognitionRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
    setVoiceAudioUrl(null);
    setVoiceTranscript("");
  };

  const handleStartVoiceRecording = async () => {
    const normRole = (userRole || "").toUpperCase();
    const isImmune =
      normRole.includes("VIP") ||
      normRole.includes("MOD") ||
      normRole.includes("STREAMER") ||
      normRole.includes("ADMIN");

    if (!isImmune && (puntosC || 0) < 100) {
      alert(
        `🔒 REQUIERE AL MENOS 100 C-COINS PARA ENVIAR SALUDOS AL AIRE (Tienes: ${puntosC || 0} C-Coins).\n\n📻 ¡Entra a diario, gira la Tornamesa C o escucha la radio para acumular más C-Coins!`
      );
      return;
    }

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
        setVoiceAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

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
            const cleanText = fullText
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            setVoiceTranscript(fullText.trim());

            const hasBannedWord = bannedWords.some((bw) => cleanText.includes(bw.toLowerCase()));
            if (hasBannedWord && !isImmune) {
              handleCancelVoiceRecording();
              alert(
                "⚠️ ALERTA DE CABINA: Se detectó lenguaje inapropiado o palabras no permitidas en el audio. El saludo fue cancelado."
              );
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

  const handleSendVoiceGreeting = () => {
    if (!voiceAudioUrl) return;

    const success = consumePuntosC(100);
    if (!success) {
      alert("No tienes suficientes C-Coins (requiere 100 C-Coins)");
      return;
    }

    submitVoiceGreeting(
      voiceAudioUrl,
      recordingSeconds,
      voiceTranscript || "Nota de voz grabada por el oyente"
    );

    setVoiceGreetingSent(true);
    setVoiceAudioUrl(null);
    setRecordingSeconds(0);
    setVoiceTranscript("");
    setTimeout(() => {
      setVoiceGreetingSent(false);
    }, 4500);
  };

  return {
    isRecordingVoice,
    recordingSeconds,
    voiceAudioUrl,
    voiceGreetingSent,
    handleStartVoiceRecording,
    handleStopVoiceRecording,
    handleCancelVoiceRecording,
    handleSendVoiceGreeting,
  };
}
