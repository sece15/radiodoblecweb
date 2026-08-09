"use client";

import { useAudioStore, AudioStoreState } from "@/store/useAudioStore";

const defaultSelector = (state: AudioStoreState) => state;

/**
 * Hook unificado de Audio con Zustand (Single Source of Truth).
 * - Uso completo: `const audio = useAudio();` (Estado y acciones).
 * - Uso atómico: `const isPlaying = useAudio(s => s.isPlaying);` (Rendimiento con selectores Zustand).
 */
export function useAudio(): AudioStoreState;
export function useAudio<U>(selector: (state: AudioStoreState) => U): U;
export function useAudio<U>(selector?: (state: AudioStoreState) => U) {
  return useAudioStore(selector ?? (defaultSelector as unknown as (state: AudioStoreState) => U));
}

export { useAudioStore };