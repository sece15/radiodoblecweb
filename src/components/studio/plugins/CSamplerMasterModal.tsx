"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Download, Play, Square, Volume2, X, Layers, Sparkles, RotateCcw, FolderOpen, Save, Trash2 } from "lucide-react";
import { encodeAudioBufferToWavBlob } from "@/lib/studio/browserStemAI";
import { useModalIsolation } from "@/hooks/useModalIsolation";
import {
  type DrumRowKey,
  type SavedDrumKit,
  type StoredSampleData,
  saveActiveDrumSample,
  deleteActiveDrumSample,
  loadAllActiveDrumSamples,
  saveSessionBeatState,
  loadSessionBeatState,
  listSavedDrumKits,
  saveNamedDrumKit,
  loadNamedDrumKitSamples,
  deleteNamedDrumKit,
} from "@/lib/studio/drumKitStorage";

export type MasterStemKey = "raw" | "drums" | "bass" | "melody" | "vocals";

export interface CSamplerMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  padLabel: string;
  rangeLabel: string;
  initialBpm?: number;
  channels: {
    raw: AudioBuffer | null;
    drums: AudioBuffer | null;
    bass: AudioBuffer | null;
    melody: AudioBuffer | null;
    vocals: AudioBuffer | null;
  };
}

interface ChannelState {
  gain: number; // 0..1.2
  muted: boolean;
  solo: boolean;
}

interface LoadedDrumSample {
  name: string;
  audioBuffer: AudioBuffer;
  rawBytes: ArrayBuffer;
}

interface DrumAssetOption {
  name: string;
  label: string;
  url: string;
}

type CustomDrumSampleMap = Partial<Record<DrumRowKey, LoadedDrumSample>>;

const DRUM_ROWS: { key: DrumRowKey; label: string; badge: string }[] = [
  { key: "kick", label: "KICK (BOMBO)", badge: "BD" },
  { key: "snare", label: "SNARE (CAJA)", badge: "SD" },
  { key: "hihat", label: "HI-HAT", badge: "HH" },
  { key: "clap", label: "CLAP / PERC", badge: "CP" },
  { key: "bass808", label: "BAJO 808", badge: "808" },
];

const BASS_NOTES: { label: string; freq: number }[] = [
  { label: "C2", freq: 65.41 },
  { label: "D2", freq: 73.42 },
  { label: "Eb2", freq: 77.78 },
  { label: "F2", freq: 87.31 },
  { label: "G2", freq: 98.0 },
  { label: "Ab2", freq: 103.83 },
  { label: "Bb2", freq: 116.54 },
];

const PRESET_PATTERNS: Record<string, Record<DrumRowKey, boolean[]>> = {
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

function triggerSynthSound(
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

function triggerDrumRow(
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

export const CSamplerMasterModal: React.FC<CSamplerMasterModalProps> = ({
  isOpen,
  onClose,
  padLabel,
  rangeLabel,
  initialBpm = 95,
  channels,
}) => {
  const [channelState, setChannelState] = useState<Record<MasterStemKey, ChannelState>>({
    raw: { gain: 0, muted: true, solo: false },
    drums: { gain: 0.9, muted: false, solo: false },
    bass: { gain: 0.9, muted: false, solo: false },
    melody: { gain: 0.95, muted: false, solo: false },
    vocals: { gain: 0.9, muted: false, solo: false },
  });

  const [bpm, setBpm] = useState<number>(Math.max(60, Math.min(180, Math.round(initialBpm))));
  const [loopSample, setLoopSample] = useState<boolean>(true);
  const [masterVol, setMasterVol] = useState<number>(0.9);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [auditioningKey, setAuditioningKey] = useState<MasterStemKey | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [bassFreq, setBassFreq] = useState<number>(65.41);
  const [beatEnabled, setBeatEnabled] = useState<boolean>(true);
  const [sidechainPump, setSidechainPump] = useState<boolean>(true);
  const [pattern, setPattern] = useState<Record<DrumRowKey, boolean[]>>(() => ({
    kick: [...PRESET_PATTERNS.boombap.kick],
    snare: [...PRESET_PATTERNS.boombap.snare],
    hihat: [...PRESET_PATTERNS.boombap.hihat],
    clap: [...PRESET_PATTERNS.boombap.clap],
    bass808: [...PRESET_PATTERNS.boombap.bass808],
  }));
  const [drumVolumes, setDrumVolumes] = useState<Record<DrumRowKey, number>>({
    kick: 0.9,
    snare: 0.85,
    hihat: 0.7,
    clap: 0.75,
    bass808: 0.85,
  });
  const [drumMuted, setDrumMuted] = useState<Record<DrumRowKey, boolean>>({
    kick: false,
    snare: false,
    hihat: false,
    clap: false,
    bass808: false,
  });
  const [customDrumSamples, setCustomDrumSamples] = useState<CustomDrumSampleMap>({});
  const [factoryDrumAssets, setFactoryDrumAssets] = useState<Partial<Record<DrumRowKey, DrumAssetOption[]>>>({});
  const [savedKits, setSavedKits] = useState<SavedDrumKit[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<string>("");
  const [isSavingKit, setIsSavingKit] = useState<boolean>(false);
  const [kitNameInput, setKitNameInput] = useState<string>("");
  const [dragOverRow, setDragOverRow] = useState<DrumRowKey | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const channelGainsRef = useRef<Partial<Record<MasterStemKey, GainNode>>>({});
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const stepTimerRef = useRef<number | null>(null);
  const stepCounterRef = useRef<number>(0);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const playMasterRef = useRef<(() => void) | null>(null);
  const sessionHydratedRef = useRef<boolean>(false);
  const fileInputRefs = useRef<Partial<Record<DrumRowKey, HTMLInputElement | null>>>({});

  useModalIsolation(isOpen, modalContainerRef, {
    onEscape: onClose,
    onSpace: () => playMasterRef.current?.(),
  });

  const patternRef = useRef(pattern);
  patternRef.current = pattern;
  const drumVolumesRef = useRef(drumVolumes);
  drumVolumesRef.current = drumVolumes;
  const drumMutedRef = useRef(drumMuted);
  drumMutedRef.current = drumMuted;
  const bassFreqRef = useRef(bassFreq);
  bassFreqRef.current = bassFreq;
  const beatEnabledRef = useRef(beatEnabled);
  beatEnabledRef.current = beatEnabled;
  const sidechainPumpRef = useRef(sidechainPump);
  sidechainPumpRef.current = sidechainPump;
  const channelStateRef = useRef(channelState);
  channelStateRef.current = channelState;
  const customDrumSamplesRef = useRef(customDrumSamples);
  customDrumSamplesRef.current = customDrumSamples;

  const stopAllPlayback = useCallback(() => {
    if (stepTimerRef.current !== null) {
      window.clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    }
    activeSourcesRef.current = [];
    setIsPlaying(false);
    setAuditioningKey(null);
    setCurrentStep(-1);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopAllPlayback();
    }
    return () => {
      stopAllPlayback();
    };
  }, [isOpen, stopAllPlayback]);

  // Sincronizar ganancias en tiempo real
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(masterVol, ctx.currentTime, 0.015);
    }
    const anySolo = (Object.values(channelState) as ChannelState[]).some((c) => c.solo);
    (["raw", "drums", "bass", "melody", "vocals"] as MasterStemKey[]).forEach((key) => {
      const node = channelGainsRef.current[key];
      if (!node) return;
      const st = channelState[key];
      const active = anySolo ? st.solo : !st.muted;
      node.gain.setTargetAtTime(active ? st.gain : 0, ctx.currentTime, 0.015);
    });
  }, [channelState, masterVol]);

  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = masterVol;
      master.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = master;
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, [masterVol]);

  // Decodificar un mapa de StoredSampleData a AudioBuffers listos para usar
  const decodeStoredSamplesMap = useCallback(
    async (stored: Partial<Record<DrumRowKey, StoredSampleData>>): Promise<CustomDrumSampleMap> => {
      const ctx = ensureAudioContext();
      const nextMap: CustomDrumSampleMap = {};
      const entries = Object.entries(stored) as [DrumRowKey, StoredSampleData][];
      await Promise.all(
        entries.map(async ([row, item]) => {
          try {
            const decoded = await ctx.decodeAudioData(item.arrayBuffer.slice(0));
            nextMap[row] = {
              name: item.name,
              audioBuffer: decoded,
              rawBytes: item.arrayBuffer.slice(0),
            };
          } catch {
            // Ignorar si un archivo guardado quedó corrupto
          }
        })
      );
      return nextMap;
    },
    [ensureAudioContext]
  );

  // Restaurar sesión y librería de samples guardada al abrir el modal
  useEffect(() => {
    if (!isOpen || sessionHydratedRef.current) return;
    sessionHydratedRef.current = true;

    const savedState = loadSessionBeatState();
    if (savedState) {
      if (savedState.pattern) setPattern(savedState.pattern);
      if (savedState.drumVolumes) setDrumVolumes(savedState.drumVolumes);
      if (savedState.drumMuted) setDrumMuted(savedState.drumMuted);
      if (typeof savedState.bassFreq === "number") setBassFreq(savedState.bassFreq);
      if (typeof savedState.sidechainPump === "boolean") setSidechainPump(savedState.sidechainPump);
      if (typeof savedState.beatEnabled === "boolean") setBeatEnabled(savedState.beatEnabled);
    }
    setSavedKits(listSavedDrumKits());

    loadAllActiveDrumSamples()
      .then((stored) => {
        if (Object.keys(stored).length === 0) return;
        return decodeStoredSamplesMap(stored).then((decodedMap) => {
          setCustomDrumSamples(decodedMap);
        });
      })
      .catch(() => {});
  }, [isOpen, decodeStoredSamplesMap]);

  // Cargar catálogo de assets predeterminados desde public/assets/drumkits/
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch("/api/studio/drum-assets")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { assets?: Partial<Record<DrumRowKey, DrumAssetOption[]>> } | null) => {
        if (!cancelled && data?.assets) {
          setFactoryDrumAssets(data.assets);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Guardar automáticamente el estado de la sesión cuando cambia el beat rack
  useEffect(() => {
    if (!sessionHydratedRef.current) return;
    saveSessionBeatState({
      pattern,
      drumVolumes,
      drumMuted,
      bassFreq,
      sidechainPump,
      beatEnabled,
    });
  }, [pattern, drumVolumes, drumMuted, bassFreq, sidechainPump, beatEnabled]);

  const handleUploadDrumSample = useCallback(
    async (row: DrumRowKey, file: File) => {
      try {
        const ctx = ensureAudioContext();
        const arrayBuffer = await file.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
        setCustomDrumSamples((prev) => ({
          ...prev,
          [row]: {
            name: file.name,
            audioBuffer: decoded,
            rawBytes: arrayBuffer.slice(0),
          },
        }));
        await saveActiveDrumSample(row, file.name, arrayBuffer);

        // Pre-escucha inmediata al cargar
        triggerDrumRow(ctx, masterGainRef.current!, row, ctx.currentTime + 0.01, drumVolumesRef.current[row], bassFreqRef.current, {
          ...customDrumSamplesRef.current,
          [row]: { name: file.name, audioBuffer: decoded, rawBytes: arrayBuffer },
        });
      } catch {
        // Archivo de audio inválido o no soportado
      }
    },
    [ensureAudioContext]
  );

  const handleLoadFactoryAsset = useCallback(
    async (row: DrumRowKey, asset: DrumAssetOption, preview = true) => {
      try {
        const res = await fetch(asset.url);
        if (!res.ok) return;
        const arrayBuffer = await res.arrayBuffer();
        const ctx = ensureAudioContext();
        const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
        const loaded: LoadedDrumSample = {
          name: asset.name,
          audioBuffer: decoded,
          rawBytes: arrayBuffer.slice(0),
        };
        setCustomDrumSamples((prev) => ({ ...prev, [row]: loaded }));
        await saveActiveDrumSample(row, asset.name, arrayBuffer);

        if (preview) {
          triggerDrumRow(ctx, masterGainRef.current!, row, ctx.currentTime + 0.01, drumVolumesRef.current[row], bassFreqRef.current, {
            ...customDrumSamplesRef.current,
            [row]: loaded,
          });
        }
      } catch {
        // Error cargando asset predeterminado
      }
    },
    [ensureAudioContext]
  );

  const handleLoadDefaultFactoryKit = useCallback(async () => {
    const keys: DrumRowKey[] = ["kick", "snare", "hihat", "clap", "bass808"];
    await Promise.all(
      keys.map((row) => {
        const first = factoryDrumAssets[row]?.[0];
        if (!first) return Promise.resolve();
        return handleLoadFactoryAsset(row, first, false);
      })
    );
  }, [factoryDrumAssets, handleLoadFactoryAsset]);

  const handleClearDrumSample = useCallback(async (row: DrumRowKey) => {
    setCustomDrumSamples((prev) => {
      const next = { ...prev };
      delete next[row];
      return next;
    });
    await deleteActiveDrumSample(row);
  }, []);

  const handlePreviewDrumRow = useCallback(
    (row: DrumRowKey) => {
      const ctx = ensureAudioContext();
      triggerDrumRow(
        ctx,
        masterGainRef.current!,
        row,
        ctx.currentTime + 0.01,
        Math.max(0.4, drumVolumesRef.current[row]),
        bassFreqRef.current,
        customDrumSamplesRef.current
      );
    },
    [ensureAudioContext]
  );

  const handleSaveCurrentKit = useCallback(async () => {
    const name = kitNameInput.trim() || `Mi Kit ${savedKits.length + 1}`;
    const rawSamples: Partial<Record<DrumRowKey, StoredSampleData>> = {};
    (Object.keys(customDrumSamples) as DrumRowKey[]).forEach((row) => {
      const item = customDrumSamples[row];
      if (item) {
        rawSamples[row] = { name: item.name, arrayBuffer: item.rawBytes };
      }
    });
    const updated = await saveNamedDrumKit(
      name,
      {
        pattern,
        drumVolumes,
        drumMuted,
        bassFreq,
        sidechainPump,
        beatEnabled,
      },
      rawSamples
    );
    setSavedKits(updated);
    const created = updated.find((k) => k.name.toLowerCase() === name.toLowerCase());
    if (created) setSelectedKitId(created.id);
    setKitNameInput("");
    setIsSavingKit(false);
  }, [
    kitNameInput,
    savedKits.length,
    customDrumSamples,
    pattern,
    drumVolumes,
    drumMuted,
    bassFreq,
    sidechainPump,
    beatEnabled,
  ]);

  const handleSelectSavedKit = useCallback(
    async (kitId: string) => {
      setSelectedKitId(kitId);
      if (!kitId) return;
      const found = savedKits.find((k) => k.id === kitId);
      if (!found) return;

      setPattern(found.state.pattern);
      setDrumVolumes(found.state.drumVolumes);
      setDrumMuted(found.state.drumMuted);
      setBassFreq(found.state.bassFreq);
      setSidechainPump(found.state.sidechainPump);
      setBeatEnabled(found.state.beatEnabled);

      const storedSamples = await loadNamedDrumKitSamples(kitId);
      const decoded = await decodeStoredSamplesMap(storedSamples);
      setCustomDrumSamples(decoded);
    },
    [savedKits, decodeStoredSamplesMap]
  );

  const handleDeleteSavedKit = useCallback(async () => {
    if (!selectedKitId) return;
    const updated = await deleteNamedDrumKit(selectedKitId);
    setSavedKits(updated);
    setSelectedKitId("");
  }, [selectedKitId]);

  const handlePlayMaster = useCallback(() => {
    if (isPlaying) {
      stopAllPlayback();
      return;
    }

    const ctx = ensureAudioContext();
    const master = masterGainRef.current!;
    const anySolo = (Object.values(channelState) as ChannelState[]).some((c) => c.solo);

    const sources: AudioBufferSourceNode[] = [];
    (["raw", "drums", "bass", "melody", "vocals"] as MasterStemKey[]).forEach((key) => {
      const buf = channels[key];
      if (!buf) return;
      const gainNode = ctx.createGain();
      const st = channelState[key];
      const active = anySolo ? st.solo : !st.muted;
      gainNode.gain.value = active ? st.gain : 0;
      gainNode.connect(master);
      channelGainsRef.current[key] = gainNode;

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = loopSample;
      src.connect(gainNode);
      src.start(ctx.currentTime + 0.02);
      sources.push(src);
    });
    activeSourcesRef.current = sources;

    // Secuenciador FL 16-step
    stepCounterRef.current = 0;
    const stepMs = (60 / bpm / 4) * 1000;
    const tick = () => {
      const step = stepCounterRef.current % 16;
      setCurrentStep(step);
      if (beatEnabledRef.current) {
        const now = ctx.currentTime + 0.01;
        DRUM_ROWS.forEach((row) => {
          if (!drumMutedRef.current[row.key] && patternRef.current[row.key][step]) {
            triggerDrumRow(
              ctx,
              master,
              row.key,
              now,
              drumVolumesRef.current[row.key],
              bassFreqRef.current,
              customDrumSamplesRef.current
            );

            // Sidechain Ducking sobre los canales del sample cuando golpea el Kick
            if (row.key === "kick" && sidechainPumpRef.current) {
              const stMap = channelStateRef.current;
              const anySoloNow = (Object.values(stMap) as ChannelState[]).some((c) => c.solo);
              (["raw", "drums", "bass", "melody", "vocals"] as MasterStemKey[]).forEach((k) => {
                const gNode = channelGainsRef.current[k];
                const st = stMap[k];
                if (!gNode || !st) return;
                const active = anySoloNow ? st.solo : !st.muted;
                if (!active || st.gain <= 0.001) return;
                gNode.gain.cancelScheduledValues(now);
                gNode.gain.setValueAtTime(st.gain * 0.25, now);
                gNode.gain.exponentialRampToValueAtTime(Math.max(0.01, st.gain), now + 0.16);
              });
            }
          }
        });
      }
      stepCounterRef.current += 1;
    };

    tick();
    stepTimerRef.current = window.setInterval(tick, stepMs);
    setIsPlaying(true);
  }, [isPlaying, stopAllPlayback, ensureAudioContext, channelState, channels, loopSample, bpm]);

  playMasterRef.current = handlePlayMaster;

  const handleAuditionSingleChannel = (key: MasterStemKey) => {
    if (auditioningKey === key && isPlaying) {
      stopAllPlayback();
      return;
    }
    const buf = channels[key];
    if (!buf) return;
    stopAllPlayback();
    const ctx = ensureAudioContext();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = channelState[key].gain || 0.9;
    src.connect(g);
    g.connect(masterGainRef.current!);
    src.start();
    src.onended = () => {
      setIsPlaying(false);
      setAuditioningKey(null);
    };
    activeSourcesRef.current = [src];
    setAuditioningKey(key);
    setIsPlaying(true);
  };

  const handleDownloadWav = (blob: Blob, suffix: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanName = padLabel.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    a.download = `${cleanName}_${suffix}.wav`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportSingleStem = (key: MasterStemKey) => {
    const buf = channels[key];
    if (!buf) return;
    const blob = encodeAudioBufferToWavBlob(buf);
    handleDownloadWav(blob, key);
  };

  const handleExportMasterMix = async () => {
    const refBuf = channels.drums || channels.bass || channels.melody || channels.vocals || channels.raw;
    const stepSec = 60 / bpm / 4;
    const barDuration = stepSec * 16;
    const renderDuration = Math.max(refBuf ? refBuf.duration : barDuration, barDuration);
    const sampleRate = refBuf ? refBuf.sampleRate : 44100;
    const offline = new OfflineAudioContext(2, Math.ceil(renderDuration * sampleRate), sampleRate);
    const master = offline.createGain();
    master.gain.value = masterVol;
    master.connect(offline.destination);

    const anySolo = (Object.values(channelState) as ChannelState[]).some((c) => c.solo);
    const stemBus = offline.createGain();
    stemBus.gain.value = 1.0;
    stemBus.connect(master);

    (["raw", "drums", "bass", "melody", "vocals"] as MasterStemKey[]).forEach((key) => {
      const buf = channels[key];
      if (!buf) return;
      const st = channelState[key];
      const active = anySolo ? st.solo : !st.muted;
      if (!active || st.gain <= 0.001) return;
      const src = offline.createBufferSource();
      src.buffer = buf;
      src.loop = loopSample;
      const g = offline.createGain();
      g.gain.value = st.gain;
      src.connect(g);
      g.connect(stemBus);
      src.start(0);
      src.stop(renderDuration);
    });

    if (beatEnabled) {
      const totalSteps = Math.floor(renderDuration / stepSec);
      for (let s = 0; s < totalSteps; s++) {
        const step = s % 16;
        const time = s * stepSec;
        DRUM_ROWS.forEach((row) => {
          if (!drumMuted[row.key] && pattern[row.key][step]) {
            triggerDrumRow(offline, master, row.key, time, drumVolumes[row.key], bassFreq, customDrumSamples);
            if (row.key === "kick" && sidechainPump) {
              stemBus.gain.setValueAtTime(0.25, time);
              stemBus.gain.exponentialRampToValueAtTime(1.0, time + 0.16);
            }
          }
        });
      }
    }

    const rendered = await offline.startRendering();
    const blob = encodeAudioBufferToWavBlob(rendered);
    handleDownloadWav(blob, beatEnabled ? "master_con_beat" : "master_stems");
  };

  if (!isOpen) return null;

  const channelMeta: { key: MasterStemKey; label: string; icon: string; accent: string }[] = [
    { key: "raw", label: "ORIGINAL", icon: "💿", accent: "#A1A1AA" },
    { key: "drums", label: "BATERÍA", icon: "🥁", accent: "#FFD600" },
    { key: "bass", label: "BAJO", icon: "🎸", accent: "#FFD600" },
    { key: "melody", label: "MELODÍA", icon: "🎹", accent: "#E4E4E7" },
    { key: "vocals", label: "VOCAL", icon: "🎤", accent: "#FFD600" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10050,
        backgroundColor: "rgba(5, 6, 9, 0.90)",
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
          maxWidth: "1060px",
          maxHeight: "92vh",
          overflowY: "auto",
          backgroundColor: "#111215",
          border: "2px solid #FFD600",
          outline: "4px solid #090A0D",
          borderRadius: "10px",
          boxShadow: "0 28px 80px rgba(0,0,0,0.95)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Cabecera FL Master */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "10px 14px",
            backgroundColor: "#141519",
            borderBottom: "1px solid rgba(255,214,0,0.45)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                background: "linear-gradient(180deg, #3A3C42 0%, #23252A 100%)",
                color: "#FFD600",
                fontWeight: 900,
                fontFamily: "monospace",
                fontSize: "0.70rem",
                padding: "3px 9px",
                borderRadius: "3px",
                border: "1px solid #4B4E57",
                boxShadow: "0 2px 0 #07080A",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Layers size={12} />
              <span>C-MASTER STUDIO</span>
            </span>
            <span style={{ fontSize: "0.70rem", fontWeight: 900, color: "#FFFFFF", fontFamily: "monospace" }}>
              {padLabel}
            </span>
            <span style={{ fontSize: "0.60rem", color: "#A1A1AA", fontFamily: "monospace" }}>
              {rangeLabel}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handlePlayMaster}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 12px",
                backgroundColor: isPlaying ? "#D4D4D8" : "#FFD600",
                color: "#090A0D",
                border: isPlaying ? "1px solid #FFFFFF" : "1px solid #FFE866",
                borderRadius: "3px",
                boxShadow: isPlaying
                  ? "0 0 14px rgba(212,212,216,0.8)"
                  : "0 0 14px rgba(255,214,0,0.85), 0 0 26px rgba(255,214,0,0.4)",
                fontSize: "0.66rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: "pointer",
              }}
            >
              {isPlaying ? <Square size={11} fill="#090A0D" /> : <Play size={11} fill="#090A0D" />}
              <span>{isPlaying ? "DETENER MASTER" : "REPRODUCIR MASTER"}</span>
            </button>

            <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.60rem", color: "#FFD600", fontFamily: "monospace", fontWeight: 900 }}>
              BPM
              <input
                type="number"
                min={60}
                max={180}
                value={bpm}
                onChange={(e) => setBpm(Math.max(60, Math.min(180, Number(e.target.value) || 95)))}
                style={{
                  width: "48px",
                  backgroundColor: "#090A0D",
                  color: "#FFD600",
                  border: "1px solid #3A3D48",
                  borderRadius: "3px",
                  padding: "2px 4px",
                  fontSize: "0.64rem",
                  fontWeight: 900,
                  textAlign: "center",
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => setLoopSample((p) => !p)}
              style={{
                padding: "4px 8px",
                backgroundColor: loopSample ? "#FFD600" : "#E4E4E7",
                color: "#090A0D",
                border: "1px solid #090A0D",
                borderRadius: "3px",
                boxShadow: "0 2px 0 #07080A",
                fontSize: "0.58rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: "pointer",
              }}
            >
              LOOP {loopSample ? "ON" : "OFF"}
            </button>

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
              title="Volver al C-Sampler"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* SECCIÓN 1: CANALES SEPARADOS DEL CORTE */}
          <div
            style={{
              backgroundColor: "#0A0B0E",
              border: "1px solid rgba(255,214,0,0.4)",
              borderRadius: "6px",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "1.2px" }}>
                1. CANALES SEPARADOS DEL CORTE (EXPORTA O MEZCLA CADA INSTRUMENTO)
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Volume2 size={12} color="#FFD600" />
                <span style={{ fontSize: "0.58rem", color: "#D4D4D8", fontFamily: "monospace" }}>
                  MASTER {Math.round(masterVol * 100)}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={120}
                  value={Math.round(masterVol * 100)}
                  onChange={(e) => setMasterVol(Number(e.target.value) / 100)}
                  style={{ width: "80px", accentColor: "#FFD600" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "8px" }}>
              {channelMeta.map((ch) => {
                const st = channelState[ch.key];
                const hasBuf = Boolean(channels[ch.key]);
                return (
                  <div
                    key={ch.key}
                    style={{
                      backgroundColor: "#141519",
                      border: st.solo ? "1.5px solid #FFD600" : "1px solid #262830",
                      borderRadius: "5px",
                      padding: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      opacity: hasBuf ? 1 : 0.45,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.60rem", fontWeight: 900, color: ch.accent, fontFamily: "monospace" }}>
                        {ch.icon} {ch.label}
                      </span>
                      <button
                        type="button"
                        disabled={!hasBuf}
                        onClick={() => handleAuditionSingleChannel(ch.key)}
                        style={{
                          padding: "2px 6px",
                          backgroundColor: auditioningKey === ch.key && isPlaying ? "#FFD600" : "#E4E4E7",
                          color: "#090A0D",
                          border: "1px solid #090A0D",
                          borderRadius: "3px",
                          fontSize: "0.55rem",
                          fontWeight: 900,
                          cursor: hasBuf ? "pointer" : "not-allowed",
                          boxShadow:
                            auditioningKey === ch.key && isPlaying
                              ? "0 0 8px rgba(255,214,0,0.75)"
                              : "none",
                        }}
                        title={
                          auditioningKey === ch.key && isPlaying
                            ? `Pausar / detener ${ch.label}`
                            : `Escuchar solo ${ch.label}`
                        }
                      >
                        {auditioningKey === ch.key && isPlaying ? "⏸" : "▶"}
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <button
                        type="button"
                        disabled={!hasBuf}
                        onClick={() =>
                          setChannelState((prev) => ({
                            ...prev,
                            [ch.key]: { ...prev[ch.key], muted: !prev[ch.key].muted },
                          }))
                        }
                        style={{
                          flex: 1,
                          padding: "2px 0",
                          fontSize: "0.56rem",
                          fontWeight: 900,
                          fontFamily: "monospace",
                          backgroundColor: st.muted ? "#52525B" : "#E4E4E7",
                          color: st.muted ? "#FFFFFF" : "#090A0D",
                          border: "1px solid #090A0D",
                          borderRadius: "3px",
                          cursor: hasBuf ? "pointer" : "not-allowed",
                        }}
                      >
                        M
                      </button>
                      <button
                        type="button"
                        disabled={!hasBuf}
                        onClick={() =>
                          setChannelState((prev) => ({
                            ...prev,
                            [ch.key]: { ...prev[ch.key], solo: !prev[ch.key].solo },
                          }))
                        }
                        style={{
                          flex: 1,
                          padding: "2px 0",
                          fontSize: "0.56rem",
                          fontWeight: 900,
                          fontFamily: "monospace",
                          backgroundColor: st.solo ? "#FFD600" : "#E4E4E7",
                          color: "#090A0D",
                          border: "1px solid #090A0D",
                          borderRadius: "3px",
                          cursor: hasBuf ? "pointer" : "not-allowed",
                        }}
                      >
                        S
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <input
                        type="range"
                        min={0}
                        max={120}
                        disabled={!hasBuf}
                        value={Math.round(st.gain * 100)}
                        onChange={(e) => {
                          const nextGain = Number(e.target.value) / 100;
                          setChannelState((prev) => ({
                            ...prev,
                            [ch.key]: { ...prev[ch.key], gain: nextGain, muted: nextGain > 0 ? false : prev[ch.key].muted },
                          }));
                        }}
                        style={{ width: "100%", accentColor: "#FFD600" }}
                      />
                      <span style={{ fontSize: "0.52rem", color: "#A1A1AA", fontFamily: "monospace", textAlign: "center" }}>
                        {Math.round(st.gain * 100)}%
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!hasBuf}
                      onClick={() => handleExportSingleStem(ch.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        padding: "3px 6px",
                        backgroundColor: "#E4E4E7",
                        color: "#090A0D",
                        border: "1px solid #090A0D",
                        borderRadius: "3px",
                        boxShadow: "0 2px 0 #07080A",
                        fontSize: "0.55rem",
                        fontWeight: 900,
                        fontFamily: "monospace",
                        cursor: hasBuf ? "pointer" : "not-allowed",
                      }}
                    >
                      <Download size={10} />
                      <span>WAV</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 2: SECUENCIADOR FL STUDIO (BATERÍA + BAJO 808) */}
          <div
            style={{
              backgroundColor: "#0A0B0E",
              border: "1px solid rgba(255,214,0,0.4)",
              borderRadius: "6px",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "1.2px" }}>
                  2. FL BEAT RACK (BATERÍA Y BAJO SOBRE TU SAMPLE)
                </span>
                <button
                  type="button"
                  onClick={() => setBeatEnabled((p) => !p)}
                  style={{
                    padding: "2px 7px",
                    backgroundColor: beatEnabled ? "#FFD600" : "#262830",
                    color: beatEnabled ? "#090A0D" : "#D4D4D8",
                    border: "1px solid #090A0D",
                    borderRadius: "3px",
                    fontSize: "0.55rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                >
                  BEAT {beatEnabled ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={() => setSidechainPump((p) => !p)}
                  style={{
                    padding: "2px 7px",
                    backgroundColor: sidechainPump ? "#FFD600" : "#262830",
                    color: sidechainPump ? "#090A0D" : "#D4D4D8",
                    border: "1px solid #090A0D",
                    borderRadius: "3px",
                    fontSize: "0.55rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                  title="Sidechain Ducking: baja suavemente el sample cada vez que golpea el Kick"
                >
                  PUMP {sidechainPump ? "ON" : "OFF"}
                </button>
              </div>

              {/* Barra MIS KITS de sesión */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => void handleLoadDefaultFactoryKit()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    padding: "2px 7px",
                    backgroundColor: "#262830",
                    color: "#86EFAC",
                    border: "1px solid rgba(134,239,172,0.45)",
                    borderRadius: "3px",
                    fontSize: "0.54rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                  title="Cargar el kit predeterminado desde /assets/drumkits/"
                >
                  <Sparkles size={10} />
                  <span>KIT ASSETS</span>
                </button>
                <select
                  value={selectedKitId}
                  onChange={(e) => handleSelectSavedKit(e.target.value)}
                  style={{
                    backgroundColor: "#141519",
                    color: "#E4E4E7",
                    border: "1px solid #3A3D48",
                    borderRadius: "3px",
                    padding: "2px 6px",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    maxWidth: "150px",
                  }}
                  title="Cargar un Kit guardado en esta sesión"
                >
                  <option value="">MIS KITS ({savedKits.length})</option>
                  {savedKits.map((kit) => (
                    <option key={kit.id} value={kit.id}>
                      {kit.name}
                    </option>
                  ))}
                </select>

                {selectedKitId && (
                  <button
                    type="button"
                    onClick={handleDeleteSavedKit}
                    style={{
                      padding: "2px 5px",
                      backgroundColor: "#262830",
                      color: "#F87171",
                      border: "1px solid #3A3D48",
                      borderRadius: "3px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Eliminar este kit guardado"
                  >
                    <Trash2 size={10} />
                  </button>
                )}

                {isSavingKit ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <input
                      type="text"
                      value={kitNameInput}
                      onChange={(e) => setKitNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveCurrentKit();
                        if (e.key === "Escape") setIsSavingKit(false);
                      }}
                      placeholder="Nombre del kit..."
                      autoFocus
                      style={{
                        width: "120px",
                        backgroundColor: "#141519",
                        color: "#FFFFFF",
                        border: "1px solid #FFD600",
                        borderRadius: "3px",
                        padding: "2px 6px",
                        fontSize: "0.55rem",
                        fontFamily: "monospace",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveCurrentKit}
                      style={{
                        padding: "2px 7px",
                        backgroundColor: "#FFD600",
                        color: "#090A0D",
                        border: "1px solid #090A0D",
                        borderRadius: "3px",
                        fontSize: "0.54rem",
                        fontWeight: 900,
                        fontFamily: "monospace",
                        cursor: "pointer",
                      }}
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSavingKit(false)}
                      style={{
                        padding: "2px 5px",
                        backgroundColor: "#262830",
                        color: "#D4D4D8",
                        border: "1px solid #3A3D48",
                        borderRadius: "3px",
                        fontSize: "0.54rem",
                        fontFamily: "monospace",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSavingKit(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 7px",
                      backgroundColor: "#262830",
                      color: "#FFD600",
                      border: "1px solid rgba(255,214,0,0.5)",
                      borderRadius: "3px",
                      fontSize: "0.54rem",
                      fontWeight: 900,
                      fontFamily: "monospace",
                      cursor: "pointer",
                    }}
                    title="Guardar tus sonidos cargados y patrón actual como un Kit en tu sesión"
                  >
                    <Save size={10} />
                    <span>GUARDAR KIT</span>
                  </button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.54rem", color: "#A1A1AA", fontFamily: "monospace" }}>NOTA 808:</span>
                <select
                  value={bassFreq}
                  onChange={(e) => setBassFreq(Number(e.target.value))}
                  style={{
                    backgroundColor: "#141519",
                    color: "#FFD600",
                    border: "1px solid #3A3D48",
                    borderRadius: "3px",
                    padding: "2px 4px",
                    fontSize: "0.58rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                  }}
                >
                  {BASS_NOTES.map((n) => (
                    <option key={n.label} value={n.freq}>
                      {n.label}
                    </option>
                  ))}
                </select>

                {(
                  [
                    { id: "boombap", label: "BOOM BAP" },
                    { id: "trap", label: "TRAP 808" },
                    { id: "house", label: "4x4" },
                    { id: "empty", label: "LIMPIAR" },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      const p = PRESET_PATTERNS[preset.id];
                      setPattern({
                        kick: [...p.kick],
                        snare: [...p.snare],
                        hihat: [...p.hihat],
                        clap: [...p.clap],
                        bass808: [...p.bass808],
                      });
                    }}
                    style={{
                      padding: "2px 7px",
                      backgroundColor: "#E4E4E7",
                      color: "#090A0D",
                      border: "1px solid #090A0D",
                      borderRadius: "3px",
                      boxShadow: "0 2px 0 #07080A",
                      fontSize: "0.54rem",
                      fontWeight: 900,
                      fontFamily: "monospace",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    {preset.id === "empty" ? <RotateCcw size={9} /> : <Sparkles size={9} />}
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {DRUM_ROWS.map((row) => {
                const customSample = customDrumSamples[row.key];
                const isDragOver = dragOverRow === row.key;
                return (
                  <div
                    key={row.key}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverRow !== row.key) setDragOverRow(row.key);
                    }}
                    onDragLeave={() => {
                      if (dragOverRow === row.key) setDragOverRow(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverRow(null);
                      const file = e.dataTransfer.files?.[0];
                      if (file) void handleUploadDrumSample(row.key, file);
                    }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "250px 1fr",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: isDragOver ? "#1F2117" : "#141519",
                      border: isDragOver ? "1px dashed #FFD600" : "1px solid #22242C",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      transition: "border-color 0.12s, background-color 0.12s",
                    }}
                  >
                    <input
                      ref={(el) => {
                        fileInputRefs.current[row.key] = el;
                      }}
                      type="file"
                      accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadDrumSample(row.key, file);
                        e.target.value = "";
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
                          <button
                            type="button"
                            onClick={() => handlePreviewDrumRow(row.key)}
                            style={{
                              padding: "1px 4px",
                              backgroundColor: "#262830",
                              color: "#FFD600",
                              border: "1px solid #3A3D48",
                              borderRadius: "2px",
                              fontSize: "0.50rem",
                              cursor: "pointer",
                            }}
                            title={`Escuchar ${row.label}`}
                          >
                            ▶
                          </button>
                          <span style={{ fontSize: "0.56rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                            {row.label}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[row.key]?.click()}
                            style={{
                              padding: "1px 5px",
                              fontSize: "0.50rem",
                              fontWeight: 900,
                              backgroundColor: customSample ? "#FFD600" : "#262830",
                              color: customSample ? "#090A0D" : "#E4E4E7",
                              border: "1px solid #3A3D48",
                              borderRadius: "2px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                            }}
                            title={`Cargar o arrastrar WAV/MP3 propio para ${row.label}`}
                          >
                            <FolderOpen size={9} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDrumMuted((p) => ({ ...p, [row.key]: !p[row.key] }))}
                            style={{
                              padding: "1px 4px",
                              fontSize: "0.50rem",
                              fontWeight: 900,
                              backgroundColor: drumMuted[row.key] ? "#52525B" : "#E4E4E7",
                              color: drumMuted[row.key] ? "#FFFFFF" : "#090A0D",
                              border: "1px solid #090A0D",
                              borderRadius: "2px",
                              cursor: "pointer",
                            }}
                          >
                            M
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(drumVolumes[row.key] * 100)}
                            onChange={(e) => setDrumVolumes((p) => ({ ...p, [row.key]: Number(e.target.value) / 100 }))}
                            style={{ width: "42px", accentColor: "#FFD600" }}
                          />
                        </div>
                      </div>
                      {(() => {
                        const rowAssets = factoryDrumAssets[row.key] || [];
                        if (!customSample && rowAssets.length === 0) return null;
                        const matchedAsset = customSample
                          ? rowAssets.find((a) => a.name === customSample.name)?.name || ""
                          : "";
                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            {rowAssets.length > 0 && (
                              <select
                                value={matchedAsset}
                                onChange={(e) => {
                                  const selected = rowAssets.find((a) => a.name === e.target.value);
                                  if (selected) void handleLoadFactoryAsset(row.key, selected, true);
                                }}
                                style={{
                                  flex: customSample ? "0 0 92px" : 1,
                                  backgroundColor: "#0D0E12",
                                  color: matchedAsset ? "#86EFAC" : "#D4D4D8",
                                  border: "1px solid #2F323D",
                                  borderRadius: "2px",
                                  padding: "1px 3px",
                                  fontSize: "0.49rem",
                                  fontFamily: "monospace",
                                  maxWidth: customSample ? "92px" : "100%",
                                }}
                                title={`Sonidos predeterminados en /assets/drumkits/${row.key}/`}
                              >
                                <option value="">Assets ({rowAssets.length})</option>
                                {rowAssets.map((asset) => (
                                  <option key={asset.name} value={asset.name}>
                                    {asset.label}
                                  </option>
                                ))}
                              </select>
                            )}
                            {customSample && (
                              <div
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "4px",
                                  backgroundColor: "rgba(34,197,94,0.12)",
                                  border: "1px solid rgba(34,197,94,0.35)",
                                  borderRadius: "2px",
                                  padding: "1px 5px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.49rem",
                                    color: "#86EFAC",
                                    fontFamily: "monospace",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={customSample.name}
                                >
                                  {customSample.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void handleClearDrumSample(row.key)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#FCA5A5",
                                    fontSize: "0.52rem",
                                    fontWeight: 900,
                                    cursor: "pointer",
                                    padding: 0,
                                    lineHeight: 1,
                                  }}
                                  title="Quitar sample y volver al sonido sintetizado"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(16, minmax(0, 1fr))", gap: "4px" }}>
                      {pattern[row.key].map((active, stepIdx) => {
                        const isBeatGroup = Math.floor(stepIdx / 4) % 2 === 1;
                        const isCurrent = currentStep === stepIdx;
                        return (
                          <button
                            key={stepIdx}
                            type="button"
                            onClick={() =>
                              setPattern((prev) => {
                                const nextRow = [...prev[row.key]];
                                nextRow[stepIdx] = !nextRow[stepIdx];
                                return { ...prev, [row.key]: nextRow };
                              })
                            }
                            style={{
                              height: "22px",
                              borderRadius: "3px",
                              border: isCurrent ? "1.5px solid #FFFFFF" : "1px solid #090A0D",
                              backgroundColor: active
                                ? "#FFD600"
                                : isBeatGroup
                                ? "#262830"
                                : "#1B1D24",
                              boxShadow: active
                                ? isCurrent
                                  ? "0 0 10px #FFD600"
                                  : "inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 0 #07080A"
                                : "inset 0 1px 2px rgba(0,0,0,0.6)",
                              cursor: "pointer",
                            }}
                            title={`${row.label} · Paso ${stepIdx + 1}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 3: EXPORTAR MASTER */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.58rem", color: "#A1A1AA", fontFamily: "monospace" }}>
              Exporta tu corte mezclado con batería y bajo 808 o descarga cada canal limpio en WAV.
            </span>
            <button
              type="button"
              onClick={handleExportMasterMix}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)",
                color: "#090A0D",
                border: "1px solid #FFE866",
                borderRadius: "4px",
                boxShadow: "0 0 14px rgba(255,214,0,0.75), 0 3px 0 #07080A",
                fontSize: "0.66rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: "pointer",
              }}
            >
              <Download size={12} />
              <span>EXPORTAR MASTER WAV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
