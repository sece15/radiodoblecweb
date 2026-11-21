"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Upload, Download, X, Disc, RefreshCw, Scissors, Square, Plus, Trash2, Pencil, ZoomIn, ZoomOut, Maximize2, ArrowLeft, Play, Pause, Loader2 } from "lucide-react";
import { CSamplerMasterModal } from "./CSamplerMasterModal";
import { CSamplerCutPadModal } from "./CSamplerCutPadModal";
import { useModalIsolation } from "@/hooks/useModalIsolation";
import type { SamplerCuePoint, SamplerTriggerMode, Akai16LevelsType, LoadedSampleData, DiggerTrack, StemType, StemsSeparationResult, BeatBreakdownSamplePayload } from "@/types/studio";
import { studioAudio } from "@/lib/studio/audioEngine";
import {
  RealtimeStemMixer,
  separateAudioIntoStems,
  createStemsFromTrack,
  extractStemPeaks,
} from "@/lib/studio/stemEngine";
import {
  separateAudioInBrowserWorker,
  encodeAudioBufferToWavBlob,
  saveYouTubeAudioToBrowserCache,
  loadYouTubeAudioFromBrowserCache,
  clearYouTubeAudioFromBrowserCache,
} from "@/lib/studio/browserStemAI";
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
  onSendToSequencer?: (payload: BeatBreakdownSamplePayload) => void;
  isStandalone?: boolean;
}

// Paleta minimalista: Amarillo, Negro y Grises
const SERATO_COLORS = [
  "#FFD600", // 1: Amarillo Estudio
  "#D4D4D8", // 2: Gris Claro
  "#FACC15", // 3: Amarillo Vivo
  "#A1A1AA", // 4: Gris Medio
  "#EAB308", // 5: Amarillo Dorado
  "#71717A", // 6: Gris Acero
  "#FDE047", // 7: Amarillo Suave
  "#E4E4E7", // 8: Gris Plata
  "#CA8A04", // 9: Amarillo Ocre
  "#A1A1AA", // 10: Gris Medio
  "#FFD600", // 11: Amarillo Estudio
  "#D4D4D8", // 12: Gris Claro
  "#FACC15", // 13: Amarillo Vivo
  "#71717A", // 14: Gris Acero
  "#EAB308", // 15: Amarillo Dorado
  "#E4E4E7", // 16: Gris Plata
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
  { id: 8, name: "CHOP 8 (BRIDGE)", startSec: 75.0, color: SERATO_COLORS[7], active: true },
  { id: 9, name: "CHOP 9 (VERSE A)", startSec: 86.0, color: SERATO_COLORS[8], active: true },
  { id: 10, name: "CHOP 10 (VERSE B)", startSec: 98.0, color: SERATO_COLORS[9], active: true },
  { id: 11, name: "CHOP 11 (STAB)", startSec: 110.0, color: SERATO_COLORS[10], active: true },
  { id: 12, name: "CHOP 12 (VOCAL)", startSec: 122.0, color: SERATO_COLORS[11], active: true },
  { id: 13, name: "CHOP 13 (DROP)", startSec: 134.0, color: SERATO_COLORS[12], active: true },
  { id: 14, name: "CHOP 14 (BREAK)", startSec: 146.0, color: SERATO_COLORS[13], active: true },
  { id: 15, name: "CHOP 15 (FILL)", startSec: 158.0, color: SERATO_COLORS[14], active: true },
  { id: 16, name: "CHOP 16 (OUTRO)", startSec: 170.0, color: SERATO_COLORS[15], active: true },
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
  onSendToSequencer,
  isStandalone = false,
}: CSamplerPluginModalProps) => {
  const [cues, setCues] = useState<SamplerCuePoint[]>(DEFAULT_CUES);
  const [selectedCueId, setSelectedCueId] = useState<number | null>(1);
  const [draggingCueId, setDraggingCueId] = useState<number | null>(null);
  const [scrubDirection, setScrubDirection] = useState<"forward" | "backward" | null>(null);
  const [editingCueId, setEditingCueId] = useState<number | null>(null);
  const [editingCueName, setEditingCueName] = useState<string>("");
  const [activeBank, setActiveBank] = useState<"A" | "B" | "ALL">("ALL");

  const [pitchSemi, setPitchSemi] = useState<number>(0);
  const [fineTuneCents, setFineTuneCents] = useState<number>(0);
  const [chopGatePct, setChopGatePct] = useState<number>(100);
  const [startOffsetMs, setStartOffsetMs] = useState<number>(0);
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
  const [stemProgress, setStemProgress] = useState<{ pct: number; stage: string } | null>(null);
  const [fxFilterSweep, setFxFilterSweep] = useState<number>(0); // -100..+100
  const [fxCrunch, setFxCrunch] = useState<number>(0); // 0..100
  const [fxMasterVol, setFxMasterVol] = useState<number>(90); // 0..120
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiServerStatus, setAiServerStatus] = useState<{
    hasLocalWorker: boolean;
    hasReplicate: boolean;
    activeProvider: string;
  } | null>(null);
  const stemMixerRef = useRef<RealtimeStemMixer | null>(null);
  const [padCustomBuffers, setPadCustomBuffers] = useState<Record<number, AudioBuffer>>({});
  const padCustomBuffersRef = useRef<Record<number, AudioBuffer>>({});
  padCustomBuffersRef.current = padCustomBuffers;
  const [padOriginalSources, setPadOriginalSources] = useState<
    Record<number, { buffer: AudioBuffer; startSec: number; endSec: number; trimStartPct: number; trimEndPct: number }>
  >({});

  const [isRecordingPads, setIsRecordingPads] = useState<boolean>(false);
  const isRecordingPadsRef = useRef<boolean>(false);
  isRecordingPadsRef.current = isRecordingPads;
  const [metronomeOn, setMetronomeOn] = useState<boolean>(false);
  const [quantizeOn, setQuantizeOn] = useState<boolean>(true);
  const quantizeOnRef = useRef<boolean>(true);
  quantizeOnRef.current = quantizeOn;
  const [recordedPadEvents, setRecordedPadEvents] = useState<{ cueId: number; timeSec: number }[]>([]);
  const [recordBars, setRecordBars] = useState<1 | 2 | 4>(4);
  const [isPlayingRecording, setIsPlayingRecording] = useState<boolean>(false);
  const [isRenderingRecording, setIsRenderingRecording] = useState<boolean>(false);
  const recordingStartPerfRef = useRef<number>(0);
  const recordingTimersRef = useRef<number[]>([]);
  const recordAutoStopTimerRef = useRef<number | null>(null);

  const [isCuttingPad, setIsCuttingPad] = useState<boolean>(false);
  const [isRescuingAudio, setIsRescuingAudio] = useState<boolean>(false);
  const rescuedYoutubeIdRef = useRef<string | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  const { isTopModal } = useModalIsolation(isOpen && !isStandalone, modalContainerRef, {
    captureSpace: false,
  });
  const [cutPadModalData, setCutPadModalData] = useState<{
    cueId: number;
    padLabel: string;
    rangeLabel: string;
    sliceStartSec: number;
    sliceEndSec: number;
    isRealAudio: boolean;
    bpm: number;
    musicalKey: string;
    genre: string;
    rawSliceBuffer: AudioBuffer;
    originalSliceBuffer?: AudioBuffer;
    initialTrimStartPct?: number;
    initialTrimEndPct?: number;
  } | null>(null);
  const [masterModalData, setMasterModalData] = useState<{
    padLabel: string;
    rangeLabel: string;
    initialBpm: number;
    channels: {
      raw: AudioBuffer | null;
      drums: AudioBuffer | null;
      bass: AudioBuffer | null;
      melody: AudioBuffer | null;
      vocals: AudioBuffer | null;
    };
  } | null>(null);

  // Estado y Refs del Puntero de Reproducción Continuo
  const [playbackPointerSec, setPlaybackPointerSec] = useState<number>(0);
  const [isPlayingSong, setIsPlayingSong] = useState<boolean>(false);

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
      const trackDur = externalSample.trackInfo?.durationSec || 180;
      if (externalSample.cues && externalSample.cues.length > 0) {
        const baseCues = externalSample.cues.slice(0, 16);
        if (baseCues.length < 16) {
          const sliceLen = trackDur / 16;
          const usedIds = new Set(baseCues.map((c) => c.id));
          const padded: SamplerCuePoint[] = [...baseCues];
          for (let id = 1; id <= 16 && padded.length < 16; id++) {
            if (!usedIds.has(id)) {
              const startSec = Math.round((id - 1) * sliceLen * 10) / 10;
              padded.push({
                id,
                name: `CHOP ${id} (${formatSeconds(startSec)})`,
                startSec,
                color: SERATO_COLORS[(id - 1) % SERATO_COLORS.length],
                active: true,
              });
            }
          }
          padded.sort((a, b) => a.id - b.id);
          setCues(padded);
        } else {
          setCues(baseCues);
        }
        setSelectedCueId(baseCues[0].id);
      } else {
        const sliceLen = trackDur / 16;
        const auto16: SamplerCuePoint[] = Array.from({ length: 16 }).map((_, idx) => {
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
        setCues(auto16);
        setSelectedCueId(1);
      }
      setActiveBank("ALL");

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

        if (trackInfo?.youtubeId && !customAudioBuffer) {
          fetch(`/api/studio/stream-sample?youtubeId=${trackInfo.youtubeId}`)
            .then(async (res) => {
              const contentType = res.headers.get("content-type") || "";
              if (res.ok && (contentType.includes("audio") || contentType.includes("octet-stream"))) {
                const arrayBuffer = await res.arrayBuffer();
                const AudioCtx =
                  window.AudioContext ||
                  (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                const ctx = new AudioCtx();
                const buf = await ctx.decodeAudioData(arrayBuffer);
                setCustomAudioBuffer(buf);
              }
            })
            .catch(() => {});
        }
      }
    };

    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, [trackInfo?.youtubeId, customAudioBuffer]);

  // Rescate automático en segundo plano del audio real de YouTube hacia RAM al abrir o cambiar pista
  const rescueYouTubeAudioIntoRam = useCallback(async (youtubeId?: string | null): Promise<AudioBuffer | null> => {
    if (customAudioBuffer) return customAudioBuffer;
    const targetId = youtubeId || externalSample?.trackInfo?.youtubeId || trackInfo?.youtubeId;
    if (!targetId) return null;

    setIsRescuingAudio(true);
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    try {
      let fromCache = false;
      let arrayBuffer: ArrayBuffer | null = await loadYouTubeAudioFromBrowserCache(targetId);
      if (arrayBuffer) {
        fromCache = true;
      } else {
        const res = await fetch(`/api/studio/stream-sample?youtubeId=${targetId}`);
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && (contentType.includes("audio") || contentType.includes("octet-stream"))) {
          arrayBuffer = await res.arrayBuffer();
          await saveYouTubeAudioToBrowserCache(targetId, arrayBuffer, contentType);
        }
      }
      if (!arrayBuffer) return null;
      let decoded: AudioBuffer;
      try {
        decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
      } catch {
        if (fromCache) {
          await clearYouTubeAudioFromBrowserCache(targetId);
        }
        return null;
      }
      setCustomAudioBuffer(decoded);
      if (wavesurferRef.current) {
        loadWaveformData(decoded.duration, decoded, externalSample?.trackInfo || trackInfo || null, null);
      }
      return decoded;
    } catch {
      return null;
    } finally {
      setIsRescuingAudio(false);
      await ctx.close().catch(() => {});
    }
  }, [customAudioBuffer, externalSample?.trackInfo, trackInfo, loadWaveformData]);

  useEffect(() => {
    if (!isOpen) return;
    const activeYtId = externalSample?.trackInfo?.youtubeId || trackInfo?.youtubeId;
    if (!activeYtId || customAudioBuffer) return;
    if (rescuedYoutubeIdRef.current === activeYtId) return;
    rescuedYoutubeIdRef.current = activeYtId;
    void rescueYouTubeAudioIntoRam(activeYtId);
  }, [isOpen, externalSample?.trackInfo?.youtubeId, trackInfo?.youtubeId, customAudioBuffer, rescueYouTubeAudioIntoRam]);

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
    setStemProgress({ pct: 0, stage: "Preparando separación de 4 canales..." });
    try {
      let sourceBuffer = customAudioBuffer;
      const currentTrack = externalSample?.trackInfo || trackInfo;
      const bpm = currentTrack?.bpm || 95;
      const key = currentTrack?.key || "Am";
      const genre = currentTrack?.genre || "funk";
      const duration = currentTrack?.durationSec || totalDuration || 180;

      // 1. Intentar separar en la PC del usuario (Worker Local en 127.0.0.1:8010) o vía API (Cloud / Dev)
      let aiResult: StemsSeparationResult | null = null;
      const decodeRemoteStems = async (
        stemsMap: { drums: string; bass: string; melody: string; vocals: string },
        engineLabel: string
      ) => {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        try {
          const fetchStemBuffer = async (url: string) => {
            const r = await fetch(url);
            if (!r.ok) throw new Error(`Stem fetch failed: ${r.status}`);
            const ab = await r.arrayBuffer();
            return ctx.decodeAudioData(ab);
          };
          const [drumsB, bassB, melodyB, vocalsB] = await Promise.all([
            fetchStemBuffer(stemsMap.drums),
            fetchStemBuffer(stemsMap.bass),
            fetchStemBuffer(stemsMap.melody),
            fetchStemBuffer(stemsMap.vocals),
          ]);
          aiResult = {
            drums: drumsB,
            bass: bassB,
            melody: melodyB,
            vocals: vocalsB,
            durationSec: drumsB.duration,
            sampleRate: drumsB.sampleRate,
          };
          void engineLabel;
        } finally {
          await ctx.close().catch(() => {});
        }
      };

      // 1A. Primero comprobar si la PC del usuario tiene su propio worker Demucs local en 127.0.0.1:8010
      if (currentTrack?.youtubeId) {
        try {
          const clientHealth = await fetch("http://127.0.0.1:8010/health", {
            signal: AbortSignal.timeout(600),
          });
          if (clientHealth.ok) {
            const clientSepRes = await fetch("http://127.0.0.1:8010/separate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                youtubeId: currentTrack.youtubeId,
                trackTitle: currentTrack.title || sampleName,
              }),
            });
            if (clientSepRes.ok) {
              const clientSepData = await clientSepRes.json();
              if (clientSepData.success && clientSepData.stems) {
                await decodeRemoteStems(clientSepData.stems, "DEMUCS PC LOCAL");
              }
            }
          }
        } catch {
          // El usuario no tiene worker Python local activo; continuamos sin bloquear
        }
      }

      // 1B. Si no hubo worker en la PC del usuario, consultar /api/studio/separate-stems (Cloud / Dev)
      if (!aiResult) {
        try {
          const sepRes = await fetch("/api/studio/separate-stems", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              youtubeId: currentTrack?.youtubeId,
              trackTitle: currentTrack?.title || sampleName,
              bpm,
              key,
              genre,
            }),
          });
          if (sepRes.ok) {
            const sepData = await sepRes.json();
            if (sepData.status === "success" && sepData.stems) {
              await decodeRemoteStems(
                sepData.stems,
                sepData.provider === "meta_demucs_v4_local" || sepData.provider === "meta_demucs_v4_local_cache"
                  ? "DEMUCS LOCAL"
                  : "DEMUCS CLOUD"
              );
            }
          }
        } catch (aiErr) {
          console.warn("AI Demucs separation notice:", aiErr);
        }
      }

      // 2. Intentar obtener audio real de YouTube (primero desde caché local en PC, luego gateway)
      if (!aiResult && !sourceBuffer && currentTrack?.youtubeId) {
        try {
          let arrayBuffer = await loadYouTubeAudioFromBrowserCache(currentTrack.youtubeId);
          if (!arrayBuffer) {
            const res = await fetch(
              `/api/studio/stream-sample?youtubeId=${currentTrack.youtubeId}&bpm=${bpm}&key=${encodeURIComponent(key)}&genre=${encodeURIComponent(genre)}`
            );
            const contentType = res.headers.get("Content-Type") || "";
            if (res.ok && contentType.includes("audio")) {
              arrayBuffer = await res.arrayBuffer();
              await saveYouTubeAudioToBrowserCache(currentTrack.youtubeId, arrayBuffer, contentType);
            }
          }
          if (arrayBuffer) {
            const AudioCtx =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioCtx();
            try {
              sourceBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
              setCustomAudioBuffer(sourceBuffer);
            } finally {
              await ctx.close().catch(() => {});
            }
          }
        } catch {}
      }

      // 3. Resultado final: IA Worker Local/Cloud, IA en Navegador (WebGPU/WASM sobre el Chop activo) o DSP en memoria
      let res: StemsSeparationResult;
      if (aiResult) {
        res = aiResult;
      } else if (sourceBuffer) {
        // Flujo profesional de Sampler: primero DSP base instantáneo (~50ms) y luego IA Demucs
        // enfocada en la ventana del Chop/Cue activo (máx. 23.4s = 1 a 3 bloques = ~5-12s en WebGPU)
        const dspBase = await separateAudioIntoStems(sourceBuffer, bpm, key, genre);
        const targetCue = cues.find((c) => c.id === (activeCueId ?? selectedCueId)) ?? cues[0];
        const sliceStart = targetCue ? targetCue.startSec : 0;
        const sliceEnd = targetCue
          ? calculateSliceBoundary(targetCue.id, cues, sourceBuffer.duration).endLimitSec
          : Math.min(sourceBuffer.duration, 15.6);
        const windowStartSec = Math.max(0, Math.min(sourceBuffer.duration - 1, sliceStart));
        const windowDurationSec = Math.min(
          23.4,
          Math.max(7.8, sliceEnd > sliceStart ? sliceEnd - sliceStart : 15.6)
        );

        console.info(
          `[C-Stems] Separando chop activo (${formatSeconds(windowStartSec)} -> ${formatSeconds(
            Math.min(sourceBuffer.duration, windowStartSec + windowDurationSec)
          )}) con IA en tu navegador...`
        );
        const browserAi = await separateAudioInBrowserWorker(sourceBuffer, {
          windowStartSec,
          windowDurationSec,
          baseStems: dspBase,
          onProgress: (pct, stage) => {
            setStemProgress({ pct, stage });
            console.info(`[C-Stems] ${pct}% - ${stage}`);
          },
        });
        if (browserAi) {
          res = browserAi.stems;
        } else {
          console.info("[C-Stems] Usando motor DSP en memoria (Web Audio).");
          res = dspBase;
        }
      } else {
        console.warn(
          "[C-Stems] No se pudo obtener el audio binario de YouTube desde los gateways públicos. Para probar la IA del navegador, carga un archivo local con 'CARGAR AUDIO'."
        );
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
      setStemProgress(null);
    }
  }, [customAudioBuffer, trackInfo, totalDuration, externalSample, sampleName, cues, activeCueId, selectedCueId]);

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

      const activePitch = (options?.overridePitchSemi !== undefined ? options.overridePitchSemi : pitchSemi) + fineTuneCents / 100;
      const effectiveStartSec = Math.max(0, cue.startSec + startOffsetMs / 1000);
      const velocity = options?.velocity ?? 1.0;
      const filterCutoff = options?.filterCutoff;

      if (isRecordingPadsRef.current) {
        const rawSec = Math.max(0, (performance.now() - recordingStartPerfRef.current) / 1000);
        const curBpm = (externalSample?.trackInfo || trackInfo)?.bpm || 95;
        const step16 = 60 / curBpm / 4;
        const timeSec = quantizeOnRef.current
          ? Math.round(rawSec / step16) * step16
          : rawSec;
        setRecordedPadEvents((prev) => [...prev, { cueId: cue.id, timeSec }]);
      }

      // Límites sucesivos de corte: el marcador 1 termina en el marcador 2, el 2 en el 3, etc.
      const { naturalDurationSec } = getCueSliceLimits(
        cue.id,
        cues,
        totalDuration
      );

      // Factor de velocidad por pitch shifting
      const playbackRate = Math.pow(2, activePitch / 12);
      // Duración real en segundos de reproducción hasta alcanzar el siguiente marcador
      const gateScale = triggerMode === "full_track" ? 1 : Math.max(0.1, chopGatePct / 100);
      const playbackDurationSec = (naturalDurationSec * gateScale) / playbackRate;
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

      const customPadBuf = padCustomBuffersRef.current[cue.id];

      // 0. PAD CON CORTE REAL PERSONALIZADO
      if (customPadBuf) {
        studioAudio.playSamplerSlice(
          { startSec: 0, duration: customPadBuf.duration },
          {
            pitchSemi: activePitch,
            velocity,
            filterCutoff,
            duration: customPadBuf.duration,
          },
          customPadBuf
        );
      } else if (activeStemFilter && stemMixerRef.current) {
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
          stemMixerRef.current.play(effectiveStartSec, sliceDuration);
        } else if (customAudioBuffer) {
          studioAudio.playSamplerSlice(
            { startSec: effectiveStartSec, duration: sliceDuration },
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
    [pitchSemi, fineTuneCents, chopGatePct, startOffsetMs, customAudioBuffer, trackInfo?.youtubeId, trackInfo?.key, triggerMode, applyPitchRateToYouTube, handleStopAudio, getCueSliceLimits, activeStemFilter, cues, stemsResult, totalDuration]
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
      waveColor: ["#FFD600", "#FFD600", "#D4D4D8"], // Gradiente espectral Serato RGB
      progressColor: ["#FFD600", "#FFD600", "#EAB308"], // Máscara de progreso
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
          const color = cue?.color || "#FFD600";

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

  const sliceAudioBufferToWindow = (
    ctx: AudioContext,
    buf: AudioBuffer,
    startSec: number,
    endSec: number
  ): AudioBuffer => {
    const sr = buf.sampleRate;
    const startSample = Math.max(0, Math.min(buf.length - 1, Math.floor(startSec * sr)));
    const endSample = Math.max(startSample + Math.floor(0.1 * sr), Math.min(buf.length, Math.floor(endSec * sr)));
    const frameCount = Math.max(1, endSample - startSample);
    const out = ctx.createBuffer(buf.numberOfChannels, frameCount, sr);
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      out.getChannelData(ch).set(buf.getChannelData(ch).subarray(startSample, startSample + frameCount));
    }
    return out;
  };

  const handleCutSelectedPadAtPlayhead = async () => {
    const targetCue = cues.find((c) => c.id === (selectedCueId ?? activeCueId)) ?? cues[0];
    if (!targetCue) return;

    const { startSec, endLimitSec, naturalDurationSec } = getCueSliceLimits(
      targetCue.id,
      cues,
      totalDuration
    );
    const safeEnd = Math.max(startSec + 0.2, endLimitSec);

    setIsCuttingPad(true);
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    try {
      let sourceBuf: AudioBuffer | null = customAudioBuffer;
      const activeTrack = externalSample?.trackInfo || trackInfo;

      if (!sourceBuf && activeTrack?.youtubeId) {
        try {
          let arrayBuffer: ArrayBuffer | null = await loadYouTubeAudioFromBrowserCache(activeTrack.youtubeId);
          if (!arrayBuffer) {
            const res = await fetch(`/api/studio/stream-sample?youtubeId=${activeTrack.youtubeId}`);
            const contentType = res.headers.get("content-type") || "";
            if (res.ok && (contentType.includes("audio") || contentType.includes("octet-stream"))) {
              arrayBuffer = await res.arrayBuffer();
              await saveYouTubeAudioToBrowserCache(activeTrack.youtubeId, arrayBuffer, contentType);
            }
          }
          if (arrayBuffer) {
            sourceBuf = await ctx.decodeAudioData(arrayBuffer.slice(0));
            setCustomAudioBuffer(sourceBuf);
          }
        } catch {}
      }

      let rawSliceBuffer: AudioBuffer;
      let originalSliceBuffer: AudioBuffer;
      let effectiveStartSec = startSec;
      let effectiveEndSec = safeEnd;
      let initialTrimStartPct = 0;
      let initialTrimEndPct = 100;
      let isRealAudio = false;

      const savedOriginal = padOriginalSources[targetCue.id];
      const existingPadBuffer = padCustomBuffers[targetCue.id];

      if (savedOriginal) {
        originalSliceBuffer = savedOriginal.buffer;
        rawSliceBuffer = existingPadBuffer || savedOriginal.buffer;
        effectiveStartSec = savedOriginal.startSec;
        effectiveEndSec = savedOriginal.endSec;
        initialTrimStartPct = savedOriginal.trimStartPct;
        initialTrimEndPct = savedOriginal.trimEndPct;
        isRealAudio = true;
      } else if (sourceBuf) {
        const sliced = sliceAudioBufferToWindow(ctx, sourceBuf, startSec, safeEnd);
        originalSliceBuffer = sliced;
        rawSliceBuffer = existingPadBuffer || sliced;
        isRealAudio = true;
        setPadOriginalSources((prev) => ({
          ...prev,
          [targetCue.id]: {
            buffer: sliced,
            startSec,
            endSec: safeEnd,
            trimStartPct: 0,
            trimEndPct: 100,
          },
        }));
      } else if (existingPadBuffer) {
        originalSliceBuffer = existingPadBuffer;
        rawSliceBuffer = existingPadBuffer;
        isRealAudio = true;
      } else {
        const synth = createStemsFromTrack(
          Math.max(1, Math.min(30, naturalDurationSec)),
          activeTrack?.bpm || 95,
          activeTrack?.key || "Am",
          activeTrack?.genre || "funk"
        );
        const fallbackBuf =
          synth.melody || synth.drums || ctx.createBuffer(2, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
        originalSliceBuffer = fallbackBuf;
        rawSliceBuffer = fallbackBuf;
      }

      setCutPadModalData({
        cueId: targetCue.id,
        padLabel: `CUE ${targetCue.id} · ${targetCue.name}`,
        rangeLabel: `${formatSeconds(effectiveStartSec)} ➔ ${formatSeconds(effectiveEndSec)} (${Math.max(0.1, effectiveEndSec - effectiveStartSec).toFixed(1)}s)`,
        sliceStartSec: effectiveStartSec,
        sliceEndSec: effectiveEndSec,
        isRealAudio,
        bpm: activeTrack?.bpm || 95,
        musicalKey: activeTrack?.key || "Am",
        genre: activeTrack?.genre || "funk",
        rawSliceBuffer,
        originalSliceBuffer,
        initialTrimStartPct,
        initialTrimEndPct,
      });
    } finally {
      setIsCuttingPad(false);
      await ctx.close().catch(() => {});
    }
  };

  const stopRecordedMelodyPlayback = useCallback(() => {
    for (const id of recordingTimersRef.current) {
      window.clearTimeout(id);
    }
    recordingTimersRef.current = [];
    setIsPlayingRecording(false);
    handleStopAudio();
  }, [handleStopAudio]);

  // Metrónomo en vivo mientras se graba una secuencia de pads
  useEffect(() => {
    if (!isRecordingPads || !metronomeOn) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const curBpm = (externalSample?.trackInfo || trackInfo)?.bpm || 95;
    const beatMs = Math.round((60 / Math.max(50, curBpm)) * 1000);
    let beatIdx = 0;

    const playTick = () => {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(beatIdx % 4 === 0 ? 1280 : 880, now);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        beatIdx++;
      } catch {}
    };

    playTick();
    const timer = window.setInterval(playTick, beatMs);
    return () => {
      window.clearInterval(timer);
      ctx.close().catch(() => {});
    };
  }, [isRecordingPads, metronomeOn, externalSample?.trackInfo, trackInfo]);

  const handleToggleRecordPads = () => {
    if (recordAutoStopTimerRef.current !== null) {
      window.clearTimeout(recordAutoStopTimerRef.current);
      recordAutoStopTimerRef.current = null;
    }
    if (isRecordingPads) {
      setIsRecordingPads(false);
    } else {
      stopRecordedMelodyPlayback();
      setRecordedPadEvents([]);
      recordingStartPerfRef.current = performance.now();
      setIsRecordingPads(true);
      // Auto-detener al completar los compases elegidos (1, 2 o 4 compases)
      const activeBpm = (externalSample?.trackInfo || trackInfo)?.bpm || 90;
      const targetMs = Math.round(((60 / activeBpm) * 4 * recordBars) * 1000);
      recordAutoStopTimerRef.current = window.setTimeout(() => {
        setIsRecordingPads(false);
        recordAutoStopTimerRef.current = null;
      }, targetMs);
    }
  };

  const handlePlayRecordedMelody = () => {
    if (isPlayingRecording) {
      stopRecordedMelodyPlayback();
      return;
    }
    if (recordedPadEvents.length === 0) return;

    setIsPlayingRecording(true);
    const timers: number[] = [];
    const maxTime = recordedPadEvents[recordedPadEvents.length - 1].timeSec;
    recordedPadEvents.forEach((ev) => {
      const t = window.setTimeout(() => {
        const cue = cues.find((c) => c.id === ev.cueId);
        if (cue) handleTriggerCue(cue);
      }, Math.round(ev.timeSec * 1000));
      timers.push(t);
    });
    const endTimer = window.setTimeout(() => {
      setIsPlayingRecording(false);
    }, Math.round((maxTime + 1.5) * 1000));
    timers.push(endTimer);
    recordingTimersRef.current = timers;
  };

  const handleSendRecordedMelodyToMaster = async () => {
    if (recordedPadEvents.length === 0) return;
    stopRecordedMelodyPlayback();
    setIsRenderingRecording(true);
    try {
      const sr = customAudioBuffer?.sampleRate || 44100;
      const activeTrack = externalSample?.trackInfo || trackInfo;
      const bpm = activeTrack?.bpm || 87;
      const key = activeTrack?.key || "Am";
      const genre = activeTrack?.genre || "boombap";
      const exactBarsSec = (60 / bpm) * 4 * recordBars;
      const lastEv = recordedPadEvents[recordedPadEvents.length - 1];
      const totalRenderSec = Math.max(exactBarsSec, lastEv.timeSec + 0.5);
      const offline = new OfflineAudioContext(2, Math.ceil(totalRenderSec * sr), sr);

      for (let i = 0; i < recordedPadEvents.length; i++) {
        const ev = recordedPadEvents[i];
        const nextEv = recordedPadEvents[i + 1];
        const cue = cues.find((c) => c.id === ev.cueId);
        if (!cue) continue;

        const padBuf = padCustomBuffersRef.current[cue.id];
        const { startSec, naturalDurationSec } = getCueSliceLimits(cue.id, cues, totalDuration);
        const maxPlayDur = nextEv
          ? Math.max(0.12, nextEv.timeSec - ev.timeSec)
          : Math.max(0.25, exactBarsSec - ev.timeSec);

        let hitBuf: AudioBuffer | null = null;
        if (padBuf) {
          hitBuf = padBuf;
        } else if (customAudioBuffer) {
          const sliceLen = Math.min(naturalDurationSec, maxPlayDur);
          const hitCtx = new OfflineAudioContext(
            customAudioBuffer.numberOfChannels,
            Math.max(1, Math.floor(sliceLen * sr)),
            sr
          );
          const s = hitCtx.createBufferSource();
          s.buffer = customAudioBuffer;
          s.connect(hitCtx.destination);
          s.start(0, startSec, sliceLen);
          hitBuf = await hitCtx.startRendering();
        }

        if (hitBuf) {
          const src = offline.createBufferSource();
          src.buffer = hitBuf;
          src.connect(offline.destination);
          src.start(ev.timeSec, 0, Math.min(hitBuf.duration, maxPlayDur));
        }
      }

      const rendered = await offline.startRendering();

      // Si estamos conectados al nuevo Beat Breakdown Sequencer, enviar la melodía grabada directamente allí
      if (onSendToSequencer) {
        studioAudio.stopSamplerAudio();
        onSendToSequencer({
          title: sampleName || activeTrack?.title || "BOOMBAP OLD SCHOOL TYPE BEAT",
          bpm,
          musicalKey: key,
          genre,
          sampleBuffer: rendered,
          bassBuffer: stemsResult?.bass ?? null,
          cues,
          padCustomBuffers: padCustomBuffersRef.current,
          selectedCueId: null,
          recordedBars: recordBars,
        });
        return;
      }

      const dspBase = await separateAudioIntoStems(rendered, bpm, key, genre);
      const browserAi = await separateAudioInBrowserWorker(rendered, {
        windowStartSec: 0,
        windowDurationSec: rendered.duration,
        baseStems: dspBase,
      });
      const finalStems = browserAi ? browserAi.stems : dspBase;

      setMasterModalData({
        padLabel: `MELODÍA GRABADA (${recordedPadEvents.length} PADS)`,
        rangeLabel: `0:00.0 ➔ ${formatSeconds(rendered.duration)} (${rendered.duration.toFixed(1)}s)`,
        initialBpm: bpm,
        channels: {
          raw: rendered,
          drums: finalStems.drums,
          bass: finalStems.bass,
          melody: finalStems.melody,
          vocals: finalStems.vocals,
        },
      });
    } finally {
      setIsRenderingRecording(false);
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

  // Atajos de teclado físicos (Soporta Serato Chops y Akai 16 Levels con modo HOLD y monophonic choke)
  useEffect(() => {
    if (!isStandalone && !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isStandalone && !isTopModal()) return;
      if (showAiModal) return;

      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
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
          e.stopPropagation();
          setCues((prev) => prev.filter((c) => c.id !== selectedCueId));
          setSelectedCueId(null);
          return;
        }
      }

      const padId = KEY_PAD_MAP[e.key];
      if (padId !== undefined) {
        if (!e.repeat) {
          e.preventDefault();
          e.stopPropagation();
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
      if (!isStandalone && !isTopModal()) return;
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

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [isOpen, isStandalone, showAiModal, isTopModal, cues, selectedCueId, is16Levels, triggerMode, handleTriggerCue, handleTrigger16Level, handleStopAudio]);

  const handleDownloadAudioToPc = useCallback(() => {
    if (!customAudioBuffer) return;
    const blob = encodeAudioBufferToWavBlob(customAudioBuffer);
    const url = URL.createObjectURL(blob);
    const rawName = (trackInfo?.title || sampleName || "c-studio-sample")
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 60);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rawName}.wav`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, [customAudioBuffer, trackInfo?.title, sampleName]);

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

        const sliceLen = decoded.duration / 16;
        const autoCues: SamplerCuePoint[] = Array.from({ length: 16 }).map((_, idx) => {
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

      const sliceLen = decoded.duration / 16;
      const autoCues: SamplerCuePoint[] = Array.from({ length: 16 }).map((_, idx) => {
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
      ref={modalContainerRef}
      tabIndex={-1}
      role={isStandalone ? undefined : "dialog"}
      aria-modal={isStandalone ? undefined : true}
      suppressHydrationWarning
      style={
        isStandalone
          ? {
              minHeight: "100vh",
              width: "100%",
              backgroundColor: "#07080B",
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
              backgroundColor: "#07080B",
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
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropAudio}
        style={{
          width: "100%",
          maxWidth: "1180px",
          backgroundColor: "#111215",
          border: "2px solid #FFD600",
          outline: "4px solid #090A0D",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 28px 80px rgba(0,0,0,0.95)",
          overflow: "hidden",
        }}
      >
        {/* Header Bar: Estilo Modular VU202 (Negro mate + líneas amarillas + botones metálicos) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "12px",
            padding: "8px 14px",
            backgroundColor: "#141519",
            borderBottom: "1px solid rgba(255,214,0,0.45)",
          }}
        >
          {/* Izquierda: C-SAMPLER + VOLVER A LA RADIO + Perillas de Efectos */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div
              style={{
                background: "linear-gradient(180deg, #3A3C42 0%, #23252A 100%)",
                color: "#FFD600",
                fontWeight: 900,
                fontFamily: "monospace",
                fontSize: "0.68rem",
                padding: "3px 9px",
                borderRadius: "3px",
                border: "1px solid #4B4E57",
                boxShadow: "0 2px 0 #07080A",
                letterSpacing: "1px",
              }}
            >
              C-SAMPLER
            </div>

            {isStandalone && (
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "linear-gradient(180deg, #3A3C42 0%, #23252A 100%)",
                  color: "#FFD600",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  fontSize: "0.68rem",
                  padding: "3px 9px",
                  borderRadius: "3px",
                  border: "1px solid #4B4E57",
                  boxShadow: "0 2px 0 #07080A",
                  letterSpacing: "1px",
                  textDecoration: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                title="Volver a la señal en vivo de Radio Doble C"
              >
                <ArrowLeft size={11} />
                <span>VOLVER A LA RADIO</span>
              </Link>
            )}
          </div>

          {/* Centro: RADIO DOBLE C */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 900,
                color: "#FFD600",
                letterSpacing: "1.4px",
                fontFamily: "monospace",
                whiteSpace: "nowrap",
              }}
            >
              RADIO DOBLE C
            </span>
          </div>

          {/* Derecha: IR A BEAT BREAKDOWN + IR A C-DIGGER + Emoji Calavera + LED */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
            {onSendToSequencer && (
              <button
                type="button"
                onClick={() => {
                  studioAudio.stopSamplerAudio();
                  onSendToSequencer({
                    title: sampleName || trackInfo?.title || "BOOMBAP OLD SCHOOL TYPE BEAT",
                    bpm: trackInfo?.bpm || 87,
                    musicalKey: trackInfo?.key,
                    genre: trackInfo?.genre,
                    sampleBuffer: customAudioBuffer,
                    bassBuffer: stemsResult?.bass ?? null,
                    cues,
                    padCustomBuffers,
                    selectedCueId,
                  });
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  backgroundColor: "var(--primary-container)",
                  color: "var(--on-primary-container)",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  fontSize: "0.68rem",
                  padding: "3px 10px",
                  borderRadius: "3px",
                  border: "1.5px solid var(--primary)",
                  boxShadow: "0 2px 0 #07080A",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                title="Enviar sample cortado al Secuenciador Beat Breakdown"
              >
                <span>BEAT BREAKDOWN →</span>
              </button>
            )}
            {onOpenDigger && (
              <button
                type="button"
                onClick={onOpenDigger}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "linear-gradient(180deg, #3A3C42 0%, #23252A 100%)",
                  color: "#FFD600",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  fontSize: "0.68rem",
                  padding: "3px 9px",
                  borderRadius: "3px",
                  border: "1px solid #4B4E57",
                  boxShadow: "0 2px 0 #07080A",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                title="Explorar y samplear vinilos en C-Digger"
              >
                <Disc size={11} />
                <span>IR A C-DIGGER</span>
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                padding: "3px 6px",
                backgroundColor: "#262830",
                border: "1px solid #3A3D48",
                borderRadius: "3px",
                boxShadow: "0 2px 0 #090A0D",
                color: "#D4D4D8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Cerrar sampler"
            >
              <img
                src="/emojis/msn/c-calavera-48.png"
                alt="Cerrar sampler"
                style={{ width: "20px", height: "20px", objectFit: "contain", display: "block" }}
              />
            </button>
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                backgroundColor: "#2C2F38",
                border: "1px solid #0B0C0F",
                boxShadow: "inset 0 1px 1px rgba(0,0,0,0.9)",
                display: "inline-block",
              }}
            />
          </div>
        </div>

        {/* Hidden YouTube Audio Player (sin banner visible para ahorrar espacio) */}
        {(() => {
          const activeTrack = externalSample?.trackInfo || trackInfo;
          if (!activeTrack?.youtubeId) return null;
          return (
            <div
              aria-hidden="true"
              style={{
                position: "fixed",
                left: "-9999px",
                top: 0,
                width: "1px",
                height: "1px",
                opacity: 0,
                pointerEvents: "none",
                overflow: "hidden",
              }}
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
          );
        })()}

        {/* Modal Main Content */}
        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "86vh", overflowY: "auto" }}>
          {/* 1. Modular VU202 Top Bar: Fuente de Audio + Caja EFECTOS + Stems */}
          <div
            style={{
              backgroundColor: "#0A0B0E",
              border: "1px solid rgba(255,214,0,0.45)",
              borderRadius: "6px",
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "stretch", gap: "10px", flexWrap: "wrap" }}>
              {/* Caja EFECTOS (Botones Blancos Táctiles estilo VU202) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  backgroundColor: "#111215",
                  border: "1px solid rgba(255,214,0,0.45)",
                  borderRadius: "5px",
                  padding: "6px 10px",
                }}
              >
                <div
                  style={{
                    borderBottom: "1px solid rgba(255,214,0,0.35)",
                    paddingBottom: "3px",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.54rem",
                      fontWeight: 900,
                      color: "#FFD600",
                      letterSpacing: "1.6px",
                      fontFamily: "monospace",
                    }}
                  >
                    EFECTOS
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleAddCue()}
                  disabled={cues.length >= 16}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 9px",
                    background: "linear-gradient(180deg, #F0F0F2 0%, #D4D4D8 100%)",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "4px",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 3px 0 #07080A",
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: cues.length >= 16 ? "not-allowed" : "pointer",
                    opacity: cues.length >= 16 ? 0.5 : 1,
                  }}
                  title="Agregar un nuevo Cue Point (hasta 16)"
                >
                  <Plus size={11} />
                  <span>+ CUE</span>
                </button>

                <button
                  type="button"
                  disabled={isCuttingPad}
                  onClick={handleCutSelectedPadAtPlayhead}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 9px",
                    background: "linear-gradient(180deg, #F0F0F2 0%, #D4D4D8 100%)",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "4px",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 3px 0 #07080A",
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: isCuttingPad ? "wait" : "pointer",
                    opacity: isCuttingPad ? 0.65 : 1,
                  }}
                  title="Abre el editor de corte con el tramo exacto del pad seleccionado para ajustar pitch, efectos y separar instrumentos"
                >
                  <Scissors size={11} />
                  <span>{isCuttingPad ? "CORTANDO..." : "CORTAR PAD"}</span>
                </button>

                {/* Botón Akai MPC 16 Levels */}
                <button
                  onClick={() => setIs16Levels((prev) => !prev)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 9px",
                    background: is16Levels
                      ? "linear-gradient(180deg, #FFE135 0%, #FFD600 100%)"
                      : "linear-gradient(180deg, #F0F0F2 0%, #D4D4D8 100%)",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "4px",
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                    boxShadow: is16Levels
                      ? "inset 0 1px 0 rgba(255,255,255,0.7), 0 0 12px rgba(255, 214, 0, 0.55), 0 3px 0 #07080A"
                      : "inset 0 1px 0 rgba(255,255,255,0.9), 0 3px 0 #07080A",
                    transition: "all 0.12s ease",
                  }}
                  title="Efecto Akai MPC 16 Levels: Mapea el chop seleccionado cromáticamente en 16 semitonos (-7st a +8st) para tocar melodías con el teclado"
                >
                  <span>🎹</span>
                  <span>16 LEVELS</span>
                  {is16Levels && (
                    <span
                      style={{
                        fontSize: "0.52rem",
                        backgroundColor: "#090A0D",
                        color: "#FFD600",
                        padding: "1px 4px",
                        borderRadius: "2px",
                        fontWeight: 900,
                      }}
                    >
                      ON
                    </span>
                  )}
                </button>

                {/* Fin Caja EFECTOS */}
                </div>
              </div>

              {/* Perillas de Efectos Reales al lado de EFECTOS (FILTER · CRUNCH · VOLUME) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "6px",
                  backgroundColor: "#111215",
                  border: "1px solid rgba(255,214,0,0.45)",
                  borderRadius: "5px",
                  padding: "6px 10px",
                }}
              >
                <div
                  style={{
                    borderBottom: "1px solid rgba(255,214,0,0.35)",
                    paddingBottom: "3px",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.54rem",
                      fontWeight: 900,
                      color: "#FFD600",
                      letterSpacing: "1.6px",
                      fontFamily: "monospace",
                    }}
                  >
                    DSP / MASTER
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                  {(
                    [
                      {
                        label: "FILTER",
                        valText: fxFilterSweep === 0 ? "FLAT" : fxFilterSweep < 0 ? `LP ${fxFilterSweep}` : `HP +${fxFilterSweep}`,
                        deg: (fxFilterSweep / 100) * 135,
                        min: -100,
                        max: 100,
                        value: fxFilterSweep,
                        onReset: () => {
                          setFxFilterSweep(0);
                          stemMixerRef.current?.setFilterSweep(0);
                        },
                        onChange: (v: number) => {
                          setFxFilterSweep(v);
                          stemMixerRef.current?.setFilterSweep(v);
                        },
                        title: "Filtro DJ Sweep (-100 LowPass / 0 Flat / +100 HighPass). Arrastra verticalmente o doble clic para resetear.",
                      },
                      {
                        label: "CRUNCH",
                        valText: `${fxCrunch}%`,
                        deg: (fxCrunch / 100) * 270 - 135,
                        min: 0,
                        max: 100,
                        value: fxCrunch,
                        onReset: () => {
                          setFxCrunch(0);
                          stemMixerRef.current?.setCrunchDrive(0);
                        },
                        onChange: (v: number) => {
                          setFxCrunch(v);
                          stemMixerRef.current?.setCrunchDrive(v);
                        },
                        title: "Saturación 12-Bit / SP-404 Crunch (0% a 100%). Arrastra verticalmente o doble clic para resetear.",
                      },
                      {
                        label: "VOLUME",
                        valText: `${fxMasterVol}%`,
                        deg: (fxMasterVol / 120) * 270 - 135,
                        min: 0,
                        max: 120,
                        value: fxMasterVol,
                        onReset: () => {
                          setFxMasterVol(90);
                          stemMixerRef.current?.setMasterVolume(0.9);
                        },
                        onChange: (v: number) => {
                          setFxMasterVol(v);
                          stemMixerRef.current?.setMasterVolume(v / 100);
                        },
                        title: "Volumen Maestro del Sampler (0% a 120%). Arrastra verticalmente o doble clic para resetear.",
                      },
                    ] as const
                  ).map((knob) => (
                    <div key={knob.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div
                        onPointerDown={(e) => {
                          e.preventDefault();
                          const startY = e.clientY;
                          const startVal = knob.value;
                          const range = knob.max - knob.min;
                          const onMove = (ev: PointerEvent) => {
                            const delta = Math.round(((startY - ev.clientY) / 100) * range);
                            const next = Math.max(knob.min, Math.min(knob.max, startVal + delta));
                            knob.onChange(next);
                          };
                          const onUp = () => {
                            window.removeEventListener("pointermove", onMove);
                            window.removeEventListener("pointerup", onUp);
                          };
                          window.addEventListener("pointermove", onMove);
                          window.addEventListener("pointerup", onUp);
                        }}
                        onDoubleClick={knob.onReset}
                        title={knob.title}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: "radial-gradient(circle at 50% 45%, #2B2D33 0%, #191A1E 75%, #0D0E10 100%)",
                          border: "1.5px dashed #FFD600",
                          boxShadow: "0 0 12px rgba(255, 214, 0, 0.55), inset 0 0 8px rgba(255, 214, 0, 0.2), 0 2px 5px rgba(0,0,0,0.85)",
                          position: "relative",
                          cursor: "ns-resize",
                          transform: `rotate(${knob.deg}deg)`,
                          userSelect: "none",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "4px",
                            left: "50%",
                            transform: "translateX(-50%) rotate(45deg)",
                            width: "4px",
                            height: "4px",
                            backgroundColor: "#FFD600",
                            boxShadow: "0 0 8px #FFD600, 0 0 14px rgba(255, 214, 0, 0.9)",
                            borderRadius: "1px",
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
                        <span style={{ fontSize: "0.48rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "0.8px", textShadow: "0 0 8px rgba(255, 214, 0, 0.65)" }}>
                          {knob.label}
                        </span>
                        <span style={{ fontSize: "0.52rem", fontWeight: 800, color: "#D4D4D8", fontFamily: "monospace" }}>
                          {knob.valText}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              </div>

              {/* CARGAR AUDIO, GUARDAR EN PC y GRABAR alineados a la derecha */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginLeft: "auto" }}>
                <input
                  type="file"
                  accept="audio/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "5px 10px",
                    background: "linear-gradient(180deg, #3A3C42 0%, #23252A 100%)",
                    color: "#FFD600",
                    border: "1px solid #4B4E57",
                    borderRadius: "4px",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 3px 0 #07080A",
                    fontSize: "0.62rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                >
                  <Upload size={11} />
                  <span>CARGAR AUDIO</span>
                </button>
                {customAudioBuffer ? (
                  <button
                    type="button"
                    onClick={handleDownloadAudioToPc}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "5px 10px",
                      background: "linear-gradient(180deg, #FFE135 0%, #FFD600 100%)",
                      color: "#090A0D",
                      border: "1px solid #090A0D",
                      borderRadius: "4px",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 0 #07080A",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      fontFamily: "monospace",
                      cursor: "pointer",
                    }}
                    title="Descarga el audio en memoria como .WAV a tu PC para reutilizarlo cuando quieras"
                  >
                    <Download size={11} />
                    <span>GUARDAR WAV</span>
                  </button>
                ) : isRescuingAudio ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "5px 9px",
                      backgroundColor: "#1B1F2A",
                      color: "#FFD600",
                      border: "1px solid #3A3D48",
                      borderRadius: "4px",
                      fontSize: "0.58rem",
                      fontWeight: 800,
                      fontFamily: "monospace",
                    }}
                  >
                    <Loader2 size={10} className="animate-spin" />
                    <span>RESCATANDO...</span>
                  </span>
                ) : null}

                {/* Botón Grabar Secuencia de Pads + Metrónomo + Quantize */}
                <button
                  type="button"
                  onClick={() => setMetronomeOn((p) => !p)}
                  style={{
                    padding: "5px 7px",
                    background: metronomeOn
                      ? "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)"
                      : "linear-gradient(180deg, #2B2D33 0%, #191A1E 100%)",
                    color: metronomeOn ? "#090A0D" : "#D4D4D8",
                    border: "1px solid #4B4E57",
                    borderRadius: "4px",
                    fontSize: "0.56rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                  title="Activa o desactiva el clic del metrónomo al grabar tu melodía de pads"
                >
                  METRO {metronomeOn ? "ON" : "OFF"}
                </button>

                <button
                  type="button"
                  onClick={() => setQuantizeOn((p) => !p)}
                  style={{
                    padding: "5px 7px",
                    background: quantizeOn
                      ? "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)"
                      : "linear-gradient(180deg, #2B2D33 0%, #191A1E 100%)",
                    color: quantizeOn ? "#090A0D" : "#D4D4D8",
                    border: "1px solid #4B4E57",
                    borderRadius: "4px",
                    fontSize: "0.56rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                  title="Cuantiza automáticamente tus golpes de pad a semicorcheas (1/16) según el BPM"
                >
                  Q 1/16 {quantizeOn ? "ON" : "OFF"}
                </button>

                <button
                  type="button"
                  onClick={handleToggleRecordPads}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "5px 10px",
                    background: isRecordingPads
                      ? "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)"
                      : "linear-gradient(180deg, #F0F0F2 0%, #D4D4D8 100%)",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "4px",
                    boxShadow: isRecordingPads
                      ? "0 0 14px rgba(255,214,0,0.85), 0 3px 0 #07080A"
                      : "inset 0 1px 0 rgba(255,255,255,0.9), 0 3px 0 #07080A",
                    fontSize: "0.62rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                  title="Graba tu melodía tocando los pads en vivo con el teclado o mouse"
                >
                  <span>{isRecordingPads ? "■" : "●"}</span>
                  <span>{isRecordingPads ? `PARAR (${recordedPadEvents.length})` : `GRABAR ${recordBars}B`}</span>
                </button>

                <div style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                  {([1, 2, 4] as const).map((bars) => (
                    <button
                      key={bars}
                      type="button"
                      disabled={isRecordingPads}
                      onClick={() => setRecordBars(bars)}
                      style={{
                        padding: "4px 6px",
                        backgroundColor: recordBars === bars ? "#FFD600" : "#1F222A",
                        color: recordBars === bars ? "#090A0D" : "#D4D4D8",
                        border: "1px solid #090A0D",
                        borderRadius: "3px",
                        fontSize: "0.56rem",
                        fontWeight: 900,
                        fontFamily: "monospace",
                        cursor: isRecordingPads ? "not-allowed" : "pointer",
                      }}
                      title={`Grabar melodía de ${bars} ${bars === 1 ? "compás" : "compases"}`}
                    >
                      {bars}B
                    </button>
                  ))}
                </div>

                {recordedPadEvents.length > 0 && !isRecordingPads && (
                  <>
                    <button
                      type="button"
                      onClick={handlePlayRecordedMelody}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "5px 9px",
                        background: isPlayingRecording
                          ? "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)"
                          : "linear-gradient(180deg, #F0F0F2 0%, #D4D4D8 100%)",
                        color: "#090A0D",
                        border: "1px solid #090A0D",
                        borderRadius: "4px",
                        boxShadow: "0 3px 0 #07080A",
                        fontSize: "0.60rem",
                        fontWeight: 900,
                        fontFamily: "monospace",
                        cursor: "pointer",
                      }}
                      title="Escucha la melodía grabada con tus pads"
                    >
                      <span>{isPlayingRecording ? "■" : "▶"}</span>
                      <span>MELODÍA</span>
                    </button>

                    <button
                      type="button"
                      disabled={isRenderingRecording}
                      onClick={handleSendRecordedMelodyToMaster}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "5px 10px",
                        background: "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)",
                        color: "#090A0D",
                        border: "1px solid #FFE866",
                        borderRadius: "4px",
                        boxShadow: "0 0 12px rgba(255,214,0,0.7), 0 3px 0 #07080A",
                        fontSize: "0.60rem",
                        fontWeight: 900,
                        fontFamily: "monospace",
                        cursor: isRenderingRecording ? "wait" : "pointer",
                      }}
                      title="Lleva tu melodía grabada de 1, 2 o 4 compases al Beat Breakdown Sequencer"
                    >
                      <span>{isRenderingRecording ? "RENDERIZANDO..." : onSendToSequencer ? "A SECUENCIADOR →" : "A C-MASTER"}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {isSeparatingStems && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  padding: "8px 12px",
                  margin: "6px 0",
                  backgroundColor: "#0B0C0F",
                  border: "1px solid #FFD600",
                  borderRadius: "6px",
                  boxShadow: "0 0 14px rgba(255, 214, 0, 0.15)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Loader2 size={14} className="animate-spin" style={{ color: "#FFD600" }} />
                    <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.04em" }}>
                      SEPARANDO CANALES IA:
                    </span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#FFD600" }}>
                      {stemProgress?.stage || "Procesando audio en tu PC..."}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 900,
                      color: "#FFD600",
                      fontFamily: "monospace",
                    }}
                  >
                    {stemProgress?.pct ?? 0}%
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "7px",
                    backgroundColor: "#1A1C22",
                    borderRadius: "999px",
                    overflow: "hidden",
                    border: "1px solid #2A2D36",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(4, stemProgress?.pct ?? 4)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #FFD600 0%, #FFD600 100%)",
                      borderRadius: "999px",
                      transition: "width 250ms ease",
                    }}
                  />
                </div>
              </div>
            )}

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
                  border: "1px solid #22242C",
                  borderRadius: "4px 4px 0 0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {activeStemFilter ? (
                    <span
                      style={{
                        fontSize: "0.55rem",
                        fontWeight: 900,
                        backgroundColor:
                          activeStemFilter === "drums"
                            ? "#FFD60022"
                            : activeStemFilter === "bass"
                            ? "#FFD60022"
                            : activeStemFilter === "melody"
                            ? "#D4D4D822"
                            : "#FFD60022",
                        color:
                          activeStemFilter === "drums"
                            ? "#FFD600"
                            : activeStemFilter === "bass"
                            ? "#FFD600"
                            : activeStemFilter === "melody"
                            ? "#D4D4D8"
                            : "#FFD600",
                        border: `1px solid ${
                          activeStemFilter === "drums"
                            ? "#FFD600"
                            : activeStemFilter === "bass"
                            ? "#FFD600"
                            : activeStemFilter === "melody"
                            ? "#D4D4D8"
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
                        color: "#8E939E",
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
                        fontSize: "0.55rem",
                        fontWeight: 800,
                        color: "#FFD600",
                        backgroundColor: "rgba(255, 214, 0, 0.1)",
                        border: "1px solid rgba(255, 214, 0, 0.35)",
                        padding: "2px 7px",
                        borderRadius: "3px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <RefreshCw size={10} className="animate-spin" />
                      <span>
                        {stemProgress?.stage
                          ? `${stemProgress.pct > 0 ? `${stemProgress.pct}% · ` : ""}${stemProgress.stage}`
                          : "SEPARANDO STEMS IA..."}
                      </span>
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "0.55rem",
                      fontWeight: 900,
                      backgroundColor: "#14151A",
                      color: "#FFD600",
                      padding: "1px 5px",
                      borderRadius: "2px",
                      border: "1px solid #2E313B",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatSeconds(totalDuration)}
                  </span>
                  <span
                    style={{
                      fontSize: "0.52rem",
                      fontWeight: 900,
                      color: isWaveReady ? "#D4D4D8" : "#FFD600",
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
                      color: "#FFD600",
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
                      backgroundColor: "#14151A",
                      color: "#FFFFFF",
                      border: "1px solid #2E313B",
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
                      accentColor: "#FFD600",
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
                      backgroundColor: "#14151A",
                      color: "#FFFFFF",
                      border: "1px solid #2E313B",
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
                      padding: "2px 8px",
                      backgroundColor: "#E4E4E7",
                      color: "#090A0D",
                      border: "1px solid #090A0D",
                      borderRadius: "4px",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85), 0 2px 0 #07080A",
                      fontSize: "0.58rem",
                      fontWeight: 900,
                      fontFamily: "monospace",
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
                  backgroundColor: "#090A0D",
                  borderLeft: "2px solid #FFD600",
                  borderRight: "1px solid #1A1C23",
                  borderTop: "1px solid #1A1C23",
                  borderBottom: "1px solid #1A1C23",
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
                      backgroundColor: isPlayingSong ? "#D4D4D8" : "#FFD600",
                      color: "#07080B",
                      border: isPlayingSong ? "1px solid #FFFFFF" : "1px solid #FFE866",
                      borderRadius: "3px",
                      fontSize: "0.68rem",
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: isPlayingSong
                        ? "0 0 14px rgba(212, 212, 216, 0.85), 0 0 28px rgba(212, 212, 216, 0.4)"
                        : "0 0 14px rgba(255, 214, 0, 0.85), 0 0 28px rgba(255, 214, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.75)",
                      transition: "all 0.12s ease",
                    }}
                    title={isPlayingSong ? "Pausar canción [Espacio]" : "Reproducir canción continua [Espacio]"}
                  >
                    {isPlayingSong ? <Pause size={12} fill="#07080B" /> : <Play size={12} fill="#07080B" />}
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
                      backgroundColor: "#14151A",
                      color: "#A1A1AA",
                      border: "1px solid #2A2D36",
                      borderRadius: "3px",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                    title="Detener canción y reiniciar puntero a 00:00.0"
                  >
                    <Square size={10} fill="#A1A1AA" />
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
                      border: "1px solid #262830",
                      borderRadius: "3px",
                      fontFamily: "monospace",
                    }}
                  >
                    <span style={{ fontSize: "0.58rem", color: "#71717A", fontWeight: 700 }}>
                      PUNTERO:
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#FFD600", fontWeight: 900 }}>
                      {formatSeconds(playbackPointerSec)}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "#475569" }}>/</span>
                    <span style={{ fontSize: "0.68rem", color: "#A1A1AA" }}>
                      {formatSeconds(totalDuration)}
                    </span>
                  </div>
                </div>

                {/* Scrubber / Control Deslizante del Puntero */}
                <div style={{ flex: 1, minWidth: "160px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.58rem", color: "#71717A", fontWeight: 800, whiteSpace: "nowrap" }}>
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
                          ? "#FFD600"
                          : activeStemFilter === "drums"
                          ? "#FFD600"
                          : activeStemFilter === "melody"
                          ? "#D4D4D8"
                          : activeStemFilter === "vocals"
                          ? "#FFD600"
                          : "#FFD600",
                      cursor: "pointer",
                    }}
                    title={`Mover puntero de la canción (${formatSeconds(playbackPointerSec)})`}
                  />
                </div>

                {/* Badge de Fuente Activa del Puntero */}
                {activeStemFilter && (
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
                            ? "#FFD60018"
                            : activeStemFilter === "drums"
                            ? "#FFD60018"
                            : activeStemFilter === "melody"
                            ? "#D4D4D818"
                            : "#FFD60018",
                        borderColor:
                          activeStemFilter === "bass"
                            ? "#FFD600"
                            : activeStemFilter === "drums"
                            ? "#FFD600"
                            : activeStemFilter === "melody"
                            ? "#D4D4D8"
                            : "#FFD600",
                        color:
                          activeStemFilter === "bass"
                            ? "#FFD600"
                            : activeStemFilter === "drums"
                            ? "#FFD600"
                            : activeStemFilter === "melody"
                            ? "#D4D4D8"
                            : "#FFD600",
                      }}
                    >
                      {activeStemFilter === "bass" && "🎸 REPRODUCIENDO: STEM BAJO"}
                      {activeStemFilter === "drums" && "🥁 REPRODUCIENDO: STEM BATERÍA"}
                      {activeStemFilter === "melody" && "🎹 REPRODUCIENDO: STEM MELODÍA"}
                      {activeStemFilter === "vocals" && "🎤 REPRODUCIENDO: STEM VOCAL"}
                    </span>
                  </div>
                )}
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
                      backgroundColor: scrubDirection === "backward" ? "#D4D4D8" : "#FFD600",
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
                  background: #FFD600;
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
                color: "#8E939E",
              }}
            >
              <span>
                💡 <strong style={{ color: "#FFD600" }}>Límites Sucesivos Serato:</strong> El límite del{" "}
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
          {/* VU202 Horizontal Control Strip: Perillas con anillo LED + Display BPM rectangular + Botones Blanco/Amarillo */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1.05fr 1.25fr 1.15fr auto",
              gap: "12px",
              backgroundColor: "#111215",
              padding: "10px 14px",
              borderRadius: "5px",
              border: "1px solid rgba(255,214,0,0.55)",
              alignItems: "center",
            }}
          >
            {/* Display BPM Rectangular VU202 + Perillas con anillo de puntos amarillos */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Rectangular BPM LED Screen */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <span style={{ fontSize: "0.48rem", color: "#FFD600", fontWeight: 900, letterSpacing: "1.2px", fontFamily: "monospace" }}>
                  BPM
                </span>
                <div
                  style={{
                    minWidth: "84px",
                    padding: "6px 10px",
                    borderRadius: "4px",
                    backgroundColor: "#141106",
                    border: "1px solid rgba(255,214,0,0.65)",
                    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.95)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    lineHeight: 1.05,
                  }}
                  title="Display BPM / Pitch"
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "1.05rem",
                      fontWeight: 900,
                      color: "#FFD600",
                      letterSpacing: "1.5px",
                      textShadow: "0 0 8px rgba(255,214,0,0.5)",
                    }}
                  >
                    {(trackInfo?.bpm || 95).toFixed(1)}
                  </span>
                  <span style={{ fontSize: "0.48rem", color: "#A1A1AA", fontFamily: "monospace" }}>
                    {pitchSemi > 0 ? `+${pitchSemi} st` : `${pitchSemi} st`}
                  </span>
                </div>
              </div>

              {/* 4 Perillas Rotatorias Arrastrables estilo DSP / MASTER (PITCH, CONTROL, FINE, OFFSET) */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                {(
                  [
                    {
                      label: "PITCH",
                      valText: pitchSemi > 0 ? `+${pitchSemi} st` : `${pitchSemi} st`,
                      deg: (pitchSemi / 12) * 135,
                      min: -12,
                      max: 12,
                      step: 1,
                      value: pitchSemi,
                      onReset: () => {
                        setPitchSemi(0);
                        applyPitchRateToYouTube(0);
                      },
                      onChange: (v: number) => {
                        setPitchSemi(v);
                        applyPitchRateToYouTube(v);
                        if (selectedCueId !== null) {
                          const cue = cues.find((c) => c.id === selectedCueId);
                          studioAudio.playPitchHarmonic(v, cue?.keyNote || trackInfo?.key);
                        }
                      },
                      title: "Perilla PITCH (-12 a +12 st). Arrastra verticalmente o rueda del mouse; doble clic para centrar en 0 st.",
                    },
                    {
                      label: "CONTROL",
                      valText: `${chopGatePct}%`,
                      deg: ((chopGatePct - 10) / 90) * 270 - 135,
                      min: 10,
                      max: 100,
                      step: 5,
                      value: chopGatePct,
                      onReset: () => setChopGatePct(100),
                      onChange: (v: number) => setChopGatePct(v),
                      title: "CONTROL / GATE: Duración del golpe del pad (10% staccato a 100% completo). Arrastra arriba/abajo.",
                    },
                    {
                      label: "FINE",
                      valText: fineTuneCents > 0 ? `+${fineTuneCents}ct` : `${fineTuneCents}ct`,
                      deg: (fineTuneCents / 50) * 135,
                      min: -50,
                      max: 50,
                      step: 5,
                      value: fineTuneCents,
                      onReset: () => setFineTuneCents(0),
                      onChange: (v: number) => setFineTuneCents(v),
                      title: "FINE TUNE: Micro-afinación fina (-50 a +50 cents) para cuadrar samples. Arrastra arriba/abajo.",
                    },
                    {
                      label: "OFFSET",
                      valText: startOffsetMs > 0 ? `+${startOffsetMs}ms` : `${startOffsetMs}ms`,
                      deg: (startOffsetMs / 200) * 135,
                      min: -200,
                      max: 200,
                      step: 10,
                      value: startOffsetMs,
                      onReset: () => setStartOffsetMs(0),
                      onChange: (v: number) => setStartOffsetMs(v),
                      title: "START OFFSET: Micro-ajuste del punto de inicio del pad (-200ms a +200ms). Arrastra arriba/abajo.",
                    },
                  ] as const
                ).map((knob) => (
                  <div key={knob.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <span style={{ fontSize: "0.48rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "0.8px" }}>
                      {knob.label}
                    </span>
                    <div
                      onPointerDown={(e) => {
                        e.preventDefault();
                        const startY = e.clientY;
                        const startVal = knob.value;
                        const range = knob.max - knob.min;
                        const onMove = (ev: PointerEvent) => {
                          const raw = startVal + ((startY - ev.clientY) / 100) * range;
                          const snapped = Math.round(raw / knob.step) * knob.step;
                          const next = Math.max(knob.min, Math.min(knob.max, snapped));
                          knob.onChange(next);
                        };
                        const onUp = () => {
                          window.removeEventListener("pointermove", onMove);
                          window.removeEventListener("pointerup", onUp);
                        };
                        window.addEventListener("pointermove", onMove);
                        window.addEventListener("pointerup", onUp);
                      }}
                      onWheel={(e) => {
                        e.preventDefault();
                        const dir = e.deltaY < 0 ? 1 : -1;
                        const next = Math.max(knob.min, Math.min(knob.max, knob.value + dir * knob.step));
                        knob.onChange(next);
                      }}
                      onDoubleClick={knob.onReset}
                      title={knob.title}
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle at 50% 45%, #2B2D33 0%, #191A1E 75%, #0D0E10 100%)",
                        border: "1.5px dashed #FFD600",
                        boxShadow: "0 0 10px rgba(255, 214, 0, 0.45), inset 0 0 6px rgba(255, 214, 0, 0.18), 0 2px 5px rgba(0,0,0,0.85)",
                        position: "relative",
                        cursor: "ns-resize",
                        transform: `rotate(${knob.deg}deg)`,
                        userSelect: "none",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "4px",
                          left: "50%",
                          transform: "translateX(-50%) rotate(45deg)",
                          width: "4px",
                          height: "4px",
                          backgroundColor: "#FFD600",
                          borderRadius: "1px",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.52rem", fontWeight: 900, color: "#E4E4E7", fontFamily: "monospace" }}>
                      {knob.valText}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trigger Mode estilo botones blancos/amarillos VU202 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", textAlign: "center" }}>
              <span style={{ fontSize: "0.52rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "0.8px" }}>
                TRIGGER / MODE
              </span>
              <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                {(
                  [
                    { mode: "hold" as const, label: "HOLD (GATE)", title: "Corta el sonido en el momento al soltar el pad o la tecla" },
                    { mode: "one_shot" as const, label: "1-SHOT", title: "Disparo tradicional de chop (3.5s o hasta el siguiente golpe)" },
                    { mode: "full_track" as const, label: "LOOP / TODO", title: "Suena toda la canción completa desde este cue" },
                  ]
                ).map(({ mode, label, title }) => (
                  <button
                    key={mode}
                    onClick={() => setTriggerMode(mode)}
                    style={{
                      padding: "4px 8px",
                      fontSize: "0.56rem",
                      fontWeight: 900,
                      fontFamily: "monospace",
                      backgroundColor: triggerMode === mode ? "#FFD600" : "#E4E4E7",
                      color: "#090A0D",
                      border: "1px solid #090A0D",
                      borderRadius: "3px",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 0 #07080A",
                      transform: triggerMode === mode ? "translateY(1px)" : "translateY(0)",
                      cursor: "pointer",
                      transition: "all 0.08s ease",
                    }}
                    title={title}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Selectors estilo VU202 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", textAlign: "center" }}>
              <span style={{ fontSize: "0.52rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "0.8px" }}>
                BANK
              </span>
              <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                <button
                  onClick={() => setActiveBank("A")}
                  style={{
                    padding: "4px 7px",
                    fontSize: "0.56rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    backgroundColor: activeBank === "A" ? "#FFD600" : "#E4E4E7",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "3px",
                    boxShadow: "0 2px 0 #07080A",
                    cursor: "pointer",
                  }}
                >
                  A (1-8)
                </button>
                <button
                  onClick={() => setActiveBank("B")}
                  style={{
                    padding: "4px 7px",
                    fontSize: "0.56rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    backgroundColor: activeBank === "B" ? "#FFD600" : "#E4E4E7",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "3px",
                    boxShadow: "0 2px 0 #07080A",
                    cursor: "pointer",
                  }}
                >
                  B (9-16)
                </button>
                <button
                  onClick={() => setActiveBank("ALL")}
                  style={{
                    padding: "4px 7px",
                    fontSize: "0.56rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    backgroundColor: activeBank === "ALL" ? "#FFD600" : "#E4E4E7",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "3px",
                    boxShadow: "0 2px 0 #07080A",
                    cursor: "pointer",
                  }}
                >
                  ALL ({cues.length})
                </button>
              </div>
            </div>

            {/* Quick Reset */}
            <button
              onClick={() => {
                setPitchSemi(0);
                setFineTuneCents(0);
                setChopGatePct(100);
                setStartOffsetMs(0);
                applyPitchRateToYouTube(0);
                setCues(DEFAULT_CUES);
                setSelectedCueId(1);
                setActiveBank("ALL");
                setIs16Levels(false);
                setTriggerMode("one_shot");
                setCustomAudioBuffer(null);
                setSampleName("RADIO DOBLE C VAULT");
              }}
              style={{
                padding: "4px 9px",
                fontSize: "0.62rem",
                fontWeight: 900,
                fontFamily: "monospace",
                backgroundColor: "#E4E4E7",
                color: "#090A0D",
                border: "1px solid #090A0D",
                borderRadius: "4px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85), 0 3px 0 #07080A",
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
                    <span style={{ fontSize: "0.70rem", fontWeight: 900, color: "#EAB308" }}>
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
                            backgroundColor: akai16Type === t.type ? "#EAB308" : "#1B1F2A",
                            color: akai16Type === t.type ? "#FFFFFF" : "#8E939E",
                            border: akai16Type === t.type ? "1px solid #FFFFFF" : "1px solid #323540",
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
                    Chop: <strong style={{ color: "#FFD600" }}>{cues.find((c) => c.id === selectedCueId)?.name || cues[0]?.name || "CHOP 1"}</strong>
                  </span>
                </div>

                {/* 16 Levels Grid (16 pads compactos con soporte de Tune, Velocity, Filter y Decay) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
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
                    let padColor = "#FFD600";
                    let isRoot = false;

                    if (akai16Type === "tune") {
                      const semi = AKAI_16_LEVELS_SEMITONES[idx];
                      isRoot = semi === 0;
                      valueLabel = `${semi > 0 ? `+${semi}` : semi} st`;
                      subLabel = isRoot ? "ROOT (0 st)" : "";
                      padColor = isRoot ? "#FFD600" : semi < 0 ? "#FFD600" : "#D4D4D8";
                    } else if (akai16Type === "velocity") {
                      const vel = AKAI_16_LEVELS_VELOCITIES[idx];
                      valueLabel = `${Math.round(vel * 100)}%`;
                      subLabel = idx === 15 ? "MAX (100%)" : idx === 0 ? "GHOST (10%)" : `VEL ${idx + 1}`;
                      padColor = idx === 15 ? "#FFD600" : idx >= 10 ? "#EAB308" : idx >= 5 ? "#D4D4D8" : "#FFD600";
                    } else if (akai16Type === "filter") {
                      const freq = AKAI_16_LEVELS_FILTERS[idx];
                      valueLabel = freq >= 1000 ? `${(freq / 1000).toFixed(1)} kHz` : `${freq} Hz`;
                      subLabel = idx === 15 ? "OPEN (18kHz)" : idx === 0 ? "SUB (300Hz)" : "LPF";
                      padColor = idx >= 12 ? "#FFD600" : idx >= 6 ? "#FFD600" : "#A1A1AA";
                    } else if (akai16Type === "decay") {
                      const dec = AKAI_16_LEVELS_DECAYS[idx];
                      valueLabel = dec < 1.0 ? `${Math.round(dec * 1000)} ms` : `${dec.toFixed(1)} s`;
                      subLabel = idx === 15 ? "FULL (4s)" : idx === 0 ? "CLICK (80ms)" : "DECAY";
                      padColor = idx >= 12 ? "#D4D4D8" : idx >= 6 ? "#FFD600" : "#D4D4D8";
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
                          backgroundColor: isPlaying ? padColor : isRoot ? "#172314" : "#121318",
                          color: isPlaying ? "#111111" : "#FFFFFF",
                          border: isRoot
                            ? isPlaying
                              ? "2px solid #FFFFFF"
                              : "1.8px solid #FFD600"
                            : isPlaying
                            ? "2px solid #FFFFFF"
                            : `1.2px solid ${padColor}77`,
                          borderRadius: "4px",
                          boxShadow: isPlaying
                            ? `0 0 16px ${padColor}`
                            : isRoot
                            ? "0 0 10px rgba(255, 214, 0, 0.4)"
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
                              backgroundColor: isPlaying ? "#FFFFFF" : "#090A0D",
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
                              color: isPlaying ? "#111111" : isRoot ? "#FFD600" : "#FFFFFF",
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
                    <span style={{ fontSize: "0.58rem", color: "#8E939E" }}>
                      (Doble clic o ✏️ para renombrar)
                    </span>
                  </div>
                  <span style={{ fontSize: "0.62rem", color: "#FFD600", fontWeight: 800 }}>
                    ⌨️ Teclado:{" "}
                    <strong style={{ color: "#FFFFFF", backgroundColor: "#1B202D", padding: "1px 5px", borderRadius: "2px", letterSpacing: "1px" }}>
                      {activeBank === "ALL"
                        ? "Q W E R T Y U I · A S D F G H J K"
                        : activeBank === "B"
                        ? "A S D F G H J K"
                        : "Q W E R T Y U I"}
                    </strong>
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
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
                          height: "64px",
                          backgroundColor: isPlaying || isSelected ? "#FFD600" : "#E4E4E7",
                          color: "#090A0D",
                          border: isPlaying ? "2px solid #FFFFFF" : "1.5px solid #090A0D",
                          borderRadius: "5px",
                          boxShadow: isPlaying
                            ? "inset 0 2px 4px rgba(0,0,0,0.3), 0 0 18px rgba(255,214,0,0.85)"
                            : isSelected
                            ? "inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 0 #07080A, 0 0 10px rgba(255,214,0,0.5)"
                            : "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -2px 0 rgba(0,0,0,0.12), 0 4px 0 #07080A",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          padding: "5px 7px",
                          transform: isPlaying ? "translateY(3px)" : "translateY(0)",
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
                                backgroundColor: isPlaying ? "#FFFFFF" : "#090A0D",
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
                                  color: isPlaying ? "#111111" : "#FFD600",
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
                                border: "1px solid #FFD600",
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
                                  color: isPlaying ? "#111111" : "#8E939E",
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
                              color: isPlaying ? "#111111" : "#8E939E",
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
                backgroundColor: "#090A0D",
                border: "1px solid #262830",
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
                  borderBottom: "1px solid #262830",
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
                    <div style={{ fontSize: "0.58rem", color: "#71717A" }}>
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
                    color: "#A1A1AA",
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
                    border: "1.5px solid #FFD60044",
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
                      <div style={{ fontSize: "0.58rem", fontWeight: 900, color: "#FFD600", letterSpacing: "0.5px" }}>
                        CANCIÓN DE C-DIGGER SELECCIONADA:
                      </div>
                      <div style={{ fontSize: "0.76rem", fontWeight: 900, color: "#FFFFFF" }}>
                        {trackInfo?.artist ? `${trackInfo.artist} — ${trackInfo.title}` : sampleName}
                      </div>
                      <div style={{ fontSize: "0.58rem", color: "#A1A1AA" }}>
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
                        color: "#FFD600",
                        border: "1px solid #FFD60044",
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
                    backgroundColor: "#0D0E12",
                    border: `1px solid ${aiServerStatus?.hasReplicate ? "#FFD60044" : "#1A1C23"}`,
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
                        backgroundColor: aiServerStatus?.hasReplicate ? "#FFD60022" : "#262830",
                        color: aiServerStatus?.hasReplicate ? "#FFD600" : "#A1A1AA",
                      }}
                    >
                      {aiServerStatus?.hasReplicate ? "CONECTADO" : "PENDIENTE TOKEN"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.62rem", color: "#A1A1AA", margin: 0, lineHeight: 1.4 }}>
                    Separa cualquier canción en 3-5 segundos sin consumir recursos de tu computadora.
                  </p>
                  <div style={{ fontSize: "0.58rem", color: "#71717A", marginTop: "4px" }}>
                    Configuración: Agrega <code style={{ color: "#FFD600" }}>REPLICATE_API_TOKEN</code> en tu archivo <code style={{ color: "#FFD600" }}>.env.local</code>
                  </div>
                </div>

                {/* Opción 2: Worker Local */}
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "#0D0E12",
                    border: `1px solid ${aiServerStatus?.hasLocalWorker ? "#FFD60044" : "#1A1C23"}`,
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
                        backgroundColor: aiServerStatus?.hasLocalWorker ? "#FFD60022" : "#262830",
                        color: aiServerStatus?.hasLocalWorker ? "#FFD600" : "#A1A1AA",
                      }}
                    >
                      {aiServerStatus?.hasLocalWorker ? "EN LÍNEA (8000)" : "NO DETECTADO"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.62rem", color: "#A1A1AA", margin: 0, lineHeight: 1.4 }}>
                    Corre en tu propia máquina con Python sin depender de internet.
                  </p>
                  <div style={{ fontSize: "0.58rem", color: "#71717A", marginTop: "4px" }}>
                    Comando: <code style={{ color: "#FFD600" }}>python scripts/stem_separator.py --server --port 8000</code>
                  </div>
                </div>

                {/* Opción 3: Motor DSP en Memoria (Siempre activo) */}
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "#0D0E12",
                    border: "1px solid #1A1C23",
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
                        backgroundColor: "#D4D4D822",
                        color: "#D4D4D8",
                      }}
                    >
                      ACTIVO (0ms)
                    </span>
                  </div>
                  <p style={{ fontSize: "0.62rem", color: "#A1A1AA", margin: 0, lineHeight: 1.4 }}>
                    Filtra y sintetiza stems analógicos al vuelo sincronizados a la tonalidad y BPM.
                  </p>
                </div>
              </div>

              {/* Botones de Acción */}
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#0D111A",
                  borderTop: "1px solid #262830",
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
                    backgroundColor: "#181920",
                    color: "#FFFFFF",
                    border: "1px solid #2E313B",
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
                      backgroundColor: "#FFD600",
                      color: "#07080B",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.66rem",
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: "0 0 12px rgba(255, 214, 0, 0.4)",
                    }}
                  >
                    <span>⚡ PROBAR SEPARACIÓN AHORA</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {cutPadModalData && (
          <CSamplerCutPadModal
            key={cutPadModalData.cueId}
            isOpen={Boolean(cutPadModalData)}
            onClose={() => setCutPadModalData(null)}
            padLabel={cutPadModalData.padLabel}
            rangeLabel={cutPadModalData.rangeLabel}
            sliceStartSec={cutPadModalData.sliceStartSec}
            sliceEndSec={cutPadModalData.sliceEndSec}
            isRealAudio={cutPadModalData.isRealAudio}
            hasYoutubeFallback={Boolean((externalSample?.trackInfo || trackInfo)?.youtubeId)}
            onCapturedPadAudio={(capturedBuffer) => {
              const targetId = cutPadModalData.cueId;
              setPadCustomBuffers((prev) => ({ ...prev, [targetId]: capturedBuffer }));
            }}
            onRequestLoadAudio={() => {
              setCutPadModalData(null);
              fileInputRef.current?.click();
            }}
            onPlayYoutubeSlice={(startSec, _endSec, pitch) => {
              if (ytPlayerRef.current?.contentWindow) {
                try {
                  ytPlayerRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: "command", func: "unMute", args: [] }),
                    "*"
                  );
                  ytPlayerRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: "command", func: "seekTo", args: [startSec, true] }),
                    "*"
                  );
                  ytPlayerRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: "command", func: "playVideo", args: [] }),
                    "*"
                  );
                  setTimeout(() => applyPitchRateToYouTube(pitch), 80);
                } catch {}
              }
            }}
            onStopYoutubeSlice={() => {
              if (ytPlayerRef.current?.contentWindow) {
                try {
                  ytPlayerRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
                    "*"
                  );
                } catch {}
              }
            }}
            bpm={cutPadModalData.bpm}
            musicalKey={cutPadModalData.musicalKey}
            genre={cutPadModalData.genre}
            rawSliceBuffer={cutPadModalData.rawSliceBuffer}
            originalSliceBuffer={cutPadModalData.originalSliceBuffer}
            initialTrimStartPct={cutPadModalData.initialTrimStartPct}
            initialTrimEndPct={cutPadModalData.initialTrimEndPct}
            onSeparatedToMaster={(channels) => {
              const info = cutPadModalData;
              setCutPadModalData(null);
              setMasterModalData({
                padLabel: info.padLabel,
                rangeLabel: info.rangeLabel,
                initialBpm: info.bpm,
                channels,
              });
            }}
            onApplyRealCut={({ newStartSec, processedBuffer, stemLabel, trimStartPct, trimEndPct }) => {
              const targetId = cutPadModalData.cueId;
              if (processedBuffer) {
                setPadCustomBuffers((prev) => ({ ...prev, [targetId]: processedBuffer }));
              }
              setPadOriginalSources((prev) => {
                const existing = prev[targetId];
                if (!existing) return prev;
                return {
                  ...prev,
                  [targetId]: {
                    ...existing,
                    trimStartPct,
                    trimEndPct,
                  },
                };
              });
              setCues((prev) =>
                prev.map((c) =>
                  c.id === targetId
                    ? {
                        ...c,
                        startSec: newStartSec,
                        name: stemLabel
                          ? `CHOP ${c.id} · ${stemLabel}`
                          : `CHOP ${c.id} (${formatSeconds(newStartSec)})`,
                      }
                    : c
                )
              );
              setCutPadModalData(null);
            }}
          />
        )}

        {masterModalData && (
          <CSamplerMasterModal
            isOpen={Boolean(masterModalData)}
            onClose={() => setMasterModalData(null)}
            padLabel={masterModalData.padLabel}
            rangeLabel={masterModalData.rangeLabel}
            initialBpm={masterModalData.initialBpm}
            channels={masterModalData.channels}
          />
        )}
      </div>
    </div>
  );
};
