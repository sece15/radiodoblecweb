import type { DrumRowKey } from "@/lib/studio/drumKitStorage";

export interface LoadedDrumSample {
  name: string;
  audioBuffer: AudioBuffer;
  rawBytes: ArrayBuffer;
}

export interface DrumAssetOption {
  name: string;
  label: string;
  url: string;
}

export type CustomDrumSampleMap = Partial<Record<DrumRowKey, LoadedDrumSample>>;

export const DRUM_ROWS: { key: DrumRowKey; label: string; badge: string }[] = [
  { key: "kick", label: "KICK (BOMBO)", badge: "BD" },
  { key: "snare", label: "SNARE (CAJA)", badge: "SD" },
  { key: "hihat", label: "HI-HAT", badge: "HH" },
  { key: "clap", label: "CLAP / PERC", badge: "CP" },
  { key: "bass808", label: "BAJO 808", badge: "808" },
];

export const BASS_NOTES: { label: string; freq: number }[] = [
  { label: "C2", freq: 65.41 },
  { label: "D2", freq: 73.42 },
  { label: "Eb2", freq: 77.78 },
  { label: "F2", freq: 87.31 },
  { label: "G2", freq: 98.0 },
  { label: "Ab2", freq: 103.83 },
  { label: "Bb2", freq: 116.54 },
];

export const PRESET_PATTERNS: Record<string, Record<DrumRowKey, boolean[]>> = {
  boombap: {
    kick:    [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
    snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat:   [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, true],
    clap:    [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
    bass808: [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
  },
  trap: {
    kick:    [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
    snare:   [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
    hihat:   [true, true, true, true, true, false, true, true, true, true, true, true, true, false, true, true],
    clap:    [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, true],
    bass808: [true, false, false, false, false, false, true, false, false, false, true, false, false, true, false, false],
  },
  house: {
    kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat:   [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
    clap:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    bass808: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
  },
  empty: {
    kick:    Array(16).fill(false),
    snare:   Array(16).fill(false),
    hihat:   Array(16).fill(false),
    clap:    Array(16).fill(false),
    bass808: Array(16).fill(false),
  },
};

export function triggerSynthSound(
  ctx: BaseAudioContext,
  dest: AudioNode,
  row: DrumRowKey,
  time: number,
  vol: number,
  bassFreq: number
) {
  if (vol <= 0.001) return;

  if (row === "kick") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.14);
    gain.gain.setValueAtTime(0.95 * vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.3);
  } else if (row === "snare") {
    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1100;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65 * vol, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.17);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);
    noise.start(time);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(190, time);
    osc.frequency.exponentialRampToValueAtTime(95, time + 0.08);
    oscGain.gain.setValueAtTime(0.45 * vol, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.12);
  } else if (row === "hihat") {
    const bufferSize = Math.floor(ctx.sampleRate * 0.06);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.32 * vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
  } else if (row === "clap") {
    const bufferSize = Math.floor(ctx.sampleRate * 0.16);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55 * vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
  } else if (row === "bass808") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(bassFreq * 1.15, time);
    osc.frequency.exponentialRampToValueAtTime(bassFreq, time + 0.04);
    gain.gain.setValueAtTime(0.85 * vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.42);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.44);
  }
}

export function triggerDrumRow(
  ctx: BaseAudioContext,
  dest: AudioNode,
  row: DrumRowKey,
  time: number,
  vol: number,
  bassFreq: number,
  customSamples: CustomDrumSampleMap
) {
  if (vol <= 0.001) return;
  const custom = customSamples[row];
  if (custom) {
    const src = ctx.createBufferSource();
    src.buffer = custom.audioBuffer;
    if (row === "bass808") {
      src.playbackRate.setValueAtTime(Math.max(0.25, Math.min(4, bassFreq / 65.41)), time);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    src.connect(g);
    g.connect(dest);
    src.start(time);
    return;
  }
  triggerSynthSound(ctx, dest, row, time, vol, bassFreq);
}
