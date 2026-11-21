"use client";

import { Volume2, VolumeX } from "lucide-react";
import { LAYERS, type FocusStage, type LayerId } from "@/lib/studio/breakdownConstants";

interface BreakdownSequencerGridProps {
  focusStage: FocusStage;
  totalBars: number;
  visibleBar: number;
  isPlaying: boolean;
  playheadPct: number;
  activeStep: number;
  patterns: Record<"kick" | "snare" | "hats" | "bass", boolean[][]>;
  mutedLayers: Record<LayerId, boolean>;
  bassPeaks: number[];
  melodyPeaks: number[];
  isLayerAudible: (layer: LayerId, stage: FocusStage, muted: Record<LayerId, boolean>) => boolean;
  onSetFullLoop: () => void;
  onChangeTotalBars: (bars: 1 | 2 | 4 | 8) => void;
  onChangeEditingBar: (barIdx: number) => void;
  onToggleLayerFocus: (layerId: LayerId) => void;
  onTogglePad: (layer: "kick" | "snare" | "hats" | "bass", stepIdx: number) => void;
  onToggleMute: (layer: LayerId, e: React.MouseEvent) => void;
}

export function BreakdownSequencerGrid({
  focusStage,
  totalBars,
  visibleBar,
  isPlaying,
  playheadPct,
  activeStep,
  patterns,
  mutedLayers,
  bassPeaks,
  melodyPeaks,
  isLayerAudible,
  onSetFullLoop,
  onChangeTotalBars,
  onChangeEditingBar,
  onToggleLayerFocus,
  onTogglePad,
  onToggleMute,
}: BreakdownSequencerGridProps) {
  return (
    <section
      style={{
        border: "2.5px solid var(--primary)",
        backgroundColor: "var(--card-bg)",
        boxShadow: "6px 6px 0px var(--primary)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Sequencer Frame Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: "1.5px solid var(--primary)",
          backgroundColor: "var(--surface-container)",
          fontSize: "0.72rem",
          fontWeight: 800,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span>SEQUENCER · 16 STEPS</span>
          <button
            type="button"
            onClick={onSetFullLoop}
            style={{
              padding: "2px 8px",
              fontSize: "0.62rem",
              fontWeight: 900,
              letterSpacing: "0.1em",
              border: "1.5px solid var(--primary)",
              backgroundColor: focusStage === "full" ? "var(--primary-container)" : "transparent",
              color: focusStage === "full" ? "var(--on-primary-container)" : "var(--on-background)",
              cursor: "pointer",
            }}
          >
            FULL LOOP
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "3px", marginRight: "6px" }}>
            <span style={{ fontSize: "0.60rem", color: "var(--on-surface-variant)", letterSpacing: "0.08em" }}>
              COMPASES:
            </span>
            {([1, 2, 4, 8] as const).map((bars) => (
              <button
                key={bars}
                type="button"
                onClick={() => onChangeTotalBars(bars)}
                style={{
                  padding: "2px 6px",
                  fontSize: "0.62rem",
                  fontWeight: 900,
                  border: "1.5px solid var(--primary)",
                  backgroundColor: totalBars === bars ? "var(--primary-container)" : "transparent",
                  color: totalBars === bars ? "var(--on-primary-container)" : "var(--on-background)",
                  cursor: "pointer",
                }}
                title={`Expandir el beat a ${bars} ${bars === 1 ? "compás" : "compases"}`}
              >
                {bars}
              </button>
            ))}
          </div>

          <span style={{ fontSize: "0.68rem", fontWeight: 900, letterSpacing: "0.14em" }}>
            BAR {visibleBar + 1} OF {totalBars}
          </span>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
            {Array.from({ length: totalBars }, (_, barIdx) => (
              <button
                key={barIdx}
                type="button"
                onClick={() => onChangeEditingBar(barIdx)}
                style={{
                  width: "20px",
                  height: "20px",
                  fontSize: "0.62rem",
                  fontWeight: 900,
                  border: visibleBar === barIdx ? "1.5px solid var(--primary)" : "1px solid var(--on-surface-variant)",
                  backgroundColor: visibleBar === barIdx ? "var(--primary)" : "transparent",
                  color: visibleBar === barIdx ? "var(--on-primary)" : "var(--on-surface-variant)",
                  cursor: "pointer",
                }}
                title={`Editar Compás ${barIdx + 1}`}
              >
                {barIdx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5 SEPARATED LAYER ROWS + CONTINUOUS PLAYHEAD OVERLAY */}
      <div style={{ position: "relative", padding: "12px 0 8px" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: "28px",
            left: "112px",
            right: "54px",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {[0, 25, 50, 75].map((pct) => (
            <div
              key={pct}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${pct}%`,
                width: "1px",
                backgroundColor: "var(--primary)",
                opacity: 0.12,
              }}
            />
          ))}

          {isPlaying && (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${playheadPct}%`,
                width: "2.5px",
                backgroundColor: "var(--primary-container)",
                boxShadow: "0 0 8px var(--primary-container)",
                transform: "translateX(-1px)",
              }}
            />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {LAYERS.map((layer) => {
            const isFocused = focusStage === layer.id;
            const isAudible = isLayerAudible(layer.id, focusStage, mutedLayers);
            const isMuted = mutedLayers[layer.id];

            const rowBg = isFocused ? "var(--primary)" : "transparent";
            const rowText = isFocused ? "var(--on-primary)" : "var(--on-background)";
            const rowOpacity = isMuted ? 0.28 : isAudible ? 1 : 0.35;

            return (
              <div
                key={layer.id}
                onClick={() => onToggleLayerFocus(layer.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "112px minmax(0, 1fr) 54px",
                  alignItems: "center",
                  minHeight: layer.kind === "waveform" ? "66px" : "56px",
                  padding: "6px 0",
                  backgroundColor: rowBg,
                  color: rowText,
                  opacity: rowOpacity,
                  cursor: "pointer",
                  transition: "background-color 0.2s ease, opacity 0.2s ease",
                }}
              >
                <div
                  style={{
                    paddingLeft: "18px",
                    fontSize: "0.78rem",
                    fontWeight: 900,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    userSelect: "none",
                  }}
                >
                  {layer.label}
                </div>

                {layer.kind === "pads" ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(16, minmax(0, 1fr))",
                      gap: "6px",
                      alignItems: "center",
                      padding: "0 4px",
                    }}
                  >
                    {patterns[layer.id as "kick" | "snare" | "hats"][visibleBar].map((active, stepIdx) => {
                      const isPlayheadStep = isPlaying && activeStep === stepIdx;
                      return (
                        <button
                          key={stepIdx}
                          type="button"
                          onClick={() => onTogglePad(layer.id as "kick" | "snare" | "hats", stepIdx)}
                          aria-label={`${layer.label} step ${stepIdx + 1}`}
                          style={{
                            width: "100%",
                            aspectRatio: "1 / 1",
                            maxWidth: "24px",
                            maxHeight: "24px",
                            margin: "0 auto",
                            border: active
                              ? `2px solid ${isFocused ? "var(--primary-container)" : "var(--primary)"}`
                              : `1.5px solid ${isFocused ? "var(--on-primary)" : "var(--primary)"}`,
                            backgroundColor: active
                              ? isPlayheadStep
                                ? "var(--primary-container)"
                                : isFocused
                                ? "var(--on-primary)"
                                : "var(--primary)"
                              : "transparent",
                            opacity: active ? 1 : isPlayheadStep ? 0.55 : 0.22,
                            transform: isPlayheadStep && active ? "scale(1.18)" : "scale(1)",
                            transition: "transform 0.08s ease, background-color 0.1s ease",
                            cursor: "pointer",
                            borderRadius: "2px",
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "relative",
                      height: "52px",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 4px",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1px",
                        pointerEvents: layer.id === "bass" ? "none" : "auto",
                      }}
                      onClick={() => onToggleLayerFocus(layer.id)}
                    >
                      {(layer.id === "bass" ? bassPeaks : melodyPeaks).map((amp, i) => {
                        const barPct = (i / (layer.id === "bass" ? bassPeaks.length : melodyPeaks.length)) * 100;
                        const isPastPlayhead = isPlaying && barPct <= playheadPct;
                        return (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: `${Math.max(8, Math.round(amp * 100))}%`,
                              backgroundColor: isPastPlayhead
                                ? "var(--primary-container)"
                                : isFocused
                                ? "var(--on-primary)"
                                : "var(--primary)",
                              opacity: isPastPlayhead ? 1 : 0.85,
                              borderRadius: "1px",
                            }}
                          />
                        );
                      })}
                    </div>

                    {layer.id === "bass" && (
                      <div
                        style={{
                          position: "absolute",
                          inset: "0 4px",
                          display: "grid",
                          gridTemplateColumns: "repeat(16, minmax(0, 1fr))",
                          gap: "4px",
                          alignItems: "flex-end",
                        }}
                      >
                        {patterns.bass[visibleBar].map((active, stepIdx) => (
                          <button
                            key={stepIdx}
                            type="button"
                            onClick={() => onTogglePad("bass", stepIdx)}
                            title={`Bass step ${stepIdx + 1}`}
                            style={{
                              height: "100%",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "flex-end",
                              justifyContent: "center",
                              paddingBottom: "2px",
                            }}
                          >
                            <span
                              style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "1px",
                                backgroundColor: active
                                  ? "var(--primary-container)"
                                  : isFocused
                                  ? "var(--on-primary)"
                                  : "var(--primary)",
                                opacity: active ? 1 : 0.18,
                                border: active ? "1px solid var(--primary)" : "none",
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "center", paddingRight: "10px" }}>
                  <button
                    type="button"
                    onClick={(e) => onToggleMute(layer.id, e)}
                    title={isMuted ? `Activar ${layer.label}` : `Silenciar ${layer.label}`}
                    style={{
                      width: "26px",
                      height: "26px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1.5px solid ${isFocused ? "var(--on-primary)" : "var(--primary)"}`,
                      backgroundColor: isMuted ? "var(--error)" : "transparent",
                      color: isMuted ? "#FFFFFF" : rowText,
                      cursor: "pointer",
                      borderRadius: "2px",
                    }}
                  >
                    {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Beat Numbers Axis: 1 2 3 4 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "112px minmax(0, 1fr) 54px",
            marginTop: "8px",
            paddingTop: "6px",
            borderTop: "1px solid var(--surface-container)",
          }}
        >
          <div />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              padding: "0 4px",
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "var(--on-surface-variant)",
              fontFamily: "monospace",
            }}
          >
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
          </div>
          <div />
        </div>
      </div>
    </section>
  );
}
