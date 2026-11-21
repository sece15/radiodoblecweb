import type { DiggerTrack, SamplerCuePoint, StemType } from "@/types/studio";

// Paleta minimalista: Amarillo, Negro y Grises
export const SERATO_COLORS = [
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

// Akai MPC 16 Levels: Parámetros por tipo (Tune, Velocity, Filter, Decay)
export const AKAI_16_LEVELS_SEMITONES = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8];
export const AKAI_16_LEVELS_VELOCITIES = [
  0.10, 0.16, 0.22, 0.28, 0.34, 0.40, 0.46, 0.52,
  0.58, 0.64, 0.70, 0.76, 0.82, 0.88, 0.94, 1.00,
];
export const AKAI_16_LEVELS_FILTERS = [
  300, 450, 650, 900, 1200, 1600, 2200, 3000,
  4000, 5200, 6800, 8500, 10500, 13000, 15500, 18000,
];
export const AKAI_16_LEVELS_DECAYS = [
  0.08, 0.15, 0.25, 0.35, 0.50, 0.70, 0.90, 1.20,
  1.50, 1.80, 2.10, 2.40, 2.70, 3.00, 3.30, 4.00,
];

// Cues iniciales estilo Serato Chops
export const DEFAULT_CUES: SamplerCuePoint[] = [
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
export const KEY_PAD_MAP: Record<string, number> = {
  q: 1, Q: 1,
  w: 2, W: 2,
  e: 3, E: 3,
  r: 4, R: 4,
  t: 5, T: 5,
  y: 6, Y: 6,
  u: 7, U: 7,
  i: 8, I: 8,
  a: 9, A: 9,
  s: 10, S: 10,
  d: 11, D: 11,
  f: 12, F: 12,
  g: 13, G: 13,
  h: 14, H: 14,
  j: 15, J: 15,
  k: 16, K: 16,
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
};

export const PAD_DISPLAY_KEYS: Record<number, string> = {
  1: "Q", 2: "W", 3: "E", 4: "R", 5: "T", 6: "Y", 7: "U", 8: "I",
  9: "A", 10: "S", 11: "D", 12: "F", 13: "G", 14: "H", 15: "J", 16: "K",
};

export function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
}

export function sliceAudioBufferToWindow(
  ctx: AudioContext,
  buf: AudioBuffer,
  startSec: number,
  endSec: number
): AudioBuffer {
  const sr = buf.sampleRate;
  const startSample = Math.max(0, Math.min(buf.length - 1, Math.floor(startSec * sr)));
  const endSample = Math.max(
    startSample + Math.floor(0.1 * sr),
    Math.min(buf.length, Math.floor(endSec * sr))
  );
  const frameCount = Math.max(1, endSample - startSample);
  const out = ctx.createBuffer(buf.numberOfChannels, frameCount, sr);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    out.getChannelData(ch).set(buf.getChannelData(ch).subarray(startSample, startSample + frameCount));
  }
  return out;
}

export function generateSimulatedWaveformPeaks(
  validDur: number,
  totalPoints: number,
  track: Partial<DiggerTrack> | null,
  stemFilter: StemType | null
): number[] {
  const peaks: number[] = [];
  const trackBpm = track?.bpm || 95;
  const beatPeriod = 60 / trackBpm;

  for (let i = 0; i < totalPoints; i++) {
    const sec = (i / totalPoints) * validDur;
    const progress = i / totalPoints;
    const beatPhase = (sec % beatPeriod) / beatPeriod;

    let finalAmp = 0.2;

    if (stemFilter === "drums") {
      const kickHit = beatPhase < 0.08 ? (1 - beatPhase / 0.08) * 0.95 : 0;
      const snarePhase = ((sec + beatPeriod * 0.5) % beatPeriod) / beatPeriod;
      const snareHit = snarePhase < 0.1 ? (1 - snarePhase / 0.1) * 0.8 : 0;
      const hihat = (Math.sin(sec * 120) * 0.5 + 0.5) * 0.15;
      finalAmp = Math.max(0.04, kickHit + snareHit + hihat);
    } else if (stemFilter === "bass") {
      const bassEnvelope = 0.45 + Math.sin(sec * 0.8) * 0.25 + Math.cos(sec * 1.6) * 0.2;
      const bassPulse = beatPhase < 0.35 ? (1 - beatPhase / 0.35) * 0.4 : 0.1;
      finalAmp = Math.max(0.05, Math.min(1.0, bassEnvelope * 0.7 + bassPulse));
    } else if (stemFilter === "melody") {
      const melodyPhasing = 0.4 + Math.sin(sec * 2.4) * 0.3 + Math.cos(sec * 4.8) * 0.2;
      const riff = (Math.sin(sec * 32.5) * 0.25 + 0.25) * 0.3;
      finalAmp = Math.max(0.06, Math.min(1.0, melodyPhasing + riff));
    } else if (stemFilter === "vocals") {
      const vocalActive = Math.sin(sec * 0.35) > -0.15 ? 1 : 0.08;
      const speechFormant =
        (0.35 + Math.sin(sec * 1.8) * 0.3 + Math.sin(sec * 7.2) * 0.2) * vocalActive;
      finalAmp = Math.max(0.03, Math.min(0.95, speechFormant));
    } else {
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

  return peaks;
}
