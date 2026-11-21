"use client";

import { ArrowLeft, Disc, Play, RotateCcw, Square, Zap } from "lucide-react";
import { LAYERS, type FocusStage, type LayerId } from "@/lib/studio/breakdownConstants";

interface BreakdownHeaderBarProps {
  beatTitle: string;
  bpm: number;
  musicalKey?: string;
  autoBreakdown: boolean;
  isPlaying: boolean;
  focusStage: FocusStage;
  activeStageIndex: number;
  onBackToSampler: () => void;
  onBackToDigger: () => void;
  onChangeTitle: (title: string) => void;
  onDecrementBpm: () => void;
  onIncrementBpm: () => void;
  onToggleAutoBreakdown: () => void;
  onResetPattern: () => void;
  onTogglePlay: () => void;
  onToggleLayerFocus: (layerId: LayerId) => void;
}

export function BreakdownHeaderBar({
  beatTitle,
  bpm,
  musicalKey,
  autoBreakdown,
  isPlaying,
  focusStage,
  activeStageIndex,
  onBackToSampler,
  onBackToDigger,
  onChangeTitle,
  onDecrementBpm,
  onIncrementBpm,
  onToggleAutoBreakdown,
  onResetPattern,
  onTogglePlay,
  onToggleLayerFocus,
}: BreakdownHeaderBarProps) {
  return (
    <>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "46px",
              height: "46px",
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              border: "3px solid var(--primary)",
              boxShadow: "4px 4px 0px var(--primary-container)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "1.05rem",
              letterSpacing: "-1px",
              userSelect: "none",
            }}
            title="Radio Doble C · C-Station"
          >
            DC
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onBackToSampler}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                backgroundColor: "var(--surface-container)",
                color: "var(--on-background)",
                border: "2px solid var(--primary)",
                boxShadow: "3px 3px 0px var(--primary)",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={14} />
              C-SAMPLER
            </button>

            <button
              type="button"
              onClick={onBackToDigger}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                backgroundColor: "var(--card-bg)",
                color: "var(--on-background)",
                border: "2px solid var(--primary)",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              <Disc size={14} />
              C-DIGGER
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--on-surface-variant)",
            }}
          >
            BEAT BREAKDOWN
          </span>
        </div>
      </header>

      <section style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "240px", flex: 1 }}>
            <input
              type="text"
              value={beatTitle}
              onChange={(e) => onChangeTitle(e.target.value.toUpperCase())}
              aria-label="Título del beat"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--on-background)",
                fontFamily: "'Outfit', 'Space Grotesk', sans-serif",
                fontSize: "clamp(1.35rem, 3.2vw, 2rem)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                width: "100%",
                padding: 0,
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "var(--on-surface-variant)",
                textTransform: "uppercase",
              }}
            >
              <span>{bpm} BPM</span>
              <span>·</span>
              <span>5 LAYERS</span>
              {musicalKey && (
                <>
                  <span>·</span>
                  <span>{musicalKey}</span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "2px solid var(--primary)",
                backgroundColor: "var(--card-bg)",
              }}
            >
              <button
                type="button"
                onClick={onDecrementBpm}
                style={{
                  padding: "6px 10px",
                  background: "transparent",
                  border: "none",
                  color: "var(--on-background)",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                title="Bajar BPM"
              >
                −
              </button>
              <span style={{ fontSize: "0.75rem", fontWeight: 900, padding: "0 6px", fontFamily: "monospace" }}>
                {bpm}
              </span>
              <button
                type="button"
                onClick={onIncrementBpm}
                style={{
                  padding: "6px 10px",
                  background: "transparent",
                  border: "none",
                  color: "var(--on-background)",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                title="Subir BPM"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleAutoBreakdown}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "7px 12px",
                backgroundColor: autoBreakdown ? "var(--primary-container)" : "var(--surface-container)",
                color: autoBreakdown ? "var(--on-primary-container)" : "var(--on-background)",
                border: "2px solid var(--primary)",
                fontWeight: 900,
                fontSize: "0.72rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
              title="Cicla automáticamente Full Loop y las 5 capas"
            >
              <Zap size={13} />
              AUTO BREAKDOWN
            </button>

            <button
              type="button"
              onClick={onResetPattern}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "7px 10px",
                backgroundColor: "var(--surface-container)",
                color: "var(--on-background)",
                border: "2px solid var(--primary)",
                cursor: "pointer",
              }}
              title="Restaurar patrón BoomBap"
            >
              <RotateCcw size={14} />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 18px",
                backgroundColor: isPlaying ? "var(--error)" : "var(--primary-container)",
                color: isPlaying ? "#FFFFFF" : "var(--on-primary-container)",
                border: "2px solid var(--primary)",
                boxShadow: "3px 3px 0px var(--primary)",
                fontWeight: 900,
                fontSize: "0.78rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              {isPlaying ? "STOP" : "PLAY"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "8px", marginTop: "2px" }}>
          {LAYERS.map((layer, idx) => {
            const isFilled = focusStage === "full" || idx < activeStageIndex;
            const isCurrent = focusStage === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => onToggleLayerFocus(layer.id)}
                title={`Enfocar capa ${layer.label} (o clic de nuevo para Full Loop)`}
                style={{
                  height: isCurrent ? "7px" : "4px",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  backgroundColor: isCurrent
                    ? "var(--primary-container)"
                    : isFilled
                    ? "var(--primary)"
                    : "var(--surface-container)",
                  opacity: isFilled ? 1 : 0.45,
                  transition: "all 0.2s ease",
                }}
              />
            );
          })}
        </div>
      </section>
    </>
  );
}
