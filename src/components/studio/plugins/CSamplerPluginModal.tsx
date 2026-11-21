"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { CSamplerMasterModal } from "./CSamplerMasterModal";
import { CSamplerCutPadModal } from "./CSamplerCutPadModal";
import { SamplerHeaderBar } from "./sampler/SamplerHeaderBar";
import { SamplerTopBar } from "./sampler/SamplerTopBar";
import { SamplerWaveformToolbar } from "./sampler/SamplerWaveformToolbar";
import { SamplerControlsStrip } from "./sampler/SamplerControlsStrip";
import { SamplerCuePadsGrid } from "./sampler/SamplerCuePadsGrid";
import { useSamplerWaveform } from "./sampler/useSamplerWaveform";
import { useSamplerRecorder, type MasterModalPayload } from "./sampler/useSamplerRecorder";
import { useModalIsolation } from "@/hooks/useModalIsolation";
import type {
  SamplerCuePoint,
  SamplerTriggerMode,
  Akai16LevelsType,
  LoadedSampleData,
  DiggerTrack,
  StemType,
  StemsSeparationResult,
  BeatBreakdownSamplePayload,
} from "@/types/studio";
import { studioAudio } from "@/lib/studio/audioEngine";
import { RealtimeStemMixer, createStemsFromTrack } from "@/lib/studio/stemEngine";
import {
  saveYouTubeAudioToBrowserCache,
  loadYouTubeAudioFromBrowserCache,
  clearYouTubeAudioFromBrowserCache,
} from "@/lib/studio/browserStemAI";
import { calculateSliceBoundary } from "@/lib/contracts/samplerContracts";
import { buildSampletteYouTubeEmbedUrl } from "@/lib/studio/crateEngine";
import {
  SERATO_COLORS,
  AKAI_16_LEVELS_SEMITONES,
  AKAI_16_LEVELS_VELOCITIES,
  AKAI_16_LEVELS_FILTERS,
  AKAI_16_LEVELS_DECAYS,
  DEFAULT_CUES,
  KEY_PAD_MAP,
  formatSeconds,
  sliceAudioBufferToWindow,
} from "@/lib/studio/samplerConstants";
import { downloadAudioBufferAsWav } from "@/lib/studio/samplerRender";

interface CSamplerPluginModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalSample?: LoadedSampleData | null;
  onOpenDigger?: () => void;
  onSendToSequencer?: (payload: BeatBreakdownSamplePayload) => void;
  isStandalone?: boolean;
}

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

  // Akai MPC 16 Levels State
  const [is16Levels, setIs16Levels] = useState<boolean>(false);
  const [akai16Type, setAkai16Type] = useState<Akai16LevelsType>("tune");
  const [active16LevelPad, setActive16LevelPad] = useState<number | null>(null);
  const activeKeysDownRef = useRef<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ytPlayerRef = useRef<HTMLIFrameElement>(null);
  const sliceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stems & DSP Master State
  const [activeStemFilter, setActiveStemFilter] = useState<StemType | null>(null);
  const activeStemFilterRef = useRef<StemType | null>(null);
  const [stemsResult, setStemsResult] = useState<StemsSeparationResult | null>(null);
  const [fxFilterSweep, setFxFilterSweep] = useState<number>(0);
  const [fxCrunch, setFxCrunch] = useState<number>(0);
  const [fxMasterVol, setFxMasterVol] = useState<number>(90);
  const stemMixerRef = useRef<RealtimeStemMixer | null>(null);

  const [padCustomBuffers, setPadCustomBuffers] = useState<Record<number, AudioBuffer>>({});
  const padCustomBuffersRef = useRef<Record<number, AudioBuffer>>({});
  const [padOriginalSources, setPadOriginalSources] = useState<
    Record<number, { buffer: AudioBuffer; startSec: number; endSec: number; trimStartPct: number; trimEndPct: number }>
  >({});

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
  const [masterModalData, setMasterModalData] = useState<MasterModalPayload | null>(null);

  // Puntero de Reproducción Continuo
  const [playbackPointerSec, setPlaybackPointerSec] = useState<number>(0);
  const [isPlayingSong, setIsPlayingSong] = useState<boolean>(false);
  const playbackPointerSecRef = useRef<number>(0);
  const isPlayingSongRef = useRef<boolean>(false);
  const playheadTimerRef = useRef<number | null>(null);
  const playheadStartClockRef = useRef<number>(0);
  const playheadStartOffsetRef = useRef<number>(0);

  const recordPadHitRef = useRef<(cueId: number) => void>(() => {});
  const setWaveformTimeRef = useRef<(sec: number) => void>(() => {});
  const loadWaveformDataRef = useRef<
    (
      dur: number,
      buffer: AudioBuffer | null,
      track: Partial<DiggerTrack> | null,
      stemFilter?: StemType | null,
      stems?: StemsSeparationResult | null
    ) => void
  >(() => {});
  const resetRecorderRef = useRef<() => void>(() => {});

  useEffect(() => {
    padCustomBuffersRef.current = padCustomBuffers;
    playbackPointerSecRef.current = playbackPointerSec;
    isPlayingSongRef.current = isPlayingSong;
  }, [padCustomBuffers, playbackPointerSec, isPlayingSong]);

  // Sincronizar DSP con el bus maestro del Sampler
  useEffect(() => {
    if (!isOpen && !isStandalone) return;
    studioAudio.setSamplerFilterSweep(fxFilterSweep);
    studioAudio.setSamplerCrunch(fxCrunch);
    studioAudio.setSamplerMasterVolume(fxMasterVol / 100);
  }, [isOpen, isStandalone, fxFilterSweep, fxCrunch, fxMasterVol]);

  // Inicialización del mezclador en tiempo real de Stems
  useEffect(() => {
    if (!stemMixerRef.current && typeof window !== "undefined") {
      stemMixerRef.current = new RealtimeStemMixer();
    }
    return () => {
      stemMixerRef.current?.stop();
    };
  }, []);

  const totalDuration = useMemo(() => {
    if (customAudioBuffer?.duration) return customAudioBuffer.duration;
    if (trackInfo?.durationSec && trackInfo.durationSec > 0) return trackInfo.durationSec;
    return 180;
  }, [customAudioBuffer, trackInfo?.durationSec]);

  const activeTrack = externalSample?.trackInfo || trackInfo;

  // Sincronizar sample externo desde C-Digger
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
        setCues(baseCues);
        setSelectedCueId(baseCues[0].id);
      } else {
        const sliceLen = trackDur / 8;
        const auto8: SamplerCuePoint[] = Array.from({ length: 8 }).map((_, idx) => {
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
        setCues(auto8);
        setSelectedCueId(1);
      }
      setActiveBank("ALL");
      setPadCustomBuffers({});
      setPadOriginalSources({});
      resetRecorderRef.current();
      setPlaybackPointerSec(0);
      setCustomAudioBuffer(externalSample.buffer || null);
      setActiveStemFilter(null);
      activeStemFilterRef.current = null;
      setStemsResult(null);

      loadWaveformDataRef.current(trackDur, externalSample.buffer || null, externalSample.trackInfo || null, null);
    });
  }, [externalSample]);

  // Escuchador de restricciones de YouTube (Error 150)
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
      const nestedInfo = payload.info as Record<string, unknown> | undefined;
      const isError =
        payload.event === "onError" ||
        payload.info === 150 ||
        payload.info === 101 ||
        payload.info === 100 ||
        payload.info === 2 ||
        nestedInfo?.errorCode === 150 ||
        nestedInfo?.errorCode === 101 ||
        nestedInfo?.errorCode === 100;

      if (isError && trackInfo?.youtubeId && !customAudioBuffer) {
        fetch(`/api/studio/stream-sample?youtubeId=${trackInfo.youtubeId}`)
          .then(async (res) => {
            const contentType = res.headers.get("content-type") || "";
            if (res.ok && (contentType.includes("audio") || contentType.includes("octet-stream"))) {
              const arrayBuffer = await res.arrayBuffer();
              const AudioCtx =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
              const ctx = new AudioCtx();
              try {
                const buf = await ctx.decodeAudioData(arrayBuffer);
                setCustomAudioBuffer(buf);
              } finally {
                await ctx.close().catch(() => {});
              }
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, [trackInfo?.youtubeId, customAudioBuffer]);

  // Rescate automático en segundo plano del audio de YouTube hacia RAM
  const rescueYouTubeAudioIntoRam = useCallback(
    async (youtubeId?: string | null): Promise<AudioBuffer | null> => {
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
          if (fromCache) await clearYouTubeAudioFromBrowserCache(targetId);
          return null;
        }
        setCustomAudioBuffer(decoded);
        loadWaveformDataRef.current(decoded.duration, decoded, externalSample?.trackInfo || trackInfo || null, null);
        return decoded;
      } catch {
        return null;
      } finally {
        setIsRescuingAudio(false);
        await ctx.close().catch(() => {});
      }
    },
    [customAudioBuffer, externalSample, trackInfo]
  );

  useEffect(() => {
    if (!isOpen && !isStandalone) return;
    const activeYtId = externalSample?.trackInfo?.youtubeId || trackInfo?.youtubeId;
    if (!activeYtId || customAudioBuffer) return;
    if (rescuedYoutubeIdRef.current === activeYtId) return;
    rescuedYoutubeIdRef.current = activeYtId;
    void rescueYouTubeAudioIntoRam(activeYtId);
  }, [isOpen, isStandalone, externalSample?.trackInfo?.youtubeId, trackInfo?.youtubeId, customAudioBuffer, rescueYouTubeAudioIntoRam]);

  const pauseYouTubeIframe = useCallback(() => {
    if (ytPlayerRef.current?.contentWindow) {
      try {
        ytPlayerRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      } catch {}
    }
  }, []);

  // Detener audio inmediatamente
  const handleStopAudio = useCallback(() => {
    if (sliceTimerRef.current) {
      clearTimeout(sliceTimerRef.current);
      sliceTimerRef.current = null;
    }
    if (playheadTimerRef.current) {
      cancelAnimationFrame(playheadTimerRef.current);
      playheadTimerRef.current = null;
    }
    setIsPlayingSong(false);
    isPlayingSongRef.current = false;

    studioAudio.stopSamplerAudio();
    stemMixerRef.current?.stop();
    pauseYouTubeIframe();
    setActiveCueId(null);
    setActive16LevelPad(null);
  }, [pauseYouTubeIframe]);

  const handleStopSong = useCallback(() => {
    if (playheadTimerRef.current) {
      cancelAnimationFrame(playheadTimerRef.current);
      playheadTimerRef.current = null;
    }
    setIsPlayingSong(false);
    isPlayingSongRef.current = false;

    studioAudio.stopSamplerAudio();
    stemMixerRef.current?.stop();
    pauseYouTubeIframe();

    setPlaybackPointerSec(0);
    playbackPointerSecRef.current = 0;
    setWaveformTimeRef.current(0);
  }, [pauseYouTubeIframe]);

  const handlePauseSong = useCallback(() => {
    if (playheadTimerRef.current) {
      cancelAnimationFrame(playheadTimerRef.current);
      playheadTimerRef.current = null;
    }
    setIsPlayingSong(false);
    isPlayingSongRef.current = false;

    studioAudio.stopSamplerAudio();
    stemMixerRef.current?.stop();
    pauseYouTubeIframe();
  }, [pauseYouTubeIframe]);

  const handlePlaySongFrom = useCallback(
    (startSec: number) => {
      const validStart = Math.max(0, Math.min(totalDuration, startSec));
      setPlaybackPointerSec(validStart);
      playbackPointerSecRef.current = validStart;
      setIsPlayingSong(true);
      isPlayingSongRef.current = true;

      studioAudio.stopSamplerAudio();
      stemMixerRef.current?.stop();

      const activePitch = pitchSemi + fineTuneCents / 100;
      const playbackRate = Math.pow(2, activePitch / 12);

      if (activeStemFilter && stemMixerRef.current && stemsResult) {
        pauseYouTubeIframe();
        stemMixerRef.current.setSolo(activeStemFilter);
        stemMixerRef.current.play(validStart);
      } else if (customAudioBuffer) {
        pauseYouTubeIframe();
        studioAudio.playSamplerContinuous(customAudioBuffer, validStart, activePitch);
      } else if (stemsResult && stemMixerRef.current) {
        pauseYouTubeIframe();
        stemMixerRef.current.setSolo(null);
        stemMixerRef.current.play(validStart);
      } else if (activeTrack?.youtubeId && ytPlayerRef.current?.contentWindow) {
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

      if (playheadTimerRef.current) cancelAnimationFrame(playheadTimerRef.current);
      playheadStartOffsetRef.current = validStart;
      playheadStartClockRef.current = performance.now() / 1000;

      const tick = () => {
        if (!isPlayingSongRef.current) return;
        const elapsed = (performance.now() / 1000 - playheadStartClockRef.current) * (customAudioBuffer ? playbackRate : 1);
        const curSec = playheadStartOffsetRef.current + elapsed;

        if (curSec >= totalDuration) {
          handleStopSong();
          return;
        }

        setPlaybackPointerSec(curSec);
        playbackPointerSecRef.current = curSec;
        setWaveformTimeRef.current(curSec);
        playheadTimerRef.current = requestAnimationFrame(tick);
      };

      playheadTimerRef.current = requestAnimationFrame(tick);
    },
    [
      totalDuration,
      activeTrack?.youtubeId,
      activeStemFilter,
      stemsResult,
      customAudioBuffer,
      pitchSemi,
      fineTuneCents,
      pauseYouTubeIframe,
      handleStopSong,
    ]
  );

  const handlePlayPauseSong = useCallback(() => {
    if (isPlayingSong) handlePauseSong();
    else handlePlaySongFrom(playbackPointerSec);
  }, [isPlayingSong, playbackPointerSec, handlePauseSong, handlePlaySongFrom]);

  const handleSeekPointer = useCallback(
    (newSec: number) => {
      const clamped = Math.max(0, Math.min(totalDuration, Math.round(newSec * 10) / 10));
      setPlaybackPointerSec(clamped);
      playbackPointerSecRef.current = clamped;
      setWaveformTimeRef.current(clamped);
      if (isPlayingSongRef.current) handlePlaySongFrom(clamped);
    },
    [totalDuration, handlePlaySongFrom]
  );

  const applyPitchRateToYouTube = useCallback((semi: number) => {
    if (!ytPlayerRef.current?.contentWindow) return;
    const clampedRate = Math.max(0.25, Math.min(2.0, Math.pow(2, semi / 12)));
    const roundedRate = Math.round(clampedRate * 100) / 100;
    const STANDARD_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const nearest = STANDARD_RATES.reduce((prev, curr) =>
      Math.abs(curr - clampedRate) < Math.abs(prev - clampedRate) ? curr : prev
    );

    ytPlayerRef.current.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "setPlaybackRate", args: [roundedRate] }),
      "*"
    );
    ytPlayerRef.current.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "setPlaybackRate", args: [nearest] }),
      "*"
    );
  }, []);

  // Disparar un Cue Point
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
      setPlaybackPointerSec(cue.startSec);
      playbackPointerSecRef.current = cue.startSec;
      setWaveformTimeRef.current(cue.startSec);

      const activePitch =
        (options?.overridePitchSemi !== undefined ? options.overridePitchSemi : pitchSemi) +
        fineTuneCents / 100;
      const effectiveStartSec = Math.max(0, cue.startSec + startOffsetMs / 1000);
      const velocity = options?.velocity ?? 1.0;
      const filterCutoff = options?.filterCutoff;

      recordPadHitRef.current(cue.id);

      const { naturalDurationSec } = calculateSliceBoundary(cue.id, cues, totalDuration);
      const playbackRate = Math.pow(2, activePitch / 12);
      const gateScale = triggerMode === "full_track" ? 1 : Math.max(0.1, chopGatePct / 100);
      const playbackDurationSec = (naturalDurationSec * gateScale) / playbackRate;
      const effectiveDurSec =
        options?.duration !== undefined
          ? Math.min(options.duration / playbackRate, playbackDurationSec)
          : playbackDurationSec;

      if (sliceTimerRef.current) {
        clearTimeout(sliceTimerRef.current);
        sliceTimerRef.current = null;
      }

      const customPadBuf = padCustomBuffersRef.current[cue.id];

      if (customPadBuf) {
        pauseYouTubeIframe();
        studioAudio.playSamplerSlice(
          { startSec: 0, duration: customPadBuf.duration },
          { pitchSemi: activePitch, velocity, filterCutoff, duration: customPadBuf.duration },
          customPadBuf
        );
      } else if (activeStemFilter && stemMixerRef.current) {
        pauseYouTubeIframe();
        if (!stemsResult) {
          const synthStems = createStemsFromTrack(
            Math.min(180, Math.max(30, totalDuration)),
            activeTrack?.bpm || 95,
            activeTrack?.key || "Am",
            activeTrack?.genre || "funk"
          );
          setStemsResult(synthStems);
          stemMixerRef.current.loadStems(synthStems);
          stemMixerRef.current.setSolo(activeStemFilter);
        }
        stemMixerRef.current.play(cue.startSec, effectiveDurSec);
      } else if (customAudioBuffer) {
        pauseYouTubeIframe();
        const sliceDuration =
          triggerMode === "full_track"
            ? customAudioBuffer.duration - effectiveStartSec
            : options?.duration !== undefined
            ? options.duration
            : naturalDurationSec * gateScale;

        studioAudio.playSamplerSlice(
          { startSec: effectiveStartSec, duration: Math.max(0.05, sliceDuration) },
          { pitchSemi: activePitch, velocity, filterCutoff, duration: Math.max(0.05, sliceDuration) },
          customAudioBuffer
        );
      } else if (activeTrack?.youtubeId) {
        applyPitchRateToYouTube(activePitch);
        studioAudio.playPitchHarmonic(activePitch, cue.keyNote || activeTrack?.key, velocity, filterCutoff);

        if (ytPlayerRef.current?.contentWindow) {
          try {
            ytPlayerRef.current.contentWindow.postMessage(
              JSON.stringify({ event: "command", func: "unMute", args: [] }),
              "*"
            );
            ytPlayerRef.current.contentWindow.postMessage(
              JSON.stringify({ event: "command", func: "seekTo", args: [effectiveStartSec, true] }),
              "*"
            );
            ytPlayerRef.current.contentWindow.postMessage(
              JSON.stringify({ event: "command", func: "playVideo", args: [] }),
              "*"
            );
          } catch {}
        }

        setTimeout(() => applyPitchRateToYouTube(activePitch), 80);
      }

      if (triggerMode === "one_shot" || triggerMode === "hold") {
        const stopDelay = Math.max(60, Math.round(effectiveDurSec * 1000));
        sliceTimerRef.current = setTimeout(() => handleStopAudio(), stopDelay);
      }

      if (triggerMode !== "hold") {
        setTimeout(() => {
          setActiveCueId((current) => (current === cue.id ? null : current));
        }, Math.min(220, effectiveDurSec * 1000));
      }
    },
    [
      pitchSemi,
      fineTuneCents,
      chopGatePct,
      startOffsetMs,
      customAudioBuffer,
      activeTrack,
      triggerMode,
      applyPitchRateToYouTube,
      handleStopAudio,
      pauseYouTubeIframe,
      activeStemFilter,
      cues,
      stemsResult,
      totalDuration,
    ]
  );

  const handleTrigger16Level = useCallback(
    (padNum: number) => {
      setActive16LevelPad(padNum);
      const targetCue = cues.find((c) => c.id === selectedCueId) || cues[0] || DEFAULT_CUES[0];

      if (akai16Type === "tune") {
        handleTriggerCue(targetCue, { overridePitchSemi: AKAI_16_LEVELS_SEMITONES[padNum - 1] ?? 0 });
      } else if (akai16Type === "velocity") {
        handleTriggerCue(targetCue, { velocity: AKAI_16_LEVELS_VELOCITIES[padNum - 1] ?? 1.0 });
      } else if (akai16Type === "filter") {
        handleTriggerCue(targetCue, { filterCutoff: AKAI_16_LEVELS_FILTERS[padNum - 1] ?? 18000 });
      } else if (akai16Type === "decay") {
        handleTriggerCue(targetCue, { duration: AKAI_16_LEVELS_DECAYS[padNum - 1] ?? 3.5 });
      }

      if (triggerMode !== "hold") {
        setTimeout(() => {
          setActive16LevelPad((curr) => (curr === padNum ? null : curr));
        }, 180);
      }
    },
    [cues, selectedCueId, akai16Type, handleTriggerCue, triggerMode]
  );

  // Hook modular de WaveSurfer + Regions + Zoom
  const waveform = useSamplerWaveform({
    isOpen,
    isStandalone,
    cues,
    setCues,
    selectedCueId,
    setSelectedCueId,
    totalDuration,
    triggerMode,
    customAudioBuffer,
    externalSample,
    trackInfo,
    stemsResult,
    activeStemFilterRef,
    ytPlayerRef,
    onTriggerCue: handleTriggerCue,
    onStopAudio: handleStopAudio,
    onSeekPointer: handleSeekPointer,
  });

  // Hook modular de Grabación de Pads + Metrónomo + Render Offline
  const recorder = useSamplerRecorder({
    activeTrack,
    sampleName,
    cues,
    customAudioBuffer,
    padCustomBuffersRef,
    stemsResult,
    totalDuration,
    pitchSemi,
    fineTuneCents,
    startOffsetMs,
    fxFilterSweep,
    fxMasterVol,
    onTriggerCue: handleTriggerCue,
    onStopAudio: handleStopAudio,
    onRescueAudio: () => rescueYouTubeAudioIntoRam(),
    onSendToSequencer,
    onOpenMasterModal: setMasterModalData,
  });

  useEffect(() => {
    recordPadHitRef.current = recorder.recordPadHit;
    resetRecorderRef.current = recorder.resetRecorder;
    setWaveformTimeRef.current = waveform.setWaveformTime;
    loadWaveformDataRef.current = waveform.loadWaveformData;
  }, [recorder.recordPadHit, recorder.resetRecorder, waveform.setWaveformTime, waveform.loadWaveformData]);

  // Gestión de Cue Points
  const handleAddCue = (targetSec?: number) => {
    if (cues.length >= 16) {
      alert("Límite de 16 Cues alcanzado (Estándar Serato Sample).");
      return;
    }
    const existingIds = new Set(cues.map((c) => c.id));
    let newId = 1;
    while (existingIds.has(newId) && newId <= 16) newId++;
    if (newId > 16) newId = cues.length + 1;

    const sliceSec =
      targetSec !== undefined
        ? Math.max(0, Math.min(totalDuration, targetSec))
        : Math.round(cues.length * (totalDuration / (cues.length + 1)) * 10) / 10;

    const newCue: SamplerCuePoint = {
      id: newId,
      name: `CHOP ${newId} (${formatSeconds(sliceSec)})`,
      startSec: sliceSec,
      color: SERATO_COLORS[(newId - 1) % SERATO_COLORS.length],
      active: true,
    };

    setCues((prev) => [...prev, newCue].sort((a, b) => a.id - b.id));
    setSelectedCueId(newId);
    if (newId > 8 && activeBank === "A") setActiveBank("ALL");
    handleTriggerCue(newCue);
  };

  const handleDeleteCue = (e: React.MouseEvent, cueId: number) => {
    e.stopPropagation();
    if (cues.length <= 1) {
      alert("Debes conservar al menos 1 Cue point.");
      return;
    }
    setCues((prev) => prev.filter((c) => c.id !== cueId));
    if (selectedCueId === cueId) setSelectedCueId(null);
  };

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

  // Cortar Pad seleccionado (abrir CSamplerCutPadModal)
  const handleCutSelectedPadAtPlayhead = async () => {
    const targetCue = cues.find((c) => c.id === (selectedCueId ?? activeCueId)) ?? cues[0];
    if (!targetCue) return;

    const { startSec, endLimitSec, naturalDurationSec } = calculateSliceBoundary(
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
      if (!sourceBuf && activeTrack?.youtubeId) {
        try {
          let arrayBuffer = await loadYouTubeAudioFromBrowserCache(activeTrack.youtubeId);
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
          [targetCue.id]: { buffer: sliced, startSec, endSec: safeEnd, trimStartPct: 0, trimEndPct: 100 },
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

  // Atajos de teclado físicos
  useEffect(() => {
    if (!isStandalone && !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isStandalone && !isTopModal()) return;

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
        handlePlayPauseSong();
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
      if (padId !== undefined && !e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        activeKeysDownRef.current.add(e.key.toLowerCase());
        if (is16Levels) {
          handleTrigger16Level(padId);
        } else {
          const targetCue = cues.find((c) => c.id === padId);
          if (targetCue) handleTriggerCue(targetCue);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isStandalone && !isTopModal()) return;
      const padId = KEY_PAD_MAP[e.key];
      if (padId !== undefined) {
        activeKeysDownRef.current.delete(e.key.toLowerCase());
        if (triggerMode === "hold" && activeKeysDownRef.current.size === 0) {
          handleStopAudio();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [
    isOpen,
    isStandalone,
    isTopModal,
    cues,
    selectedCueId,
    is16Levels,
    triggerMode,
    handlePlayPauseSong,
    handleTriggerCue,
    handleTrigger16Level,
    handleStopAudio,
  ]);

  // Carga local de audio & Descarga WAV
  const handleDownloadAudioToPc = useCallback(() => {
    if (!customAudioBuffer) return;
    downloadAudioBufferAsWav(customAudioBuffer, trackInfo?.title || sampleName);
  }, [customAudioBuffer, trackInfo?.title, sampleName]);

  const loadLocalAudioFile = useCallback(
    async (file: File) => {
      handleStopAudio();
      setSampleName(file.name.toUpperCase());
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const tempCtx = new AudioCtx();
      try {
        const arrayBuffer = await file.arrayBuffer();
        const decoded = await tempCtx.decodeAudioData(arrayBuffer);
        setTrackInfo(null);
        setCustomAudioBuffer(decoded);
        setPadCustomBuffers({});
        setPadOriginalSources({});
        resetRecorderRef.current();
        setActiveStemFilter(null);
        activeStemFilterRef.current = null;
        setStemsResult(null);
        setPlaybackPointerSec(0);
        rescuedYoutubeIdRef.current = null;

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
      } finally {
        await tempCtx.close().catch(() => {});
      }
    },
    [handleStopAudio]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void loadLocalAudioFile(file);
    e.target.value = "";
  };

  const handleDropAudio = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    void loadLocalAudioFile(file);
  };

  const visibleCues = useMemo(() => {
    if (activeBank === "A") return cues.filter((c) => c.id <= 8);
    if (activeBank === "B") return cues.filter((c) => c.id > 8);
    return cues;
  }, [cues, activeBank]);

  const handleDspKnobChange = (id: "filter" | "crunch" | "volume", v: number) => {
    if (id === "filter") {
      setFxFilterSweep(v);
      studioAudio.setSamplerFilterSweep(v);
      stemMixerRef.current?.setFilterSweep(v);
    } else if (id === "crunch") {
      setFxCrunch(v);
      studioAudio.setSamplerCrunch(v);
      stemMixerRef.current?.setCrunchDrive(v);
    } else {
      setFxMasterVol(v);
      studioAudio.setSamplerMasterVolume(v / 100);
      stemMixerRef.current?.setMasterVolume(v / 100);
    }
  };

  const handleDspKnobReset = (id: "filter" | "crunch" | "volume") => {
    handleDspKnobChange(id, id === "volume" ? 90 : 0);
  };

  const handleControlKnobChange = (id: "pitch" | "control" | "fine" | "offset", v: number) => {
    if (id === "pitch") {
      setPitchSemi(v);
      studioAudio.setActiveSamplerPitch(v + fineTuneCents / 100);
      applyPitchRateToYouTube(v);
      if (!customAudioBuffer && selectedCueId !== null) {
        const cue = cues.find((c) => c.id === selectedCueId);
        studioAudio.playPitchHarmonic(v, cue?.keyNote || trackInfo?.key);
      }
    } else if (id === "control") {
      setChopGatePct(v);
    } else if (id === "fine") {
      setFineTuneCents(v);
      studioAudio.setActiveSamplerPitch(pitchSemi + v / 100);
    } else {
      setStartOffsetMs(v);
    }
  };

  const handleControlKnobReset = (id: "pitch" | "control" | "fine" | "offset") => {
    handleControlKnobChange(id, id === "control" ? 100 : 0);
  };

  const handleResetAll = () => {
    handleStopAudio();
    setPitchSemi(0);
    setFineTuneCents(0);
    setChopGatePct(100);
    setStartOffsetMs(0);
    setFxFilterSweep(0);
    setFxCrunch(0);
    setFxMasterVol(90);
    studioAudio.setSamplerFilterSweep(0);
    studioAudio.setSamplerCrunch(0);
    studioAudio.setSamplerMasterVolume(0.9);
    stemMixerRef.current?.setFilterSweep(0);
    stemMixerRef.current?.setCrunchDrive(0);
    stemMixerRef.current?.setMasterVolume(0.9);
    applyPitchRateToYouTube(0);
    setCues(DEFAULT_CUES.slice(0, 8));
    setSelectedCueId(1);
    setActiveBank("ALL");
    setIs16Levels(false);
    setTriggerMode("one_shot");
    setCustomAudioBuffer(null);
    setTrackInfo(null);
    setPadCustomBuffers({});
    setPadOriginalSources({});
    recorder.resetRecorder();
    setActiveStemFilter(null);
    activeStemFilterRef.current = null;
    setStemsResult(null);
    setPlaybackPointerSec(0);
    rescuedYoutubeIdRef.current = null;
    setSampleName("RADIO DOBLE C VAULT");
  };

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
        <SamplerHeaderBar
          isStandalone={isStandalone}
          onSendToSequencer={
            onSendToSequencer
              ? () => {
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
                }
              : undefined
          }
          onOpenDigger={onOpenDigger}
          onClose={onClose}
        />

        {/* Hidden YouTube Audio Player */}
        {activeTrack?.youtubeId && (
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
                    ytPlayerRef.current.contentWindow.postMessage(JSON.stringify({ event: "listening" }), "*");
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
        )}

        {/* Modal Main Content */}
        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "86vh", overflowY: "auto" }}>
          <input
            type="file"
            accept="audio/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />

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
            <SamplerTopBar
              cuesCount={cues.length}
              isCuttingPad={isCuttingPad}
              is16Levels={is16Levels}
              fxFilterSweep={fxFilterSweep}
              fxCrunch={fxCrunch}
              fxMasterVol={fxMasterVol}
              hasCustomAudio={Boolean(customAudioBuffer)}
              metronomeOn={recorder.metronomeOn}
              quantizeOn={recorder.quantizeOn}
              isRecordingPads={recorder.isRecordingPads}
              recordBars={recorder.recordBars}
              recordedEventsCount={recorder.recordedPadEvents.length}
              isPlayingRecording={recorder.isPlayingRecording}
              isRenderingRecording={recorder.isRenderingRecording}
              hasSequencerTarget={Boolean(onSendToSequencer)}
              onAddCue={() => handleAddCue()}
              onCutPad={handleCutSelectedPadAtPlayhead}
              onToggle16Levels={() => setIs16Levels((prev) => !prev)}
              onDspKnobChange={handleDspKnobChange}
              onDspKnobReset={handleDspKnobReset}
              onClickUpload={() => fileInputRef.current?.click()}
              onDownloadWav={handleDownloadAudioToPc}
              onToggleMetronome={() => recorder.setMetronomeOn((p) => !p)}
              onToggleQuantize={() => recorder.setQuantizeOn((p) => !p)}
              onToggleRecordPads={recorder.handleToggleRecordPads}
              onSelectRecordBars={recorder.setRecordBars}
              onPlayRecordedMelody={recorder.handlePlayRecordedMelody}
              onSendRecordedMelody={recorder.handleSendRecordedMelodyToMaster}
            />

            {recorder.recordNotice && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "6px 10px",
                  backgroundColor: "rgba(255, 214, 0, 0.1)",
                  border: "1px solid #FFD600",
                  borderRadius: "4px",
                  fontSize: "0.64rem",
                  fontWeight: 800,
                  color: "#FFD600",
                }}
              >
                <span>{recorder.recordNotice}</span>
                <button
                  type="button"
                  onClick={() => recorder.setRecordNotice(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#FFD600",
                    fontWeight: 900,
                    cursor: "pointer",
                    fontSize: "0.68rem",
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <SamplerWaveformToolbar
              waveformContainerRef={waveform.waveformContainerRef}
              activeStemFilter={activeStemFilter}
              totalDuration={totalDuration}
              hasCustomAudio={Boolean(customAudioBuffer)}
              isRescuingAudio={isRescuingAudio}
              isWaveReady={waveform.isWaveReady}
              zoomLevel={waveform.zoomLevel}
              fitZoomBase={waveform.fitZoomBase}
              isPlayingSong={isPlayingSong}
              playbackPointerSec={playbackPointerSec}
              draggingCueId={waveform.draggingCueId}
              scrubDirection={waveform.scrubDirection}
              cues={cues}
              selectedCueId={selectedCueId}
              triggerMode={triggerMode}
              onZoomChange={waveform.handleZoomChange}
              onResetZoom={waveform.handleResetZoom}
              onPlayPauseSong={handlePlayPauseSong}
              onStopSong={handleStopSong}
              onSeekPointer={handleSeekPointer}
            />
          </div>

          <SamplerControlsStrip
            bpm={trackInfo?.bpm || 95}
            pitchSemi={pitchSemi}
            chopGatePct={chopGatePct}
            fineTuneCents={fineTuneCents}
            startOffsetMs={startOffsetMs}
            triggerMode={triggerMode}
            activeBank={activeBank}
            cuesCount={cues.length}
            onControlKnobChange={handleControlKnobChange}
            onControlKnobReset={handleControlKnobReset}
            onChangeTriggerMode={setTriggerMode}
            onChangeBank={setActiveBank}
            onResetAll={handleResetAll}
          />

          <SamplerCuePadsGrid
            is16Levels={is16Levels}
            akai16Type={akai16Type}
            active16LevelPad={active16LevelPad}
            cues={cues}
            visibleCues={visibleCues}
            activeBank={activeBank}
            activeCueId={activeCueId}
            selectedCueId={selectedCueId}
            editingCueId={editingCueId}
            editingCueName={editingCueName}
            triggerMode={triggerMode}
            totalDuration={totalDuration}
            onChangeAkai16Type={setAkai16Type}
            onTrigger16Level={handleTrigger16Level}
            onTriggerCue={handleTriggerCue}
            onStopAudio={handleStopAudio}
            onDeleteCue={handleDeleteCue}
            onStartRename={handleStartRename}
            onChangeEditingName={setEditingCueName}
            onSaveRename={handleSaveRename}
            onCancelRename={() => setEditingCueId(null)}
          />
        </div>

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
            hasYoutubeFallback={Boolean(activeTrack?.youtubeId)}
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
            onStopYoutubeSlice={pauseYouTubeIframe}
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
                  [targetId]: { ...existing, trimStartPct, trimEndPct },
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
