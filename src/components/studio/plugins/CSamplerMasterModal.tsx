"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
import {
  DRUM_ROWS,
  PRESET_PATTERNS,
  triggerDrumRow,
  type CustomDrumSampleMap,
  type DrumAssetOption,
  type LoadedDrumSample,
} from "@/lib/studio/masterSynth";
import { MasterHeaderBar } from "./master/MasterHeaderBar";
import { MasterStemChannels, type MasterChannelState, type MasterStemKey } from "./master/MasterStemChannels";
import { MasterSequencerSection } from "./master/MasterSequencerSection";
import { MasterFooterBar } from "./master/MasterFooterBar";

export type { MasterStemKey };

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

type ChannelState = MasterChannelState;

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
  const drumVolumesRef = useRef(drumVolumes);
  const drumMutedRef = useRef(drumMuted);
  const bassFreqRef = useRef(bassFreq);
  const beatEnabledRef = useRef(beatEnabled);
  const sidechainPumpRef = useRef(sidechainPump);
  const channelStateRef = useRef(channelState);
  const customDrumSamplesRef = useRef(customDrumSamples);

  useEffect(() => {
    patternRef.current = pattern;
    drumVolumesRef.current = drumVolumes;
    drumMutedRef.current = drumMuted;
    bassFreqRef.current = bassFreq;
    beatEnabledRef.current = beatEnabled;
    sidechainPumpRef.current = sidechainPump;
    channelStateRef.current = channelState;
    customDrumSamplesRef.current = customDrumSamples;
  }, [pattern, drumVolumes, drumMuted, bassFreq, beatEnabled, sidechainPump, channelState, customDrumSamples]);

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
      const id = window.setTimeout(() => stopAllPlayback(), 0);
      return () => {
        window.clearTimeout(id);
        stopAllPlayback();
      };
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

    const timerId = window.setTimeout(() => {
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
    }, 0);

    loadAllActiveDrumSamples()
      .then((stored) => {
        if (Object.keys(stored).length === 0) return;
        return decodeStoredSamplesMap(stored).then((decodedMap) => {
          setCustomDrumSamples(decodedMap);
        });
      })
      .catch(() => {});

    return () => window.clearTimeout(timerId);
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

  useEffect(() => {
    playMasterRef.current = handlePlayMaster;
  }, [handlePlayMaster]);

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
        <MasterHeaderBar
          padLabel={padLabel}
          rangeLabel={rangeLabel}
          isPlaying={isPlaying}
          bpm={bpm}
          loopSample={loopSample}
          onPlayMaster={handlePlayMaster}
          onChangeBpm={setBpm}
          onToggleLoop={() => setLoopSample((p) => !p)}
          onClose={onClose}
        />

        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <MasterStemChannels
            channelMeta={channelMeta}
            channelState={channelState}
            channels={channels}
            masterVol={masterVol}
            auditioningKey={auditioningKey}
            isPlaying={isPlaying}
            onChangeMasterVol={setMasterVol}
            onAuditionChannel={handleAuditionSingleChannel}
            onToggleMute={(key) =>
              setChannelState((prev) => ({
                ...prev,
                [key]: { ...prev[key], muted: !prev[key].muted },
              }))
            }
            onToggleSolo={(key) =>
              setChannelState((prev) => ({
                ...prev,
                [key]: { ...prev[key], solo: !prev[key].solo },
              }))
            }
            onChangeGain={(key, nextGain) =>
              setChannelState((prev) => ({
                ...prev,
                [key]: { ...prev[key], gain: nextGain, muted: nextGain > 0 ? false : prev[key].muted },
              }))
            }
            onExportSingleStem={handleExportSingleStem}
          />

          <MasterSequencerSection
            beatEnabled={beatEnabled}
            sidechainPump={sidechainPump}
            selectedKitId={selectedKitId}
            savedKits={savedKits}
            isSavingKit={isSavingKit}
            kitNameInput={kitNameInput}
            bassFreq={bassFreq}
            pattern={pattern}
            currentStep={currentStep}
            customDrumSamples={customDrumSamples}
            factoryDrumAssets={factoryDrumAssets}
            drumMuted={drumMuted}
            drumVolumes={drumVolumes}
            dragOverRow={dragOverRow}
            fileInputRefs={fileInputRefs}
            onToggleBeatEnabled={() => setBeatEnabled((p) => !p)}
            onToggleSidechainPump={() => setSidechainPump((p) => !p)}
            onLoadDefaultFactoryKit={() => void handleLoadDefaultFactoryKit()}
            onSelectSavedKit={handleSelectSavedKit}
            onDeleteSavedKit={handleDeleteSavedKit}
            onChangeSavingKit={setIsSavingKit}
            onChangeKitNameInput={setKitNameInput}
            onSaveCurrentKit={handleSaveCurrentKit}
            onChangeBassFreq={setBassFreq}
            onApplyPatternPreset={(presetId) => {
              const p = PRESET_PATTERNS[presetId];
              setPattern({
                kick: [...p.kick],
                snare: [...p.snare],
                hihat: [...p.hihat],
                clap: [...p.clap],
                bass808: [...p.bass808],
              });
            }}
            onChangeDragOverRow={setDragOverRow}
            onUploadDrumSample={(row, file) => void handleUploadDrumSample(row, file)}
            onPreviewDrumRow={handlePreviewDrumRow}
            onToggleDrumMute={(row) => setDrumMuted((p) => ({ ...p, [row]: !p[row] }))}
            onChangeDrumVolume={(row, vol) => setDrumVolumes((p) => ({ ...p, [row]: vol }))}
            onLoadFactoryAsset={(row, asset) => void handleLoadFactoryAsset(row, asset, true)}
            onClearDrumSample={(row) => void handleClearDrumSample(row)}
            onToggleStep={(row, stepIdx) =>
              setPattern((prev) => {
                const nextRow = [...prev[row]];
                nextRow[stepIdx] = !nextRow[stepIdx];
                return { ...prev, [row]: nextRow };
              })
            }
          />

          <MasterFooterBar onExportMasterMix={handleExportMasterMix} />
        </div>
      </div>
    </div>
  );
};