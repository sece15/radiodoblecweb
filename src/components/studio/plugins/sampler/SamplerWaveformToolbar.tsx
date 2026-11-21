"use client";

import type { RefObject } from "react";
import { Loader2, Maximize2, Pause, Play, Square, ZoomIn, ZoomOut } from "lucide-react";
import type { SamplerCuePoint, SamplerTriggerMode, StemType } from "@/types/studio";
import { calculateSliceBoundary } from "@/lib/contracts/samplerContracts";
import { formatSeconds, PAD_DISPLAY_KEYS } from "@/lib/studio/samplerConstants";

interface SamplerWaveformToolbarProps {
  waveformContainerRef: RefObject<HTMLDivElement | null>;
  activeStemFilter: StemType | null;
  totalDuration: number;
  hasCustomAudio: boolean;
  isRescuingAudio: boolean;
  isWaveReady: boolean;
  zoomLevel: number;
  fitZoomBase: number;
  isPlayingSong: boolean;
  playbackPointerSec: number;
  draggingCueId: number | null;
  scrubDirection: "forward" | "backward" | null;
  cues: SamplerCuePoint[];
  selectedCueId: number | null;
  triggerMode: SamplerTriggerMode;
  onZoomChange: (newZoom: number) => void;
  onResetZoom: () => void;
  onPlayPauseSong: () => void;
  onStopSong: () => void;
  onSeekPointer: (sec: number) => void;
}

export function SamplerWaveformToolbar({
  waveformContainerRef,
  activeStemFilter,
  totalDuration,
  hasCustomAudio,
  isRescuingAudio,
  isWaveReady,
  zoomLevel,
  fitZoomBase,
  isPlayingSong,
  playbackPointerSec,
  draggingCueId,
  scrubDirection,
  cues,
  selectedCueId,
  triggerMode,
  onZoomChange,
  onResetZoom,
  onPlayPauseSong,
  onStopSong,
  onSeekPointer,
}: SamplerWaveformToolbarProps) {
  const selectedCue = selectedCueId !== null ? cues.find((c) => c.id === selectedCueId) : null;
  const selectedLimits = selectedCue
    ? calculateSliceBoundary(selectedCue.id, cues, totalDuration)
    : null;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", margin: "4px 0" }}>
        {/* Toolbar de la Forma de Onda: Badges + Controles de Zoom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "6px",
            padding: "4px 8px",
            backgroundColor: "#07090F",
            border: "1px solid #22242C",
            borderRadius: "4px 4px 0 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {activeStemFilter ? (
              <span
                style={{
                  fontSize: "0.55rem",
                  fontWeight: 900,
                  backgroundColor: activeStemFilter === "melody" ? "#D4D4D822" : "#FFD60022",
                  color: activeStemFilter === "melody" ? "#D4D4D8" : "#FFD600",
                  border: `1px solid ${activeStemFilter === "melody" ? "#D4D4D8" : "#FFD600"}`,
                  padding: "1px 6px",
                  borderRadius: "2px",
                  letterSpacing: "0.5px",
                }}
              >
                {activeStemFilter === "drums" && "🥁 BATERÍA AISLADA"}
                {activeStemFilter === "bass" && "🎸 BAJO AISLADO"}
                {activeStemFilter === "melody" && "🎹 MELODÍA AISLADA"}
                {activeStemFilter === "vocals" && "🎤 VOCAL AISLADA"}
              </span>
            ) : (
              <span
                style={{
                  fontSize: "0.54rem",
                  fontWeight: 800,
                  color: "#8E939E",
                  backgroundColor: "#111622",
                  padding: "1px 5px",
                  borderRadius: "2px",
                }}
              >
                FULL MIX (RGB)
              </span>
            )}
            <span
              style={{
                fontSize: "0.55rem",
                fontWeight: 900,
                backgroundColor: "#14151A",
                color: "#FFD600",
                padding: "1px 5px",
                borderRadius: "2px",
                border: "1px solid #2E313B",
                fontFamily: "monospace",
              }}
            >
              {formatSeconds(totalDuration)}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.52rem",
                fontWeight: 900,
                color: hasCustomAudio ? "#4ADE80" : isRescuingAudio || !isWaveReady ? "#FFD600" : "#D4D4D8",
                fontFamily: "monospace",
              }}
              title={
                hasCustomAudio
                  ? "Audio cargado en memoria: 0ms de latencia con Pitch, Fine, Offset, Filter, Crunch y Volume reales"
                  : isRescuingAudio
                  ? "Descargando el audio del sample a memoria RAM para habilitar efectos DSP sin latencia"
                  : "Listo para reproducir"
              }
            >
              {isRescuingAudio ? (
                <>
                  <Loader2 size={9} className="animate-spin" />
                  <span>RESCATANDO...</span>
                </>
              ) : hasCustomAudio ? (
                "● RAM READY"
              ) : isWaveReady ? (
                "● READY"
              ) : (
                "● CARGANDO..."
              )}
            </span>
          </div>

          {/* Controles Interactivos de Zoom */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "0.58rem", fontWeight: 900, color: "#FFD600", letterSpacing: "0.4px" }}>
              🔍 ZOOM:
            </span>
            <button
              type="button"
              onClick={() => onZoomChange(zoomLevel - 15)}
              style={{
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#14151A",
                color: "#FFFFFF",
                border: "1px solid #2E313B",
                borderRadius: "2px",
                cursor: "pointer",
              }}
              title="Alejar (Zoom Out)"
            >
              <ZoomOut size={11} />
            </button>
            <input
              type="range"
              min={2}
              max={250}
              step={2}
              value={zoomLevel}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              style={{ width: "80px", height: "4px", accentColor: "#FFD600", cursor: "pointer" }}
              title="Nivel de zoom en segundos"
            />
            <button
              type="button"
              onClick={() => onZoomChange(zoomLevel + 15)}
              style={{
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#14151A",
                color: "#FFFFFF",
                border: "1px solid #2E313B",
                borderRadius: "2px",
                cursor: "pointer",
              }}
              title="Acercar (Zoom In)"
            >
              <ZoomIn size={11} />
            </button>
            <button
              type="button"
              onClick={onResetZoom}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                padding: "2px 8px",
                backgroundColor: "#E4E4E7",
                color: "#090A0D",
                border: "1px solid #090A0D",
                borderRadius: "4px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85), 0 2px 0 #07080A",
                fontSize: "0.58rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: "pointer",
              }}
              title="Ajustar toda la canción en pantalla"
            >
              <Maximize2 size={9} />
              <span>FIT</span>
            </button>
            <span style={{ fontSize: "0.56rem", fontFamily: "monospace", color: "#8E9AA8", minWidth: "48px" }}>
              {Math.max(1, Math.round((zoomLevel / Math.max(1, fitZoomBase)) * 10) / 10).toFixed(1)}x
            </span>
            <span style={{ fontSize: "0.50rem", color: "#5C6A82" }}>[Rueda para zoom]</span>
          </div>
        </div>

        {/* BARRA DE TRANSPORTE & PUNTERO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            padding: "5px 10px",
            backgroundColor: "#090A0D",
            borderLeft: "2px solid #FFD600",
            borderRight: "1px solid #1A1C23",
            borderTop: "1px solid #1A1C23",
            borderBottom: "1px solid #1A1C23",
            margin: "2px 0",
            borderRadius: "3px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              onClick={onPlayPauseSong}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 12px",
                backgroundColor: isPlayingSong ? "#D4D4D8" : "#FFD600",
                color: "#07080B",
                border: isPlayingSong ? "1px solid #FFFFFF" : "1px solid #FFE866",
                borderRadius: "3px",
                fontSize: "0.68rem",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: isPlayingSong
                  ? "0 0 14px rgba(212, 212, 216, 0.85), 0 0 28px rgba(212, 212, 216, 0.4)"
                  : "0 0 14px rgba(255, 214, 0, 0.85), 0 0 28px rgba(255, 214, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.75)",
                transition: "all 0.12s ease",
              }}
              title={isPlayingSong ? "Pausar canción [Espacio]" : "Reproducir canción continua [Espacio]"}
            >
              {isPlayingSong ? <Pause size={12} fill="#07080B" /> : <Play size={12} fill="#07080B" />}
              <span>{isPlayingSong ? "PAUSAR" : "REPRODUCIR"}</span>
            </button>

            <button
              type="button"
              onClick={onStopSong}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                backgroundColor: "#14151A",
                color: "#A1A1AA",
                border: "1px solid #2A2D36",
                borderRadius: "3px",
                fontSize: "0.65rem",
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
              title="Detener canción y reiniciar puntero a 00:00.0"
            >
              <Square size={10} fill="#A1A1AA" />
              <span>PARAR</span>
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 8px",
                backgroundColor: "#07090F",
                border: "1px solid #262830",
                borderRadius: "3px",
                fontFamily: "monospace",
              }}
            >
              <span style={{ fontSize: "0.58rem", color: "#71717A", fontWeight: 700 }}>PUNTERO:</span>
              <span style={{ fontSize: "0.72rem", color: "#FFD600", fontWeight: 900 }}>
                {formatSeconds(playbackPointerSec)}
              </span>
              <span style={{ fontSize: "0.65rem", color: "#475569" }}>/</span>
              <span style={{ fontSize: "0.68rem", color: "#A1A1AA" }}>{formatSeconds(totalDuration)}</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: "160px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.58rem", color: "#71717A", fontWeight: 800, whiteSpace: "nowrap" }}>
              DESLIZAR PUNTERO:
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(1, totalDuration)}
              step={0.1}
              value={playbackPointerSec}
              onChange={(e) => onSeekPointer(parseFloat(e.target.value))}
              style={{
                flex: 1,
                height: "5px",
                accentColor: activeStemFilter === "melody" ? "#D4D4D8" : "#FFD600",
                cursor: "pointer",
              }}
              title={`Mover puntero de la canción (${formatSeconds(playbackPointerSec)})`}
            />
          </div>
        </div>

        {/* Host de WaveSurfer */}
        <div
          style={{
            position: "relative",
            backgroundColor: "#07080D",
            border: "1.5px solid #232B3E",
            borderRadius: "0 0 4px 4px",
            overflow: "hidden",
            padding: "1px",
          }}
        >
          {draggingCueId !== null && (
            <div
              style={{
                position: "absolute",
                top: "6px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: scrubDirection === "backward" ? "#D4D4D8" : "#FFD600",
                color: "#111111",
                fontWeight: 900,
                fontSize: "0.62rem",
                padding: "2px 9px",
                borderRadius: "3px",
                boxShadow: "0 0 14px rgba(0,0,0,0.9)",
                zIndex: 50,
                letterSpacing: "0.5px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                pointerEvents: "none",
              }}
            >
              <span>
                {scrubDirection === "backward"
                  ? "⏪ ATRASANDO (REVERSE VINYL SCRUB)"
                  : "⏩ ADELANTANDO (FORWARD TAPE SCRUB)"}
              </span>
            </div>
          )}

          <div
            ref={waveformContainerRef}
            className="csampler-wavesurfer-host"
            style={{ width: "100%", minHeight: "66px", cursor: "crosshair" }}
            title="Haz clic en cualquier punto para mover el puntero de reproducción. Arrastra las etiquetas de los cortes (1, 2, 3...) para reubicarlos. Rueda del ratón para zoom."
          />
        </div>

        <style>{`
          .csampler-wavesurfer-host ::-webkit-scrollbar { height: 5px; }
          .csampler-wavesurfer-host ::-webkit-scrollbar-track { background: #090B10; }
          .csampler-wavesurfer-host ::-webkit-scrollbar-thumb { background: #252D42; border-radius: 3px; }
          .csampler-wavesurfer-host ::-webkit-scrollbar-thumb:hover { background: #FFD600; }
          .csampler-wavesurfer-host .wavesurfer-region { transition: background-color 0.15s ease !important; }
          .csampler-wavesurfer-host .wavesurfer-region:hover { filter: brightness(1.2) !important; }
        `}</style>
      </div>

      {/* Instruction Guidance bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "6px",
          fontSize: "0.66rem",
          color: "#8E939E",
        }}
      >
        <span>
          💡 <strong style={{ color: "#FFD600" }}>Límites Sucesivos Serato:</strong> El límite del{" "}
          <strong style={{ color: "#FFFFFF" }}>Marcador 1 es el Marcador 2</strong>, el 2 es el 3, y así sucesivamente.
        </span>
        {selectedCue && selectedLimits && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#111624",
              padding: "2px 8px",
              borderRadius: "3px",
              border: `1px solid ${selectedCue.color}77`,
            }}
          >
            <span style={{ color: selectedCue.color, fontWeight: 900 }}>
              CHOP #{selectedCue.id} [{PAD_DISPLAY_KEYS[selectedCue.id] || selectedCue.id}]:
            </span>
            <span style={{ color: "#FFFFFF", fontFamily: "monospace", fontWeight: 800 }}>
              {formatSeconds(selectedCue.startSec)} ➔ {formatSeconds(selectedLimits.endLimitSec)}
            </span>
            <span
              style={{
                backgroundColor: selectedCue.color,
                color: "#07080B",
                fontWeight: 900,
                fontSize: "0.58rem",
                padding: "1px 4px",
                borderRadius: "2px",
              }}
            >
              {selectedLimits.naturalDurationSec.toFixed(1)}s
            </span>
            <span style={{ color: "#A0A8BC", fontSize: "0.60rem" }}>
              (
              {triggerMode === "full_track"
                ? "modo continuo: todo"
                : selectedLimits.nextCue
                ? `corta en Marcador #${selectedLimits.nextCue.id}`
                : "corta al final"}
              )
            </span>
          </span>
        )}
      </div>
    </>
  );
}
