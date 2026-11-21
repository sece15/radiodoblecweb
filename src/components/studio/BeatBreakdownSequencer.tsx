"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Disc, Play, RotateCcw, Square, Volume2, VolumeX, Zap } from "lucide-react";
import type { BeatBreakdownSamplePayload } from "@/types/studio";
import { extractStemPeaks } from "@/lib/studio/stemEngine";

interface BeatBreakdownSequencerProps {
  samplePayload: BeatBreakdownSamplePayload | null;
  onBackToSampler: () => void;
  onBackToDigger: () => void;
}

type LayerId = "kick" | "snare" | "hats" | "bass" | "melody";
type FocusStage = "full" | LayerId;

interface LayerMeta {
  id: LayerId;
  index: number;
  label: string;
  overline: string;
  headline: string;
  subline: string;
  kind: "pads" | "waveform";
}

const LAYERS: LayerMeta[] = [
  {
    id: "kick",
    index: 1,
    label: "KICK",
    overline: "LAYER 01 / 05 · KICK",
    headline: "THE KICK.",
    subline: "IT SETS THE BOUNCE.",
    kind: "pads",
  },
  {
    id: "snare",
    index: 2,
    label: "SNARE",
    overline: "LAYER 02 / 05 · SNARE",
    headline: "THE SNARE.",
    subline: "BACKBEAT ON 2 & 4.",
    kind: "pads",
  },
  {
    id: "hats",
    index: 3,
    label: "HATS",
    overline: "LAYER 03 / 05 · HATS",
    headline: "THE HATS.",
    subline: "THEY KEEP IT MOVING.",
    kind: "pads",
  },
  {
    id: "bass",
    index: 4,
    label: "BASS",
    overline: "LAYER 04 / 05 · BASS",
    headline: "THE BASS.",
    subline: "HOLDS THE LOW END.",
    kind: "waveform",
  },
  {
    id: "melody",
    index: 5,
    label: "MELODY",
    overline: "LAYER 05 / 05 · MELODY",
    headline: "THE SAMPLE",
    subline: "ON TOP.",
    kind: "waveform",
  },
];

const BREAKDOWN_ORDER: FocusStage[] = ["full", "kick", "snare", "hats", "bass", "melody"];

// Base 2-bar BoomBap templates (expanded dynamically when user increases totalBars to 4 or 8)
const INITIAL_PATTERNS: Record<"kick" | "snare" | "hats" | "bass", boolean[][]> = {
  kick: [
    [true, false, false, false, false, false, false, true, true, false, true, false, false, false, false, false],
    [true, false, false, false, false, false, false, true, true, false, true, false, false, false, true, false],
  ],
  snare: [
    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true],
  ],
  hats: [
    [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, true],
    [true, false, true, false, true, false, true, true, true, false, true, false, true, false, true, false],
  ],
  bass: [
    [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
    [true, false, false, false, false, false, true, false, false, false, true, false, false, true, false, false],
  ],
};

function resizePatterns(
  current: Record<"kick" | "snare" | "hats" | "bass", boolean[][]>,
  targetBars: number
): Record<"kick" | "snare" | "hats" | "bass", boolean[][]> {
  const keys = ["kick", "snare", "hats", "bass"] as const;
  const next = {} as Record<"kick" | "snare" | "hats" | "bass", boolean[][]>;
  for (const key of keys) {
    const src = current[key];
    const bars: boolean[][] = [];
    for (let b = 0; b < targetBars; b++) {
      bars.push([...src[b % src.length]]);
    }
    next[key] = bars;
  }
  return next;
}

// Bass pitch contour in Hz (classic dark BoomBap F minor / C minor feel)
const BASS_FREQS: number[] = [
  55.0, 55.0, 55.0, 55.0,
  55.0, 55.0, 65.41, 61.74,
  55.0, 55.0, 49.0, 49.0,
  49.0, 55.0, 61.74, 55.0,
];

function generateSyntheticWaveform(steps: boolean[], bars = 88, seed = 1): number[] {
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    const stepPos = (i / bars) * 16;
    const stepIdx = Math.floor(stepPos);
    const frac = stepPos - stepIdx;

    // Look back up to 3 steps for decaying envelope
    let energy = 0.08;
    for (let back = 0; back <= 3; back++) {
      const idx = stepIdx - back;
      if (idx >= 0 && steps[idx]) {
        const dist = back + frac;
        const env = Math.exp(-dist * 0.95);
        energy = Math.max(energy, env * 0.92);
      }
    }
    const ripple = 0.72 + 0.28 * Math.abs(Math.sin((i + seed * 7) * 1.45) * Math.cos((i + seed) * 0.63));
    out.push(Math.min(1, Math.max(0.06, energy * ripple)));
  }
  return out;
}

function generateSampleFallbackPeaks(bars = 112): number[] {
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    const t = i / bars;
    const phrase = 0.55 + 0.35 * Math.sin(t * Math.PI * 4) + 0.18 * Math.cos(t * Math.PI * 13);
    const transient = i % 14 === 0 || i % 28 === 6 ? 0.28 : 0;
    const micro = 0.75 + 0.25 * Math.abs(Math.sin(i * 2.13));
    out.push(Math.min(1, Math.max(0.12, (phrase * micro + transient) * 0.85)));
  }
  return out;
}

export const BeatBreakdownSequencer: React.FC<BeatBreakdownSequencerProps> = ({
  samplePayload,
  onBackToSampler,
  onBackToDigger,
}) => {
  const [bpm, setBpm] = useState<number>(() => {
    const raw = samplePayload?.bpm;
    return raw && Number.isFinite(raw) && raw >= 55 && raw <= 190 ? Math.round(raw) : 87;
  });
  const [beatTitle, setBeatTitle] = useState<string>(() => {
    const raw = samplePayload?.title?.trim();
    return raw ? raw.toUpperCase() : "BOOMBAP OLD SCHOOL TYPE BEAT";
  });
  const [totalBars, setTotalBars] = useState<number>(() => samplePayload?.recordedBars ?? 2);
  const [patterns, setPatterns] = useState<Record<"kick" | "snare" | "hats" | "bass", boolean[][]>>(() =>
    resizePatterns(INITIAL_PATTERNS, samplePayload?.recordedBars ?? 2)
  );
  const [mutedLayers, setMutedLayers] = useState<Record<LayerId, boolean>>({
    kick: false,
    snare: false,
    hats: false,
    bass: false,
    melody: false,
  });
  const [focusStage, setFocusStage] = useState<FocusStage>("full");
  const [autoBreakdown, setAutoBreakdown] = useState<boolean>(false);
  const [editingBar, setEditingBar] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1); // 0..15
  const [playingBar, setPlayingBar] = useState<number>(0);
  const [playheadPct, setPlayheadPct] = useState<number>(0);
  const [selectedChopId, setSelectedChopId] = useState<number>(samplePayload?.selectedCueId ?? 0);

  // Refs for sample-accurate Web Audio scheduler
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const schedulerTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const nextNoteTimeRef = useRef<number>(0);
  const currentStepGlobalRef = useRef<number>(0);
  const barStartAudioTimeRef = useRef<number>(0);
  const activeSampleSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeBassSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const bpmRef = useRef(bpm);
  const totalBarsRef = useRef(totalBars);
  const patternsRef = useRef(patterns);
  const mutedRef = useRef(mutedLayers);
  const focusStageRef = useRef(focusStage);
  const autoBreakdownRef = useRef(autoBreakdown);
  const selectedChopIdRef = useRef(selectedChopId);

  const melodyLoopBars = samplePayload?.recordedBars ?? 1;
  const melodyLoopBarsRef = useRef(melodyLoopBars);

  // Determine active sample buffer (if recorded melody selectedChopId === 0, use full rendered melody buffer)
  const activeSampleBuffer = useMemo<AudioBuffer | null>(() => {
    if (!samplePayload) return null;
    if (selectedChopId > 0) {
      const custom = samplePayload.padCustomBuffers?.[selectedChopId];
      if (custom) return custom;
    }
    return samplePayload.sampleBuffer ?? null;
  }, [samplePayload, selectedChopId]);

  const activeSampleBufferRef = useRef<AudioBuffer | null>(activeSampleBuffer);

  const activeCue = useMemo(() => {
    if (selectedChopId <= 0) return null;
    return samplePayload?.cues?.find((c) => c.id === selectedChopId) ?? null;
  }, [samplePayload, selectedChopId]);

  const activeCueRef = useRef(activeCue);

  const bassBufferRef = useRef<AudioBuffer | null>(samplePayload?.bassBuffer ?? null);

  useEffect(() => {
    bpmRef.current = bpm;
    totalBarsRef.current = totalBars;
    patternsRef.current = patterns;
    mutedRef.current = mutedLayers;
    focusStageRef.current = focusStage;
    autoBreakdownRef.current = autoBreakdown;
    selectedChopIdRef.current = selectedChopId;
    melodyLoopBarsRef.current = melodyLoopBars;
    activeSampleBufferRef.current = activeSampleBuffer;
    activeCueRef.current = activeCue;
    bassBufferRef.current = samplePayload?.bassBuffer ?? null;
  }, [
    bpm,
    totalBars,
    patterns,
    mutedLayers,
    focusStage,
    autoBreakdown,
    selectedChopId,
    melodyLoopBars,
    activeSampleBuffer,
    activeCue,
    samplePayload?.bassBuffer,
  ]);

  // Compute waveform peaks for Bass & Melody
  const visibleBar: number = Math.min(totalBars - 1, isPlaying ? playingBar : editingBar);

  const handleChangeTotalBars = (nextBars: number) => {
    setTotalBars(nextBars);
    setPatterns((prev) => resizePatterns(prev, nextBars));
    setEditingBar((prev) => Math.min(prev, nextBars - 1));
    setPlayingBar((prev) => Math.min(prev, nextBars - 1));
  };

  const sampleBassBuffer = samplePayload?.bassBuffer ?? null;

  const bassPeaks = useMemo(() => {
    if (sampleBassBuffer) {
      return extractStemPeaks(sampleBassBuffer, 96);
    }
    return generateSyntheticWaveform(patterns.bass[visibleBar], 96, visibleBar + 1);
  }, [sampleBassBuffer, patterns.bass, visibleBar]);

  const melodyPeaks = useMemo(() => {
    if (activeSampleBuffer) {
      return extractStemPeaks(activeSampleBuffer, 112);
    }
    return generateSampleFallbackPeaks(112);
  }, [activeSampleBuffer]);

  // Helper: check if a layer should be audible under the current focusStage + mute
  const isLayerAudible = useCallback((layerId: LayerId, stage: FocusStage, muted: Record<LayerId, boolean>): boolean => {
    if (muted[layerId]) return false;
    if (stage === "full") return true;
    // Progressive breakdown (identical to video):
    // Layer 1 = Kick; Layer 2 = Kick+Snare; Layer 3 = Kick+Snare+Hats; Layer 4 = +Bass; Layer 5 = +Melody
    const order: LayerId[] = ["kick", "snare", "hats", "bass", "melody"];
    return order.indexOf(layerId) <= order.indexOf(stage);
  }, []);

  const ensureAudioContext = useCallback((): AudioContext => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = 0.88;
      master.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = master;
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Crisp BoomBap Web Audio synths
  const triggerKick = useCallback((ctx: AudioContext, dest: AudioNode, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(44, time + 0.09);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.24);
    gain.gain.setValueAtTime(0.95, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.3);
  }, []);

  const triggerSnare = useCallback((ctx: AudioContext, dest: AudioNode, time: number, ghost = false) => {
    const vol = ghost ? 0.28 : 0.78;
    // Noise burst
    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.055));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = "bandpass";
    hp.frequency.setValueAtTime(1900, time);
    hp.Q.setValueAtTime(0.9, time);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(vol, time);
    nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    noise.connect(hp);
    hp.connect(nGain);
    nGain.connect(dest);
    noise.start(time);

    // Body punch
    const osc = ctx.createOscillator();
    const oGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(210, time);
    osc.frequency.exponentialRampToValueAtTime(115, time + 0.07);
    oGain.gain.setValueAtTime(vol * 0.6, time);
    oGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(oGain);
    oGain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.12);
  }, []);

  const triggerHat = useCallback((ctx: AudioContext, dest: AudioNode, time: number, accent = false) => {
    const bufferSize = Math.floor(ctx.sampleRate * 0.065);
    const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.018));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(6800, time);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(accent ? 0.34 : 0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    noise.connect(hp);
    hp.connect(gain);
    gain.connect(dest);
    noise.start(time);
  }, []);

  const triggerBass = useCallback((ctx: AudioContext, dest: AudioNode, time: number, step16: number, stepDur: number) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const freq = BASS_FREQS[step16 % BASS_FREQS.length];
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, time);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(260, time);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.65, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, time + stepDur * 2.8);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + stepDur * 3.0);
  }, []);

  const triggerMelodyLayer = useCallback((ctx: AudioContext, dest: AudioNode, time: number, barDur: number) => {
    // Stop previous bar's sample slice cleanly
    if (activeSampleSourceRef.current) {
      try {
        activeSampleSourceRef.current.stop(time);
      } catch {}
      activeSampleSourceRef.current = null;
    }

    const buf = activeSampleBufferRef.current;
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.85, time);
      gain.gain.setValueAtTime(0.85, Math.max(time, time + barDur - 0.03));
      gain.gain.linearRampToValueAtTime(0.001, time + barDur);
      src.connect(gain);
      gain.connect(dest);

      const isCustomChop = Boolean(samplePayload?.padCustomBuffers?.[selectedChopIdRef.current]);
      const startOffset = isCustomChop ? 0 : Math.min(Math.max(0, activeCueRef.current?.startSec ?? 0), Math.max(0, buf.duration - 0.25));
      const playDur = Math.min(barDur, Math.max(0.1, buf.duration - startOffset));
      src.start(time, startOffset, playDur);
      activeSampleSourceRef.current = src;
      return;
    }

    // Fallback warm BoomBap Rhodes/Soul sample chord if no decoded AudioBuffer
    const chord = [220.0, 261.63, 329.63, 392.0]; // Am7
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, time);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1150, time);
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.09, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + barDur * 0.92);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + barDur);
    });
  }, [samplePayload]);

  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveStep(-1);
    setPlayheadPct(0);
    if (schedulerTimerRef.current !== null) {
      window.clearTimeout(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (activeSampleSourceRef.current) {
      try {
        activeSampleSourceRef.current.stop();
      } catch {}
      activeSampleSourceRef.current = null;
    }
    if (activeBassSourceRef.current) {
      try {
        activeBassSourceRef.current.stop();
      } catch {}
      activeBassSourceRef.current = null;
    }
  }, []);

  const scheduleStep = useCallback(
    (stepGlobal: number, time: number) => {
      const ctx = audioCtxRef.current;
      const dest = masterGainRef.current;
      if (!ctx || !dest) return;

      const barsCount = totalBarsRef.current;
      const barIdx = Math.floor(stepGlobal / 16) % barsCount;
      const step16 = stepGlobal % 16;
      const stepDur = 60 / bpmRef.current / 4;
      const barDur = stepDur * 16;

      // Auto-breakdown cycle at the start of every full loop (stepGlobal === 0)
      let currentStage = focusStageRef.current;
      if (stepGlobal === 0 && autoBreakdownRef.current && currentStepGlobalRef.current !== -1) {
        const nextIdx = (BREAKDOWN_ORDER.indexOf(currentStage) + 1) % BREAKDOWN_ORDER.length;
        currentStage = BREAKDOWN_ORDER[nextIdx];
        focusStageRef.current = currentStage;
        const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
        const stageToSet = currentStage;
        window.setTimeout(() => {
          if (isPlayingRef.current) setFocusStage(stageToSet);
        }, delayMs);
      }

      if (step16 === 0) {
        barStartAudioTimeRef.current = time;
      }

      const muted = mutedRef.current;
      const pats = patternsRef.current;
      const kickBar = pats.kick[barIdx] || pats.kick[0];
      const snareBar = pats.snare[barIdx] || pats.snare[0];
      const hatsBar = pats.hats[barIdx] || pats.hats[0];
      const bassBar = pats.bass[barIdx] || pats.bass[0];

      if (isLayerAudible("kick", currentStage, muted) && kickBar[step16]) {
        triggerKick(ctx, dest, time);
      }
      if (isLayerAudible("snare", currentStage, muted) && snareBar[step16]) {
        const isGhost = step16 !== 4 && step16 !== 12;
        triggerSnare(ctx, dest, time, isGhost);
      }
      if (isLayerAudible("hats", currentStage, muted) && hatsBar[step16]) {
        triggerHat(ctx, dest, time, step16 % 4 === 0);
      }
      if (isLayerAudible("bass", currentStage, muted) && bassBar[step16]) {
        triggerBass(ctx, dest, time, step16, stepDur);
      }
      // Trigger recorded 1/2/4-bar melody cleanly on its phrase boundary
      const phraseBars = selectedChopIdRef.current === 0 ? melodyLoopBarsRef.current : 1;
      if (step16 === 0 && barIdx % phraseBars === 0 && isLayerAudible("melody", currentStage, muted)) {
        triggerMelodyLayer(ctx, dest, time, barDur * phraseBars);
      }

      const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
      window.setTimeout(() => {
        if (!isPlayingRef.current) return;
        setActiveStep(step16);
        setPlayingBar(barIdx);
      }, delayMs);
    },
    [isLayerAudible, triggerBass, triggerHat, triggerKick, triggerMelodyLayer, triggerSnare]
  );

  const startPlayback = useCallback(() => {
    const ctx = ensureAudioContext();
    isPlayingRef.current = true;
    setIsPlaying(true);
    currentStepGlobalRef.current = 0;
    const startAt = ctx.currentTime + 0.05;
    nextNoteTimeRef.current = startAt;
    barStartAudioTimeRef.current = startAt;

    const scheduler = () => {
      if (!isPlayingRef.current || !audioCtxRef.current) return;
      while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + 0.1) {
        const totalSteps = totalBarsRef.current * 16;
        scheduleStep(currentStepGlobalRef.current % totalSteps, nextNoteTimeRef.current);
        const stepDur = 60 / bpmRef.current / 4;
        // Subtle BoomBap swing (12%) on odd 16th steps
        const isOdd = currentStepGlobalRef.current % 2 === 1;
        nextNoteTimeRef.current += isOdd ? stepDur * 0.94 : stepDur * 1.06;
        currentStepGlobalRef.current = (currentStepGlobalRef.current + 1) % totalSteps;
      }
      schedulerTimerRef.current = window.setTimeout(scheduler, 25);
    };
    scheduler();

    const animatePlayhead = () => {
      if (!isPlayingRef.current || !audioCtxRef.current) return;
      const barDur = (60 / bpmRef.current) * 4;
      const elapsed = audioCtxRef.current.currentTime - barStartAudioTimeRef.current;
      const pct = Math.max(0, Math.min(100, ((elapsed % barDur) / barDur) * 100));
      setPlayheadPct(pct);
      rafRef.current = requestAnimationFrame(animatePlayhead);
    };
    rafRef.current = requestAnimationFrame(animatePlayhead);
  }, [ensureAudioContext, scheduleStep]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [startPlayback, stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [stopPlayback]);

  // Keyboard shortcuts: Space (play/stop), 0 (full loop), 1-5 (layer focus)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "0") {
        setFocusStage("full");
      } else if (e.key >= "1" && e.key <= "5") {
        const idx = Number(e.key) - 1;
        setFocusStage(LAYERS[idx].id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay]);

  const togglePad = (layer: "kick" | "snare" | "hats" | "bass", stepIdx: number) => {
    setPatterns((prev) => {
      const nextBars = prev[layer].map((bar) => [...bar]);
      if (nextBars[visibleBar]) {
        nextBars[visibleBar][stepIdx] = !nextBars[visibleBar][stepIdx];
      }
      return { ...prev, [layer]: nextBars };
    });
  };

  const toggleMute = (layerId: LayerId, e: React.MouseEvent) => {
    e.stopPropagation();
    setMutedLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  const handleResetPattern = () => {
    setPatterns(resizePatterns(INITIAL_PATTERNS, totalBars));
    setMutedLayers({ kick: false, snare: false, hats: false, bass: false, melody: false });
    setFocusStage("full");
  };

  // Current breakdown caption metadata
  const currentCaption = useMemo(() => {
    if (focusStage === "full") {
      return {
        overline: "FULL LOOP",
        headline: isPlaying ? "THAT'S THE FULL BEAT." : "HERE'S THE LOOP.",
        subline: isPlaying ? "ALL LAYERS. ONE LOOP." : "LET'S BREAK IT DOWN.",
      };
    }
    const found = LAYERS.find((l) => l.id === focusStage)!;
    return {
      overline: found.overline,
      headline: found.headline,
      subline: found.subline,
    };
  }, [focusStage, isPlaying]);

  const activeStageIndex = focusStage === "full" ? 5 : LAYERS.findIndex((l) => l.id === focusStage) + 1;
  const availableChops = samplePayload?.cues?.filter((c) => c.active).slice(0, 8) ?? [];

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "var(--background)",
        color: "var(--on-background)",
        fontFamily: "'Space Grotesk', 'Outfit', -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 16px 40px",
        transition: "background-color 0.25s ease, color 0.25s ease",
      }}
    >
      <div style={{ width: "100%", maxWidth: "860px", display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* TOP HEADER (Monogram + Navigation + BEAT BREAKDOWN) */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Bold Square Monogram (mirrors top-left logo in video) */}
            <div
              style={{
                width: "46px",
                height: "46px",
                backgroundColor: "var(--primary)",
                color: "var(--on-primary)",
                border: "3px solid var(--primary)",
                boxShadow: "4px 4px 0px var(--primary-container)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1.05rem",
                letterSpacing: "-1px",
                userSelect: "none",
              }}
              title="Radio Doble C · C-Station"
            >
              DC
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  stopPlayback();
                  onBackToSampler();
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  backgroundColor: "var(--surface-container)",
                  color: "var(--on-background)",
                  border: "2px solid var(--primary)",
                  boxShadow: "3px 3px 0px var(--primary)",
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={14} />
                C-SAMPLER
              </button>

              <button
                type="button"
                onClick={() => {
                  stopPlayback();
                  onBackToDigger();
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  backgroundColor: "var(--card-bg)",
                  color: "var(--on-background)",
                  border: "2px solid var(--primary)",
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                <Disc size={14} />
                C-DIGGER
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "var(--on-surface-variant)",
              }}
            >
              BEAT BREAKDOWN
            </span>
          </div>
        </header>

        {/* BEAT TITLE + BPM / LAYERS + TRANSPORT */}
        <section style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "240px", flex: 1 }}>
              <input
                type="text"
                value={beatTitle}
                onChange={(e) => setBeatTitle(e.target.value.toUpperCase())}
                aria-label="Título del beat"
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--on-background)",
                  fontFamily: "'Outfit', 'Space Grotesk', sans-serif",
                  fontSize: "clamp(1.35rem, 3.2vw, 2rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  width: "100%",
                  padding: 0,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: "var(--on-surface-variant)",
                  textTransform: "uppercase",
                }}
              >
                <span>{bpm} BPM</span>
                <span>·</span>
                <span>5 LAYERS</span>
                {samplePayload?.musicalKey && (
                  <>
                    <span>·</span>
                    <span>{samplePayload.musicalKey}</span>
                  </>
                )}
              </div>
            </div>

            {/* Compact Transport Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {/* BPM Stepper */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  border: "2px solid var(--primary)",
                  backgroundColor: "var(--card-bg)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setBpm((v) => Math.max(60, v - 1))}
                  style={{
                    padding: "6px 10px",
                    background: "transparent",
                    border: "none",
                    color: "var(--on-background)",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                  title="Bajar BPM"
                >
                  −
                </button>
                <span style={{ fontSize: "0.75rem", fontWeight: 900, padding: "0 6px", fontFamily: "monospace" }}>
                  {bpm}
                </span>
                <button
                  type="button"
                  onClick={() => setBpm((v) => Math.min(180, v + 1))}
                  style={{
                    padding: "6px 10px",
                    background: "transparent",
                    border: "none",
                    color: "var(--on-background)",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                  title="Subir BPM"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => setAutoBreakdown((v) => !v)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "7px 12px",
                  backgroundColor: autoBreakdown ? "var(--primary-container)" : "var(--surface-container)",
                  color: autoBreakdown ? "var(--on-primary-container)" : "var(--on-background)",
                  border: "2px solid var(--primary)",
                  fontWeight: 900,
                  fontSize: "0.72rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
                title="Cicla automáticamente Full Loop y las 5 capas como en el video"
              >
                <Zap size={13} />
                AUTO BREAKDOWN
              </button>

              <button
                type="button"
                onClick={handleResetPattern}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "7px 10px",
                  backgroundColor: "var(--surface-container)",
                  color: "var(--on-background)",
                  border: "2px solid var(--primary)",
                  cursor: "pointer",
                }}
                title="Restaurar patrón BoomBap"
              >
                <RotateCcw size={14} />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "7px 18px",
                  backgroundColor: isPlaying ? "var(--error)" : "var(--primary-container)",
                  color: isPlaying ? "#FFFFFF" : "var(--on-primary-container)",
                  border: "2px solid var(--primary)",
                  boxShadow: "3px 3px 0px var(--primary)",
                  fontWeight: 900,
                  fontSize: "0.78rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                {isPlaying ? "STOP" : "PLAY"}
              </button>
            </div>
          </div>

          {/* 5-SEGMENT PROGRESS BAR (Exact match to video) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginTop: "2px" }}>
            {LAYERS.map((layer, idx) => {
              const isFilled = focusStage === "full" || idx < activeStageIndex;
              const isCurrent = focusStage === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setFocusStage((prev) => (prev === layer.id ? "full" : layer.id))}
                  title={`Enfocar capa ${layer.label} (o clic de nuevo para Full Loop)`}
                  style={{
                    height: isCurrent ? "7px" : "4px",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    backgroundColor: isCurrent
                      ? "var(--primary-container)"
                      : isFilled
                      ? "var(--primary)"
                      : "var(--surface-container)",
                    opacity: isFilled ? 1 : 0.45,
                    transition: "all 0.2s ease",
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* MAIN SEQUENCER FRAME (Exact visual structure of boobbap.mp4) */}
        <section
          style={{
            border: "2.5px solid var(--primary)",
            backgroundColor: "var(--card-bg)",
            boxShadow: "6px 6px 0px var(--primary)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Sequencer Frame Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
              borderBottom: "1.5px solid var(--primary)",
              backgroundColor: "var(--surface-container)",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>SEQUENCER · 16 STEPS</span>
              <button
                type="button"
                onClick={() => setFocusStage("full")}
                style={{
                  padding: "2px 8px",
                  fontSize: "0.62rem",
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  border: "1.5px solid var(--primary)",
                  backgroundColor: focusStage === "full" ? "var(--primary-container)" : "transparent",
                  color: focusStage === "full" ? "var(--on-primary-container)" : "var(--on-background)",
                  cursor: "pointer",
                }}
              >
                FULL LOOP
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {/* Selector para aumentar compases del beat (1, 2, 4, 8) */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "3px", marginRight: "6px" }}>
                <span style={{ fontSize: "0.60rem", color: "var(--on-surface-variant)", letterSpacing: "0.08em" }}>
                  COMPASES:
                </span>
                {([1, 2, 4, 8] as const).map((bars) => (
                  <button
                    key={bars}
                    type="button"
                    onClick={() => handleChangeTotalBars(bars)}
                    style={{
                      padding: "2px 6px",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      border: "1.5px solid var(--primary)",
                      backgroundColor: totalBars === bars ? "var(--primary-container)" : "transparent",
                      color: totalBars === bars ? "var(--on-primary-container)" : "var(--on-background)",
                      cursor: "pointer",
                    }}
                    title={`Expandir el beat a ${bars} ${bars === 1 ? "compás" : "compases"}`}
                  >
                    {bars}
                  </button>
                ))}
              </div>

              <span style={{ fontSize: "0.68rem", fontWeight: 900, letterSpacing: "0.14em" }}>
                BAR {visibleBar + 1} OF {totalBars}
              </span>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                {Array.from({ length: totalBars }, (_, barIdx) => (
                  <button
                    key={barIdx}
                    type="button"
                    onClick={() => setEditingBar(barIdx)}
                    style={{
                      width: "20px",
                      height: "20px",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      border: visibleBar === barIdx ? "1.5px solid var(--primary)" : "1px solid var(--on-surface-variant)",
                      backgroundColor: visibleBar === barIdx ? "var(--primary)" : "transparent",
                      color: visibleBar === barIdx ? "var(--on-primary)" : "var(--on-surface-variant)",
                      cursor: "pointer",
                    }}
                    title={`Editar Compás ${barIdx + 1}`}
                  >
                    {barIdx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5 SEPARATED LAYER ROWS + CONTINUOUS PLAYHEAD OVERLAY */}
          <div style={{ position: "relative", padding: "12px 0 8px" }}>
            {/* Vertical Sweeping Playhead Line across the 16-step track area */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: "28px",
                left: "112px",
                right: "54px",
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              {/* Subtle beat grid guide lines (1, 2, 3, 4) */}
              {[0, 25, 50, 75].map((pct) => (
                <div
                  key={pct}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${pct}%`,
                    width: "1px",
                    backgroundColor: "var(--primary)",
                    opacity: 0.12,
                  }}
                />
              ))}

              {/* Active Playhead Cursor */}
              {isPlaying && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${playheadPct}%`,
                    width: "2.5px",
                    backgroundColor: "var(--primary-container)",
                    boxShadow: "0 0 8px var(--primary-container)",
                    transform: "translateX(-1px)",
                  }}
                />
              )}
            </div>

            {/* ROWS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {LAYERS.map((layer) => {
                const isFocused = focusStage === layer.id;
                const isAudible = isLayerAudible(layer.id, focusStage, mutedLayers);
                const isMuted = mutedLayers[layer.id];

                // Highlighted row inverts to Radio Doble C's primary/on-primary (just like video's high-contrast strip)
                const rowBg = isFocused ? "var(--primary)" : "transparent";
                const rowText = isFocused ? "var(--on-primary)" : "var(--on-background)";
                const rowOpacity = isMuted ? 0.28 : isAudible ? 1 : 0.35;

                return (
                  <div
                    key={layer.id}
                    onClick={() => setFocusStage((prev) => (prev === layer.id ? "full" : layer.id))}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "112px 1fr 54px",
                      alignItems: "center",
                      minHeight: layer.kind === "waveform" ? "66px" : "56px",
                      padding: "6px 0",
                      backgroundColor: rowBg,
                      color: rowText,
                      opacity: rowOpacity,
                      cursor: "pointer",
                      transition: "background-color 0.2s ease, opacity 0.2s ease",
                    }}
                  >
                    {/* Left Layer Label */}
                    <div
                      style={{
                        paddingLeft: "18px",
                        fontSize: "0.78rem",
                        fontWeight: 900,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        userSelect: "none",
                      }}
                    >
                      {layer.label}
                    </div>

                    {/* Center 16-Step Pads OR Waveform */}
                    {layer.kind === "pads" ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(16, 1fr)",
                          gap: "6px",
                          alignItems: "center",
                          padding: "0 4px",
                        }}
                      >
                        {patterns[layer.id as "kick" | "snare" | "hats"][visibleBar].map((active, stepIdx) => {
                          const isPlayheadStep = isPlaying && activeStep === stepIdx;
                          return (
                            <button
                              key={stepIdx}
                              type="button"
                              onClick={() => togglePad(layer.id as "kick" | "snare" | "hats", stepIdx)}
                              aria-label={`${layer.label} step ${stepIdx + 1}`}
                              style={{
                                width: "100%",
                                aspectRatio: "1 / 1",
                                maxWidth: "24px",
                                maxHeight: "24px",
                                margin: "0 auto",
                                border: active
                                  ? `2px solid ${isFocused ? "var(--primary-container)" : "var(--primary)"}`
                                  : `1.5px solid ${isFocused ? "var(--on-primary)" : "var(--primary)"}`,
                                backgroundColor: active
                                  ? isPlayheadStep
                                    ? "var(--primary-container)"
                                    : isFocused
                                    ? "var(--on-primary)"
                                    : "var(--primary)"
                                  : "transparent",
                                opacity: active ? 1 : isPlayheadStep ? 0.55 : 0.22,
                                transform: isPlayheadStep && active ? "scale(1.18)" : "scale(1)",
                                transition: "transform 0.08s ease, background-color 0.1s ease",
                                cursor: "pointer",
                                borderRadius: "2px",
                              }}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "relative",
                          height: "52px",
                          display: "flex",
                          alignItems: "center",
                          padding: "0 4px",
                        }}
                      >
                        {/* Symmetrical Audio Waveform Bars (mirrors BASS & MELODY in video) */}
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "1px",
                            pointerEvents: layer.id === "bass" ? "none" : "auto",
                          }}
                          onClick={() => setFocusStage((prev) => (prev === layer.id ? "full" : layer.id))}
                        >
                          {(layer.id === "bass" ? bassPeaks : melodyPeaks).map((amp, i) => {
                            const barPct = (i / (layer.id === "bass" ? bassPeaks.length : melodyPeaks.length)) * 100;
                            const isPastPlayhead = isPlaying && barPct <= playheadPct;
                            return (
                              <div
                                key={i}
                                style={{
                                  flex: 1,
                                  height: `${Math.max(8, Math.round(amp * 100))}%`,
                                  backgroundColor: isPastPlayhead
                                    ? "var(--primary-container)"
                                    : isFocused
                                    ? "var(--on-primary)"
                                    : "var(--primary)",
                                  opacity: isPastPlayhead ? 1 : 0.85,
                                  borderRadius: "1px",
                                }}
                              />
                            );
                          })}
                        </div>

                        {/* Interactive clickable 16-step overlay on BASS so user can edit bass triggers */}
                        {layer.id === "bass" && (
                          <div
                            style={{
                              position: "absolute",
                              inset: "0 4px",
                              display: "grid",
                              gridTemplateColumns: "repeat(16, 1fr)",
                              gap: "4px",
                              alignItems: "flex-end",
                            }}
                          >
                            {patterns.bass[visibleBar].map((active, stepIdx) => (
                              <button
                                key={stepIdx}
                                type="button"
                                onClick={() => togglePad("bass", stepIdx)}
                                title={`Bass step ${stepIdx + 1}`}
                                style={{
                                  height: "100%",
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "flex-end",
                                  justifyContent: "center",
                                  paddingBottom: "2px",
                                }}
                              >
                                <span
                                  style={{
                                    width: "7px",
                                    height: "7px",
                                    borderRadius: "1px",
                                    backgroundColor: active
                                      ? "var(--primary-container)"
                                      : isFocused
                                      ? "var(--on-primary)"
                                      : "var(--primary)",
                                    opacity: active ? 1 : 0.18,
                                    border: active ? "1px solid var(--primary)" : "none",
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Right Mute Toggle */}
                    <div style={{ display: "flex", justifyContent: "center", paddingRight: "10px" }}>
                      <button
                        type="button"
                        onClick={(e) => toggleMute(layer.id, e)}
                        title={isMuted ? `Activar ${layer.label}` : `Silenciar ${layer.label}`}
                        style={{
                          width: "26px",
                          height: "26px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1.5px solid ${isFocused ? "var(--on-primary)" : "var(--primary)"}`,
                          backgroundColor: isMuted ? "var(--error)" : "transparent",
                          color: isMuted ? "#FFFFFF" : rowText,
                          cursor: "pointer",
                          borderRadius: "2px",
                        }}
                      >
                        {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Beat Numbers Axis: 1  2  3  4 (exact match to video) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "112px 1fr 54px",
                marginTop: "8px",
                paddingTop: "6px",
                borderTop: "1px solid var(--surface-container)",
              }}
            >
              <div />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  padding: "0 4px",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "var(--on-surface-variant)",
                  fontFamily: "monospace",
                }}
              >
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
              </div>
              <div />
            </div>
          </div>
        </section>

        {/* OPTIONAL CHOP SELECTOR BAR (if chops came from C-Sampler) */}
        {availableChops.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
              padding: "8px 12px",
              border: "2px solid var(--primary)",
              backgroundColor: "var(--surface-container)",
            }}
          >
            <span
              style={{
                fontSize: "0.66rem",
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginRight: "4px",
              }}
            >
              MELODÍA / CHOP:
            </span>
            {samplePayload?.sampleBuffer && (
              <button
                type="button"
                onClick={() => setSelectedChopId(0)}
                style={{
                  padding: "4px 9px",
                  fontSize: "0.68rem",
                  fontWeight: 900,
                  border: "1.5px solid var(--primary)",
                  backgroundColor: selectedChopId === 0 ? "var(--primary-container)" : "var(--card-bg)",
                  color: selectedChopId === 0 ? "var(--on-primary-container)" : "var(--on-background)",
                  cursor: "pointer",
                }}
              >
                {samplePayload.recordedBars
                  ? `MELODÍA GRABADA (${samplePayload.recordedBars} COMP)`
                  : "SAMPLE COMPLETO"}
              </button>
            )}
            {availableChops.map((cue) => {
              const isSelected = selectedChopId === cue.id;
              return (
                <button
                  key={cue.id}
                  type="button"
                  onClick={() => setSelectedChopId(cue.id)}
                  style={{
                    padding: "4px 9px",
                    fontSize: "0.68rem",
                    fontWeight: 900,
                    border: "1.5px solid var(--primary)",
                    backgroundColor: isSelected ? "var(--primary-container)" : "var(--card-bg)",
                    color: isSelected ? "var(--on-primary-container)" : "var(--on-background)",
                    cursor: "pointer",
                  }}
                >
                  {cue.name}
                </button>
              );
            })}
          </div>
        )}

        {/* BOTTOM BREAKDOWN CAPTION (Exact giant bold typography from video) */}
        <footer
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            marginTop: "6px",
            padding: "4px 2px",
          }}
        >
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--on-surface-variant)",
            }}
          >
            {currentCaption.overline}
          </span>
          <h2
            style={{
              fontFamily: "'Outfit', 'Space Grotesk', sans-serif",
              fontSize: "clamp(1.75rem, 5vw, 3.1rem)",
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            {currentCaption.headline}
            <br />
            <span
              style={{
                backgroundColor: "var(--primary-container)",
                color: "var(--on-primary-container)",
                padding: "0 8px",
                boxDecorationBreak: "clone",
              }}
            >
              {currentCaption.subline}
            </span>
          </h2>
          <p
            style={{
              marginTop: "8px",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--on-surface-variant)",
              letterSpacing: "0.04em",
            }}
          >
            Atajos: [ESPACIO] Play/Stop · [1–5] Enfocar capa · [0] Full Loop · Clic en cada pad para editar el ritmo
          </p>
        </footer>
      </div>
    </div>
  );
};
