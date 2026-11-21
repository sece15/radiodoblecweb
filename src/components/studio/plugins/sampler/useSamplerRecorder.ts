"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BeatBreakdownSamplePayload,
  DiggerTrack,
  SamplerCuePoint,
  StemsSeparationResult,
} from "@/types/studio";
import { studioAudio } from "@/lib/studio/audioEngine";
import { separateAudioIntoStems } from "@/lib/studio/stemEngine";
import { separateAudioInBrowserWorker } from "@/lib/studio/browserStemAI";
import { formatSeconds } from "@/lib/studio/samplerConstants";
import { renderRecordedPadsToBuffer, type RecordedPadEvent } from "@/lib/studio/samplerRender";

export interface MasterModalChannels {
  raw: AudioBuffer | null;
  drums: AudioBuffer | null;
  bass: AudioBuffer | null;
  melody: AudioBuffer | null;
  vocals: AudioBuffer | null;
}

export interface MasterModalPayload {
  padLabel: string;
  rangeLabel: string;
  initialBpm: number;
  channels: MasterModalChannels;
}

interface UseSamplerRecorderParams {
  activeTrack: Partial<DiggerTrack> | null;
  sampleName: string;
  cues: SamplerCuePoint[];
  customAudioBuffer: AudioBuffer | null;
  padCustomBuffersRef: React.RefObject<Record<number, AudioBuffer>>;
  stemsResult: StemsSeparationResult | null;
  totalDuration: number;
  pitchSemi: number;
  fineTuneCents: number;
  startOffsetMs: number;
  fxFilterSweep: number;
  fxMasterVol: number;
  onTriggerCue: (cue: SamplerCuePoint) => void;
  onStopAudio: () => void;
  onRescueAudio: () => Promise<AudioBuffer | null>;
  onSendToSequencer?: (payload: BeatBreakdownSamplePayload) => void;
  onOpenMasterModal: (data: MasterModalPayload) => void;
}

export function useSamplerRecorder({
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
  onTriggerCue,
  onStopAudio,
  onRescueAudio,
  onSendToSequencer,
  onOpenMasterModal,
}: UseSamplerRecorderParams) {
  const [isRecordingPads, setIsRecordingPads] = useState<boolean>(false);
  const [metronomeOn, setMetronomeOn] = useState<boolean>(false);
  const [quantizeOn, setQuantizeOn] = useState<boolean>(true);
  const [recordedPadEvents, setRecordedPadEvents] = useState<RecordedPadEvent[]>([]);
  const [recordBars, setRecordBars] = useState<1 | 2 | 4>(4);
  const [isPlayingRecording, setIsPlayingRecording] = useState<boolean>(false);
  const [isRenderingRecording, setIsRenderingRecording] = useState<boolean>(false);
  const [recordNotice, setRecordNotice] = useState<string | null>(null);

  const isRecordingPadsRef = useRef<boolean>(false);
  const quantizeOnRef = useRef<boolean>(true);
  const recordingStartPerfRef = useRef<number>(0);
  const recordingTimersRef = useRef<number[]>([]);
  const recordAutoStopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    isRecordingPadsRef.current = isRecordingPads;
    quantizeOnRef.current = quantizeOn;
  }, [isRecordingPads, quantizeOn]);

  const stopRecordedMelodyPlayback = useCallback(() => {
    for (const id of recordingTimersRef.current) {
      window.clearTimeout(id);
    }
    recordingTimersRef.current = [];
    setIsPlayingRecording(false);
    onStopAudio();
  }, [onStopAudio]);

  // Metrónomo en vivo mientras se graba una secuencia de pads
  useEffect(() => {
    if (!isRecordingPads || !metronomeOn) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const curBpm = activeTrack?.bpm || 95;
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
  }, [isRecordingPads, metronomeOn, activeTrack?.bpm]);

  const recordPadHit = useCallback(
    (cueId: number) => {
      if (!isRecordingPadsRef.current) return;
      const rawSec = Math.max(0, (performance.now() - recordingStartPerfRef.current) / 1000);
      const curBpm = activeTrack?.bpm || 95;
      const step16 = 60 / curBpm / 4;
      const timeSec = quantizeOnRef.current ? Math.round(rawSec / step16) * step16 : rawSec;
      setRecordedPadEvents((prev) => [...prev, { cueId, timeSec }]);
    },
    [activeTrack?.bpm]
  );

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
      setRecordNotice(null);
      recordingStartPerfRef.current = performance.now();
      setIsRecordingPads(true);
      const activeBpm = activeTrack?.bpm || 90;
      const targetMs = Math.round((60 / activeBpm) * 4 * recordBars * 1000);
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
        if (cue) onTriggerCue(cue);
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
    setRecordNotice(null);
    setIsRenderingRecording(true);
    try {
      let baseBuffer = customAudioBuffer;
      const hasAnyCustomPad = Object.keys(padCustomBuffersRef.current).length > 0;
      if (!baseBuffer && !hasAnyCustomPad) {
        baseBuffer = await onRescueAudio();
      }
      if (!baseBuffer && !hasAnyCustomPad) {
        setRecordNotice(
          "No hay audio en memoria todavía. Carga un audio local o recorta un pad en CORTAR PAD antes de enviar."
        );
        return;
      }

      const bpm = activeTrack?.bpm || 87;
      const key = activeTrack?.key || "Am";
      const genre = activeTrack?.genre || "boombap";

      const rendered = await renderRecordedPadsToBuffer({
        events: recordedPadEvents,
        cues,
        baseBuffer,
        padCustomBuffers: padCustomBuffersRef.current,
        totalDuration,
        bpm,
        recordBars,
        pitchSemi,
        fineTuneCents,
        startOffsetMs,
        fxFilterSweep,
        fxMasterVol,
      });

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

      onOpenMasterModal({
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

  const resetRecorder = useCallback(() => {
    if (recordAutoStopTimerRef.current !== null) {
      window.clearTimeout(recordAutoStopTimerRef.current);
      recordAutoStopTimerRef.current = null;
    }
    setIsRecordingPads(false);
    setRecordedPadEvents([]);
    setRecordNotice(null);
    setIsPlayingRecording(false);
  }, []);

  return {
    isRecordingPads,
    metronomeOn,
    setMetronomeOn,
    quantizeOn,
    setQuantizeOn,
    recordedPadEvents,
    recordBars,
    setRecordBars,
    isPlayingRecording,
    isRenderingRecording,
    recordNotice,
    setRecordNotice,
    recordPadHit,
    handleToggleRecordPads,
    handlePlayRecordedMelody,
    handleSendRecordedMelodyToMaster,
    resetRecorder,
  };
}
