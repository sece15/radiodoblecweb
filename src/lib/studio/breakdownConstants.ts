export type LayerId = "kick" | "snare" | "hats" | "bass" | "melody";
export type FocusStage = "full" | LayerId;

export interface LayerMeta {
  id: LayerId;
  index: number;
  label: string;
  overline: string;
  headline: string;
  subline: string;
  kind: "pads" | "waveform";
}

export const LAYERS: LayerMeta[] = [
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

export const BREAKDOWN_ORDER: FocusStage[] = ["full", "kick", "snare", "hats", "bass", "melody"];

export const INITIAL_PATTERNS: Record<"kick" | "snare" | "hats" | "bass", boolean[][]> = {
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

export const BASS_FREQS: number[] = [
  55.0, 55.0, 55.0, 55.0,
  55.0, 55.0, 65.41, 61.74,
  55.0, 55.0, 49.0, 49.0,
  49.0, 55.0, 61.74, 55.0,
];

export function resizePatterns(
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

export function generateSyntheticWaveform(steps: boolean[], bars = 88, seed = 1): number[] {
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    const stepPos = (i / bars) * 16;
    const stepIdx = Math.floor(stepPos);
    const frac = stepPos - stepIdx;

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

export function generateSampleFallbackPeaks(bars = 112): number[] {
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
