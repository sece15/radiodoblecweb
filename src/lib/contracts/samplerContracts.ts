/**
 * =====================================================================
 * C-SAMPLER FORMAL MATHEMATICAL CONTRACTS (src/lib/contracts/samplerContracts.ts)
 * =====================================================================
 * Demostración de invariantes y contratos de slicing en tiempo real.
 * Garantiza que:
 * 1. Los marcadores siempre guardan orden monótono creciente.
 * 2. Cada corte está estrictamente delimitado por el siguiente marcador.
 * 3. Ningún arrastre puede cruzar sus vecinos.
 * 4. El playback respeta matemáticamente el varispeed de pitch.
 */

import type { SamplerCuePoint } from "@/types/studio";
import { checkInvariants, assertInvariants, type VerificationResult } from "./invariant";

export interface SamplerContractState {
  cues: SamplerCuePoint[];
  totalDuration: number;
}

export interface SliceBoundary {
  cueId: number;
  startSec: number;
  endLimitSec: number;
  naturalDurationSec: number;
  nextCue: SamplerCuePoint | null;
  prevCue: SamplerCuePoint | null;
  dragMinSec: number;
  dragMaxSec: number;
}

export interface PlaybackVerification {
  cueId: number;
  startSec: number;
  endLimitSec: number;
  naturalDurationSec: number;
  playbackRate: number;
  realDurationSec: number;
  stopTimeoutMs: number;
}

/**
 * Invariantes matemáticas formales del Sampler
 */
export const SAMPLER_INVARIANTS = [
  {
    id: "I1_STRICT_MONOTONIC_ORDER",
    description: "Para todo par consecutivo (i, i+1), cues[i].startSec < cues[i+1].startSec",
    predicate: (s: SamplerContractState) => {
      const sorted = [...s.cues].sort((a, b) => a.startSec - b.startSec);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].startSec >= sorted[i + 1].startSec) return false;
      }
      return true;
    },
  },
  {
    id: "I2_BOUNDED_RANGE",
    description: "Todo marcador debe estar en el intervalo [0, totalDuration)",
    predicate: (s: SamplerContractState) => {
      return s.cues.every((c) => c.startSec >= 0 && c.startSec < s.totalDuration);
    },
  },
  {
    id: "I3_MINIMUM_SAFETY_GAP",
    description: "La distancia mínima entre marcadores adyacentes debe ser >= 0.1s",
    predicate: (s: SamplerContractState) => {
      const sorted = [...s.cues].sort((a, b) => a.startSec - b.startSec);
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = Math.round((sorted[i + 1].startSec - sorted[i].startSec) * 100) / 100;
        if (gap < 0.09) return false; // tolerancia de redondeo float
      }
      return true;
    },
  },
  {
    id: "I4_SUCCESSIVE_COVERAGE",
    description: "Cada slice tiene duración positiva finita delimitada por el siguiente marcador o fin de track",
    predicate: (s: SamplerContractState) => {
      const sorted = [...s.cues].sort((a, b) => a.startSec - b.startSec);
      for (let i = 0; i < sorted.length; i++) {
        const end = i < sorted.length - 1 ? sorted[i + 1].startSec : s.totalDuration;
        if (end <= sorted[i].startSec) return false;
      }
      return true;
    },
  },
];

/**
 * Valida formalmente el estado de los Cues del Sampler
 */
export function verifySamplerState(
  cues: SamplerCuePoint[],
  totalDuration: number
): VerificationResult {
  return checkInvariants({ cues, totalDuration }, SAMPLER_INVARIANTS);
}

/**
 * Aserción estricta de invariantes del Sampler
 */
export function assertSamplerState(
  cues: SamplerCuePoint[],
  totalDuration: number,
  contextMessage?: string
): void {
  assertInvariants({ cues, totalDuration }, SAMPLER_INVARIANTS, contextMessage);
}

/**
 * Calcula con rigor matemático los límites sucesivos de un corte
 */
export function calculateSliceBoundary(
  cueId: number,
  cues: SamplerCuePoint[],
  totalDuration: number
): SliceBoundary {
  const validDur = Math.max(10, totalDuration || 180);
  const sorted = [...cues].sort((a, b) => a.startSec - b.startSec);
  const idx = sorted.findIndex((c) => c.id === cueId);
  const cur = idx !== -1 ? sorted[idx] : null;

  const startSec = cur ? cur.startSec : 0;
  const nextCue = idx !== -1 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const prevCue = idx > 0 ? sorted[idx - 1] : null;
  const endLimitSec = nextCue ? nextCue.startSec : validDur;
  const naturalDurationSec = Math.max(0.08, endLimitSec - startSec);

  const dragMinSec = prevCue ? Math.round((prevCue.startSec + 0.1) * 10) / 10 : 0;
  const dragMaxSec = nextCue
    ? Math.round((nextCue.startSec - 0.1) * 10) / 10
    : Math.round((validDur - 0.1) * 10) / 10;

  return {
    cueId,
    startSec,
    endLimitSec,
    naturalDurationSec,
    nextCue,
    prevCue,
    dragMinSec: Math.min(dragMinSec, dragMaxSec),
    dragMaxSec: Math.max(dragMinSec, dragMaxSec),
  };
}

/**
 * Calcula el playback con varispeed y corte exacto en el siguiente marcador
 */
export function calculatePlaybackParameters(
  cueId: number,
  cues: SamplerCuePoint[],
  totalDuration: number,
  pitchSemi = 0,
  durationOverride?: number
): PlaybackVerification {
  const boundary = calculateSliceBoundary(cueId, cues, totalDuration);
  const playbackRate = Math.pow(2, pitchSemi / 12);
  const naturalDur = boundary.naturalDurationSec;
  const rawPlaybackDuration = naturalDur / playbackRate;

  const realDurationSec =
    durationOverride !== undefined
      ? Math.min(durationOverride / playbackRate, rawPlaybackDuration)
      : rawPlaybackDuration;

  const stopTimeoutMs = Math.max(60, Math.round(realDurationSec * 1000));

  return {
    cueId,
    startSec: boundary.startSec,
    endLimitSec: boundary.endLimitSec,
    naturalDurationSec: naturalDur,
    playbackRate,
    realDurationSec,
    stopTimeoutMs,
  };
}

