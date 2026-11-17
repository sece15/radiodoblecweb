"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Mic, Play, Scissors, Sparkles, Square, X } from "lucide-react";
import {
  decodeMediaBlobToAudioBuffer,
  encodeAudioBufferToWavBlob,
  separateAudioInBrowserWorker,
} from "@/lib/studio/browserStemAI";
import { extractStemPeaks, separateAudioIntoStems } from "@/lib/studio/stemEngine";
import { useModalIsolation } from "@/hooks/useModalIsolation";

export interface CSamplerCutPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  padLabel: string;
  rangeLabel: string;
  sliceStartSec: number;
  sliceEndSec: number;
  isRealAudio: boolean;
  hasYoutubeFallback?: boolean;
  onPlayYoutubeSlice?: (startSec: number, endSec: number, pitchSemi: number) => void;
  onStopYoutubeSlice?: () => void;
  onRequestLoadAudio?: () => void;
  onCapturedPadAudio?: (buffer: AudioBuffer) => void;
  bpm: number;
  musicalKey: string;
  genre: string;
  rawSliceBuffer: AudioBuffer;
  onSeparatedToMaster: (channels: {
    raw: AudioBuffer | null;
    drums: AudioBuffer | null;
    bass: AudioBuffer | null;
    melody: AudioBuffer | null;
    vocals: AudioBuffer | null;
  }) => void;
  onApplyRealCut?: (result: {
    newStartSec: number;
    newEndSec: number;
    processedBuffer: AudioBuffer | null;
  }) => void;
}

const formatSec = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
};

function makeCrunchCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  const k = Math.max(0, amount) * 1.4;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = k === 0 ? x : ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export const CSamplerCutPadModal: React.FC<CSamplerCutPadModalProps> = ({
  isOpen,
  onClose,
  padLabel,
  rangeLabel,
  sliceStartSec,
  sliceEndSec,
  isRealAudio,
  hasYoutubeFallback = false,
  onPlayYoutubeSlice,
  onStopYoutubeSlice,
  onRequestLoadAudio,
  onCapturedPadAudio,
  bpm,
  musicalKey,
  genre,
  rawSliceBuffer,
  onSeparatedToMaster,
  onApplyRealCut,
}) => {
  const [pitchSemi, setPitchSemi] = useState<number>(0);
  const [filterSweep, setFilterSweep] = useState<number>(0); // -100..100
  const [resonance, setResonance] = useState<number>(1); // 1..15
  const [crunch, setCrunch] = useState<number>(0); // 0..100
  const [echoMix, setEchoMix] = useState<number>(0); // 0..80
  const [volume, setVolume] = useState<number>(100); // 0..120
  const [loopOn, setLoopOn] = useState<boolean>(true);
  const [trimStartPct, setTrimStartPct] = useState<number>(0); // 0..85
  const [trimEndPct, setTrimEndPct] = useState<number>(100); // 15..100
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playheadPct, setPlayheadPct] = useState<number>(0);
  const [isSeparating, setIsSeparating] = useState<boolean>(false);
  const [sepProgress, setSepProgress] = useState<{ pct: number; stage: string } | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [liveSliceBuffer, setLiveSliceBuffer] = useState<AudioBuffer>(rawSliceBuffer);
  const [liveIsRealAudio, setLiveIsRealAudio] = useState<boolean>(isRealAudio);
  const [isRecordingPad, setIsRecordingPad] = useState<boolean>(false);
  const [isReversed, setIsReversed] = useState<boolean>(false);
  const [isTapeStopping, setIsTapeStopping] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const shaperNodeRef = useRef<WaveShaperNode | null>(null);
  const echoGainRef = useRef<GainNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const ytTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const togglePlayRef = useRef<(() => void) | null>(null);

  useModalIsolation(isOpen, modalContainerRef, {
    onEscape: onClose,
    onSpace: () => togglePlayRef.current?.(),
  });

  useEffect(() => {
    setLiveSliceBuffer(rawSliceBuffer);
    setLiveIsRealAudio(isRealAudio);
    setIsReversed(false);
  }, [rawSliceBuffer, isRealAudio]);

  const handleToggleReversePad = () => {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    try {
      const reversed = ctx.createBuffer(
        liveSliceBuffer.numberOfChannels,
        liveSliceBuffer.length,
        liveSliceBuffer.sampleRate
      );
      for (let ch = 0; ch < liveSliceBuffer.numberOfChannels; ch++) {
        const srcData = liveSliceBuffer.getChannelData(ch);
        const dstData = reversed.getChannelData(ch);
        for (let i = 0, len = srcData.length; i < len; i++) {
          dstData[i] = srcData[len - 1 - i];
        }
      }
      const wasPlaying = isPlaying;
      stopPlayback();
      setLiveSliceBuffer(reversed);
      setIsReversed((p) => !p);
      if (liveIsRealAudio) {
        onCapturedPadAudio?.(reversed);
      }
      if (wasPlaying) {
        setTimeout(() => togglePlayRef.current?.(), 30);
      }
    } finally {
      ctx.close().catch(() => {});
    }
  };

  const handleTapeStopStart = () => {
    setIsTapeStopping(true);
    const ctx = audioCtxRef.current;
    const src = sourceRef.current;
    if (ctx && src) {
      src.playbackRate.cancelScheduledValues(ctx.currentTime);
      src.playbackRate.setTargetAtTime(0.06, ctx.currentTime, 0.14);
    }
  };

  const handleTapeStopEnd = () => {
    setIsTapeStopping(false);
    const ctx = audioCtxRef.current;
    const src = sourceRef.current;
    if (ctx && src) {
      src.playbackRate.cancelScheduledValues(ctx.currentTime);
      src.playbackRate.setTargetAtTime(Math.pow(2, pitchSemi / 12), ctx.currentTime, 0.08);
    }
  };

  const peaks = useMemo(() => extractStemPeaks(liveSliceBuffer, 96), [liveSliceBuffer]);

  const stopPlayback = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (ytTimerRef.current !== null) {
      window.clearTimeout(ytTimerRef.current);
      ytTimerRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }
    onStopYoutubeSlice?.();
    setIsPlaying(false);
    setPlayheadPct(0);
  }, [onStopYoutubeSlice]);

  useEffect(() => {
    if (!isOpen) stopPlayback();
    return () => stopPlayback();
  }, [isOpen, stopPlayback]);

  // Actualizar parámetros DSP en tiempo real mientras suena
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (sourceRef.current) {
      sourceRef.current.playbackRate.setTargetAtTime(Math.pow(2, pitchSemi / 12), ctx.currentTime, 0.015);
    }
    if (filterNodeRef.current) {
      filterNodeRef.current.Q.setTargetAtTime(resonance, ctx.currentTime, 0.02);
      if (filterSweep < -2) {
        filterNodeRef.current.type = "lowpass";
        const freq = 22000 * Math.pow(250 / 22000, Math.abs(filterSweep) / 100);
        filterNodeRef.current.frequency.setTargetAtTime(freq, ctx.currentTime, 0.02);
      } else if (filterSweep > 2) {
        filterNodeRef.current.type = "highpass";
        const freq = 40 * Math.pow(4500 / 40, filterSweep / 100);
        filterNodeRef.current.frequency.setTargetAtTime(freq, ctx.currentTime, 0.02);
      } else {
        filterNodeRef.current.type = "lowpass";
        filterNodeRef.current.frequency.setTargetAtTime(22000, ctx.currentTime, 0.02);
      }
    }
    if (shaperNodeRef.current) {
      shaperNodeRef.current.curve = makeCrunchCurve(crunch);
    }
    if (echoGainRef.current) {
      echoGainRef.current.gain.setTargetAtTime(echoMix / 100, ctx.currentTime, 0.02);
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume / 100, ctx.currentTime, 0.015);
    }
  }, [pitchSemi, filterSweep, resonance, crunch, echoMix, volume]);

  const getTrimmedTimes = useCallback(() => {
    const dur = liveSliceBuffer.duration;
    const startSec = (trimStartPct / 100) * dur;
    const endSec = Math.max(startSec + 0.1, (trimEndPct / 100) * dur);
    return { startSec, endSec, trimmedDur: endSec - startSec };
  }, [liveSliceBuffer.duration, trimStartPct, trimEndPct]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    // Si no hay AudioBuffer real descargado pero sí pista de YouTube, reproducir el tramo real en el reproductor de YouTube
    if (!liveIsRealAudio && hasYoutubeFallback && onPlayYoutubeSlice) {
      const fullSpan = Math.max(0.2, sliceEndSec - sliceStartSec);
      const realStart = sliceStartSec + (trimStartPct / 100) * fullSpan;
      const realEnd = Math.max(realStart + 0.15, sliceStartSec + (trimEndPct / 100) * fullSpan);
      const rate = Math.pow(2, pitchSemi / 12);
      const realPlayMs = Math.max(150, ((realEnd - realStart) / rate) * 1000);

      const triggerYtPass = () => {
        onPlayYoutubeSlice(realStart, realEnd, pitchSemi);
        const passStart = performance.now();
        const animateYt = () => {
          const elapsedMs = performance.now() - passStart;
          const frac = Math.min(1, elapsedMs / realPlayMs);
          setPlayheadPct(trimStartPct + frac * (trimEndPct - trimStartPct));
          if (frac < 1) {
            rafRef.current = requestAnimationFrame(animateYt);
          }
        };
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(animateYt);

        ytTimerRef.current = window.setTimeout(() => {
          if (loopOn) {
            triggerYtPass();
          } else {
            stopPlayback();
          }
        }, realPlayMs);
      };

      setIsPlaying(true);
      triggerYtPass();
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioCtx();
      streamDestRef.current = audioCtxRef.current.createMediaStreamDestination();
    }
    const ctx = audioCtxRef.current;
    if (!streamDestRef.current) {
      streamDestRef.current = ctx.createMediaStreamDestination();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const { startSec, endSec, trimmedDur } = getTrimmedTimes();
    const src = ctx.createBufferSource();
    src.buffer = liveSliceBuffer;
    src.playbackRate.value = Math.pow(2, pitchSemi / 12);
    src.loop = loopOn;
    src.loopStart = startSec;
    src.loopEnd = endSec;

    const filter = ctx.createBiquadFilter();
    filter.Q.value = resonance;
    if (filterSweep < -2) {
      filter.type = "lowpass";
      filter.frequency.value = 22000 * Math.pow(250 / 22000, Math.abs(filterSweep) / 100);
    } else if (filterSweep > 2) {
      filter.type = "highpass";
      filter.frequency.value = 40 * Math.pow(4500 / 40, filterSweep / 100);
    } else {
      filter.type = "lowpass";
      filter.frequency.value = 22000;
    }

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeCrunchCurve(crunch);
    shaper.oversample = "2x";

    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = Math.max(0.12, Math.min(0.45, 60 / Math.max(60, bpm) / 2));
    const fb = ctx.createGain();
    fb.gain.value = 0.36;
    const echoGain = ctx.createGain();
    echoGain.gain.value = echoMix / 100;

    const gain = ctx.createGain();
    gain.gain.value = volume / 100;

    src.connect(filter);
    filter.connect(shaper);
    shaper.connect(gain);
    shaper.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(echoGain);
    echoGain.connect(gain);

    gain.connect(ctx.destination);
    gain.connect(streamDestRef.current);

    sourceRef.current = src;
    filterNodeRef.current = filter;
    shaperNodeRef.current = shaper;
    echoGainRef.current = echoGain;
    gainNodeRef.current = gain;

    if (loopOn) {
      src.start(0, startSec);
    } else {
      src.start(0, startSec, trimmedDur);
      src.onended = () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        setIsPlaying(false);
        setPlayheadPct(0);
      };
    }

    const startedAt = ctx.currentTime;
    const updatePlayhead = () => {
      if (!sourceRef.current) return;
      const rate = Math.pow(2, pitchSemi / 12);
      const elapsed = (ctx.currentTime - startedAt) * rate;
      const posInTrim = loopOn ? elapsed % Math.max(0.05, trimmedDur) : Math.min(trimmedDur, elapsed);
      const posInBuf = startSec + posInTrim;
      setPlayheadPct(Math.min(100, Math.max(0, (posInBuf / liveSliceBuffer.duration) * 100)));
      rafRef.current = requestAnimationFrame(updatePlayhead);
    };
    rafRef.current = requestAnimationFrame(updatePlayhead);
    setIsPlaying(true);
  };

  togglePlayRef.current = handleTogglePlay;

  // Renderiza el corte con Trim + Pitch + Filter + Crunch + Volume en un AudioBuffer limpio
  const renderProcessedCutBuffer = async (): Promise<AudioBuffer> => {
    const { startSec, trimmedDur } = getTrimmedTimes();
    const rate = Math.pow(2, pitchSemi / 12);
    const outDur = Math.max(0.15, trimmedDur / rate);
    const sr = liveSliceBuffer.sampleRate;
    const offline = new OfflineAudioContext(
      liveSliceBuffer.numberOfChannels,
      Math.ceil(outDur * sr),
      sr
    );
    const src = offline.createBufferSource();
    src.buffer = liveSliceBuffer;
    src.playbackRate.value = rate;

    const filter = offline.createBiquadFilter();
    filter.Q.value = resonance;
    if (filterSweep < -2) {
      filter.type = "lowpass";
      filter.frequency.value = 22000 * Math.pow(250 / 22000, Math.abs(filterSweep) / 100);
    } else if (filterSweep > 2) {
      filter.type = "highpass";
      filter.frequency.value = 40 * Math.pow(4500 / 40, filterSweep / 100);
    } else {
      filter.type = "lowpass";
      filter.frequency.value = 22000;
    }

    const shaper = offline.createWaveShaper();
    shaper.curve = makeCrunchCurve(crunch);
    shaper.oversample = "2x";

    const delay = offline.createDelay(1.0);
    delay.delayTime.value = Math.max(0.12, Math.min(0.45, 60 / Math.max(60, bpm) / 2));
    const fb = offline.createGain();
    fb.gain.value = 0.36;
    const echoGain = offline.createGain();
    echoGain.gain.value = echoMix / 100;

    const gain = offline.createGain();
    const targetGain = volume / 100;
    const fadeSec = Math.min(0.015, outDur * 0.15);
    gain.gain.setValueAtTime(0.0001, 0);
    gain.gain.linearRampToValueAtTime(targetGain, fadeSec);
    gain.gain.setValueAtTime(targetGain, Math.max(fadeSec, outDur - fadeSec));
    gain.gain.linearRampToValueAtTime(0.0001, outDur);

    src.connect(filter);
    filter.connect(shaper);
    shaper.connect(gain);
    shaper.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(echoGain);
    echoGain.connect(gain);
    gain.connect(offline.destination);

    src.start(0, startSec, trimmedDur);
    return await offline.startRendering();
  };

  const handleToggleRecordPad = async () => {
    if (isRecordingPad) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      stopPlayback();
      return;
    }

    setErrorNotice(null);
    if (!isPlaying) {
      handleTogglePlay();
    }

    const dest = streamDestRef.current;
    if (!dest) {
      setErrorNotice("Reproduce el pad en RAM para grabar su salida con filtros en vivo.");
      return;
    }

    try {
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(dest.stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = async () => {
        setIsRecordingPad(false);
        try {
          const blob = new Blob(chunks, { type: mimeType });
          const decoded = await decodeMediaBlobToAudioBuffer(blob);
          setLiveSliceBuffer(decoded);
          setLiveIsRealAudio(true);
          setTrimStartPct(0);
          setTrimEndPct(100);
          onCapturedPadAudio?.(decoded);
        } catch {
          setErrorNotice("No se pudo procesar la toma grabada del pad.");
        }
      };

      mediaRecorderRef.current = recorder;
      setIsRecordingPad(true);
      recorder.start(80);
    } catch {
      setIsRecordingPad(false);
      setErrorNotice("No se pudo iniciar la grabación interna del pad.");
    }
  };

  const handleDownloadCutWav = async () => {
    if (!liveIsRealAudio) {
      setErrorNotice("No hay audio real en RAM para exportar WAV. Graba el pad desde YouTube o usa CARGAR AUDIO.");
      return;
    }
    setErrorNotice(null);
    const rendered = await renderProcessedCutBuffer();
    const blob = encodeAudioBufferToWavBlob(rendered);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${padLabel.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()}_corte.wav`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleSeparateCutInstruments = async () => {
    if (!liveIsRealAudio) {
      setErrorNotice("Esta pista está solo en streaming YouTube. Presiona GRABAR DEL VIDEO o CARGAR AUDIO para separar los instrumentos reales de este pad.");
      return;
    }
    setErrorNotice(null);
    stopPlayback();
    setIsSeparating(true);
    setSepProgress({ pct: 10, stage: "Procesando corte, pitch y efectos..." });
    try {
      const processedCut = await renderProcessedCutBuffer();
      setSepProgress({ pct: 45, stage: "Separando instrumentos del pad..." });
      const dspBase = await separateAudioIntoStems(processedCut, bpm, musicalKey, genre);
      const browserAi = await separateAudioInBrowserWorker(processedCut, {
        windowStartSec: 0,
        windowDurationSec: processedCut.duration,
        baseStems: dspBase,
        cachedOnly: true,
        timeoutMs: 8000,
        onProgress: (pct, stage) => setSepProgress({ pct, stage }),
      });
      const finalStems = browserAi ? browserAi.stems : dspBase;
      onSeparatedToMaster({
        raw: processedCut,
        drums: finalStems.drums,
        bass: finalStems.bass,
        melody: finalStems.melody,
        vocals: finalStems.vocals,
      });
    } finally {
      setIsSeparating(false);
      setSepProgress(null);
    }
  };

  if (!isOpen) return null;

  const { trimmedDur } = getTrimmedTimes();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10040,
        backgroundColor: "rgba(5, 6, 9, 0.88)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        ref={modalContainerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: "960px",
          backgroundColor: "#111215",
          border: "2px solid #FFD600",
          outline: "4px solid #090A0D",
          borderRadius: "10px",
          boxShadow: "0 28px 80px rgba(0,0,0,0.95)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "9px 14px",
            backgroundColor: "#141519",
            borderBottom: "1px solid rgba(255,214,0,0.45)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
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
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Scissors size={11} />
              <span>CORTAR PAD</span>
            </span>
            <span style={{ fontSize: "0.70rem", fontWeight: 900, color: "#FFFFFF", fontFamily: "monospace" }}>
              {padLabel}
            </span>
            <span style={{ fontSize: "0.60rem", color: "#A1A1AA", fontFamily: "monospace" }}>
              {rangeLabel} · Recorte: {(trimmedDur / Math.pow(2, pitchSemi / 12)).toFixed(2)}s
            </span>
            <span
              style={{
                fontSize: "0.52rem",
                fontWeight: 900,
                fontFamily: "monospace",
                padding: "2px 6px",
                borderRadius: "3px",
                backgroundColor: liveIsRealAudio ? "#162A1B" : hasYoutubeFallback ? "#231E0C" : "#2A1F14",
                color: liveIsRealAudio ? "#4ADE80" : "#FFD600",
                border: liveIsRealAudio ? "1px solid #22C55E" : "1px solid #FFD600",
              }}
            >
              {liveIsRealAudio
                ? "AUDIO REAL DEL CORTE"
                : hasYoutubeFallback
                ? "CANCIÓN REAL (YOUTUBE)"
                : "AUDIO SINTÉTICO"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "4px 7px",
              backgroundColor: "#262830",
              border: "1px solid #3A3D48",
              borderRadius: "3px",
              color: "#E4E4E7",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            title="Cerrar editor de corte"
          >
            <X size={14} />
          </button>
        </div>

        {errorNotice && (
          <div
            style={{
              padding: "8px 14px",
              backgroundColor: "rgba(255, 214, 0, 0.08)",
              borderBottom: "1px solid rgba(255, 214, 0, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "0.62rem", color: "#FDE047", fontFamily: "monospace", fontWeight: 700, flex: 1 }}>
              {errorNotice}
            </span>
            {onRequestLoadAudio && (
              <button
                type="button"
                onClick={onRequestLoadAudio}
                style={{
                  padding: "4px 10px",
                  backgroundColor: "#FFD600",
                  color: "#090A0D",
                  border: "none",
                  borderRadius: "3px",
                  fontSize: "0.60rem",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                CARGAR AUDIO
              </button>
            )}
          </div>
        )}

        {/* Cuerpo 3 Columnas: Costado Izq (PITCH) | Centro (ONDA + SEPARAR) | Costado Der (EFECTOS) */}
        <div
          style={{
            padding: "12px 14px",
            display: "grid",
            gridTemplateColumns: "185px 1fr 235px",
            gap: "12px",
            alignItems: "stretch",
          }}
        >
          {/* COSTADO IZQUIERDO: PERILLA PITCH */}
          <div
            style={{
              backgroundColor: "#0A0B0E",
              border: "1px solid rgba(255,214,0,0.4)",
              borderRadius: "6px",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ borderBottom: "1px solid rgba(255,214,0,0.3)", paddingBottom: "4px", textAlign: "center" }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "1.4px" }}>
                PITCH / TONO
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div
                onPointerDown={(e) => {
                  e.preventDefault();
                  const startY = e.clientY;
                  const startVal = pitchSemi;
                  const onMove = (ev: PointerEvent) => {
                    const delta = Math.round(((startY - ev.clientY) / 100) * 24);
                    setPitchSemi(Math.max(-12, Math.min(12, startVal + delta)));
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
                  setPitchSemi((p) => Math.max(-12, Math.min(12, p + (e.deltaY < 0 ? 1 : -1))));
                }}
                onDoubleClick={() => setPitchSemi(0)}
                title="Arrastra arriba/abajo o usa la rueda del mouse (-12 a +12 st). Doble clic para 0 st."
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 50% 45%, #2B2D33 0%, #191A1E 75%, #0D0E10 100%)",
                  border: "2px dashed #FFD600",
                  boxShadow: "0 0 14px rgba(255, 214, 0, 0.55), inset 0 0 8px rgba(255, 214, 0, 0.2), 0 3px 6px rgba(0,0,0,0.85)",
                  position: "relative",
                  cursor: "ns-resize",
                  transform: `rotate(${(pitchSemi / 12) * 135}deg)`,
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "6px",
                    left: "50%",
                    transform: "translateX(-50%) rotate(45deg)",
                    width: "6px",
                    height: "6px",
                    backgroundColor: "#FFD600",
                    borderRadius: "1px",
                  }}
                />
              </div>
              <span style={{ fontSize: "1.15rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", textShadow: "0 0 10px rgba(255,214,0,0.5)" }}>
                {pitchSemi > 0 ? `+${pitchSemi}` : pitchSemi} st
              </span>
              <span style={{ fontSize: "0.50rem", color: "#A1A1AA", fontFamily: "monospace", textAlign: "center" }}>
                Arrastra arriba/abajo · 2x clic = 0
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                <button
                  type="button"
                  onClick={handleToggleReversePad}
                  style={{
                    padding: "5px 4px",
                    backgroundColor: isReversed ? "#FFD600" : "#E4E4E7",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "4px",
                    boxShadow: "0 2px 0 #07080A",
                    fontSize: "0.56rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                  title="Invierte el audio del pad (Reverse)"
                >
                  ◀ {isReversed ? "REV ON" : "REVERSA"}
                </button>
                <button
                  type="button"
                  onPointerDown={handleTapeStopStart}
                  onPointerUp={handleTapeStopEnd}
                  onPointerLeave={handleTapeStopEnd}
                  style={{
                    padding: "5px 4px",
                    backgroundColor: isTapeStopping ? "#FFD600" : "#E4E4E7",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "4px",
                    boxShadow: "0 2px 0 #07080A",
                    fontSize: "0.56rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  title="Mantén presionado mientras suena o grabas para frenar la cinta estilo vinilo (Tape Stop)"
                >
                  🛑 TAPE STOP
                </button>
              </div>

              <button
                type="button"
                onClick={() => setLoopOn((p) => !p)}
                style={{
                  padding: "5px 8px",
                  backgroundColor: loopOn ? "#FFD600" : "#E4E4E7",
                  color: "#090A0D",
                  border: "1px solid #090A0D",
                  borderRadius: "4px",
                  boxShadow: "0 2px 0 #07080A",
                  fontSize: "0.60rem",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                LOOP CORTE: {loopOn ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* CENTRO: ONDA CORTADA + TRIM + REPRODUCIR + SEPARAR INSTRUMENTOS */}
          <div
            style={{
              backgroundColor: "#0A0B0E",
              border: "1px solid rgba(255,214,0,0.4)",
              borderRadius: "6px",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            {/* Visualizador de Onda del Pad */}
            <div
              style={{
                position: "relative",
                height: "92px",
                backgroundColor: "#06070A",
                border: "1px solid #22242C",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "2px",
                padding: "8px 6px",
                overflow: "hidden",
              }}
            >
              {peaks.map((pk, idx) => {
                const pct = (idx / peaks.length) * 100;
                const inside = pct >= trimStartPct && pct <= trimEndPct;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: `${Math.max(10, Math.min(100, pk * 100))}%`,
                      backgroundColor: inside ? "#FFD600" : "#3F3F46",
                      opacity: inside ? 0.95 : 0.4,
                      borderRadius: "1px",
                    }}
                  />
                );
              })}
              {isPlaying && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${playheadPct}%`,
                    width: "2px",
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 0 8px #FFFFFF",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>

            {/* Recorte fino Start / End con tiempos reales de la canción */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.56rem", color: "#D4D4D8", fontFamily: "monospace" }}>
                <span>
                  INICIO: {formatSec(sliceStartSec + (trimStartPct / 100) * Math.max(0.1, sliceEndSec - sliceStartSec))}
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, trimEndPct - 10)}
                  value={trimStartPct}
                  onChange={(e) => setTrimStartPct(Number(e.target.value))}
                  style={{ accentColor: "#FFD600" }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.56rem", color: "#D4D4D8", fontFamily: "monospace" }}>
                <span>
                  FIN: {formatSec(sliceStartSec + (trimEndPct / 100) * Math.max(0.1, sliceEndSec - sliceStartSec))}
                </span>
                <input
                  type="range"
                  min={Math.min(100, trimStartPct + 10)}
                  max={100}
                  value={trimEndPct}
                  onChange={(e) => setTrimEndPct(Number(e.target.value))}
                  style={{ accentColor: "#FFD600" }}
                />
              </label>
            </div>

            {/* Botones de Acción */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 12px",
                    backgroundColor: isPlaying ? "#D4D4D8" : "#FFD600",
                    color: "#090A0D",
                    border: isPlaying ? "1px solid #FFFFFF" : "1px solid #FFE866",
                    borderRadius: "4px",
                    boxShadow: "0 0 14px rgba(255,214,0,0.7)",
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                >
                  {isPlaying ? <Square size={11} fill="#090A0D" /> : <Play size={11} fill="#090A0D" />}
                  <span>{isPlaying ? "DETENER" : "ESCUCHAR"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleRecordPad}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 10px",
                    backgroundColor: isRecordingPad ? "#FFD600" : "#E4E4E7",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "4px",
                    boxShadow: isRecordingPad ? "0 0 14px rgba(255,214,0,0.85)" : "0 2px 0 #07080A",
                    fontSize: "0.60rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                  title="Graba en vivo el audio del pad mientras mueves las perillas de Pitch y Efectos (Resample)"
                >
                  <Mic size={11} />
                  <span>{isRecordingPad ? "■ PARAR PAD" : "● GRABAR PAD"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCutWav}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 10px",
                    backgroundColor: "#E4E4E7",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "4px",
                    boxShadow: "0 2px 0 #07080A",
                    fontSize: "0.60rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                >
                  <Download size={11} />
                  <span>WAV</span>
                </button>

                {onApplyRealCut && (
                  <button
                    type="button"
                    onClick={async () => {
                      stopPlayback();
                      const fullSpan = Math.max(0.2, sliceEndSec - sliceStartSec);
                      const newStartSec =
                        Math.round((sliceStartSec + (trimStartPct / 100) * fullSpan) * 10) / 10;
                      const newEndSec =
                        Math.round((sliceStartSec + (trimEndPct / 100) * fullSpan) * 10) / 10;
                      const processedBuffer = liveIsRealAudio ? await renderProcessedCutBuffer() : null;
                      onApplyRealCut({ newStartSec, newEndSec, processedBuffer });
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 10px",
                      backgroundColor: "#E4E4E7",
                      color: "#090A0D",
                      border: "1px solid #090A0D",
                      borderRadius: "4px",
                      boxShadow: "0 2px 0 #07080A",
                      fontSize: "0.60rem",
                      fontWeight: 900,
                      fontFamily: "monospace",
                      cursor: "pointer",
                    }}
                    title="Guarda este recorte con su pitch y efectos directamente en el pad del C-Sampler"
                  >
                    <Scissors size={11} />
                    <span>CORTE REAL</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                disabled={isSeparating}
                onClick={handleSeparateCutInstruments}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  background: "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)",
                  color: "#090A0D",
                  border: "1px solid #FFE866",
                  borderRadius: "4px",
                  boxShadow: "0 0 16px rgba(255,214,0,0.8), 0 3px 0 #07080A",
                  fontSize: "0.64rem",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  cursor: isSeparating ? "wait" : "pointer",
                }}
              >
                {isSeparating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span>
                  {isSeparating
                    ? `SEPARANDO ${sepProgress?.pct ?? 0}%`
                    : "SEPARAR INSTRUMENTOS"}
                </span>
              </button>
            </div>

            {sepProgress && (
              <div style={{ fontSize: "0.56rem", color: "#FFD600", fontFamily: "monospace", textAlign: "center" }}>
                {sepProgress.stage}
              </div>
            )}
          </div>

          {/* COSTADO DERECHO: PERILLAS DE EFECTOS + FILTROS ESPECIALES */}
          <div
            style={{
              backgroundColor: "#0A0B0E",
              border: "1px solid rgba(255,214,0,0.4)",
              borderRadius: "6px",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <div style={{ borderBottom: "1px solid rgba(255,214,0,0.3)", paddingBottom: "4px", textAlign: "center" }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "1.4px" }}>
                EFECTOS DEL CORTE
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {(
                [
                  {
                    label: "FILTER",
                    valText: filterSweep === 0 ? "FLAT" : filterSweep < 0 ? `LP ${filterSweep}` : `HP +${filterSweep}`,
                    deg: (filterSweep / 100) * 135,
                    min: -100,
                    max: 100,
                    step: 2,
                    value: filterSweep,
                    onReset: () => setFilterSweep(0),
                    onChange: (v: number) => setFilterSweep(v),
                    title: "Filtro DJ Sweep (-100 LowPass a +100 HighPass). Arrastra arriba/abajo.",
                  },
                  {
                    label: "RESO (Q)",
                    valText: `Q ${resonance}`,
                    deg: ((resonance - 1) / 14) * 270 - 135,
                    min: 1,
                    max: 15,
                    step: 1,
                    value: resonance,
                    onReset: () => setResonance(1),
                    onChange: (v: number) => setResonance(v),
                    title: "Resonancia del filtro (1 a 15) para barridos tipo SP-404 / Acid.",
                  },
                  {
                    label: "CRUNCH",
                    valText: `${crunch}%`,
                    deg: (crunch / 100) * 270 - 135,
                    min: 0,
                    max: 100,
                    step: 2,
                    value: crunch,
                    onReset: () => setCrunch(0),
                    onChange: (v: number) => setCrunch(v),
                    title: "Saturación 12-Bit / Vinyl Drive (0% a 100%).",
                  },
                  {
                    label: "DUB ECHO",
                    valText: `${echoMix}%`,
                    deg: (echoMix / 80) * 270 - 135,
                    min: 0,
                    max: 80,
                    step: 2,
                    value: echoMix,
                    onReset: () => setEchoMix(0),
                    onChange: (v: number) => setEchoMix(v),
                    title: "Eco espacial sincronizado al BPM (0% a 80%).",
                  },
                ] as const
              ).map((knob) => (
                <div key={knob.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <span style={{ fontSize: "0.48rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace" }}>
                    {knob.label}
                  </span>
                  <div
                    onPointerDown={(e) => {
                      e.preventDefault();
                      const startY = e.clientY;
                      const startVal = knob.value;
                      const range = knob.max - knob.min;
                      const onMove = (ev: PointerEvent) => {
                        const raw = startVal + ((startY - ev.clientY) / 90) * range;
                        const snapped = Math.round(raw / knob.step) * knob.step;
                        knob.onChange(Math.max(knob.min, Math.min(knob.max, snapped)));
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
                      knob.onChange(Math.max(knob.min, Math.min(knob.max, knob.value + dir * knob.step)));
                    }}
                    onDoubleClick={knob.onReset}
                    title={knob.title}
                    style={{
                      width: "32px",
                      height: "32px",
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              <button
                type="button"
                onClick={() => {
                  setFilterSweep(0);
                  setResonance(1);
                  setCrunch(0);
                  setEchoMix(0);
                  setVolume(100);
                }}
                style={{
                  padding: "3px 4px",
                  backgroundColor: "#E4E4E7",
                  color: "#090A0D",
                  border: "1px solid #090A0D",
                  borderRadius: "3px",
                  fontSize: "0.52rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                FLAT
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterSweep(-45);
                  setResonance(3);
                  setCrunch(55);
                  setEchoMix(0);
                  setVolume(105);
                }}
                style={{
                  padding: "3px 4px",
                  backgroundColor: "#E4E4E7",
                  color: "#090A0D",
                  border: "1px solid #090A0D",
                  borderRadius: "3px",
                  fontSize: "0.52rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                LO-FI 12B
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterSweep(55);
                  setResonance(6);
                  setCrunch(35);
                  setEchoMix(0);
                  setVolume(105);
                }}
                style={{
                  padding: "3px 4px",
                  backgroundColor: "#E4E4E7",
                  color: "#090A0D",
                  border: "1px solid #090A0D",
                  borderRadius: "3px",
                  fontSize: "0.52rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                RADIO TEL
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterSweep(-30);
                  setResonance(4);
                  setCrunch(15);
                  setEchoMix(45);
                  setVolume(100);
                }}
                style={{
                  padding: "3px 4px",
                  backgroundColor: "#E4E4E7",
                  color: "#090A0D",
                  border: "1px solid #090A0D",
                  borderRadius: "3px",
                  fontSize: "0.52rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                DUB ECHO
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
