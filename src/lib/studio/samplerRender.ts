import type { SamplerCuePoint } from "@/types/studio";
import { calculateSliceBoundary } from "@/lib/contracts/samplerContracts";
import { encodeAudioBufferToWavBlob } from "@/lib/studio/browserStemAI";

export interface RecordedPadEvent {
  cueId: number;
  timeSec: number;
}

export interface RenderRecordedPadsParams {
  events: RecordedPadEvent[];
  cues: SamplerCuePoint[];
  baseBuffer: AudioBuffer | null;
  padCustomBuffers: Record<number, AudioBuffer>;
  totalDuration: number;
  bpm: number;
  recordBars: 1 | 2 | 4;
  pitchSemi: number;
  fineTuneCents: number;
  startOffsetMs: number;
  fxFilterSweep: number;
  fxMasterVol: number;
}

export async function renderRecordedPadsToBuffer({
  events,
  cues,
  baseBuffer,
  padCustomBuffers,
  totalDuration,
  bpm,
  recordBars,
  pitchSemi,
  fineTuneCents,
  startOffsetMs,
  fxFilterSweep,
  fxMasterVol,
}: RenderRecordedPadsParams): Promise<AudioBuffer> {
  const sr = baseBuffer?.sampleRate || 44100;
  const exactBarsSec = (60 / bpm) * 4 * recordBars;
  const lastEv = events[events.length - 1];
  const totalRenderSec = Math.max(exactBarsSec, lastEv.timeSec + 0.5);
  const offline = new OfflineAudioContext(2, Math.ceil(totalRenderSec * sr), sr);

  const masterGain = offline.createGain();
  masterGain.gain.value = Math.max(0, Math.min(1.2, fxMasterVol / 100));

  let renderDest: AudioNode = masterGain;
  if (Math.abs(fxFilterSweep) > 2) {
    const filter = offline.createBiquadFilter();
    if (fxFilterSweep < 0) {
      const norm = Math.min(1, Math.abs(fxFilterSweep) / 100);
      filter.type = "lowpass";
      filter.frequency.value = 18000 * Math.pow(180 / 18000, norm);
      filter.Q.value = 1.4 + norm * 2.2;
    } else {
      const norm = Math.min(1, fxFilterSweep / 100);
      filter.type = "highpass";
      filter.frequency.value = 40 * Math.pow(5200 / 40, norm);
      filter.Q.value = 1.2 + norm * 1.8;
    }
    filter.connect(masterGain);
    renderDest = filter;
  }
  masterGain.connect(offline.destination);

  const playbackRate = Math.pow(2, (pitchSemi + fineTuneCents / 100) / 12);

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const nextEv = events[i + 1];
    const cue = cues.find((c) => c.id === ev.cueId);
    if (!cue) continue;

    const padBuf = padCustomBuffers[cue.id];
    const { startSec, naturalDurationSec } = calculateSliceBoundary(cue.id, cues, totalDuration);
    const maxPlayDur = nextEv
      ? Math.max(0.12, nextEv.timeSec - ev.timeSec)
      : Math.max(0.25, exactBarsSec - ev.timeSec);

    let hitBuf: AudioBuffer | null = null;
    if (padBuf) {
      hitBuf = padBuf;
    } else if (baseBuffer) {
      const effectiveStart = Math.max(0, Math.min(baseBuffer.duration - 0.05, startSec + startOffsetMs / 1000));
      const sliceLen = Math.min(naturalDurationSec, maxPlayDur * playbackRate);
      const hitCtx = new OfflineAudioContext(
        baseBuffer.numberOfChannels,
        Math.max(1, Math.floor(sliceLen * sr)),
        sr
      );
      const s = hitCtx.createBufferSource();
      s.buffer = baseBuffer;
      s.connect(hitCtx.destination);
      s.start(0, effectiveStart, sliceLen);
      hitBuf = await hitCtx.startRendering();
    }

    if (hitBuf) {
      const src = offline.createBufferSource();
      src.buffer = hitBuf;
      src.playbackRate.value = playbackRate;
      src.connect(renderDest);
      src.start(ev.timeSec, 0, Math.min(hitBuf.duration / playbackRate, maxPlayDur));
    }
  }

  return offline.startRendering();
}

export function downloadAudioBufferAsWav(buffer: AudioBuffer, rawTitle: string) {
  const blob = encodeAudioBufferToWavBlob(buffer);
  const url = URL.createObjectURL(blob);
  const safeName = (rawTitle || "c-studio-sample")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 60);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.wav`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
