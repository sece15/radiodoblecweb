"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BeatBreakdownSamplePayload } from "@/types/studio";
import { extractStemPeaks } from "@/lib/studio/stemEngine";
import {
  LAYERS,
  BREAKDOWN_ORDER,
  INITIAL_PATTERNS,
  BASS_FREQS,
  resizePatterns,
  generateSyntheticWaveform,
  generateSampleFallbackPeaks,
  type LayerId,
  type FocusStage,
} from "@/lib/studio/breakdownConstants";
import { BreakdownHeaderBar } from "./breakdown/BreakdownHeaderBar";
import { BreakdownSequencerGrid } from "./breakdown/BreakdownSequencerGrid";
import { BreakdownFooterStage } from "./breakdown/BreakdownFooterStage";

interface BeatBreakdownSequencerProps {
  samplePayload: BeatBreakdownSamplePayload | null;
  onBackToSampler: () => void;
  onBackToDigger: () => void;
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
        <BreakdownHeaderBar
          beatTitle={beatTitle}
          bpm={bpm}
          musicalKey={samplePayload?.musicalKey}
          autoBreakdown={autoBreakdown}
          isPlaying={isPlaying}
          focusStage={focusStage}
          activeStageIndex={activeStageIndex}
          onBackToSampler={() => {
            stopPlayback();
            onBackToSampler();
          }}
          onBackToDigger={() => {
            stopPlayback();
            onBackToDigger();
          }}
          onChangeTitle={setBeatTitle}
          onDecrementBpm={() => setBpm((v) => Math.max(60, v - 1))}
          onIncrementBpm={() => setBpm((v) => Math.min(180, v + 1))}
          onToggleAutoBreakdown={() => setAutoBreakdown((v) => !v)}
          onResetPattern={handleResetPattern}
          onTogglePlay={togglePlay}
          onToggleLayerFocus={(id) => setFocusStage((prev) => (prev === id ? "full" : id))}
        />

        <BreakdownSequencerGrid
          focusStage={focusStage}
          totalBars={totalBars}
          visibleBar={visibleBar}
          isPlaying={isPlaying}
          playheadPct={playheadPct}
          activeStep={activeStep}
          patterns={patterns}
          mutedLayers={mutedLayers}
          bassPeaks={bassPeaks}
          melodyPeaks={melodyPeaks}
          isLayerAudible={isLayerAudible}
          onSetFullLoop={() => setFocusStage("full")}
          onChangeTotalBars={handleChangeTotalBars}
          onChangeEditingBar={setEditingBar}
          onToggleLayerFocus={(id) => setFocusStage((prev) => (prev === id ? "full" : id))}
          onTogglePad={togglePad}
          onToggleMute={toggleMute}
        />

        <BreakdownFooterStage
          samplePayload={samplePayload}
          availableChops={availableChops}
          selectedChopId={selectedChopId}
          currentCaption={currentCaption}
          onSelectChop={setSelectedChopId}
        />
      </div>
    </div>
  );
};