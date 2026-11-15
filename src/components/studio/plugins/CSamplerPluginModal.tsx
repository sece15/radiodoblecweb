"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Upload, X, Disc, RefreshCw, Scissors, Square, Plus, Trash2, Pencil, Shuffle, ZoomIn, ZoomOut, Maximize2, ArrowLeft, Play, Pause, Loader2 } from "lucide-react";
import type { SamplerCuePoint, SamplerTriggerMode, Akai16LevelsType, LoadedSampleData, DiggerTrack, StemType, StemsSeparationResult } from "@/types/studio";
import { studioAudio } from "@/lib/studio/audioEngine";
import {
  RealtimeStemMixer,
  separateAudioIntoStems,
  createStemsFromTrack,
  extractStemPeaks,
} from "@/lib/studio/stemEngine";
import { calculateSliceBoundary } from "@/lib/contracts/samplerContracts";
import { buildSampletteYouTubeEmbedUrl } from "@/lib/studio/crateEngine";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.esm.js";

interface CSamplerPluginModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalSample?: LoadedSampleData | null;
  onOpenDigger?: () => void;
  isStandalone?: boolean;
}

// Paleta oficial de 16 colores Neón estilo Serato Sample VST
const SERATO_COLORS = [
  "#CCFF00", // 1: Lime Green
  "#00E5FF", // 2: Cyan
  "#FF007A", // 3: Hot Pink
  "#FFD600", // 4: Golden Yellow
  "#FF6D00", // 5: Neon Orange
  "#00E676", // 6: Spring Mint
  "#E040FB", // 7: Neon Violet
  "#2979FF", // 8: Electric Blue
  "#FF1744", // 9: Bright Red
  "#00B0FF", // 10: Light Sky Blue
  "#76FF03", // 11: Electric Chartreuse
  "#FF9100", // 12: Deep Amber
  "#F50057", // 13: Neon Rose
  "#7C4DFF", // 14: Deep Purple
  "#1DE9B6", // 15: Teal Cyan
  "#FFEA00", // 16: Lemon Yellow
];

// Akai MPC 16 Levels: Parámetros legendarios por tipo (Tune, Velocity, Filter, Decay)
const AKAI_16_LEVELS_SEMITONES = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8];
const AKAI_16_LEVELS_VELOCITIES = [0.10, 0.16, 0.22, 0.28, 0.34, 0.40, 0.46, 0.52, 0.58, 0.64, 0.70, 0.76, 0.82, 0.88, 0.94, 1.00];
const AKAI_16_LEVELS_FILTERS = [300, 450, 650, 900, 1200, 1600, 2200, 3000, 4000, 5200, 6800, 8500, 10500, 13000, 15500, 18000];
const AKAI_16_LEVELS_DECAYS = [0.08, 0.15, 0.25, 0.35, 0.50, 0.70, 0.90, 1.20, 1.50, 1.80, 2.10, 2.40, 2.70, 3.00, 3.30, 4.00];

// Cues iniciales estilo Serato Chops (Adiós a los nombres fijos de drums/fx)
const DEFAULT_CUES: SamplerCuePoint[] = [
  { id: 1, name: "CHOP 1 (INTRO)", startSec: 0.0, color: SERATO_COLORS[0], active: true },
  { id: 2, name: "CHOP 2 (GROOVE)", startSec: 4.5, color: SERATO_COLORS[1], active: true },
  { id: 3, name: "CHOP 3 (MELODÍA)", startSec: 12.0, color: SERATO_COLORS[2], active: true },
  { id: 4, name: "CHOP 4 (BASSLINE)", startSec: 24.5, color: SERATO_COLORS[3], active: true },
  { id: 5, name: "CHOP 5 (HOOK)", startSec: 36.0, color: SERATO_COLORS[4], active: true },
  { id: 6, name: "CHOP 6 (CORTE)", startSec: 48.5, color: SERATO_COLORS[5], active: true },
  { id: 7, name: "CHOP 7 (CLIMAX)", startSec: 62.0, color: SERATO_COLORS[6], active: true },
  { id: 8, name: "CHOP 8 (OUTRO)", startSec: 75.0, color: SERATO_COLORS[7], active: true },
];

// Mapeo de teclas estilo MPC / Serato Sample (Fila Q-I para 1-8 y A-K para 9-16)
const KEY_PAD_MAP: Record<string, number> = {
  // Bank A: 1-8
  q: 1, Q: 1,
  w: 2, W: 2,
  e: 3, E: 3,
  r: 4, R: 4,
  t: 5, T: 5,
  y: 6, Y: 6,
  u: 7, U: 7,
  i: 8, I: 8,
  // Bank B: 9-16
  a: 9, A: 9,
  s: 10, S: 10,
  d: 11, D: 11,
  f: 12, F: 12,
  g: 13, G: 13,
  h: 14, H: 14,
  j: 15, J: 15,
  k: 16, K: 16,
  // Números 1 a 8
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
};

const PAD_DISPLAY_KEYS: Record<number, string> = {
  1: "Q",
  2: "W",
  3: "E",
  4: "R",
  5: "T",
  6: "Y",
  7: "U",
  8: "I",
  9: "A",
  10: "S",
  11: "D",
  12: "F",
  13: "G",
  14: "H",
  15: "J",
  16: "K",
};

const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
};

export const CSamplerPluginModal = ({
  isOpen,
  onClose,
  externalSample,
  onOpenDigger,
  isStandalone = false,
}: CSamplerPluginModalProps) => {
  const [cues, setCues] = useState<SamplerCuePoint[]>(DEFAULT_CUES);
  const [selectedCueId, setSelectedCueId] = useState<number | null>(1);
  const [draggingCueId, setDraggingCueId] = useState<number | null>(null);
  const [scrubDirection, setScrubDirection] = useState<"forward" | "backward" | null>(null);
  const [editingCueId, setEditingCueId] = useState<number | null>(null);
  const [editingCueName, setEditingCueName] = useState<string>("");
  const [activeBank, setActiveBank] = useState<"A" | "B" | "ALL">("A");

  const [pitchSemi, setPitchSemi] = useState<number>(0);
  const [triggerMode, setTriggerMode] = useState<SamplerTriggerMode>("one_shot");
  const [activeCueId, setActiveCueId] = useState<number | null>(null);
  const [sampleName, setSampleName] = useState<string>("RADIO DOBLE C VAULT");
  const [customAudioBuffer, setCustomAudioBuffer] = useState<AudioBuffer | null>(null);
  const [trackInfo, setTrackInfo] = useState<Partial<DiggerTrack> | null>(externalSample?.trackInfo || null);

  // Akai MPC 16 Levels State (Tune, Velocity, Filter, Decay)
  const [is16Levels, setIs16Levels] = useState<boolean>(false);
  const [akai16Type, setAkai16Type] = useState<Akai16LevelsType>("tune");
  const [active16LevelPad, setActive16LevelPad] = useState<number | null>(null);
  const activeKeysDownRef = useRef<Set<string>>(new Set());

  // WaveSurfer.js V8 & Plugins Refs
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(20);
  const [isWaveReady, setIsWaveReady] = useState<boolean>(false);
  const isInternalRegionUpdateRef = useRef<boolean>(false);
  const lastScrubSecRef = useRef<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ytPlayerRef = useRef<HTMLIFrameElement>(null);
  const sliceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrubSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Serato Stems IA 4-Way Engine State (Unificado directamente en la misma onda Serato)
  const [activeStemFilter, setActiveStemFilter] = useState<StemType | null>(null);
  const activeStemFilterRef = useRef<StemType | null>(null);
  const [stemsResult, setStemsResult] = useState<StemsSeparationResult | null>(null);
  const [isSeparatingStems, setIsSeparatingStems] = useState<boolean>(false);
  const [isYtRestricted, setIsYtRestricted] = useState<boolean>(false);
  const [aiEngineName, setAiEngineName] = useState<string>("DSP");
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiServerStatus, setAiServerStatus] = useState<{
    hasLocalWorker: boolean;
    hasReplicate: boolean;
    activeProvider: string;
  } | null>(null);
  const stemMixerRef = useRef<RealtimeStemMixer | null>(null);

  // Estado y Refs del Puntero de Reproducción Continuo
  const [playbackPointerSec, setPlaybackPointerSec] = useState<number>(0);
  const [isPlayingSong, setIsPlayingSong] = useState<boolean>(false);
  const [loadingStem, setLoadingStem] = useState<StemType | null>(null);

  const playbackPointerSecRef = useRef<number>(0);
  playbackPointerSecRef.current = playbackPointerSec;

  const isPlayingSongRef = useRef<boolean>(false);
  isPlayingSongRef.current = isPlayingSong;

  const playheadTimerRef = useRef<number | null>(null);
  const playheadStartClockRef = useRef<number>(0);
  const playheadStartOffsetRef = useRef<number>(0);
  const continuousSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const continuousAudioCtxRef = useRef<AudioContext | null>(null);

  const handleSeekPointerRef = useRef<(sec: number) => void>(() => {});
  const handlePlaySongFromRef = useRef<(startSec: number) => void>(() => {});
  const handlePlayPauseSongRef = useRef<() => void>(() => {});
  const handlePauseSongRef = useRef<() => void>(() => {});
  const handleStopSongRef = useRef<() => void>(() => {});

  const checkAiStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/studio/separate-stems");
      if (res.ok) {
        const data = await res.json();
        setAiServerStatus({
          hasLocalWorker: Boolean(data.hasLocalWorker),
          hasReplicate: Boolean(data.hasReplicate),
          activeProvider: data.activeProvider || "web_audio_dsp_crossover",
        });
        if (data.hasLocalWorker) {
          setAiEngineName("DEMUCS LOCAL");
        } else if (data.hasReplicate) {
          setAiEngineName("DEMUCS CLOUD");
        } else {
          setAiEngineName("DSP EN MEMORIA");
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkAiStatus();
    }
  }, [isOpen, checkAiStatus]);

  useEffect(() => {
    return () => {
      studioAudio.stopScrub();
      if (scrubSilenceTimerRef.current) {
        clearTimeout(scrubSilenceTimerRef.current);
      }
    };
  }, []);

  // Duración estimada total del audio (de buffer, youtube o 180s)
  const totalDuration = useMemo(() => {
    if (customAudioBuffer?.duration) return customAudioBuffer.duration;
    if (trackInfo?.durationSec && trackInfo.durationSec > 0) return trackInfo.durationSec;
    return 180;
  }, [customAudioBuffer, trackInfo?.durationSec]);

  // Cues ordenados por tiempo para colorear las zonas de Serato Slice en la onda
  // Delegar al contrato formal matemático de límites sucesivos de corte
  const getCueSliceLimits = useCallback(
    (cueId: number, cuesList: SamplerCuePoint[], dur: number) => {
      return calculateSliceBoundary(cueId, cuesList, dur);
    },
    []
  );

  // Cargar o actualizar forma de onda en WaveSurfer de manera fluida y con duración exacta
  const loadWaveformData = useCallback(
    (
      dur: number,
      buffer: AudioBuffer | null,
      track: Partial<DiggerTrack> | null,
      stemFilter: StemType | null = null,
      stems: StemsSeparationResult | null = null
    ) => {
      const ws = wavesurferRef.current;
      if (!ws) return;

      const validDur = Math.max(10, dur || 180);
      const totalPoints = Math.max(2400, Math.min(8000, Math.floor(validDur * 35)));

      // 1. Si hay un stem seleccionado y tenemos el buffer del stem separado por IA
      if (stemFilter && stems && stems[stemFilter]) {
        try {
          const stemBuffer = stems[stemFilter];
          const peaks = extractStemPeaks(stemBuffer, totalPoints);
          ws.load("", [peaks], validDur).catch((err) => {
            if (err?.name !== "AbortError") console.warn("WaveSurfer stem load notice:", err);
          });
          return;
        } catch (err) {
          console.warn("Error loading stem peaks into WaveSurfer, falling back to algorithmic peaks:", err);
        }
      }

      // 2. Si es la mezcla completa (sin filtro) y tenemos el buffer global decodificado
      if (!stemFilter && buffer) {
        try {
          const peaks = extractStemPeaks(buffer, totalPoints);
          ws.load("", [peaks], validDur).catch((err) => {
            if (err?.name !== "AbortError") console.warn("WaveSurfer buffer load notice:", err);
          });
          return;
        } catch (err) {
          console.error("Error loading buffer peaks into WaveSurfer:", err);
        }
      }

      // 3. Generar picos de audio de alta resolución (simulados analógicamente según el instrumento filtrado)
      const peaks: number[] = [];
      const trackBpm = track?.bpm || 95;
      const beatPeriod = 60 / trackBpm;

      for (let i = 0; i < totalPoints; i++) {
        const sec = (i / totalPoints) * validDur;
        const progress = i / totalPoints;
        const beatPhase = (sec % beatPeriod) / beatPeriod;

        let finalAmp = 0.2;

        if (stemFilter === "drums") {
          // BATERÍA: Transitorios rítmicos muy marcados en kicks y snares (cyan)
          const kickHit = beatPhase < 0.08 ? (1 - beatPhase / 0.08) * 0.95 : 0;
          const snarePhase = ((sec + beatPeriod * 0.5) % beatPeriod) / beatPeriod;
          const snareHit = snarePhase < 0.1 ? (1 - snarePhase / 0.1) * 0.8 : 0;
          const hihat = (Math.sin(sec * 120) * 0.5 + 0.5) * 0.15;
          finalAmp = Math.max(0.04, kickHit + snareHit + hihat);
        } else if (stemFilter === "bass") {
          // BAJO: Ondas densas, continuas y pesadas de sub-graves (lime)
          const bassEnvelope = 0.45 + Math.sin(sec * 0.8) * 0.25 + Math.cos(sec * 1.6) * 0.2;
          const bassPulse = beatPhase < 0.35 ? (1 - beatPhase / 0.35) * 0.4 : 0.1;
          finalAmp = Math.max(0.05, Math.min(1.0, bassEnvelope * 0.7 + bassPulse));
        } else if (stemFilter === "melody") {
          // MELODÍA: Fraseo melódico, acordes y variaciones armónicas (pink)
          const melodyPhasing = 0.4 + Math.sin(sec * 2.4) * 0.3 + Math.cos(sec * 4.8) * 0.2;
          const riff = (Math.sin(sec * 32.5) * 0.25 + 0.25) * 0.3;
          finalAmp = Math.max(0.06, Math.min(1.0, melodyPhasing + riff));
        } else if (stemFilter === "vocals") {
          // VOCAL: Fraseo vocal humano con pausas de respiración naturales (gold)
          const vocalActive = Math.sin(sec * 0.35) > -0.15 ? 1 : 0.08;
          const speechFormant = (0.35 + Math.sin(sec * 1.8) * 0.3 + Math.sin(sec * 7.2) * 0.2) * vocalActive;
          finalAmp = Math.max(0.03, Math.min(0.95, speechFormant));
        } else {
          // MODO TODO (FULL SPECTRUM / SERATO RGB)
          let baseAmp = 0.42;
          if (progress < 0.1) {
            baseAmp = 0.35 + Math.sin(sec * 0.8) * 0.12;
          } else if (progress < 0.45) {
            baseAmp = 0.68 + Math.sin(sec * 1.5) * 0.18;
          } else if (progress < 0.75) {
            baseAmp = 0.85 + Math.cos(sec * 2.2) * 0.14;
          } else if (progress < 0.9) {
            baseAmp = 0.58 + Math.sin(sec * 1.2) * 0.15;
          } else {
            baseAmp = Math.max(0.08, 0.5 * (1 - (progress - 0.9) / 0.1));
          }

          const beatTransient = beatPhase < 0.12 ? (1 - beatPhase / 0.12) * 0.45 : 0;
          let chopTransient = 0;
          if (track?.miniPads) {
            for (const pad of track.miniPads) {
              const dist = Math.abs(sec - pad.timeSec);
              if (dist < 0.8) {
                chopTransient = Math.max(chopTransient, (1 - dist / 0.8) * 0.55);
              }
            }
          }
          const texture = (Math.sin(sec * 41.3) * 0.35 + Math.cos(sec * 79.1) * 0.35) * 0.08;
          finalAmp = Math.max(0.08, Math.min(1.0, baseAmp + beatTransient + chopTransient + texture));
        }

        peaks.push(finalAmp);
      }

      // Cargar los picos en WaveSurfer con la duración exacta del vinilo
      ws.load("", [peaks], validDur).catch((err) => {
        if (err?.name !== "AbortError") {
          console.warn("WaveSurfer load peaks notice:", err);
        }
      });
    },
    []
  );

  // Sincronizar sample externo desde C-Digger (Samplette)
  useEffect(() => {
    if (!externalSample) return;

    queueMicrotask(() => {
      if (externalSample.trackInfo) {
        setTrackInfo(externalSample.trackInfo);
      }
      if (externalSample.name) {
        setSampleName(externalSample.name.toUpperCase());
      }
      if (externalSample.cues && externalSample.cues.length > 0) {
        setCues(externalSample.cues);
        setSelectedCueId(externalSample.cues[0].id);
      }

      if (externalSample.buffer) {
        setCustomAudioBuffer(externalSample.buffer);
      } else {
        // Limpiamos customAudioBuffer para que la reproducción use 100% el reproductor de YouTube de la canción real
        setCustomAudioBuffer(null);
      }

      // Reiniciar filtro de stems al cargar una nueva canción
      setActiveStemFilter(null);
      activeStemFilterRef.current = null;
      setStemsResult(null);

      const trackDur = externalSample.trackInfo?.durationSec || 180;
      if (wavesurferRef.current) {
        loadWaveformData(trackDur, externalSample.buffer || null, externalSample.trackInfo || null, null);
      }
    });
  }, [externalSample, loadWaveformData]);

  // ESCUCHADOR DE RESTRICCIONES DE YOUTUBE (Error 150 / LatinAutor Embed Block): Auto-recuperación en RAM
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (typeof event.origin === "string" && !event.origin.includes("youtube.com")) return;
      let data: unknown = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== "object") return;
      const payload = data as Record<string, unknown>;

      const isDirectError =
        payload.event === "onError" ||
        payload.info === 150 ||
        payload.info === 101 ||
        payload.info === 100 ||
        payload.info === 2;

      const nestedInfo = payload.info as Record<string, unknown> | undefined;
      const isNestedError =
        nestedInfo?.errorCode === 150 ||
        nestedInfo?.errorCode === 101 ||
        nestedInfo?.errorCode === 100;

      if (isDirectError || isNestedError) {
        console.warn(
          `[C-SAMPLER] Video bloqueado por sello comercial en iframe (Error 150 / LatinAutor): ${trackInfo?.youtubeId}. Rescatando flujo de audio...`
        );
        setIsYtRestricted(true);

        if (trackInfo?.youtubeId && !customAudioBuffer) {
          fetch(`/api/studio/stream-sample?youtubeId=${trackInfo.youtubeId}`)
            .then(async (res) => {
              if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                const AudioCtx =
                  window.AudioContext ||
                  (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                const ctx = new AudioCtx();
                const buf = await ctx.decodeAudioData(arrayBuffer);
                setCustomAudioBuffer(buf);
                setIsYtRestricted(false);
              }
            })
            .catch(() => {});
        }
      }
    };

    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, [trackInfo?.youtubeId, customAudioBuffer]);

  // Detener audio inmediatamente (para Stop, Espacio o Modo HOLD al soltar)
  const handleStopAudio = useCallback(() => {
    if (sliceTimerRef.current) {
      clearTimeout(sliceTimerRef.current);
      sliceTimerRef.current = null;
    }
    if (playheadTimerRef.current) {
      cancelAnimationFrame(playheadTimerRef.current);
      playheadTimerRef.current = null;
    }
    if (continuousSourceRef.current) {
      try {
        continuousSourceRef.current.stop();
        continuousSourceRef.current.disconnect();
      } catch {}
      continuousSourceRef.current = null;
    }
    setIsPlayingSong(false);
    isPlayingSongRef.current = false;

    studioAudio.stopSamplerAudio();
    stemMixerRef.current?.stop();
    if (ytPlayerRef.current?.contentWindow) {
      ytPlayerRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: "pauseVideo",
          args: [],
        }),
        "*"
      );
    }
    setActiveCueId(null);
    setActive16LevelPad(null);
  }, []);

  // Inicialización del mezclador en tiempo real de Stems
  useEffect(() => {
    if (!stemMixerRef.current && typeof window !== "undefined") {
      stemMixerRef.current = new RealtimeStemMixer();
    }
    return () => {
      stemMixerRef.current?.stop();
    };
  }, []);

  const handleSeparateStems = useCallback(async (): Promise<StemsSeparationResult> => {
    setIsSeparatingStems(true);
    try {
      let sourceBuffer = customAudioBuffer;
      const currentTrack = externalSample?.trackInfo || trackInfo;
      const bpm = currentTrack?.bpm || 95;
      const key = currentTrack?.key || "Am";
      const genre = currentTrack?.genre || "funk";
      const duration = currentTrack?.durationSec || totalDuration || 180;

      // 1. Intentar separar con IA Meta Demucs v4 (Worker Local o Replicate Cloud)
      let aiResult: StemsSeparationResult | null = null;
      try {
        const sepRes = await fetch("/api/studio/separate-stems", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            youtubeId: currentTrack?.youtubeId,
            trackTitle: currentTrack?.title || sampleName,
            bpm,
            key,
          }),
        });
        if (sepRes.ok) {
          const sepData = await sepRes.json();
          if (sepData.status === "success" && sepData.stems) {
            const AudioCtx =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioCtx();
            const [drumsB, bassB, melodyB, vocalsB] = await Promise.all([
              fetch(sepData.stems.drums).then((r) => r.arrayBuffer()).then((ab) => ctx.decodeAudioData(ab)),
              fetch(sepData.stems.bass).then((r) => r.arrayBuffer()).then((ab) => ctx.decodeAudioData(ab)),
              fetch(sepData.stems.melody).then((r) => r.arrayBuffer()).then((ab) => ctx.decodeAudioData(ab)),
              fetch(sepData.stems.vocals).then((r) => r.arrayBuffer()).then((ab) => ctx.decodeAudioData(ab)),
            ]);
            aiResult = {
              drums: drumsB,
              bass: bassB,
              melody: melodyB,
              vocals: vocalsB,
              durationSec: drumsB.duration,
              sampleRate: drumsB.sampleRate,
            };
            setAiEngineName(sepData.provider === "meta_demucs_v4_local" ? "DEMUCS LOCAL" : "DEMUCS CLOUD");
          }
        }
      } catch (aiErr) {
        console.warn("AI Demucs separation notice:", aiErr);
      }

      // 2. Intentar obtener stream de audio binario real de YouTube si no hay buffer
      if (!aiResult && !sourceBuffer && currentTrack?.youtubeId) {
        try {
          const res = await fetch(
            `/api/studio/stream-sample?youtubeId=${currentTrack.youtubeId}&bpm=${bpm}&key=${encodeURIComponent(key)}&genre=${encodeURIComponent(genre)}`
          );
          const contentType = res.headers.get("Content-Type") || "";
          if (res.ok && contentType.includes("audio")) {
            const arrayBuffer = await res.arrayBuffer();
            const AudioCtx =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioCtx();
            sourceBuffer = await ctx.decodeAudioData(arrayBuffer);
            setCustomAudioBuffer(sourceBuffer);
          }
        } catch {}
      }

      // 3. Resultado final: IA Demucs o DSP en memoria
      let res: StemsSeparationResult;
      if (aiResult) {
        res = aiResult;
      } else if (sourceBuffer) {
        res = await separateAudioIntoStems(sourceBuffer, bpm, key, genre);
      } else {
        res = createStemsFromTrack(Math.min(180, Math.max(30, duration)), bpm, key, genre);
      }

      setStemsResult(res);
      if (stemMixerRef.current) {
        stemMixerRef.current.loadStems(res);
        if (activeStemFilterRef.current) {
          stemMixerRef.current.setSolo(activeStemFilterRef.current);
        }
      }

      return res;
    } catch (err) {
      console.warn("Stem separation notice:", err);
      const fallbackTrack = externalSample?.trackInfo || trackInfo;
      const fDur = fallbackTrack?.durationSec || totalDuration || 180;
      const fBpm = fallbackTrack?.bpm || 95;
      const fKey = fallbackTrack?.key || "Am";
      const fGenre = fallbackTrack?.genre || "funk";
      const fallback = createStemsFromTrack(Math.min(180, Math.max(30, fDur)), fBpm, fKey, fGenre);
      setStemsResult(fallback);
      if (stemMixerRef.current) {
        stemMixerRef.current.loadStems(fallback);
      }
      return fallback;
    } finally {
      setIsSeparatingStems(false);
    }
  }, [customAudioBuffer, trackInfo, totalDuration, externalSample, sampleName]);

  // Controles de Reproducción y Parada del Puntero Dedicado
  const handleStopSong = useCallback(() => {
    if (playheadTimerRef.current) {
      cancelAnimationFrame(playheadTimerRef.current);
      playheadTimerRef.current = null;
    }
    setIsPlayingSong(false);
    isPlayingSongRef.current = false;

    if (stemMixerRef.current) {
      stemMixerRef.current.stop();
    }
    if (continuousSourceRef.current) {
      try {
        continuousSourceRef.current.stop();
        continuousSourceRef.current.disconnect();
      } catch {}
      continuousSourceRef.current = null;
    }
    if (ytPlayerRef.current?.contentWindow) {
      try {
        ytPlayerRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      } catch {}
    }

    setPlaybackPointerSec(0);
    playbackPointerSecRef.current = 0;
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.setTime(0);
      } catch {}
    }
  }, []);

  const handlePauseSong = useCallback(() => {
    if (playheadTimerRef.current) {
      cancelAnimationFrame(playheadTimerRef.current);
      playheadTimerRef.current = null;
    }
    setIsPlayingSong(false);
    isPlayingSongRef.current = false;

    if (stemMixerRef.current) {
      stemMixerRef.current.stop();
    }
    if (continuousSourceRef.current) {
      try {
        continuousSourceRef.current.stop();
        continuousSourceRef.current.disconnect();
      } catch {}
      continuousSourceRef.current = null;
    }
    if (ytPlayerRef.current?.contentWindow) {
      try {
        ytPlayerRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      } catch {}
    }
  }, []);

  const handlePlaySongFrom = useCallback((startSec: number) => {
    const validStart = Math.max(0, Math.min(totalDuration, startSec));
    setPlaybackPointerSec(validStart);
    playbackPointerSecRef.current = validStart;
    setIsPlayingSong(true);
    isPlayingSongRef.current = true;

    if (stemMixerRef.current) {
      stemMixerRef.current.stop();
    }
    if (continuousSourceRef.current) {
      try {
        continuousSourceRef.current.stop();
        continuousSourceRef.current.disconnect();
      } catch {}
      continuousSourceRef.current = null;
    }

    const currentTrack = externalSample?.trackInfo || trackInfo;

    if (activeStemFilter && stemMixerRef.current && stemsResult) {
      if (ytPlayerRef.current?.contentWindow) {
        try {
          ytPlayerRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
            "*"
          );
        } catch {}
      }
      stemMixerRef.current.setSolo(activeStemFilter);
      stemMixerRef.current.play(validStart);
    } else if (customAudioBuffer) {
      if (ytPlayerRef.current?.contentWindow) {
        try {
          ytPlayerRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
            "*"
          );
        } catch {}
      }
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!continuousAudioCtxRef.current) {
        continuousAudioCtxRef.current = new AudioCtx();
      }
      const ctx = continuousAudioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const src = ctx.createBufferSource();
      src.buffer = customAudioBuffer;
      src.connect(ctx.destination);
      src.start(0, validStart);
      continuousSourceRef.current = src;
    } else if (stemsResult && stemMixerRef.current) {
      if (ytPlayerRef.current?.contentWindow) {
        try {
          ytPlayerRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
            "*"
          );
        } catch {}
      }
      stemMixerRef.current.setSolo(null);
      stemMixerRef.current.play(validStart);
    } else if (currentTrack?.youtubeId && ytPlayerRef.current?.contentWindow) {
      try {
        ytPlayerRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "unMute", args: [] }),
          "*"
        );
        ytPlayerRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "seekTo", args: [validStart, true] }),
          "*"
        );
        ytPlayerRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: [] }),
          "*"
        );
      } catch {}
    }

    if (playheadTimerRef.current) {
      cancelAnimationFrame(playheadTimerRef.current);
    }
    playheadStartOffsetRef.current = validStart;
    playheadStartClockRef.current = performance.now() / 1000;

    const tick = () => {
      if (!isPlayingSongRef.current) return;
      const elapsed = (performance.now() / 1000) - playheadStartClockRef.current;
      const curSec = playheadStartOffsetRef.current + elapsed;

      if (curSec >= totalDuration) {
        handleStopSong();
        return;
      }

      setPlaybackPointerSec(curSec);
      playbackPointerSecRef.current = curSec;

      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.setTime(curSec);
        } catch {}
      }

      playheadTimerRef.current = requestAnimationFrame(tick);
    };

    playheadTimerRef.current = requestAnimationFrame(tick);
  }, [totalDuration, externalSample, trackInfo, activeStemFilter, stemsResult, customAudioBuffer, handleStopSong]);

  const handlePlayPauseSong = useCallback(() => {
    if (isPlayingSong) {
      handlePauseSong();
    } else {
      handlePlaySongFrom(playbackPointerSec);
    }
  }, [isPlayingSong, playbackPointerSec, handlePauseSong, handlePlaySongFrom]);

  const handleSeekPointer = useCallback((newSec: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, Math.round(newSec * 10) / 10));
    setPlaybackPointerSec(clamped);
    playbackPointerSecRef.current = clamped;

    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.setTime(clamped);
      } catch {}
    }

    if (isPlayingSongRef.current) {
      handlePlaySongFrom(clamped);
    }
  }, [totalDuration, handlePlaySongFrom]);

  useEffect(() => {
    handleStopSongRef.current = handleStopSong;
  }, [handleStopSong]);

  useEffect(() => {
    handlePauseSongRef.current = handlePauseSong;
  }, [handlePauseSong]);

  useEffect(() => {
    handlePlaySongFromRef.current = handlePlaySongFrom;
  }, [handlePlaySongFrom]);

  useEffect(() => {
    handlePlayPauseSongRef.current = handlePlayPauseSong;
  }, [handlePlayPauseSong]);

  useEffect(() => {
    handleSeekPointerRef.current = handleSeekPointer;
  }, [handleSeekPointer]);

  // Selección de Filtro de Stems con AWAIT y carga en el botón
  const handleSelectStemFilter = useCallback(
    async (stem: StemType | null) => {
      if (loadingStem !== null) return;

      const nextStem = activeStemFilterRef.current === stem ? null : stem;

      // 1. Si se deselecciona o se vuelve a TODO (null)
      if (!nextStem) {
        setActiveStemFilter(null);
        activeStemFilterRef.current = null;
        if (stemMixerRef.current) {
          stemMixerRef.current.setSolo(null);
          if (!isPlayingSongRef.current) {
            stemMixerRef.current.stop();
          }
        }
        const ws = wavesurferRef.current;
        if (ws) {
          ws.setOptions({
            waveColor: ["#00E5FF", "#CCFF00", "#FF007A"],
            progressColor: ["#CCFF00", "#00E5FF", "#FF5500"],
          });
        }
        const currentDur = externalSample?.trackInfo?.durationSec || totalDuration;
        const currentBuffer = externalSample?.buffer || customAudioBuffer;
        const currentTrack = externalSample?.trackInfo || trackInfo;
        loadWaveformData(currentDur, currentBuffer, currentTrack, null, stemsResult);

        if (isPlayingSongRef.current) {
          handlePlaySongFrom(playbackPointerSecRef.current);
        }
        return;
      }

      // 2. Si ya tenemos stemsResult en memoria: cambio instantáneo sin espera
      if (stemsResult && stemsResult[nextStem]) {
        setActiveStemFilter(nextStem);
        activeStemFilterRef.current = nextStem;
        if (stemMixerRef.current) {
          stemMixerRef.current.setSolo(nextStem);
        }
        const ws = wavesurferRef.current;
        if (ws) {
          const colorMap = {
            drums: "#00E5FF",
            bass: "#CCFF00",
            melody: "#FF007A",
            vocals: "#FFD600",
          };
          ws.setOptions({
            waveColor: colorMap[nextStem],
            progressColor: "#FFFFFF",
          });
        }
        const currentDur = stemsResult.durationSec || totalDuration;
        const currentTrack = externalSample?.trackInfo || trackInfo;
        loadWaveformData(currentDur, stemsResult[nextStem], currentTrack, nextStem, stemsResult);

        if (isPlayingSongRef.current) {
          handlePlaySongFrom(playbackPointerSecRef.current);
        }
        return;
      }

      // 3. AWAIT: Separación asíncrona con estado de carga en el botón
      setLoadingStem(nextStem);
      try {
        const separated = await handleSeparateStems();
        if (separated && separated[nextStem]) {
          setActiveStemFilter(nextStem);
          activeStemFilterRef.current = nextStem;
          if (stemMixerRef.current) {
            stemMixerRef.current.loadStems(separated);
            stemMixerRef.current.setSolo(nextStem);
          }
          const ws = wavesurferRef.current;
          if (ws) {
            const colorMap = {
              drums: "#00E5FF",
              bass: "#CCFF00",
              melody: "#FF007A",
              vocals: "#FFD600",
            };
            ws.setOptions({
              waveColor: colorMap[nextStem],
              progressColor: "#FFFFFF",
            });
          }
          const currentDur = separated.durationSec || totalDuration;
          const currentTrack = externalSample?.trackInfo || trackInfo;
          loadWaveformData(currentDur, separated[nextStem], currentTrack, nextStem, separated);

          if (isPlayingSongRef.current) {
            handlePlaySongFrom(playbackPointerSecRef.current);
          }
        }
      } catch (err) {
        console.error("Error al procesar separación de stem:", err);
      } finally {
        setLoadingStem(null);
      }
    },
    [loadingStem, stemsResult, handleSeparateStems, externalSample, totalDuration, customAudioBuffer, trackInfo, loadWaveformData, handlePlaySongFrom]
  );

  // Sincronizar tasa de pitch y velocidad en el reproductor de YouTube
  const applyPitchRateToYouTube = useCallback((semi: number) => {
    if (!ytPlayerRef.current?.contentWindow) return;
    const exactRate = Math.pow(2, semi / 12);
    const clampedRate = Math.max(0.25, Math.min(2.0, exactRate));
    const roundedRate = Math.round(clampedRate * 100) / 100;

    // 1. Tasa decimal continua
    ytPlayerRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: "setPlaybackRate",
        args: [roundedRate],
      }),
      "*"
    );

    // 2. Tasa estándar soportada por el reproductor de YouTube
    const STANDARD_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const nearest = STANDARD_RATES.reduce((prev, curr) =>
      Math.abs(curr - clampedRate) < Math.abs(prev - clampedRate) ? curr : prev
    );
    ytPlayerRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: "setPlaybackRate",
        args: [nearest],
      }),
      "*"
    );
  }, []);

  // Disparar un Cue Point (con soporte para Akai 16 Levels: Tune, Velocity, Filter, Decay y límites sucesivos)
  const handleTriggerCue = useCallback(
    (
      cue: SamplerCuePoint,
      options?: {
        overridePitchSemi?: number;
        velocity?: number;
        filterCutoff?: number;
        duration?: number;
      }
    ) => {
      setActiveCueId(cue.id);
      setSelectedCueId(cue.id);

      // Sincronizar el cursor visual de WaveSurfer en el corte activado
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.setTime(cue.startSec);
        } catch {}
      }

      const activePitch = options?.overridePitchSemi !== undefined ? options.overridePitchSemi : pitchSemi;
      const velocity = options?.velocity ?? 1.0;
      const filterCutoff = options?.filterCutoff;

      // Límites sucesivos de corte: el marcador 1 termina en el marcador 2, el 2 en el 3, etc.
      const { naturalDurationSec } = getCueSliceLimits(
        cue.id,
        cues,
        totalDuration
      );

      // Factor de velocidad por pitch shifting
      const playbackRate = Math.pow(2, activePitch / 12);
      // Duración real en segundos de reproducción hasta alcanzar el siguiente marcador
      const playbackDurationSec = naturalDurationSec / playbackRate;
      // Duración efectiva (permite acortar si se indicó options.duration en 16 Levels DECAY)
      const effectiveDurSec =
        options?.duration !== undefined
          ? Math.min(options.duration / playbackRate, playbackDurationSec)
          : playbackDurationSec;

      // Cancelar temporizador previo de parada de corte
      if (sliceTimerRef.current) {
        clearTimeout(sliceTimerRef.current);
        sliceTimerRef.current = null;
      }

      const currentTrack = externalSample?.trackInfo || trackInfo;

      // 1. CANCIÓN CON STEMS AISLADOS (si el usuario aisló un instrumento: drums, bass, melody o vocals)
      if (activeStemFilter && stemMixerRef.current) {
        if (ytPlayerRef.current?.contentWindow) {
          try {
            ytPlayerRef.current.contentWindow.postMessage(
              JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
              "*"
            );
          } catch {}
        }
        // Si aún no se han cargado los stems en el mixer, inicializarlos inmediatamente
        if (!stemsResult) {
          const bpm = currentTrack?.bpm || 95;
          const key = currentTrack?.key || "Am";
          const genre = currentTrack?.genre || "funk";
          const synthStems = createStemsFromTrack(Math.min(180, Math.max(30, totalDuration)), bpm, key, genre);
          setStemsResult(synthStems);
          stemMixerRef.current.loadStems(synthStems);
          stemMixerRef.current.setSolo(activeStemFilter);
        }
        stemMixerRef.current.play(cue.startSec, effectiveDurSec);
      } else if (currentTrack?.youtubeId) {
        // CANCIÓN REAL DE YOUTUBE (C-DIGGER): Salta al startSec del chop y reproduce con Pitch Shifting
        const targetSec = cue.startSec;

        // Aplicar la velocidad/pitch al reproductor antes de reproducir
        applyPitchRateToYouTube(activePitch);

        // Añadir resonancia armónica tonal cuando el pitch está modificado
        studioAudio.playPitchHarmonic(activePitch, cue.keyNote || currentTrack?.key, velocity, filterCutoff);

        if (ytPlayerRef.current?.contentWindow) {
          try {
            ytPlayerRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "unMute",
                args: [],
              }),
              "*"
            );
            ytPlayerRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "seekTo",
                args: [targetSec, true],
              }),
              "*"
            );
            ytPlayerRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "playVideo",
                args: [],
              }),
              "*"
            );
          } catch {}
        }

        // Re-confirmar el playbackRate justo tras seekTo para que YouTube no lo reseteé a 1.0
        setTimeout(() => {
          applyPitchRateToYouTube(activePitch);
        }, 80);
      } else if (customAudioBuffer || (activeStemFilter && stemMixerRef.current)) {
        // 2. Audio Decodificado en Web Audio (archivo local cargado por el usuario o Stems)
        const sliceDuration =
          triggerMode === "full_track"
            ? (customAudioBuffer?.duration || totalDuration) - cue.startSec
            : options?.duration !== undefined
            ? options.duration
            : naturalDurationSec;

        if (activeStemFilter && stemMixerRef.current) {
          stemMixerRef.current.play(cue.startSec, sliceDuration);
        } else if (customAudioBuffer) {
          studioAudio.playSamplerSlice(
            { startSec: cue.startSec, duration: sliceDuration },
            {
              pitchSemi: activePitch,
              velocity,
              filterCutoff,
              duration: sliceDuration,
            },
            customAudioBuffer
          );
        }
      }

      // MODOS DE DISPARO:
      // a) one_shot: dura hasta el siguiente marcador (límite sucesivo) o decay
      // b) hold: suena mientras se mantenga; corte de seguridad en el siguiente marcador
      // c) full_track: suena toda la canción sin detenerse
      if (triggerMode === "one_shot" || triggerMode === "hold") {
        const stopDelay = Math.max(60, Math.round(effectiveDurSec * 1000));
        sliceTimerRef.current = setTimeout(() => {
          handleStopAudio();
        }, stopDelay);
      }

      if (triggerMode !== "hold") {
        setTimeout(() => {
          setActiveCueId((current) => (current === cue.id ? null : current));
        }, Math.min(220, effectiveDurSec * 1000));
      }
    },
    [pitchSemi, customAudioBuffer, trackInfo?.youtubeId, trackInfo?.key, triggerMode, applyPitchRateToYouTube, handleStopAudio, getCueSliceLimits, activeStemFilter, cues, stemsResult, totalDuration]
  );

  // Disparar Pad del modo Akai MPC 16 Levels (Tune, Velocity, Filter, Decay)
  const handleTrigger16Level = useCallback(
    (padNum: number) => {
      setActive16LevelPad(padNum);
      const targetCue = cues.find((c) => c.id === selectedCueId) || cues[0] || DEFAULT_CUES[0];

      if (akai16Type === "tune") {
        const semiOffset = AKAI_16_LEVELS_SEMITONES[padNum - 1] ?? 0;
        handleTriggerCue(targetCue, { overridePitchSemi: semiOffset });
      } else if (akai16Type === "velocity") {
        const vel = AKAI_16_LEVELS_VELOCITIES[padNum - 1] ?? 1.0;
        handleTriggerCue(targetCue, { velocity: vel });
      } else if (akai16Type === "filter") {
        const cutoff = AKAI_16_LEVELS_FILTERS[padNum - 1] ?? 18000;
        handleTriggerCue(targetCue, { filterCutoff: cutoff });
      } else if (akai16Type === "decay") {
        const decaySec = AKAI_16_LEVELS_DECAYS[padNum - 1] ?? 3.5;
        handleTriggerCue(targetCue, { duration: decaySec });
      }

      if (triggerMode !== "hold") {
        setTimeout(() => {
          setActive16LevelPad((curr) => (curr === padNum ? null : curr));
        }, 180);
      }
    },
    [cues, selectedCueId, akai16Type, handleTriggerCue, triggerMode]
  );

  // Refs para evitar cierres obsoletos en los event listeners de WaveSurfer
  const cuesRef = useRef(cues);
  const selectedCueIdRef = useRef(selectedCueId);
  const totalDurationRef = useRef(totalDuration);
  const triggerModeRef = useRef(triggerMode);
  const handleTriggerCueRef = useRef(handleTriggerCue);
  const handleStopAudioRef = useRef(handleStopAudio);
  const handleAddCueRef = useRef<((targetSec?: number) => void) | null>(null);

  useEffect(() => {
    cuesRef.current = cues;
    selectedCueIdRef.current = selectedCueId;
    totalDurationRef.current = totalDuration;
    triggerModeRef.current = triggerMode;
    handleTriggerCueRef.current = handleTriggerCue;
    handleStopAudioRef.current = handleStopAudio;
  });

  // Sincronizar los marcadores de WaveSurfer con la lista de chops de Serato (Líneas y Agujas sucesivas, no cajas)
  const syncRegions = useCallback((cuesList: SamplerCuePoint[], dur: number) => {
    const rp = regionsPluginRef.current;
    if (!rp) return;

    rp.clearRegions();

    const validDur = Math.max(10, dur || totalDurationRef.current || 180);
    const sorted = [...cuesList].sort((a, b) => a.startSec - b.startSec);
    sorted.forEach((cue, idx) => {
      const safeStart = Math.max(0, Math.min(validDur - 0.05, cue.startSec));
      const nextCue = idx < sorted.length - 1 ? sorted[idx + 1] : null;
      const endLimit = nextCue ? nextCue.startSec : validDur;
      const sliceLen = Math.max(0.1, endLimit - cue.startSec).toFixed(1);

      // Marcador puntual puro: start === end, sin cajas de rango que tapen la forma de onda
      const reg = rp.addRegion({
        id: String(cue.id),
        start: safeStart,
        end: safeStart,
        color: "transparent",
        drag: true,
        resize: false,
        avoidOverlapping: false,
      });

      if (reg.element) {
        reg.element.style.background = "transparent";
        reg.element.style.backgroundColor = "transparent";
        reg.element.style.border = "none";
        reg.element.style.boxShadow = "none";
        reg.element.style.overflow = "visible";
        reg.element.style.zIndex = selectedCueIdRef.current === cue.id ? "35" : "25";
      }

      const isSelected = selectedCueIdRef.current === cue.id;
      const keyHint = PAD_DISPLAY_KEYS[cue.id] || String(cue.id);

      // Contenedor del marcador completo: Bandera + Flecha + Aguja vertical + Punto inferior
      const markerWrapper = document.createElement("div");
      markerWrapper.className = "serato-needle-marker";
      markerWrapper.dataset.cueId = String(cue.id);
      markerWrapper.style.position = "absolute";
      markerWrapper.style.top = "0";
      markerWrapper.style.bottom = "0";
      markerWrapper.style.left = "-12px";
      markerWrapper.style.width = "24px";
      markerWrapper.style.display = "flex";
      markerWrapper.style.flexDirection = "column";
      markerWrapper.style.alignItems = "center";
      markerWrapper.style.cursor = "ew-resize";
      markerWrapper.style.userSelect = "none";
      markerWrapper.style.pointerEvents = "auto";
      markerWrapper.title = `CHOP ${cue.id} [${keyHint}]: ${cue.name}\n• Rango: ${formatSeconds(cue.startSec)} ➔ ${formatSeconds(endLimit)} (${sliceLen}s)\n• Límite: ${nextCue ? `Marcador #${nextCue.id}` : "Final del audio"}\n• Arrastra dentro de sus límites | Clic para reproducir`;

      // 1. Bandera superior / Pin Flag
      const flag = document.createElement("div");
      flag.className = "marker-flag";
      flag.style.display = "flex";
      flag.style.alignItems = "center";
      flag.style.justifyContent = "center";
      flag.style.gap = "2px";
      flag.style.padding = "2px 5px";
      flag.style.backgroundColor = cue.color;
      flag.style.color = "#07080B";
      flag.style.fontWeight = "900";
      flag.style.fontSize = "10px";
      flag.style.fontFamily = "monospace";
      flag.style.borderRadius = "3px";
      flag.style.boxShadow = isSelected
        ? `0 0 14px ${cue.color}, 0 2px 6px rgba(0,0,0,0.9)`
        : "0 2px 6px rgba(0,0,0,0.85)";
      flag.style.border = isSelected ? "1.5px solid #FFFFFF" : "1px solid rgba(0,0,0,0.6)";
      flag.style.transform = isSelected ? "scale(1.15)" : "scale(1)";
      flag.style.transition = "transform 0.1s ease, box-shadow 0.1s ease";
      flag.style.lineHeight = "1";
      flag.innerHTML = `<span>${cue.id}</span><span style="opacity:0.85;font-size:7.5px;">[${keyHint}]</span>`;

      // 2. Pequeño triángulo indicador hacia abajo debajo de la bandera
      const arrow = document.createElement("div");
      arrow.className = "marker-arrow";
      arrow.style.width = "0";
      arrow.style.height = "0";
      arrow.style.borderLeft = "4px solid transparent";
      arrow.style.borderRight = "4px solid transparent";
      arrow.style.borderTop = `5px solid ${cue.color}`;
      arrow.style.marginTop = "-1px";

      // 3. Aguja vertical que atraviesa la onda de arriba a abajo
      const needle = document.createElement("div");
      needle.className = "marker-needle";
      needle.style.flex = "1";
      needle.style.width = isSelected ? "2.5px" : "1.5px";
      needle.style.backgroundColor = cue.color;
      needle.style.boxShadow = isSelected ? `0 0 8px ${cue.color}` : "none";
      needle.style.opacity = isSelected ? "1" : "0.9";
      needle.style.transition = "width 0.1s ease, box-shadow 0.1s ease";

      // 4. Punto / Diamante inferior de anclaje
      const dot = document.createElement("div");
      dot.className = "marker-dot";
      dot.style.width = "5px";
      dot.style.height = "5px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = cue.color;
      dot.style.marginBottom = "2px";
      dot.style.boxShadow = isSelected ? `0 0 6px ${cue.color}` : "none";

      markerWrapper.appendChild(flag);
      markerWrapper.appendChild(arrow);
      markerWrapper.appendChild(needle);
      markerWrapper.appendChild(dot);

      reg.setContent(markerWrapper);
    });
  }, []);

  // Inicializar WaveSurfer V8 con Plugins de Regions y Zoom
  useEffect(() => {
    if (!isOpen || !waveformContainerRef.current) return;

    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.destroy();
      } catch {}
      wavesurferRef.current = null;
    }

    const regPlugin = RegionsPlugin.create();
    regionsPluginRef.current = regPlugin;

    const zoomPlugin = ZoomPlugin.create({
      scale: 0.5,
      maxZoom: 350,
      deltaThreshold: 5,
      exponentialZooming: true,
    });

    const ws = WaveSurfer.create({
      container: waveformContainerRef.current,
      height: 64,
      backend: "WebAudio",
      waveColor: ["#00E5FF", "#CCFF00", "#FF007A"], // Gradiente espectral Serato RGB
      progressColor: ["#CCFF00", "#00E5FF", "#FF5500"], // Máscara de progreso
      cursorColor: "#FFFFFF",
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 3, // Píldoras redondeadas orgánicas suaves
      barHeight: 1.15,
      minPxPerSec: zoomLevel,
      fillParent: true,
      autoScroll: true,
      autoCenter: false,
      interact: true,
      dragToSeek: true,
      hideScrollbar: false,
      plugins: [regPlugin, zoomPlugin],
    });

    wavesurferRef.current = ws;

    // Sincronizar nivel de zoom en el UI con la rueda del ratón
    ws.on("zoom", (newMinPxPerSec) => {
      setZoomLevel(Math.round(newMinPxPerSec));
    });

    // Cuando el audio se decodifica en WaveSurfer
    ws.on("ready", (dur) => {
      setIsWaveReady(true);
      const effectiveDur = dur || totalDurationRef.current || 180;
      if (waveformContainerRef.current) {
        const containerWidth = waveformContainerRef.current.clientWidth || 850;
        const fitPx = Math.max(2, Math.floor(containerWidth / effectiveDur));
        setZoomLevel(fitPx);
        try {
          ws.zoom(fitPx);
        } catch {}
      }
      syncRegions(cuesRef.current, effectiveDur);
    });

    // Cargar inmediatamente la forma de onda con los datos de audio activos
    const currentDur = (externalSample?.trackInfo?.durationSec) || totalDuration;
    const currentBuffer = externalSample?.buffer || customAudioBuffer;
    const currentTrack = externalSample?.trackInfo || trackInfo;
    loadWaveformData(currentDur, currentBuffer, currentTrack, activeStemFilterRef.current, stemsResult);

    // Scrubbing analógico en tiempo real mientras se arrastra una región (límites sucesivos)
    regPlugin.on("region-update", (region) => {
      // Clamping estricto: el límite del marcador 1 es el 2, etc. (no pueden cruzarse)
      const { dragMinSec, dragMaxSec } = getCueSliceLimits(
        Number(region.id),
        cuesRef.current,
        totalDurationRef.current
      );
      let currentSec = Math.round(region.start * 10) / 10;
      if (currentSec < dragMinSec) {
        currentSec = dragMinSec;
        try {
          region.setOptions({ start: dragMinSec, end: dragMinSec });
        } catch {}
      } else if (currentSec > dragMaxSec) {
        currentSec = dragMaxSec;
        try {
          region.setOptions({ start: dragMaxSec, end: dragMaxSec });
        } catch {}
      }

      const delta = currentSec - lastScrubSecRef.current;
      if (Math.abs(delta) >= 0.1) {
        lastScrubSecRef.current = currentSec;
        const dir: "forward" | "backward" = delta >= 0 ? "forward" : "backward";
        setScrubDirection(dir);
        setDraggingCueId(Number(region.id));
        studioAudio.scrubVinyl(dir, Math.abs(delta) * 50, currentSec, customAudioBuffer);

        if (trackInfo?.youtubeId && ytPlayerRef.current?.contentWindow) {
          ytPlayerRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: "command",
              func: "seekTo",
              args: [currentSec, true],
            }),
            "*"
          );
        }

        if (scrubSilenceTimerRef.current) {
          clearTimeout(scrubSilenceTimerRef.current);
        }
        scrubSilenceTimerRef.current = setTimeout(() => {
          studioAudio.stopScrub();
          setScrubDirection(null);
          setDraggingCueId(null);
        }, 90);
      }
    });

    // Cuando se finaliza el arrastre de una región
    regPlugin.on("region-updated", (region) => {
      const { dragMinSec, dragMaxSec } = getCueSliceLimits(
        Number(region.id),
        cuesRef.current,
        totalDurationRef.current
      );
      const finalizedSec = Math.max(
        dragMinSec,
        Math.min(dragMaxSec, Math.round(region.start * 10) / 10)
      );

      setDraggingCueId(null);
      setScrubDirection(null);
      studioAudio.stopScrub();
      if (scrubSilenceTimerRef.current) {
        clearTimeout(scrubSilenceTimerRef.current);
        scrubSilenceTimerRef.current = null;
      }

      // Asegurar que siga siendo un marcador puntual (start === end, sin caja)
      try {
        region.setOptions({ start: finalizedSec, end: finalizedSec });
      } catch {}

      isInternalRegionUpdateRef.current = true;
      const updatedCues = cuesRef.current.map((c) =>
        String(c.id) === region.id ? { ...c, startSec: finalizedSec } : c
      );
      cuesRef.current = updatedCues;
      setCues(updatedCues);

      // Actualizar tooltips en todas las regiones para reflejar las nuevas duraciones
      try {
        const rp = regionsPluginRef.current;
        if (rp) {
          rp.getRegions().forEach((r) => {
            const limits = getCueSliceLimits(Number(r.id), updatedCues, totalDurationRef.current);
            const keyHint = PAD_DISPLAY_KEYS[Number(r.id)] || r.id;
            const markerWrapper = r.element?.querySelector(".serato-needle-marker") as HTMLElement | null;
            if (markerWrapper) {
              markerWrapper.title = `CHOP ${r.id} [${keyHint}]\n• Rango: ${formatSeconds(limits.startSec)} ➔ ${formatSeconds(limits.endLimitSec)} (${limits.naturalDurationSec.toFixed(1)}s)\n• Límite: ${limits.nextCue ? `Marcador #${limits.nextCue.id}` : "Final del audio"}\n• Arrastra dentro de sus límites | Clic para reproducir`;
            }
          });
        }
      } catch {}

      const cue = updatedCues.find((c) => String(c.id) === region.id);
      if (cue) {
        if (triggerModeRef.current === "hold") {
          handleStopAudioRef.current();
        } else {
          handleTriggerCueRef.current({ ...cue, startSec: finalizedSec });
        }
      }
    });

    // Clic directo sobre una región para disparar el chop
    regPlugin.on("region-clicked", (region, e) => {
      e.stopPropagation();
      const cue = cuesRef.current.find((c) => String(c.id) === region.id);
      if (cue) {
        setSelectedCueId(cue.id);
        handleTriggerCueRef.current(cue);
      }
    });

    // Clic en la forma de onda: Mueve y posiciona el Puntero de Reproducción Dedicado
    ws.on("click", (relativeX) => {
      const clickedSec = Math.round(relativeX * totalDurationRef.current * 10) / 10;
      if (handleSeekPointerRef.current) {
        handleSeekPointerRef.current(clickedSec);
      }
    });

    return () => {
      try {
        ws.destroy();
      } catch {}
      wavesurferRef.current = null;
      regionsPluginRef.current = null;
      setIsWaveReady(false);
    };
  }, [isOpen]);

  // Cargar buffer de audio en WaveSurfer
  useEffect(() => {
    if (!wavesurferRef.current || !customAudioBuffer) return;
    try {
      const dur = customAudioBuffer.duration || totalDuration;
      const points = Math.max(2400, Math.min(8000, Math.floor(dur * 35)));
      const peaks = extractStemPeaks(customAudioBuffer, points);
      wavesurferRef.current.load("", [peaks], dur).catch((err) => {
        if (err?.name !== "AbortError") console.warn("WaveSurfer load buffer notice:", err);
      });
    } catch (err) {
      console.error("Error loading buffer peaks into WaveSurfer:", err);
    }
  }, [customAudioBuffer, totalDuration]);

  // Sincronizar regiones cuando la lista de cues cambie desde botones (Auto-Slice, Random, Add, Delete)
  useEffect(() => {
    if (isInternalRegionUpdateRef.current) {
      isInternalRegionUpdateRef.current = false;
      return;
    }
    if (wavesurferRef.current && isWaveReady) {
      syncRegions(cues, totalDuration);
    }
  }, [cues, totalDuration, isWaveReady, syncRegions]);

  // Resaltar visualmente el marcador seleccionado (bandera, aguja, punto) sin cajas
  useEffect(() => {
    const rp = regionsPluginRef.current;
    if (!rp) return;
    try {
      const all = rp.getRegions();
      all.forEach((reg) => {
        const isSelected = reg.id === String(selectedCueId);
        if (reg.element) {
          reg.element.style.background = "transparent";
          reg.element.style.backgroundColor = "transparent";
          reg.element.style.border = "none";
          reg.element.style.boxShadow = "none";
          reg.element.style.zIndex = isSelected ? "40" : "25";

          const cue = cuesRef.current.find((c) => String(c.id) === reg.id);
          const color = cue?.color || "#CCFF00";

          const flag = reg.element.querySelector(".marker-flag") as HTMLElement | null;
          if (flag) {
            flag.style.transform = isSelected ? "scale(1.15)" : "scale(1)";
            flag.style.border = isSelected ? "1.5px solid #FFFFFF" : "1px solid rgba(0,0,0,0.6)";
            flag.style.boxShadow = isSelected
              ? `0 0 14px ${color}, 0 2px 6px rgba(0,0,0,0.9)`
              : "0 2px 6px rgba(0,0,0,0.85)";
          }

          const needle = reg.element.querySelector(".marker-needle") as HTMLElement | null;
          if (needle) {
            needle.style.width = isSelected ? "2.5px" : "1.5px";
            needle.style.boxShadow = isSelected ? `0 0 8px ${color}` : "none";
            needle.style.opacity = isSelected ? "1" : "0.9";
          }

          const dot = reg.element.querySelector(".marker-dot") as HTMLElement | null;
          if (dot) {
            dot.style.boxShadow = isSelected ? `0 0 6px ${color}` : "none";
          }
        }
      });
    } catch {}
  }, [selectedCueId]);

  // Controladores de Zoom interactivo
  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(2, Math.min(300, newZoom));
    setZoomLevel(clamped);
    if (wavesurferRef.current && isWaveReady) {
      try {
        wavesurferRef.current.zoom(clamped);
      } catch {}
    }
  };

  const handleResetZoom = () => {
    if (!waveformContainerRef.current) return;
    const containerWidth = waveformContainerRef.current.clientWidth || 800;
    const fitZoom = Math.max(2, Math.floor(containerWidth / Math.max(1, totalDuration)));
    setZoomLevel(fitZoom);
    if (wavesurferRef.current && isWaveReady) {
      try {
        wavesurferRef.current.zoom(fitZoom);
      } catch {}
    }
  };

  // Agregar nuevo Cue Point (hasta 16 estilo Serato)
  const handleAddCue = (targetSec?: number) => {
    if (cues.length >= 16) {
      alert("Límite de 16 Cues alcanzado (Estándar Serato Sample).");
      return;
    }

    // Buscar el menor ID disponible del 1 al 16
    const existingIds = new Set(cues.map((c) => c.id));
    let newId = 1;
    while (existingIds.has(newId) && newId <= 16) {
      newId++;
    }
    if (newId > 16) newId = cues.length + 1;

    const sliceSec =
      targetSec !== undefined
        ? Math.max(0, Math.min(totalDuration, targetSec))
        : Math.round(((cues.length * (totalDuration / (cues.length + 1)))) * 10) / 10;

    const newColor = SERATO_COLORS[(newId - 1) % SERATO_COLORS.length];
    const newCue: SamplerCuePoint = {
      id: newId,
      name: `CHOP ${newId} (${formatSeconds(sliceSec)})`,
      startSec: sliceSec,
      color: newColor,
      active: true,
    };

    const nextCues = [...cues, newCue].sort((a, b) => a.id - b.id);
    setCues(nextCues);
    setSelectedCueId(newId);

    if (newId > 8 && activeBank === "A") {
      setActiveBank("ALL");
    }

    handleTriggerCue(newCue);
  };

  useEffect(() => {
    handleAddCueRef.current = handleAddCue;
  });

  // Eliminar un Cue Point
  const handleDeleteCue = (e: React.MouseEvent, cueId: number) => {
    e.stopPropagation();
    if (cues.length <= 1) {
      alert("Debes conservar al menos 1 Cue point.");
      return;
    }
    setCues((prev) => prev.filter((c) => c.id !== cueId));
    if (selectedCueId === cueId) {
      setSelectedCueId(null);
    }
  };

  // Renombrar Cue Point en línea
  const handleStartRename = (e: React.MouseEvent, cue: SamplerCuePoint) => {
    e.stopPropagation();
    setEditingCueId(cue.id);
    setEditingCueName(cue.name);
  };

  const handleSaveRename = (cueId: number) => {
    if (editingCueName.trim()) {
      setCues((prev) =>
        prev.map((c) => (c.id === cueId ? { ...c, name: editingCueName.trim().toUpperCase() } : c))
      );
    }
    setEditingCueId(null);
  };

  // Auto Slicing Serato: 8 o 16 Chops
  const handleAutoSlice = (count: 8 | 16) => {
    const sliceLen = totalDuration / count;
    const newCues: SamplerCuePoint[] = Array.from({ length: count }).map((_, idx) => {
      const id = idx + 1;
      const startSec = Math.round(idx * sliceLen * 10) / 10;
      return {
        id,
        name: `CHOP ${id} (${formatSeconds(startSec)})`,
        startSec,
        color: SERATO_COLORS[(id - 1) % SERATO_COLORS.length],
        active: true,
      };
    });
    setCues(newCues);
    setSelectedCueId(1);
    if (count === 16 && activeBank === "A") {
      setActiveBank("ALL");
    }
    handleTriggerCue(newCues[0]);
  };

  // Random Chops estilo MPC / Samplette (sucesivos y ordenados cronológicamente)
  const handleRandomChops = (count = 8) => {
    const step = totalDuration / count;
    const times: number[] = [];
    for (let idx = 0; idx < count; idx++) {
      const base = idx * step;
      const jitter = (Math.random() * 0.5 - 0.25) * step;
      const startSec = Math.max(0, Math.min(totalDuration - 1, Math.round((base + jitter) * 10) / 10));
      times.push(startSec);
    }
    times.sort((a, b) => a - b);
    for (let i = 1; i < times.length; i++) {
      if (times[i] <= times[i - 1]) {
        times[i] = Math.min(totalDuration - 0.1, Math.round((times[i - 1] + 0.5) * 10) / 10);
      }
    }
    const newCues: SamplerCuePoint[] = times.map((sec, idx) => {
      const id = idx + 1;
      return {
        id,
        name: `CHOP ${id} (${formatSeconds(sec)})`,
        startSec: sec,
        color: SERATO_COLORS[(id - 1) % SERATO_COLORS.length],
        active: true,
      };
    });
    setCues(newCues);
    setSelectedCueId(1);
    handleTriggerCue(newCues[0]);
  };

  // Atajos de teclado físicos (Soporta Serato Chops y Akai 16 Levels con modo HOLD y monophonic choke)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (handlePlayPauseSongRef.current) {
          handlePlayPauseSongRef.current();
        } else {
          handleStopAudio();
        }
        return;
      }

      if (e.code === "Delete" || e.code === "Backspace") {
        if (selectedCueId !== null && cues.length > 1 && !is16Levels) {
          e.preventDefault();
          setCues((prev) => prev.filter((c) => c.id !== selectedCueId));
          setSelectedCueId(null);
          return;
        }
      }

      const padId = KEY_PAD_MAP[e.key];
      if (padId !== undefined) {
        if (!e.repeat) {
          e.preventDefault();
          activeKeysDownRef.current.add(e.key.toLowerCase());
          if (is16Levels) {
            handleTrigger16Level(padId);
          } else {
            const targetCue = cues.find((c) => c.id === padId);
            if (targetCue) {
              handleTriggerCue(targetCue);
            }
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const padId = KEY_PAD_MAP[e.key];
      if (padId !== undefined) {
        activeKeysDownRef.current.delete(e.key.toLowerCase());
        // En modo HOLD, al soltar la tecla corta el sonido de inmediato
        if (triggerMode === "hold") {
          if (activeKeysDownRef.current.size === 0) {
            handleStopAudio();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isOpen, cues, selectedCueId, is16Levels, triggerMode, handleTriggerCue, handleTrigger16Level, handleStopAudio]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSampleName(file.name.toUpperCase());
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const arrayBuffer = ev.target?.result as ArrayBuffer;
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const tempCtx = new AudioCtx();
        const decoded = await tempCtx.decodeAudioData(arrayBuffer);
        setTrackInfo(null);
        setCustomAudioBuffer(decoded);

        const sliceLen = decoded.duration / 8;
        const autoCues: SamplerCuePoint[] = Array.from({ length: 8 }).map((_, idx) => {
          const id = idx + 1;
          const startSec = Math.round(idx * sliceLen * 10) / 10;
          return {
            id,
            name: `CHOP ${id} (${formatSeconds(startSec)})`,
            startSec,
            color: SERATO_COLORS[idx % SERATO_COLORS.length],
            active: true,
          };
        });
        setCues(autoCues);
        setSelectedCueId(1);
      } catch (err) {
        console.error("Error decoding audio file:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDropAudio = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setSampleName(file.name.toUpperCase());
    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const tempCtx = new AudioCtx();
      const decoded = await tempCtx.decodeAudioData(arrayBuffer);
      setTrackInfo(null);
      setCustomAudioBuffer(decoded);

      const sliceLen = decoded.duration / 8;
      const autoCues: SamplerCuePoint[] = Array.from({ length: 8 }).map((_, idx) => {
        const id = idx + 1;
        const startSec = Math.round(idx * sliceLen * 10) / 10;
        return {
          id,
          name: `CHOP ${id} (${formatSeconds(startSec)})`,
          startSec,
          color: SERATO_COLORS[idx % SERATO_COLORS.length],
          active: true,
        };
      });
      setCues(autoCues);
      setSelectedCueId(1);
    } catch (err) {
      console.error("Error decoding dropped audio file:", err);
    }
  };

  // Filtrado de pads según el banco activo
  const visibleCues = useMemo(() => {
    if (activeBank === "A") {
      return cues.filter((c) => c.id <= 8);
    }
    if (activeBank === "B") {
      return cues.filter((c) => c.id > 8);
    }
    return cues;
  }, [cues, activeBank]);

  if (!isStandalone && !isOpen) return null;

  return (
    <div
      suppressHydrationWarning
      style={
        isStandalone
          ? {
              minHeight: "100vh",
              width: "100%",
              backgroundColor: "#080A0F",
              backgroundImage: "radial-gradient(#1E2436 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              color: "#F9FBE5",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 20px",
              boxSizing: "border-box",
              fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
            }
          : {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#080A0F",
              zIndex: 220,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px",
              fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
            }
      }
    >
      {/* 0. OUTSIDE TOP BAR: Volver a la radio, C-Digger y DAW */}
      {isStandalone && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: "1180px",
            marginBottom: "10px",
            flexShrink: 0,
            gap: "12px",
          }}
        >
          <Link
            href="/"
            className="neo-button fun-hover-wobble"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              backgroundColor: "#161922",
              color: "#CCFF00",
              border: "2px solid #CCFF00",
              boxShadow: "2px 2px 0px #CCFF00",
              borderRadius: "4px",
              fontSize: "0.7rem",
              fontWeight: 900,
              textDecoration: "none",
              cursor: "pointer",
            }}
            title="Volver a la señal en vivo de Radio Doble C"
          >
            <ArrowLeft size={13} />
            <span>VOLVER A LA RADIO</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "#94A3B8", letterSpacing: "0.5px" }}>
              RADIO DOBLE C · <span style={{ color: "#CCFF00" }}>C-SAMPLER LAB</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {onOpenDigger && (
              <button
                type="button"
                onClick={onOpenDigger}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 12px",
                  backgroundColor: "#161B26",
                  color: "#CCFF00",
                  border: "1px solid #CCFF00",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                title="Explorar y samplear vinilos en C-Digger"
              >
                <Disc size={13} />
                <span>IR A C-DIGGER</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropAudio}
        style={{
          width: "100%",
          maxWidth: "1180px",
          backgroundColor: "#0D0F16",
          border: "2.5px solid #CCFF00",
          borderRadius: "6px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 18px 70px rgba(0,0,0,0.95)",
          overflow: "hidden",
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "7px 16px",
            backgroundColor: "#161924",
            borderBottom: "1.5px solid #242938",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                backgroundColor: "#CCFF00",
                color: "#111111",
                fontWeight: 900,
                fontSize: "0.64rem",
                padding: "2px 6px",
                borderRadius: "2px",
                letterSpacing: "0.5px",
              }}
            >
              SERATO SAMPLE VST
            </div>
            <span style={{ fontWeight: 900, fontSize: "0.86rem", color: "#FFFFFF", letterSpacing: "0.8px" }}>
              C-SAMPLER <span style={{ color: "#CCFF00" }}>DYNAMIC CUE &amp; SLICE LAB</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "2px 6px",
                backgroundColor: "transparent",
                border: "none",
                color: "#A6ADC2",
                cursor: "pointer",
              }}
              title="Cerrar sampler"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Live Audio Source Banner (YouTube Vinyl) */}
        {(() => {
          const activeTrack = externalSample?.trackInfo || trackInfo;
          if (!activeTrack?.youtubeId) return null;
          return (
            <div
              style={{
                padding: "5px 16px",
                backgroundColor: "#10131E",
                borderBottom: "1px solid #232A3B",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#CCFF00",
                    boxShadow: "0 0 8px #CCFF00",
                    display: "inline-block",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.58rem", fontWeight: 900, color: "#CCFF00", letterSpacing: "0.4px" }}>
                    VINILO EN VIVO:
                  </span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#FFFFFF" }}>
                    {activeTrack.artist || "Artista"} — {activeTrack.title || "Pista"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={handleStopAudio}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 8px",
                    backgroundColor: "#202638",
                    color: "#FF3366",
                    border: "1px solid #FF3366",
                    borderRadius: "3px",
                    fontSize: "0.62rem",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 1px 6px rgba(255, 51, 102, 0.25)",
                  }}
                  title="Pausar / Detener audio (Tecla Espacio)"
                >
                  <Square size={9} fill="#FF3366" />
                  <span>STOP (ESPACIO)</span>
                </button>

                <div
                  style={{
                    width: "140px",
                    height: "58px",
                    borderRadius: "4px",
                    overflow: "hidden",
                    border: "1.5px solid #323A50",
                    backgroundColor: "#000000",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.8)",
                    position: "relative",
                  }}
                  title="Reproductor de Audio YouTube de C-Digger"
                >
                  <iframe
                    ref={ytPlayerRef}
                    key={activeTrack.youtubeId}
                    id="csampler-yt-audio-player"
                    src={buildSampletteYouTubeEmbedUrl(activeTrack.youtubeId, {
                      enableJsApi: true,
                      controls: false,
                      autoplay: false,
                    })}
                    title={`${activeTrack.artist || "Vinyl"} - ${activeTrack.title || "Track"}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => {
                    if (ytPlayerRef.current?.contentWindow) {
                      try {
                        ytPlayerRef.current.contentWindow.postMessage(
                          JSON.stringify({ event: "listening" }),
                          "*"
                        );
                        ytPlayerRef.current.contentWindow.postMessage(
                          JSON.stringify({ event: "command", func: "addEventListener", args: ["onError"] }),
                          "*"
                        );
                        ytPlayerRef.current.contentWindow.postMessage(
                          JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }),
                          "*"
                        );
                        ytPlayerRef.current.contentWindow.postMessage(
                          JSON.stringify({ event: "command", func: "unMute", args: [] }),
                          "*"
                        );
                      } catch {}
                    }
                  }}
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              </div>
            </div>
          </div>
        );
      })()}

        {/* Modal Main Content */}
        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "86vh", overflowY: "auto" }}>
          {/* 1. Track Info & Action Tools */}
          <div
            style={{
              backgroundColor: "#07080B",
              border: "1.5px solid #232838",
              borderRadius: "5px",
              padding: "7px 12px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Disc size={14} style={{ color: "#CCFF00" }} className="animate-spin" />
                <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#FFFFFF", fontFamily: "monospace" }}>
                  {sampleName}
                </span>
                <span
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 900,
                    backgroundColor: "#1F2536",
                    color: "#CCFF00",
                    padding: "1px 5px",
                    borderRadius: "2px",
                    border: "1px solid #333D56",
                  }}
                >
                  {cues.length} CUES
                </span>
                {isYtRestricted && (
                  <span
                    style={{
                      fontSize: "0.54rem",
                      fontWeight: 900,
                      backgroundColor: "#2E1018",
                      color: "#FF3366",
                      border: "1px solid #FF3366",
                      padding: "1px 6px",
                      borderRadius: "2px",
                      letterSpacing: "0.4px",
                    }}
                  >
                    ⚠️ BLOQUEO LATINAUTOR · AUDIO RESCATADO EN RAM
                  </span>
                )}
              </div>

              {/* Serato Slicing Tools & Add Cue */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {onOpenDigger && (
                  <button
                    onClick={onOpenDigger}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 9px",
                      backgroundColor: "#2B1115",
                      color: "#FF3366",
                      border: "1.5px solid #FF3366",
                      borderRadius: "3px",
                      fontSize: "0.68rem",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                    title="Explorar vinilos en YouTube con C-Digger"
                  >
                    <span>📻</span>
                    <span>C-DIGGER YOUTUBE</span>
                  </button>
                )}

                <button
                  onClick={() => handleAddCue()}
                  disabled={cues.length >= 16}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    padding: "3px 8px",
                    backgroundColor: "#162B1D",
                    color: "#00E676",
                    border: "1.2px solid #00E676",
                    borderRadius: "3px",
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    cursor: cues.length >= 16 ? "not-allowed" : "pointer",
                    opacity: cues.length >= 16 ? 0.5 : 1,
                  }}
                  title="Agregar un nuevo Cue Point (hasta 16)"
                >
                  <Plus size={11} />
                  <span>+ CUE</span>
                </button>

                <button
                  onClick={() => handleAutoSlice(8)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    padding: "3px 8px",
                    backgroundColor: "#182235",
                    color: "#00E5FF",
                    border: "1px solid #00E5FF",
                    borderRadius: "3px",
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                  title="Dividir en 8 chops simétricos estilo Serato"
                >
                  <Scissors size={11} />
                  <span>SLICE 8</span>
                </button>

                <button
                  onClick={() => handleAutoSlice(16)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    padding: "3px 8px",
                    backgroundColor: "#2A1835",
                    color: "#E040FB",
                    border: "1px solid #E040FB",
                    borderRadius: "3px",
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                  title="Dividir en 16 chops simétricos estilo Serato"
                >
                  <Scissors size={11} />
                  <span>SLICE 16</span>
                </button>

                <button
                  onClick={() => handleRandomChops(8)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    padding: "3px 8px",
                    backgroundColor: "#2A2518",
                    color: "#FFD600",
                    border: "1px solid #FFD600",
                    borderRadius: "3px",
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                  title="Cortes aleatorios distribuidos a lo largo del vinilo"
                >
                  <Shuffle size={11} />
                  <span>RANDOM</span>
                </button>

                {/* Botón Akai MPC 16 Levels */}
                <button
                  onClick={() => setIs16Levels((prev) => !prev)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 9px",
                    backgroundColor: is16Levels ? "#FF5500" : "#241710",
                    color: is16Levels ? "#FFFFFF" : "#FF7733",
                    border: is16Levels ? "1.5px solid #FFFFFF" : "1.2px solid #FF5500",
                    borderRadius: "3px",
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: is16Levels ? "0 0 12px rgba(255, 85, 0, 0.7)" : "none",
                    transition: "all 0.15s ease",
                  }}
                  title="Efecto Akai MPC 16 Levels: Mapea el chop seleccionado cromáticamente en 16 semitonos (-7st a +8st) para tocar melodías con el teclado"
                >
                  <span>🎹</span>
                  <span>16 LEVELS (AKAI)</span>
                  {is16Levels && (
                    <span
                      style={{
                        fontSize: "0.52rem",
                        backgroundColor: "#111111",
                        color: "#FF5500",
                        padding: "1px 4px",
                        borderRadius: "2px",
                        fontWeight: 900,
                      }}
                    >
                      ON
                    </span>
                  )}
                </button>

                {/* GRUPO SERATO STEMS EN LA MISMA ONDA (BATERÍA, BAJO, MELODÍA, VOCAL) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    backgroundColor: "#080B12",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    border: "1px solid #1E2738",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.56rem",
                      fontWeight: 900,
                      color: "#6E778E",
                      padding: "0 2px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    STEMS:
                  </span>

                  {/* BOTÓN ESTADO Y PRUEBA IA DEMUCS */}
                  <button
                    type="button"
                    onClick={() => {
                      checkAiStatus();
                      setShowAiModal(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      padding: "2px 6px",
                      backgroundColor:
                        aiServerStatus?.hasLocalWorker || aiServerStatus?.hasReplicate
                          ? "#00E5FF22"
                          : "#161B26",
                      color:
                        aiServerStatus?.hasLocalWorker || aiServerStatus?.hasReplicate
                          ? "#00E5FF"
                          : "#94A3B8",
                      border: `1px solid ${
                        aiServerStatus?.hasLocalWorker || aiServerStatus?.hasReplicate
                          ? "#00E5FF66"
                          : "#2D3748"
                      }`,
                      borderRadius: "3px",
                      fontSize: "0.58rem",
                      fontWeight: 900,
                      cursor: "pointer",
                      marginRight: "3px",
                      transition: "all 0.12s ease",
                    }}
                    title="Configuración y pruebas de IA Meta Demucs v4"
                  >
                    <span>✨</span>
                    <span>{aiEngineName}</span>
                  </button>

                  {/* TODO / MASTER */}
                  <button
                    type="button"
                    disabled={loadingStem !== null}
                    onClick={() => handleSelectStemFilter(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 7px",
                      backgroundColor: activeStemFilter === null ? "#1A2536" : "transparent",
                      color: activeStemFilter === null ? "#00E5FF" : "#6E778E",
                      border: activeStemFilter === null ? "1.2px solid #00E5FF" : "1px solid #1E293B",
                      borderRadius: "3px",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      cursor: loadingStem !== null ? "wait" : "pointer",
                      opacity: loadingStem !== null ? 0.6 : 1,
                      transition: "all 0.12s ease",
                    }}
                    title="Todo el vinilo completo (Espectro Serato RGB multicolor)"
                  >
                    <span>🌐</span>
                    <span>TODO</span>
                    {stemsResult && (
                      <span style={{ fontSize: "0.55rem", color: "#00E5FF", fontWeight: 900 }}>✓</span>
                    )}
                  </button>

                  {/* BATERÍA */}
                  <button
                    type="button"
                    disabled={loadingStem !== null}
                    onClick={() => handleSelectStemFilter("drums")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 8px",
                      backgroundColor: activeStemFilter === "drums" ? "#00E5FF" : "#0D1822",
                      color: activeStemFilter === "drums" ? "#07080B" : "#00E5FF",
                      border: activeStemFilter === "drums" ? "1.5px solid #FFFFFF" : "1px solid #00E5FF44",
                      borderRadius: "3px",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      cursor: loadingStem !== null ? "wait" : "pointer",
                      opacity: loadingStem !== null && loadingStem !== "drums" ? 0.5 : 1,
                      boxShadow: activeStemFilter === "drums" ? "0 0 10px rgba(0, 229, 255, 0.7)" : "none",
                      transition: "all 0.12s ease",
                    }}
                    title="Aislar Batería: reproduce y visualiza solo la pista de batería en Web Audio"
                  >
                    {loadingStem === "drums" ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <span>🥁</span>
                    )}
                    <span>{loadingStem === "drums" ? "SEPARANDO..." : "BATERÍA"}</span>
                    {stemsResult?.drums && loadingStem !== "drums" && (
                      <span style={{ fontSize: "0.55rem", fontWeight: 900, color: activeStemFilter === "drums" ? "#07080B" : "#00E5FF" }}>✓</span>
                    )}
                  </button>

                  {/* BAJO */}
                  <button
                    type="button"
                    disabled={loadingStem !== null}
                    onClick={() => handleSelectStemFilter("bass")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 8px",
                      backgroundColor: activeStemFilter === "bass" ? "#CCFF00" : "#141D0D",
                      color: activeStemFilter === "bass" ? "#07080B" : "#CCFF00",
                      border: activeStemFilter === "bass" ? "1.5px solid #FFFFFF" : "1px solid #CCFF0044",
                      borderRadius: "3px",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      cursor: loadingStem !== null ? "wait" : "pointer",
                      opacity: loadingStem !== null && loadingStem !== "bass" ? 0.5 : 1,
                      boxShadow: activeStemFilter === "bass" ? "0 0 10px rgba(204, 255, 0, 0.7)" : "none",
                      transition: "all 0.12s ease",
                    }}
                    title="Aislar Bajo: reproduce y visualiza solo la línea de bajo en Web Audio"
                  >
                    {loadingStem === "bass" ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <span>🎸</span>
                    )}
                    <span>{loadingStem === "bass" ? "SEPARANDO..." : "BAJO"}</span>
                    {stemsResult?.bass && loadingStem !== "bass" && (
                      <span style={{ fontSize: "0.55rem", fontWeight: 900, color: activeStemFilter === "bass" ? "#07080B" : "#CCFF00" }}>✓</span>
                    )}
                  </button>

                  {/* MELODÍA */}
                  <button
                    type="button"
                    disabled={loadingStem !== null}
                    onClick={() => handleSelectStemFilter("melody")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 8px",
                      backgroundColor: activeStemFilter === "melody" ? "#FF007A" : "#220D18",
                      color: activeStemFilter === "melody" ? "#07080B" : "#FF007A",
                      border: activeStemFilter === "melody" ? "1.5px solid #FFFFFF" : "1px solid #FF007A44",
                      borderRadius: "3px",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      cursor: loadingStem !== null ? "wait" : "pointer",
                      opacity: loadingStem !== null && loadingStem !== "melody" ? 0.5 : 1,
                      boxShadow: activeStemFilter === "melody" ? "0 0 10px rgba(255, 0, 122, 0.7)" : "none",
                      transition: "all 0.12s ease",
                    }}
                    title="Aislar Melodía: reproduce y visualiza solo la melodía y armonía en Web Audio"
                  >
                    {loadingStem === "melody" ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <span>🎹</span>
                    )}
                    <span>{loadingStem === "melody" ? "SEPARANDO..." : "MELODÍA"}</span>
                    {stemsResult?.melody && loadingStem !== "melody" && (
                      <span style={{ fontSize: "0.55rem", fontWeight: 900, color: activeStemFilter === "melody" ? "#07080B" : "#FF007A" }}>✓</span>
                    )}
                  </button>

                  {/* VOCAL */}
                  <button
                    type="button"
                    disabled={loadingStem !== null}
                    onClick={() => handleSelectStemFilter("vocals")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 8px",
                      backgroundColor: activeStemFilter === "vocals" ? "#FFD600" : "#221E0D",
                      color: activeStemFilter === "vocals" ? "#07080B" : "#FFD600",
                      border: activeStemFilter === "vocals" ? "1.5px solid #FFFFFF" : "1px solid #FFD60044",
                      borderRadius: "3px",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      cursor: loadingStem !== null ? "wait" : "pointer",
                      opacity: loadingStem !== null && loadingStem !== "vocals" ? 0.5 : 1,
                      boxShadow: activeStemFilter === "vocals" ? "0 0 10px rgba(255, 214, 0, 0.7)" : "none",
                      transition: "all 0.12s ease",
                    }}
                    title="Aislar Vocales: reproduce y visualiza solo la pista vocal en Web Audio"
                  >
                    {loadingStem === "vocals" ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <span>🎤</span>
                    )}
                    <span>{loadingStem === "vocals" ? "SEPARANDO..." : "VOCAL"}</span>
                    {stemsResult?.vocals && loadingStem !== "vocals" && (
                      <span style={{ fontSize: "0.55rem", fontWeight: 900, color: activeStemFilter === "vocals" ? "#07080B" : "#FFD600" }}>✓</span>
                    )}
                  </button>
                </div>

                <input
                  type="file"
                  accept="audio/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    padding: "3px 8px",
                    backgroundColor: "#1E2230",
                    color: "#CCFF00",
                    border: "1px solid #3E465E",
                    borderRadius: "3px",
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  <Upload size={11} />
                  <span>CARGAR AUDIO</span>
                </button>
              </div>
            </div>

            {/* SERATO INTERACTIVE HIGH-RES WAVEFORM (WAVESURFER.JS) CON ZOOM DINÁMICO */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                margin: "4px 0",
              }}
            >
              {/* Toolbar de la Forma de Onda: Badges + Controles de Zoom */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "6px",
                  padding: "4px 8px",
                  backgroundColor: "#07090F",
                  border: "1px solid #1F273B",
                  borderRadius: "4px 4px 0 0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      color:
                        activeStemFilter === "drums"
                          ? "#00E5FF"
                          : activeStemFilter === "bass"
                          ? "#CCFF00"
                          : activeStemFilter === "melody"
                          ? "#FF007A"
                          : activeStemFilter === "vocals"
                          ? "#FFD600"
                          : "#00E5FF",
                      letterSpacing: "0.6px",
                    }}
                  >
                    🌊 ONDA SERATO HIGH-RES
                  </span>
                  {activeStemFilter ? (
                    <span
                      style={{
                        fontSize: "0.55rem",
                        fontWeight: 900,
                        backgroundColor:
                          activeStemFilter === "drums"
                            ? "#00E5FF22"
                            : activeStemFilter === "bass"
                            ? "#CCFF0022"
                            : activeStemFilter === "melody"
                            ? "#FF007A22"
                            : "#FFD60022",
                        color:
                          activeStemFilter === "drums"
                            ? "#00E5FF"
                            : activeStemFilter === "bass"
                            ? "#CCFF00"
                            : activeStemFilter === "melody"
                            ? "#FF007A"
                            : "#FFD600",
                        border: `1px solid ${
                          activeStemFilter === "drums"
                            ? "#00E5FF"
                            : activeStemFilter === "bass"
                            ? "#CCFF00"
                            : activeStemFilter === "melody"
                            ? "#FF007A"
                            : "#FFD600"
                        }`,
                        padding: "1px 6px",
                        borderRadius: "2px",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {activeStemFilter === "drums" && "🥁 BATERÍA AISLADA"}
                      {activeStemFilter === "bass" && "🎸 BAJO AISLADO"}
                      {activeStemFilter === "melody" && "🎹 MELODÍA AISLADA"}
                      {activeStemFilter === "vocals" && "🎤 VOCAL AISLADA"}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "0.54rem",
                        fontWeight: 800,
                        color: "#8E94A5",
                        backgroundColor: "#111622",
                        padding: "1px 5px",
                        borderRadius: "2px",
                      }}
                    >
                      FULL MIX (RGB)
                    </span>
                  )}
                  {isSeparatingStems && (
                    <span
                      style={{
                        fontSize: "0.52rem",
                        color: "#00E5FF",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <RefreshCw size={9} className="animate-spin" /> SEPARANDO STEMS IA...
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "0.55rem",
                      fontWeight: 900,
                      backgroundColor: "#161D2C",
                      color: "#CCFF00",
                      padding: "1px 5px",
                      borderRadius: "2px",
                      border: "1px solid #293855",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatSeconds(totalDuration)}
                  </span>
                  <span
                    style={{
                      fontSize: "0.52rem",
                      fontWeight: 900,
                      color: isWaveReady ? "#00E676" : "#FF9100",
                    }}
                  >
                    ● {isWaveReady ? "READY" : "DECODING"}
                  </span>
                </div>

                {/* Controles Interactivos de Zoom */}
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontWeight: 900,
                      color: "#CCFF00",
                      letterSpacing: "0.4px",
                    }}
                  >
                    🔍 ZOOM:
                  </span>
                  <button
                    onClick={() => handleZoomChange(zoomLevel - 15)}
                    style={{
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#161D2C",
                      color: "#FFFFFF",
                      border: "1px solid #293855",
                      borderRadius: "2px",
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                    title="Alejar (Zoom Out)"
                  >
                    <ZoomOut size={11} />
                  </button>
                  <input
                    type="range"
                    min={2}
                    max={250}
                    step={2}
                    value={zoomLevel}
                    onChange={(e) => handleZoomChange(Number(e.target.value))}
                    style={{
                      width: "80px",
                      height: "4px",
                      accentColor: "#CCFF00",
                      cursor: "pointer",
                    }}
                    title="Nivel de zoom en segundos"
                  />
                  <button
                    onClick={() => handleZoomChange(zoomLevel + 15)}
                    style={{
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#161D2C",
                      color: "#FFFFFF",
                      border: "1px solid #293855",
                      borderRadius: "2px",
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                    title="Acercar (Zoom In)"
                  >
                    <ZoomIn size={11} />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      padding: "1px 6px",
                      backgroundColor: "#152336",
                      color: "#00E5FF",
                      border: "1px solid #00E5FF",
                      borderRadius: "2px",
                      fontSize: "0.58rem",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                    title="Ajustar toda la canción en pantalla"
                  >
                    <Maximize2 size={9} />
                    <span>FIT</span>
                  </button>
                  <span
                    style={{
                      fontSize: "0.56rem",
                      fontFamily: "monospace",
                      color: "#8E9AA8",
                      minWidth: "48px",
                    }}
                  >
                    {Math.round((zoomLevel / 20) * 10) / 10}x
                  </span>
                  <span
                    style={{
                      fontSize: "0.50rem",
                      color: "#5C6A82",
                    }}
                  >
                    [Rueda para zoom]
                  </span>
                </div>
              </div>

              {/* BARRA DE TRANSPORTE & PUNTERO DE REPRODUCCIÓN DEDICADO */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                  padding: "5px 10px",
                  backgroundColor: "#0B0E17",
                  borderLeft: "2px solid #CCFF00",
                  borderRight: "1px solid #1E2538",
                  borderTop: "1px solid #1E2538",
                  borderBottom: "1px solid #1E2538",
                  margin: "2px 0",
                  borderRadius: "3px",
                }}
              >
                {/* Controles de Reproducción y Parada */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={handlePlayPauseSong}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 12px",
                      backgroundColor: isPlayingSong ? "#FF007A" : "#CCFF00",
                      color: "#080A0F",
                      border: "none",
                      borderRadius: "3px",
                      fontSize: "0.68rem",
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: isPlayingSong
                        ? "0 0 10px rgba(255, 0, 122, 0.6)"
                        : "0 0 10px rgba(204, 255, 0, 0.6)",
                      transition: "all 0.12s ease",
                    }}
                    title={isPlayingSong ? "Pausar canción [Espacio]" : "Reproducir canción continua [Espacio]"}
                  >
                    {isPlayingSong ? <Pause size={12} fill="#080A0F" /> : <Play size={12} fill="#080A0F" />}
                    <span>{isPlayingSong ? "PAUSAR" : "REPRODUCIR"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStopSong}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 10px",
                      backgroundColor: "#161D2C",
                      color: "#A0AEC0",
                      border: "1px solid #2D3748",
                      borderRadius: "3px",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                    title="Detener canción y reiniciar puntero a 00:00.0"
                  >
                    <Square size={10} fill="#A0AEC0" />
                    <span>PARAR</span>
                  </button>

                  {/* Indicador digital del Puntero */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "3px 8px",
                      backgroundColor: "#07090F",
                      border: "1px solid #1E293B",
                      borderRadius: "3px",
                      fontFamily: "monospace",
                    }}
                  >
                    <span style={{ fontSize: "0.58rem", color: "#64748B", fontWeight: 700 }}>
                      PUNTERO:
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#CCFF00", fontWeight: 900 }}>
                      {formatSeconds(playbackPointerSec)}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "#475569" }}>/</span>
                    <span style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                      {formatSeconds(totalDuration)}
                    </span>
                  </div>
                </div>

                {/* Scrubber / Control Deslizante del Puntero */}
                <div style={{ flex: 1, minWidth: "160px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.58rem", color: "#64748B", fontWeight: 800, whiteSpace: "nowrap" }}>
                    DESLIZAR PUNTERO:
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, totalDuration)}
                    step={0.1}
                    value={playbackPointerSec}
                    onChange={(e) => handleSeekPointer(parseFloat(e.target.value))}
                    style={{
                      flex: 1,
                      height: "5px",
                      accentColor:
                        activeStemFilter === "bass"
                          ? "#CCFF00"
                          : activeStemFilter === "drums"
                          ? "#00E5FF"
                          : activeStemFilter === "melody"
                          ? "#FF007A"
                          : activeStemFilter === "vocals"
                          ? "#FFD600"
                          : "#CCFF00",
                      cursor: "pointer",
                    }}
                    title={`Mover puntero de la canción (${formatSeconds(playbackPointerSec)})`}
                  />
                </div>

                {/* Badge de Fuente Activa del Puntero */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontWeight: 900,
                      padding: "2px 8px",
                      borderRadius: "3px",
                      border: "1px solid",
                      letterSpacing: "0.5px",
                      backgroundColor:
                        activeStemFilter === "bass"
                          ? "#CCFF0018"
                          : activeStemFilter === "drums"
                          ? "#00E5FF18"
                          : activeStemFilter === "melody"
                          ? "#FF007A18"
                          : activeStemFilter === "vocals"
                          ? "#FFD60018"
                          : "#161D2C",
                      borderColor:
                        activeStemFilter === "bass"
                          ? "#CCFF00"
                          : activeStemFilter === "drums"
                          ? "#00E5FF"
                          : activeStemFilter === "melody"
                          ? "#FF007A"
                          : activeStemFilter === "vocals"
                          ? "#FFD600"
                          : "#293855",
                      color:
                        activeStemFilter === "bass"
                          ? "#CCFF00"
                          : activeStemFilter === "drums"
                          ? "#00E5FF"
                          : activeStemFilter === "melody"
                          ? "#FF007A"
                          : activeStemFilter === "vocals"
                          ? "#FFD600"
                          : "#00E5FF",
                    }}
                  >
                    {activeStemFilter === "bass" && "🎸 REPRODUCIENDO: STEM BAJO"}
                    {activeStemFilter === "drums" && "🥁 REPRODUCIENDO: STEM BATERÍA"}
                    {activeStemFilter === "melody" && "🎹 REPRODUCIENDO: STEM MELODÍA"}
                    {activeStemFilter === "vocals" && "🎤 REPRODUCIENDO: STEM VOCAL"}
                    {!activeStemFilter && "🌐 REPRODUCIENDO: CANCIÓN COMPLETA"}
                  </span>
                </div>
              </div>

              {/* Host de WaveSurfer */}
              <div
                style={{
                  position: "relative",
                  backgroundColor: "#07080D",
                  border: "1.5px solid #232B3E",
                  borderRadius: "0 0 4px 4px",
                  overflow: "hidden",
                  padding: "1px",
                }}
              >
                {/* HUD de Vinyl Scrubbing mientras se arrastran cortes */}
                {draggingCueId !== null && (
                  <div
                    style={{
                      position: "absolute",
                      top: "6px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: scrubDirection === "backward" ? "#FF007A" : "#CCFF00",
                      color: "#111111",
                      fontWeight: 900,
                      fontSize: "0.62rem",
                      padding: "2px 9px",
                      borderRadius: "3px",
                      boxShadow: "0 0 14px rgba(0,0,0,0.9)",
                      zIndex: 50,
                      letterSpacing: "0.5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      pointerEvents: "none",
                    }}
                  >
                    <span>
                      {scrubDirection === "backward"
                        ? "⏪ ATRASANDO (REVERSE VINYL SCRUB)"
                        : "⏩ ADELANTANDO (FORWARD TAPE SCRUB)"}
                    </span>
                  </div>
                )}

                <div
                  ref={waveformContainerRef}
                  className="csampler-wavesurfer-host"
                  style={{
                    width: "100%",
                    minHeight: "66px",
                    cursor: "crosshair",
                  }}
                  title="Haz clic en cualquier punto para mover el puntero de reproducción. Arrastra las etiquetas de los cortes (1, 2, 3...) para reubicarlos. Rueda del ratón para zoom."
                />
              </div>

              {/* Estilos CSS dedicados para WaveSurfer y scrollbar Neo-Brutalist */}
              <style>{`
                .csampler-wavesurfer-host ::-webkit-scrollbar {
                  height: 5px;
                }
                .csampler-wavesurfer-host ::-webkit-scrollbar-track {
                  background: #090B10;
                }
                .csampler-wavesurfer-host ::-webkit-scrollbar-thumb {
                  background: #252D42;
                  border-radius: 3px;
                }
                .csampler-wavesurfer-host ::-webkit-scrollbar-thumb:hover {
                  background: #00E5FF;
                }
                .csampler-wavesurfer-host .wavesurfer-region {
                  transition: background-color 0.15s ease !important;
                }
                .csampler-wavesurfer-host .wavesurfer-region:hover {
                  filter: brightness(1.2) !important;
                }
              `}</style>
            </div>

            {/* Instruction Guidance bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "6px",
                fontSize: "0.66rem",
                color: "#8E94A5",
              }}
            >
              <span>
                💡 <strong style={{ color: "#CCFF00" }}>Límites Sucesivos Serato:</strong> El límite del{" "}
                <strong style={{ color: "#FFFFFF" }}>Marcador 1 es el Marcador 2</strong>, el 2 es el 3, y así sucesivamente.
              </span>
              {selectedCueId !== null && (() => {
                const curCue = cues.find((c) => c.id === selectedCueId);
                if (!curCue) return null;
                const { endLimitSec, naturalDurationSec, nextCue } = getCueSliceLimits(
                  curCue.id,
                  cues,
                  totalDuration
                );
                return (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "#111624",
                      padding: "2px 8px",
                      borderRadius: "3px",
                      border: `1px solid ${curCue.color}77`,
                    }}
                  >
                    <span style={{ color: curCue.color, fontWeight: 900 }}>
                      CHOP #{curCue.id} [{PAD_DISPLAY_KEYS[curCue.id] || curCue.id}]:
                    </span>
                    <span style={{ color: "#FFFFFF", fontFamily: "monospace", fontWeight: 800 }}>
                      {formatSeconds(curCue.startSec)} ➔ {formatSeconds(endLimitSec)}
                    </span>
                    <span
                      style={{
                        backgroundColor: curCue.color,
                        color: "#07080B",
                        fontWeight: 900,
                        fontSize: "0.58rem",
                        padding: "1px 4px",
                        borderRadius: "2px",
                      }}
                    >
                      {naturalDurationSec.toFixed(1)}s
                    </span>
                    <span style={{ color: "#A0A8BC", fontSize: "0.60rem" }}>
                      ({triggerMode === "full_track" ? "modo continuo: todo" : nextCue ? `corta en Marcador #${nextCue.id}` : "corta al final"})
                    </span>
                  </span>
                );
              })()}
            </div>
          </div>



          {/* 2. Serato Control Knobs & Mode Selectors */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "8px",
              backgroundColor: "#0B0E14",
              padding: "6px 12px",
              borderRadius: "5px",
              border: "1px solid #222838",
              alignItems: "center",
            }}
          >
            {/* Pitch / Key Shifter */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "center" }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "#8E94A5" }}>PITCH (SEMITONOS)</span>
              <input
                type="range"
                min="-12"
                max="12"
                value={pitchSemi}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPitchSemi(val);
                  applyPitchRateToYouTube(val);
                  if (selectedCueId !== null) {
                    const cue = cues.find((c) => c.id === selectedCueId);
                    studioAudio.playPitchHarmonic(val, cue?.keyNote || trackInfo?.key);
                  }
                }}
                style={{ accentColor: "#CCFF00", cursor: "pointer", height: "14px" }}
              />
              <span style={{ fontFamily: "monospace", fontSize: "0.64rem", color: "#CCFF00", lineHeight: 1 }}>
                {pitchSemi > 0 ? `+${pitchSemi}` : pitchSemi} st
              </span>
            </div>

            {/* Trigger Mode (Hold / 1-Shot / Continuo) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "center" }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "#8E94A5" }}>MODO DISPARO</span>
              <div style={{ display: "flex", gap: "3px", justifyContent: "center" }}>
                {(
                  [
                    { mode: "hold" as const, label: "HOLD (CORTAR)", title: "Corta el sonido en el momento al soltar el pad o la tecla" },
                    { mode: "one_shot" as const, label: "1-SHOT", title: "Disparo tradicional de chop (3.5s o hasta el siguiente golpe)" },
                    { mode: "full_track" as const, label: "CONTINUO (TODO)", title: "Suena toda la canción completa desde este cue" },
                  ]
                ).map(({ mode, label, title }) => (
                  <button
                    key={mode}
                    onClick={() => setTriggerMode(mode)}
                    style={{
                      padding: "3px 7px",
                      fontSize: "0.58rem",
                      fontWeight: 900,
                      backgroundColor:
                        triggerMode === mode
                          ? mode === "hold"
                            ? "#FF007A"
                            : mode === "full_track"
                            ? "#00E5FF"
                            : "#CCFF00"
                          : "#1A1D27",
                      color: triggerMode === mode ? "#111111" : "#8E94A5",
                      border: triggerMode === mode ? "1px solid #FFFFFF" : "1px solid #333848",
                      borderRadius: "2px",
                      cursor: "pointer",
                      transition: "all 0.1s ease",
                    }}
                    title={title}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Selectors */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "center" }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "#8E94A5" }}>BANCO PADS</span>
              <div style={{ display: "flex", gap: "2px", justifyContent: "center" }}>
                <button
                  onClick={() => setActiveBank("A")}
                  style={{
                    padding: "3px 6px",
                    fontSize: "0.58rem",
                    fontWeight: 900,
                    backgroundColor: activeBank === "A" ? "#00E5FF" : "#1A1D27",
                    color: activeBank === "A" ? "#111111" : "#8E94A5",
                    border: "1px solid #333848",
                    borderRadius: "2px",
                    cursor: "pointer",
                  }}
                >
                  BANK A (1-8)
                </button>
                <button
                  onClick={() => setActiveBank("B")}
                  style={{
                    padding: "3px 6px",
                    fontSize: "0.58rem",
                    fontWeight: 900,
                    backgroundColor: activeBank === "B" ? "#FF007A" : "#1A1D27",
                    color: activeBank === "B" ? "#111111" : "#8E94A5",
                    border: "1px solid #333848",
                    borderRadius: "2px",
                    cursor: "pointer",
                  }}
                >
                  BANK B (9-16)
                </button>
                <button
                  onClick={() => setActiveBank("ALL")}
                  style={{
                    padding: "3px 6px",
                    fontSize: "0.58rem",
                    fontWeight: 900,
                    backgroundColor: activeBank === "ALL" ? "#CCFF00" : "#1A1D27",
                    color: activeBank === "ALL" ? "#111111" : "#8E94A5",
                    border: "1px solid #333848",
                    borderRadius: "2px",
                    cursor: "pointer",
                  }}
                >
                  TODOS ({cues.length})
                </button>
              </div>
            </div>

            {/* Quick Reset */}
            <button
              onClick={() => {
                setPitchSemi(0);
                applyPitchRateToYouTube(0);
                setCues(DEFAULT_CUES);
                setSelectedCueId(1);
                setActiveBank("A");
                setIs16Levels(false);
                setTriggerMode("one_shot");
                setCustomAudioBuffer(null);
                setSampleName("RADIO DOBLE C VAULT");
              }}
              style={{
                padding: "4px 8px",
                fontSize: "0.62rem",
                fontWeight: 900,
                backgroundColor: "#1A1D27",
                color: "#A0A0A0",
                border: "1px solid #333848",
                borderRadius: "3px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <RefreshCw size={11} />
              <span>REINICIAR</span>
            </button>
          </div>

          {/* 3. DYNAMIC SERATO / AKAI CUE PADS GRID */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {is16Levels ? (
              <>
                {/* Akai MPC 16 Levels Header & Mode Selector (Tune, Velocity, Filter, Decay) */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.70rem", fontWeight: 900, color: "#FF5500" }}>
                      🎹 AKAI MPC 16 LEVELS:
                    </span>
                    {/* Selector de Tipo de 16 Levels */}
                    <div style={{ display: "flex", gap: "3px" }}>
                      {(
                        [
                          { type: "tune" as const, label: "🎵 TUNE", desc: "Varispeed cromático (-7 a +8 st)" },
                          { type: "velocity" as const, label: "⚡ VELOCITY", desc: "Dinámica y rolls (10% a 100%)" },
                          { type: "filter" as const, label: "🎛️ FILTER", desc: "Filtro Low-pass (300Hz a 18kHz)" },
                          { type: "decay" as const, label: "⏱️ DECAY", desc: "Largo de envolvente (80ms a 4s)" },
                        ]
                      ).map((t) => (
                        <button
                          key={t.type}
                          onClick={() => setAkai16Type(t.type)}
                          style={{
                            padding: "2px 7px",
                            fontSize: "0.56rem",
                            fontWeight: 900,
                            backgroundColor: akai16Type === t.type ? "#FF5500" : "#1B1F2A",
                            color: akai16Type === t.type ? "#FFFFFF" : "#8E94A5",
                            border: akai16Type === t.type ? "1px solid #FFFFFF" : "1px solid #323A50",
                            borderRadius: "2px",
                            cursor: "pointer",
                            transition: "all 0.1s ease",
                          }}
                          title={t.desc}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <span style={{ fontSize: "0.58rem", color: "#A0A0A0" }}>
                    Chop: <strong style={{ color: "#CCFF00" }}>{cues.find((c) => c.id === selectedCueId)?.name || cues[0]?.name || "CHOP 1"}</strong>
                  </span>
                </div>

                {/* 16 Levels Grid (16 pads compactos con soporte de Tune, Velocity, Filter y Decay) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))",
                    gap: "6px",
                  }}
                >
                  {Array.from({ length: 16 }).map((_, idx) => {
                    const padNum = idx + 1;
                    const isPlaying = active16LevelPad === padNum;
                    const keyLabel = PAD_DISPLAY_KEYS[padNum] || `${padNum}`;

                    // Variables dinámicas según el tipo activo de Akai 16 Levels
                    let valueLabel = "";
                    let subLabel = "";
                    let padColor = "#CCFF00";
                    let isRoot = false;

                    if (akai16Type === "tune") {
                      const semi = AKAI_16_LEVELS_SEMITONES[idx];
                      isRoot = semi === 0;
                      valueLabel = `${semi > 0 ? `+${semi}` : semi} st`;
                      subLabel = isRoot ? "ROOT (0 st)" : "";
                      padColor = isRoot ? "#CCFF00" : semi < 0 ? "#00E5FF" : "#FF007A";
                    } else if (akai16Type === "velocity") {
                      const vel = AKAI_16_LEVELS_VELOCITIES[idx];
                      valueLabel = `${Math.round(vel * 100)}%`;
                      subLabel = idx === 15 ? "MAX (100%)" : idx === 0 ? "GHOST (10%)" : `VEL ${idx + 1}`;
                      padColor = idx === 15 ? "#FFD600" : idx >= 10 ? "#FF5500" : idx >= 5 ? "#00E676" : "#00E5FF";
                    } else if (akai16Type === "filter") {
                      const freq = AKAI_16_LEVELS_FILTERS[idx];
                      valueLabel = freq >= 1000 ? `${(freq / 1000).toFixed(1)} kHz` : `${freq} Hz`;
                      subLabel = idx === 15 ? "OPEN (18kHz)" : idx === 0 ? "SUB (300Hz)" : "LPF";
                      padColor = idx >= 12 ? "#CCFF00" : idx >= 6 ? "#00E5FF" : "#E040FB";
                    } else if (akai16Type === "decay") {
                      const dec = AKAI_16_LEVELS_DECAYS[idx];
                      valueLabel = dec < 1.0 ? `${Math.round(dec * 1000)} ms` : `${dec.toFixed(1)} s`;
                      subLabel = idx === 15 ? "FULL (4s)" : idx === 0 ? "CLICK (80ms)" : "DECAY";
                      padColor = idx >= 12 ? "#00E676" : idx >= 6 ? "#00E5FF" : "#FF007A";
                    }

                    return (
                      <div
                        key={padNum}
                        onPointerDown={() => handleTrigger16Level(padNum)}
                        onPointerUp={() => {
                          if (triggerMode === "hold") {
                            handleStopAudio();
                          }
                        }}
                        onPointerLeave={() => {
                          if (triggerMode === "hold" && active16LevelPad === padNum) {
                            handleStopAudio();
                          }
                        }}
                        style={{
                          height: "56px",
                          backgroundColor: isPlaying ? padColor : isRoot ? "#172314" : "#131620",
                          color: isPlaying ? "#111111" : "#FFFFFF",
                          border: isRoot
                            ? isPlaying
                              ? "2px solid #FFFFFF"
                              : "1.8px solid #CCFF00"
                            : isPlaying
                            ? "2px solid #FFFFFF"
                            : `1.2px solid ${padColor}77`,
                          borderRadius: "4px",
                          boxShadow: isPlaying
                            ? `0 0 16px ${padColor}`
                            : isRoot
                            ? "0 0 10px rgba(204, 255, 0, 0.4)"
                            : "inset 0 1px 2px rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.5)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          padding: "4px 6px",
                          transform: isPlaying ? "scale(0.96)" : "scale(1)",
                          transition: "all 0.05s ease",
                          userSelect: "none",
                        }}
                      >
                        {/* Pad Header: Level Badge + Shortcut */}
                        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", lineHeight: 1 }}>
                          <span
                            style={{
                              fontSize: "0.56rem",
                              fontWeight: 900,
                              backgroundColor: isPlaying ? "#111111" : padColor,
                              color: isPlaying ? padColor : "#111111",
                              padding: "1px 4px",
                              borderRadius: "2px",
                            }}
                          >
                            LVL {padNum}
                          </span>
                          <span
                            style={{
                              fontSize: "0.58rem",
                              fontWeight: 900,
                              fontFamily: "monospace",
                              backgroundColor: isPlaying ? "#FFFFFF" : "#0B0E14",
                              color: isPlaying ? "#000000" : padColor,
                              border: `1px solid ${isPlaying ? "#FFFFFF" : padColor}`,
                              padding: "0 3px",
                              borderRadius: "2px",
                            }}
                          >
                            [{keyLabel}]
                          </span>
                        </div>

                        {/* Pad Center: Dynamic Parameter Value */}
                        <div style={{ textAlign: "center", width: "100%" }}>
                          <div
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: 900,
                              color: isPlaying ? "#111111" : isRoot ? "#CCFF00" : "#FFFFFF",
                              letterSpacing: "-0.3px",
                            }}
                          >
                            {valueLabel}
                          </div>
                          {subLabel && (
                            <span
                              style={{
                                fontSize: "0.48rem",
                                fontWeight: 900,
                                color: isPlaying ? "#111111" : padColor,
                                letterSpacing: "0.4px",
                              }}
                            >
                              {subLabel}
                            </span>
                          )}
                        </div>

                        {/* Pad Footer: Pitch indicator line */}
                        <div
                          style={{
                            width: "100%",
                            height: "2px",
                            backgroundColor: padColor,
                            borderRadius: "1px",
                            opacity: isPlaying ? 1 : 0.6,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Serato Cue Pads Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 900, color: "#FFFFFF" }}>
                      SERATO CUE PADS:
                    </span>
                    <span style={{ fontSize: "0.58rem", color: "#8E94A5" }}>
                      (Doble clic o ✏️ para renombrar)
                    </span>
                  </div>
                  <span style={{ fontSize: "0.62rem", color: "#CCFF00", fontWeight: 800 }}>
                    ⌨️ Teclado:{" "}
                    <strong style={{ color: "#FFFFFF", backgroundColor: "#1B202D", padding: "1px 5px", borderRadius: "2px", letterSpacing: "1px" }}>
                      {activeBank === "B" ? "A S D F G H J K" : "Q W E R T Y U I"}
                    </strong>
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))",
                    gap: "6px",
                  }}
                >
                  {visibleCues.map((cue) => {
                    const isPlaying = activeCueId === cue.id;
                    const isSelected = selectedCueId === cue.id;
                    const isEditing = editingCueId === cue.id;

                    const { endLimitSec, naturalDurationSec, nextCue } = getCueSliceLimits(
                      cue.id,
                      cues,
                      totalDuration
                    );

                    return (
                      <div
                        key={cue.id}
                        onPointerDown={() => handleTriggerCue(cue)}
                        onPointerUp={() => {
                          if (triggerMode === "hold") {
                            handleStopAudio();
                          }
                        }}
                        onPointerLeave={() => {
                          if (triggerMode === "hold" && activeCueId === cue.id) {
                            handleStopAudio();
                          }
                        }}
                        style={{
                          height: "56px",
                          backgroundColor: isPlaying ? cue.color : "#131620",
                          color: isPlaying ? "#111111" : "#FFFFFF",
                          border: isSelected
                            ? "2px solid #FFFFFF"
                            : `1.5px solid ${cue.color}`,
                          borderRadius: "4px",
                          boxShadow: isPlaying
                            ? `0 0 16px ${cue.color}`
                            : isSelected
                            ? `0 0 10px ${cue.color}88`
                            : "inset 0 1px 2px rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.5)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          padding: "4px 6px",
                          transform: isPlaying ? "scale(0.96)" : "scale(1)",
                          transition: "all 0.05s ease",
                          position: "relative",
                          userSelect: "none",
                        }}
                      >
                        {/* Pad Header: Badge Cue + Shortcut + Delete Button */}
                        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", lineHeight: 1 }}>
                          <span
                            style={{
                              fontSize: "0.58rem",
                              fontWeight: 900,
                              backgroundColor: cue.color,
                              color: "#111111",
                              padding: "1px 4px",
                              borderRadius: "2px",
                            }}
                          >
                            CUE {cue.id}
                          </span>

                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span
                              style={{
                                fontSize: "0.58rem",
                                fontWeight: 900,
                                fontFamily: "monospace",
                                backgroundColor: isPlaying ? "#FFFFFF" : "#0B0E14",
                                color: isPlaying ? "#000000" : cue.color,
                                border: `1px solid ${isPlaying ? "#FFFFFF" : cue.color}`,
                                padding: "0 3px",
                                borderRadius: "2px",
                              }}
                              title={`Presiona tecla [${PAD_DISPLAY_KEYS[cue.id] || cue.id}]`}
                            >
                              [{PAD_DISPLAY_KEYS[cue.id] || cue.id}]
                            </span>

                            {cues.length > 1 && (
                              <button
                                onClick={(e) => handleDeleteCue(e, cue.id)}
                                style={{
                                  backgroundColor: "transparent",
                                  border: "none",
                                  color: isPlaying ? "#111111" : "#FF3366",
                                  cursor: "pointer",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  opacity: 0.7,
                                }}
                                title="Eliminar este Cue"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Pad Center: Editable Name */}
                        <div
                          onDoubleClick={(e) => handleStartRename(e, cue)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "3px",
                            width: "100%",
                            overflow: "hidden",
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              autoFocus
                              value={editingCueName}
                              onChange={(e) => setEditingCueName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveRename(cue.id);
                                } else if (e.key === "Escape") {
                                  setEditingCueId(null);
                                }
                              }}
                              onBlur={() => handleSaveRename(cue.id)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: "98%",
                                backgroundColor: "#07080B",
                                border: "1px solid #CCFF00",
                                borderRadius: "2px",
                                color: "#FFFFFF",
                                fontSize: "0.64rem",
                                fontWeight: 900,
                                textAlign: "center",
                                padding: "1px 2px",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "3px",
                                width: "100%",
                                overflow: "hidden",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.66rem",
                                  fontWeight: 900,
                                  textAlign: "center",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  letterSpacing: "-0.2px",
                                }}
                                title={cue.name}
                              >
                                {cue.name}
                              </span>
                              <button
                                onClick={(e) => handleStartRename(e, cue)}
                                style={{
                                  backgroundColor: "transparent",
                                  border: "none",
                                  color: isPlaying ? "#111111" : "#8E94A5",
                                  cursor: "pointer",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  opacity: 0.65,
                                }}
                                title="Editar nombre del Cue"
                              >
                                <Pencil size={9} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Pad Footer: Exact Timestamp range and status */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", lineHeight: 1 }}>
                          <span
                            style={{
                              fontSize: "0.52rem",
                              color: isPlaying ? "#111111" : "#8E94A5",
                              fontFamily: "monospace",
                              fontWeight: 700,
                            }}
                            title={`Corte: ${formatSeconds(cue.startSec)} hasta ${formatSeconds(endLimitSec)} (${naturalDurationSec.toFixed(1)}s)`}
                          >
                            ⏱️ {formatSeconds(cue.startSec)} ➔ {formatSeconds(endLimitSec)}
                          </span>

                          <span
                            style={{
                              fontSize: "0.50rem",
                              color: isPlaying ? "#111111" : isSelected ? cue.color : "#5A6780",
                              fontWeight: 900,
                              fontFamily: "monospace",
                            }}
                            title={nextCue ? `Límite: Marcador #${nextCue.id}` : "Límite: Fin del audio"}
                          >
                            {isSelected ? "● ACTIVO" : `${naturalDurationSec.toFixed(1)}s`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "6px 16px",
            backgroundColor: "#141722",
            borderTop: "1px solid #242938",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.62rem", color: "#8E94A5" }}>
            Motor: <strong style={{ color: "#CCFF00" }}>Serato DSP Transient Slicer &amp; Cue Grid</strong>
          </span>

          <button
            onClick={onClose}
            style={{
              padding: "4px 12px",
              backgroundColor: "#2B303C",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "3px",
              fontSize: "0.68rem",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            CERRAR
          </button>
        </div>
        {/* MODAL CONFIGURACIÓN Y PRUEBA DE IA META DEMUCS V4 */}
        {showAiModal && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.78)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => setShowAiModal(false)}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "520px",
                backgroundColor: "#0B0E17",
                border: "1px solid #1E293B",
                borderRadius: "8px",
                boxShadow: "0 12px 36px rgba(0,0,0,0.85)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#131826",
                  borderBottom: "1px solid #1E293B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "1rem" }}>🎛️</span>
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#FFFFFF" }}>
                      META DEMUCS v4 • SEPARADOR DE STEMS POR IA
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "#64748B" }}>
                      Separación milimétrica en Batería, Bajo, Melodía y Vocales
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Contenido / Estado de Conexión */}
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Canción Seleccionada de C-Digger */}
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#161E2E",
                    border: "1.5px solid #00E5FF44",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.2rem" }}>🎵</span>
                    <div>
                      <div style={{ fontSize: "0.58rem", fontWeight: 900, color: "#00E5FF", letterSpacing: "0.5px" }}>
                        CANCIÓN DE C-DIGGER SELECCIONADA:
                      </div>
                      <div style={{ fontSize: "0.76rem", fontWeight: 900, color: "#FFFFFF" }}>
                        {trackInfo?.artist ? `${trackInfo.artist} — ${trackInfo.title}` : sampleName}
                      </div>
                      <div style={{ fontSize: "0.58rem", color: "#94A3B8" }}>
                        {trackInfo?.bpm || 95} BPM · Tonalidad {trackInfo?.key || "Am"} · Género {trackInfo?.genre || "Crate"}
                        {trackInfo?.youtubeId ? ` (YouTube ID: ${trackInfo.youtubeId})` : ""}
                      </div>
                    </div>
                  </div>
                  {onOpenDigger && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAiModal(false);
                        onOpenDigger();
                      }}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#1F293D",
                        color: "#CCFF00",
                        border: "1px solid #CCFF0044",
                        borderRadius: "3px",
                        fontSize: "0.6rem",
                        fontWeight: 900,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                      title="Volver a C-Digger para elegir otra canción"
                    >
                      CAMBIAR
                    </button>
                  )}
                </div>
                {/* Opción 1: Replicate Cloud */}
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "#0F1422",
                    border: `1px solid ${aiServerStatus?.hasReplicate ? "#00E5FF44" : "#1E273A"}`,
                    borderRadius: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>☁️</span>
                      <strong style={{ fontSize: "0.72rem", color: "#FFFFFF" }}>
                        Nube Replicate (GPU NVIDIA A100)
                      </strong>
                    </div>
                    <span
                      style={{
                        fontSize: "0.58rem",
                        fontWeight: 900,
                        padding: "2px 6px",
                        borderRadius: "3px",
                        backgroundColor: aiServerStatus?.hasReplicate ? "#00E5FF22" : "#242E42",
                        color: aiServerStatus?.hasReplicate ? "#00E5FF" : "#94A3B8",
                      }}
                    >
                      {aiServerStatus?.hasReplicate ? "CONECTADO" : "PENDIENTE TOKEN"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.62rem", color: "#94A3B8", margin: 0, lineHeight: 1.4 }}>
                    Separa cualquier canción en 3-5 segundos sin consumir recursos de tu computadora.
                  </p>
                  <div style={{ fontSize: "0.58rem", color: "#64748B", marginTop: "4px" }}>
                    Configuración: Agrega <code style={{ color: "#CCFF00" }}>REPLICATE_API_TOKEN</code> en tu archivo <code style={{ color: "#CCFF00" }}>.env.local</code>
                  </div>
                </div>

                {/* Opción 2: Worker Local */}
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "#0F1422",
                    border: `1px solid ${aiServerStatus?.hasLocalWorker ? "#CCFF0044" : "#1E273A"}`,
                    borderRadius: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🖥️</span>
                      <strong style={{ fontSize: "0.72rem", color: "#FFFFFF" }}>
                        Worker Local (Demucs en tu PC)
                      </strong>
                    </div>
                    <span
                      style={{
                        fontSize: "0.58rem",
                        fontWeight: 900,
                        padding: "2px 6px",
                        borderRadius: "3px",
                        backgroundColor: aiServerStatus?.hasLocalWorker ? "#CCFF0022" : "#242E42",
                        color: aiServerStatus?.hasLocalWorker ? "#CCFF00" : "#94A3B8",
                      }}
                    >
                      {aiServerStatus?.hasLocalWorker ? "EN LÍNEA (8000)" : "NO DETECTADO"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.62rem", color: "#94A3B8", margin: 0, lineHeight: 1.4 }}>
                    Corre en tu propia máquina con Python sin depender de internet.
                  </p>
                  <div style={{ fontSize: "0.58rem", color: "#64748B", marginTop: "4px" }}>
                    Comando: <code style={{ color: "#CCFF00" }}>python scripts/stem_separator.py --server --port 8000</code>
                  </div>
                </div>

                {/* Opción 3: Motor DSP en Memoria (Siempre activo) */}
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "#0F1422",
                    border: "1px solid #1E273A",
                    borderRadius: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>⚡</span>
                      <strong style={{ fontSize: "0.72rem", color: "#FFFFFF" }}>
                        Motor DSP en Memoria (Respaldo Inmediato)
                      </strong>
                    </div>
                    <span
                      style={{
                        fontSize: "0.58rem",
                        fontWeight: 900,
                        padding: "2px 6px",
                        borderRadius: "3px",
                        backgroundColor: "#FF007A22",
                        color: "#FF007A",
                      }}
                    >
                      ACTIVO (0ms)
                    </span>
                  </div>
                  <p style={{ fontSize: "0.62rem", color: "#94A3B8", margin: 0, lineHeight: 1.4 }}>
                    Filtra y sintetiza stems analógicos al vuelo sincronizados a la tonalidad y BPM.
                  </p>
                </div>
              </div>

              {/* Botones de Acción */}
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#0D111A",
                  borderTop: "1px solid #1E293B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={checkAiStatus}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "5px 10px",
                    backgroundColor: "#1A2234",
                    color: "#FFFFFF",
                    border: "1px solid #2B3852",
                    borderRadius: "4px",
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={11} className={isSeparatingStems ? "animate-spin" : ""} />
                  <span>COMPROBAR</span>
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAiModal(false);
                      handleSeparateStems();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "5px 14px",
                      backgroundColor: "#00E5FF",
                      color: "#07080B",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.66rem",
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: "0 0 12px rgba(0, 229, 255, 0.4)",
                    }}
                  >
                    <span>⚡ PROBAR SEPARACIÓN AHORA</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
