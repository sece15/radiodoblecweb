"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.esm.js";
import type {
  DiggerTrack,
  LoadedSampleData,
  SamplerCuePoint,
  SamplerTriggerMode,
  StemsSeparationResult,
  StemType,
} from "@/types/studio";
import { studioAudio } from "@/lib/studio/audioEngine";
import { extractStemPeaks } from "@/lib/studio/stemEngine";
import { calculateSliceBoundary } from "@/lib/contracts/samplerContracts";
import {
  formatSeconds,
  generateSimulatedWaveformPeaks,
  PAD_DISPLAY_KEYS,
} from "@/lib/studio/samplerConstants";

interface UseSamplerWaveformParams {
  isOpen: boolean;
  isStandalone: boolean;
  cues: SamplerCuePoint[];
  setCues: React.Dispatch<React.SetStateAction<SamplerCuePoint[]>>;
  selectedCueId: number | null;
  setSelectedCueId: React.Dispatch<React.SetStateAction<number | null>>;
  totalDuration: number;
  triggerMode: SamplerTriggerMode;
  customAudioBuffer: AudioBuffer | null;
  externalSample?: LoadedSampleData | null;
  trackInfo: Partial<DiggerTrack> | null;
  stemsResult: StemsSeparationResult | null;
  activeStemFilterRef: React.RefObject<StemType | null>;
  ytPlayerRef: React.RefObject<HTMLIFrameElement | null>;
  onTriggerCue: (cue: SamplerCuePoint) => void;
  onStopAudio: () => void;
  onSeekPointer: (sec: number) => void;
}

export function useSamplerWaveform({
  isOpen,
  isStandalone,
  cues,
  setCues,
  selectedCueId,
  setSelectedCueId,
  totalDuration,
  triggerMode,
  customAudioBuffer,
  externalSample,
  trackInfo,
  stemsResult,
  activeStemFilterRef,
  ytPlayerRef,
  onTriggerCue,
  onStopAudio,
  onSeekPointer,
}: UseSamplerWaveformParams) {
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);
  const isInternalRegionUpdateRef = useRef<boolean>(false);
  const lastScrubSecRef = useRef<number>(0);
  const scrubSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(20);
  const [fitZoomBase, setFitZoomBase] = useState<number>(20);
  const [isWaveReady, setIsWaveReady] = useState<boolean>(false);
  const [draggingCueId, setDraggingCueId] = useState<number | null>(null);
  const [scrubDirection, setScrubDirection] = useState<"forward" | "backward" | null>(null);

  const liveRef = useRef({
    cues,
    selectedCueId,
    totalDuration,
    triggerMode,
    customAudioBuffer,
    externalSample,
    trackInfo,
    stemsResult,
    zoomLevel,
    onTriggerCue,
    onStopAudio,
    onSeekPointer,
  });

  useEffect(() => {
    liveRef.current = {
      cues,
      selectedCueId,
      totalDuration,
      triggerMode,
      customAudioBuffer,
      externalSample,
      trackInfo,
      stemsResult,
      zoomLevel,
      onTriggerCue,
      onStopAudio,
      onSeekPointer,
    };
  });

  useEffect(() => {
    return () => {
      studioAudio.stopScrub();
      if (scrubSilenceTimerRef.current) {
        clearTimeout(scrubSilenceTimerRef.current);
      }
    };
  }, []);

  const loadWaveformData = useCallback(
    (
      dur: number,
      buffer: AudioBuffer | null,
      track: Partial<DiggerTrack> | null,
      stemFilter: StemType | null = null,
      stems: StemsSeparationResult | null = null
    ) => {
      const ws = wavesurferRef.current;
      if (!ws) return;

      const validDur = Math.max(10, dur || 180);
      const totalPoints = Math.max(2400, Math.min(8000, Math.floor(validDur * 35)));

      if (stemFilter && stems && stems[stemFilter]) {
        try {
          const peaks = extractStemPeaks(stems[stemFilter], totalPoints);
          ws.load("", [peaks], validDur).catch((err) => {
            if (err?.name !== "AbortError") console.warn("WaveSurfer stem load notice:", err);
          });
          return;
        } catch (err) {
          console.warn("Error loading stem peaks into WaveSurfer:", err);
        }
      }

      if (!stemFilter && buffer) {
        try {
          const peaks = extractStemPeaks(buffer, totalPoints);
          ws.load("", [peaks], validDur).catch((err) => {
            if (err?.name !== "AbortError") console.warn("WaveSurfer buffer load notice:", err);
          });
          return;
        } catch (err) {
          console.error("Error loading buffer peaks into WaveSurfer:", err);
        }
      }

      const peaks = generateSimulatedWaveformPeaks(validDur, totalPoints, track, stemFilter);
      ws.load("", [peaks], validDur).catch((err) => {
        if (err?.name !== "AbortError") {
          console.warn("WaveSurfer load peaks notice:", err);
        }
      });
    },
    []
  );

  const syncRegions = useCallback((cuesList: SamplerCuePoint[], dur: number) => {
    const rp = regionsPluginRef.current;
    if (!rp) return;

    rp.clearRegions();
    const validDur = Math.max(10, dur || liveRef.current.totalDuration || 180);
    const sorted = [...cuesList].sort((a, b) => a.startSec - b.startSec);

    sorted.forEach((cue, idx) => {
      const safeStart = Math.max(0, Math.min(validDur - 0.05, cue.startSec));
      const nextCue = idx < sorted.length - 1 ? sorted[idx + 1] : null;
      const endLimit = nextCue ? nextCue.startSec : validDur;
      const sliceLen = Math.max(0.1, endLimit - cue.startSec).toFixed(1);

      const reg = rp.addRegion({
        id: String(cue.id),
        start: safeStart,
        end: safeStart,
        color: "transparent",
        drag: true,
        resize: false,
        avoidOverlapping: false,
      });

      const isSelected = liveRef.current.selectedCueId === cue.id;
      if (reg.element) {
        reg.element.style.background = "transparent";
        reg.element.style.backgroundColor = "transparent";
        reg.element.style.border = "none";
        reg.element.style.boxShadow = "none";
        reg.element.style.overflow = "visible";
        reg.element.style.zIndex = isSelected ? "35" : "25";
      }

      const keyHint = PAD_DISPLAY_KEYS[cue.id] || String(cue.id);
      const markerWrapper = document.createElement("div");
      markerWrapper.className = "serato-needle-marker";
      markerWrapper.dataset.cueId = String(cue.id);
      markerWrapper.style.position = "absolute";
      markerWrapper.style.top = "0";
      markerWrapper.style.bottom = "0";
      markerWrapper.style.left = "-12px";
      markerWrapper.style.width = "24px";
      markerWrapper.style.display = "flex";
      markerWrapper.style.flexDirection = "column";
      markerWrapper.style.alignItems = "center";
      markerWrapper.style.cursor = "ew-resize";
      markerWrapper.style.userSelect = "none";
      markerWrapper.style.pointerEvents = "auto";
      markerWrapper.title = `CHOP ${cue.id} [${keyHint}]: ${cue.name}\n• Rango: ${formatSeconds(cue.startSec)} ➔ ${formatSeconds(endLimit)} (${sliceLen}s)\n• Límite: ${nextCue ? `Marcador #${nextCue.id}` : "Final del audio"}\n• Arrastra dentro de sus límites | Clic para reproducir`;

      const flag = document.createElement("div");
      flag.className = "marker-flag";
      flag.style.display = "flex";
      flag.style.alignItems = "center";
      flag.style.justifyContent = "center";
      flag.style.gap = "2px";
      flag.style.padding = "2px 5px";
      flag.style.backgroundColor = cue.color;
      flag.style.color = "#07080B";
      flag.style.fontWeight = "900";
      flag.style.fontSize = "10px";
      flag.style.fontFamily = "monospace";
      flag.style.borderRadius = "3px";
      flag.style.boxShadow = isSelected
        ? `0 0 14px ${cue.color}, 0 2px 6px rgba(0,0,0,0.9)`
        : "0 2px 6px rgba(0,0,0,0.85)";
      flag.style.border = isSelected ? "1.5px solid #FFFFFF" : "1px solid rgba(0,0,0,0.6)";
      flag.style.transform = isSelected ? "scale(1.15)" : "scale(1)";
      flag.style.transition = "transform 0.1s ease, box-shadow 0.1s ease";
      flag.style.lineHeight = "1";
      flag.innerHTML = `<span>${cue.id}</span><span style="opacity:0.85;font-size:7.5px;">[${keyHint}]</span>`;

      const arrow = document.createElement("div");
      arrow.className = "marker-arrow";
      arrow.style.width = "0";
      arrow.style.height = "0";
      arrow.style.borderLeft = "4px solid transparent";
      arrow.style.borderRight = "4px solid transparent";
      arrow.style.borderTop = `5px solid ${cue.color}`;
      arrow.style.marginTop = "-1px";

      const needle = document.createElement("div");
      needle.className = "marker-needle";
      needle.style.flex = "1";
      needle.style.width = isSelected ? "2.5px" : "1.5px";
      needle.style.backgroundColor = cue.color;
      needle.style.boxShadow = isSelected ? `0 0 8px ${cue.color}` : "none";
      needle.style.opacity = isSelected ? "1" : "0.9";
      needle.style.transition = "width 0.1s ease, box-shadow 0.1s ease";

      const dot = document.createElement("div");
      dot.className = "marker-dot";
      dot.style.width = "5px";
      dot.style.height = "5px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = cue.color;
      dot.style.marginBottom = "2px";
      dot.style.boxShadow = isSelected ? `0 0 6px ${cue.color}` : "none";

      markerWrapper.appendChild(flag);
      markerWrapper.appendChild(arrow);
      markerWrapper.appendChild(needle);
      markerWrapper.appendChild(dot);

      reg.setContent(markerWrapper);
    });
  }, []);

  // Inicializar WaveSurfer V8
  useEffect(() => {
    if ((!isOpen && !isStandalone) || !waveformContainerRef.current) return;

    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.destroy();
      } catch {}
      wavesurferRef.current = null;
    }

    const regPlugin = RegionsPlugin.create();
    regionsPluginRef.current = regPlugin;

    const zoomPlugin = ZoomPlugin.create({
      scale: 0.5,
      maxZoom: 350,
      deltaThreshold: 5,
      exponentialZooming: true,
    });

    const ws = WaveSurfer.create({
      container: waveformContainerRef.current,
      height: 64,
      backend: "WebAudio",
      waveColor: ["#FFD600", "#FFD600", "#D4D4D8"],
      progressColor: ["#FFD600", "#FFD600", "#EAB308"],
      cursorColor: "#FFFFFF",
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 3,
      barHeight: 1.15,
      minPxPerSec: liveRef.current.zoomLevel,
      fillParent: true,
      autoScroll: true,
      autoCenter: false,
      interact: true,
      dragToSeek: true,
      hideScrollbar: false,
      plugins: [regPlugin, zoomPlugin],
    });

    wavesurferRef.current = ws;

    ws.on("zoom", (newMinPxPerSec) => {
      setZoomLevel(Math.round(newMinPxPerSec));
    });

    ws.on("ready", (dur) => {
      setIsWaveReady(true);
      const effectiveDur = dur || liveRef.current.totalDuration || 180;
      if (waveformContainerRef.current) {
        const containerWidth = waveformContainerRef.current.clientWidth || 850;
        const fitPx = Math.max(2, Math.floor(containerWidth / effectiveDur));
        setFitZoomBase(fitPx);
        setZoomLevel(fitPx);
        try {
          ws.zoom(fitPx);
        } catch {}
      }
      syncRegions(liveRef.current.cues, effectiveDur);
    });

    const init = liveRef.current;
    const currentDur = init.externalSample?.trackInfo?.durationSec || init.totalDuration;
    const currentBuffer = init.externalSample?.buffer || init.customAudioBuffer;
    const currentTrack = init.externalSample?.trackInfo || init.trackInfo;
    loadWaveformData(currentDur, currentBuffer, currentTrack, activeStemFilterRef.current, init.stemsResult);

    regPlugin.on("region-update", (region) => {
      const { dragMinSec, dragMaxSec } = calculateSliceBoundary(
        Number(region.id),
        liveRef.current.cues,
        liveRef.current.totalDuration
      );
      let currentSec = Math.round(region.start * 10) / 10;
      if (currentSec < dragMinSec) {
        currentSec = dragMinSec;
        try {
          region.setOptions({ start: dragMinSec, end: dragMinSec });
        } catch {}
      } else if (currentSec > dragMaxSec) {
        currentSec = dragMaxSec;
        try {
          region.setOptions({ start: dragMaxSec, end: dragMaxSec });
        } catch {}
      }

      const delta = currentSec - lastScrubSecRef.current;
      if (Math.abs(delta) >= 0.1) {
        lastScrubSecRef.current = currentSec;
        const dir: "forward" | "backward" = delta >= 0 ? "forward" : "backward";
        setScrubDirection(dir);
        setDraggingCueId(Number(region.id));
        studioAudio.scrubVinyl(dir, Math.abs(delta) * 50, currentSec, liveRef.current.customAudioBuffer);

        if (liveRef.current.trackInfo?.youtubeId && ytPlayerRef.current?.contentWindow) {
          ytPlayerRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "seekTo", args: [currentSec, true] }),
            "*"
          );
        }

        if (scrubSilenceTimerRef.current) clearTimeout(scrubSilenceTimerRef.current);
        scrubSilenceTimerRef.current = setTimeout(() => {
          studioAudio.stopScrub();
          setScrubDirection(null);
          setDraggingCueId(null);
        }, 90);
      }
    });

    regPlugin.on("region-updated", (region) => {
      const { dragMinSec, dragMaxSec } = calculateSliceBoundary(
        Number(region.id),
        liveRef.current.cues,
        liveRef.current.totalDuration
      );
      const finalizedSec = Math.max(dragMinSec, Math.min(dragMaxSec, Math.round(region.start * 10) / 10));

      setDraggingCueId(null);
      setScrubDirection(null);
      studioAudio.stopScrub();
      if (scrubSilenceTimerRef.current) {
        clearTimeout(scrubSilenceTimerRef.current);
        scrubSilenceTimerRef.current = null;
      }

      try {
        region.setOptions({ start: finalizedSec, end: finalizedSec });
      } catch {}

      isInternalRegionUpdateRef.current = true;
      const updatedCues = liveRef.current.cues.map((c) =>
        String(c.id) === region.id ? { ...c, startSec: finalizedSec } : c
      );
      liveRef.current.cues = updatedCues;
      setCues(updatedCues);

      try {
        const rp = regionsPluginRef.current;
        if (rp) {
          rp.getRegions().forEach((r) => {
            const limits = calculateSliceBoundary(Number(r.id), updatedCues, liveRef.current.totalDuration);
            const keyHint = PAD_DISPLAY_KEYS[Number(r.id)] || r.id;
            const markerWrapper = r.element?.querySelector(".serato-needle-marker") as HTMLElement | null;
            if (markerWrapper) {
              markerWrapper.title = `CHOP ${r.id} [${keyHint}]\n• Rango: ${formatSeconds(limits.startSec)} ➔ ${formatSeconds(limits.endLimitSec)} (${limits.naturalDurationSec.toFixed(1)}s)\n• Límite: ${limits.nextCue ? `Marcador #${limits.nextCue.id}` : "Final del audio"}\n• Arrastra dentro de sus límites | Clic para reproducir`;
            }
          });
        }
      } catch {}

      const cue = updatedCues.find((c) => String(c.id) === region.id);
      if (cue) {
        if (liveRef.current.triggerMode === "hold") {
          liveRef.current.onStopAudio();
        } else {
          liveRef.current.onTriggerCue({ ...cue, startSec: finalizedSec });
        }
      }
    });

    regPlugin.on("region-clicked", (region, e) => {
      e.stopPropagation();
      const cue = liveRef.current.cues.find((c) => String(c.id) === region.id);
      if (cue) {
        setSelectedCueId(cue.id);
        liveRef.current.onTriggerCue(cue);
      }
    });

    ws.on("click", (relativeX) => {
      const clickedSec = Math.round(relativeX * liveRef.current.totalDuration * 10) / 10;
      liveRef.current.onSeekPointer(clickedSec);
    });

    return () => {
      try {
        ws.destroy();
      } catch {}
      wavesurferRef.current = null;
      regionsPluginRef.current = null;
      setIsWaveReady(false);
    };
  }, [isOpen, isStandalone, loadWaveformData, syncRegions, activeStemFilterRef, ytPlayerRef, setCues, setSelectedCueId]);

  // Cargar buffer de audio en WaveSurfer cuando cambia customAudioBuffer
  useEffect(() => {
    if (!wavesurferRef.current || !customAudioBuffer) return;
    try {
      const dur = customAudioBuffer.duration || totalDuration;
      const points = Math.max(2400, Math.min(8000, Math.floor(dur * 35)));
      const peaks = extractStemPeaks(customAudioBuffer, points);
      wavesurferRef.current.load("", [peaks], dur).catch((err) => {
        if (err?.name !== "AbortError") console.warn("WaveSurfer load buffer notice:", err);
      });
    } catch (err) {
      console.error("Error loading buffer peaks into WaveSurfer:", err);
    }
  }, [customAudioBuffer, totalDuration]);

  // Sincronizar regiones cuando la lista de cues cambie
  useEffect(() => {
    if (isInternalRegionUpdateRef.current) {
      isInternalRegionUpdateRef.current = false;
      return;
    }
    if (wavesurferRef.current && isWaveReady) {
      syncRegions(cues, totalDuration);
    }
  }, [cues, totalDuration, isWaveReady, syncRegions]);

  // Resaltar visualmente el marcador seleccionado
  useEffect(() => {
    const rp = regionsPluginRef.current;
    if (!rp) return;
    try {
      rp.getRegions().forEach((reg) => {
        const isSelected = reg.id === String(selectedCueId);
        if (!reg.element) return;
        reg.element.style.background = "transparent";
        reg.element.style.backgroundColor = "transparent";
        reg.element.style.border = "none";
        reg.element.style.boxShadow = "none";
        reg.element.style.zIndex = isSelected ? "40" : "25";

        const cue = liveRef.current.cues.find((c) => String(c.id) === reg.id);
        const color = cue?.color || "#FFD600";

        const flag = reg.element.querySelector(".marker-flag") as HTMLElement | null;
        if (flag) {
          flag.style.transform = isSelected ? "scale(1.15)" : "scale(1)";
          flag.style.border = isSelected ? "1.5px solid #FFFFFF" : "1px solid rgba(0,0,0,0.6)";
          flag.style.boxShadow = isSelected
            ? `0 0 14px ${color}, 0 2px 6px rgba(0,0,0,0.9)`
            : "0 2px 6px rgba(0,0,0,0.85)";
        }

        const needle = reg.element.querySelector(".marker-needle") as HTMLElement | null;
        if (needle) {
          needle.style.width = isSelected ? "2.5px" : "1.5px";
          needle.style.boxShadow = isSelected ? `0 0 8px ${color}` : "none";
          needle.style.opacity = isSelected ? "1" : "0.9";
        }

        const dot = reg.element.querySelector(".marker-dot") as HTMLElement | null;
        if (dot) {
          dot.style.boxShadow = isSelected ? `0 0 6px ${color}` : "none";
        }
      });
    } catch {}
  }, [selectedCueId]);

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(2, Math.min(300, newZoom));
    setZoomLevel(clamped);
    if (wavesurferRef.current && isWaveReady) {
      try {
        wavesurferRef.current.zoom(clamped);
      } catch {}
    }
  };

  const handleResetZoom = () => {
    if (!waveformContainerRef.current) return;
    const containerWidth = waveformContainerRef.current.clientWidth || 800;
    const fitZoom = Math.max(2, Math.floor(containerWidth / Math.max(1, totalDuration)));
    setFitZoomBase(fitZoom);
    setZoomLevel(fitZoom);
    if (wavesurferRef.current && isWaveReady) {
      try {
        wavesurferRef.current.zoom(fitZoom);
      } catch {}
    }
  };

  const setWaveformTime = useCallback((sec: number) => {
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.setTime(sec);
      } catch {}
    }
  }, []);

  return {
    waveformContainerRef,
    zoomLevel,
    fitZoomBase,
    isWaveReady,
    draggingCueId,
    scrubDirection,
    loadWaveformData,
    setWaveformTime,
    handleZoomChange,
    handleResetZoom,
  };
}
