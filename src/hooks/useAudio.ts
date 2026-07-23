"use client";

import { useAudioStore, AudioStoreState } from "@/store/useAudioStore";

const identitySelector = (state: AudioStoreState) => state;

/**
 * Hook unificado de Audio (Single Source of Truth).
 * - Uso completo: `const audio = useAudio();` (Estado y acciones).
 * - Uso atómico: `const isPlaying = useAudio(s => s.isPlaying);` (Rendimiento máximo con 0% re-renders innecesarios).
 */
export function useAudio(): AudioStoreState;
export function useAudio<U>(selector: (state: AudioStoreState) => U): U;
export function useAudio<U>(selector?: (state: AudioStoreState) => U) {
  const targetSelector = selector || (identitySelector as unknown as (state: AudioStoreState) => U);
  return useAudioStore(targetSelector);
}

export { useAudioStore };
