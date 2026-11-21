"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Akai16LevelsType, SamplerCuePoint, SamplerTriggerMode } from "@/types/studio";
import { calculateSliceBoundary } from "@/lib/contracts/samplerContracts";
import {
  AKAI_16_LEVELS_DECAYS,
  AKAI_16_LEVELS_FILTERS,
  AKAI_16_LEVELS_SEMITONES,
  AKAI_16_LEVELS_VELOCITIES,
  formatSeconds,
  PAD_DISPLAY_KEYS,
} from "@/lib/studio/samplerConstants";

interface SamplerCuePadsGridProps {
  is16Levels: boolean;
  akai16Type: Akai16LevelsType;
  active16LevelPad: number | null;
  cues: SamplerCuePoint[];
  visibleCues: SamplerCuePoint[];
  activeBank: "A" | "B" | "ALL";
  activeCueId: number | null;
  selectedCueId: number | null;
  editingCueId: number | null;
  editingCueName: string;
  triggerMode: SamplerTriggerMode;
  totalDuration: number;
  onChangeAkai16Type: (type: Akai16LevelsType) => void;
  onTrigger16Level: (padNum: number) => void;
  onTriggerCue: (cue: SamplerCuePoint) => void;
  onStopAudio: () => void;
  onDeleteCue: (e: React.MouseEvent, cueId: number) => void;
  onStartRename: (e: React.MouseEvent, cue: SamplerCuePoint) => void;
  onChangeEditingName: (val: string) => void;
  onSaveRename: (cueId: number) => void;
  onCancelRename: () => void;
}

export function SamplerCuePadsGrid({
  is16Levels,
  akai16Type,
  active16LevelPad,
  cues,
  visibleCues,
  activeBank,
  activeCueId,
  selectedCueId,
  editingCueId,
  editingCueName,
  triggerMode,
  totalDuration,
  onChangeAkai16Type,
  onTrigger16Level,
  onTriggerCue,
  onStopAudio,
  onDeleteCue,
  onStartRename,
  onChangeEditingName,
  onSaveRename,
  onCancelRename,
}: SamplerCuePadsGridProps) {
  if (is16Levels) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.70rem", fontWeight: 900, color: "#EAB308" }}>
              🎹 AKAI MPC 16 LEVELS:
            </span>
            <div style={{ display: "flex", gap: "3px" }}>
              {(
                [
                  { type: "tune" as const, label: "🎵 TUNE", desc: "Varispeed cromático (-7 a +8 st)" },
                  { type: "velocity" as const, label: "⚡ VELOCITY", desc: "Dinámica y rolls (10% a 100%)" },
                  { type: "filter" as const, label: "🎛️ FILTER", desc: "Filtro Low-pass (300Hz a 18kHz)" },
                  { type: "decay" as const, label: "⏱️ DECAY", desc: "Largo de envolvente (80ms a 4s)" },
                ]
              ).map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => onChangeAkai16Type(t.type)}
                  style={{
                    padding: "2px 7px",
                    fontSize: "0.56rem",
                    fontWeight: 900,
                    backgroundColor: akai16Type === t.type ? "#EAB308" : "#1B1F2A",
                    color: akai16Type === t.type ? "#090A0D" : "#8E939E",
                    border: akai16Type === t.type ? "1px solid #FFFFFF" : "1px solid #323540",
                    borderRadius: "2px",
                    cursor: "pointer",
                    transition: "all 0.1s ease",
                  }}
                  title={t.desc}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <span style={{ fontSize: "0.58rem", color: "#A0A0A0" }}>
            Chop:{" "}
            <strong style={{ color: "#FFD600" }}>
              {cues.find((c) => c.id === selectedCueId)?.name || cues[0]?.name || "CHOP 1"}
            </strong>
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
            gap: "6px",
            width: "100%",
            minWidth: 0,
          }}
        >
          {Array.from({ length: 16 }).map((_, idx) => {
            const padNum = idx + 1;
            const isPlaying = active16LevelPad === padNum;
            const keyLabel = PAD_DISPLAY_KEYS[padNum] || `${padNum}`;

            let valueLabel = "";
            let subLabel = "";
            let padColor = "#FFD600";
            let isRoot = false;

            if (akai16Type === "tune") {
              const semi = AKAI_16_LEVELS_SEMITONES[idx];
              isRoot = semi === 0;
              valueLabel = `${semi > 0 ? `+${semi}` : semi} st`;
              subLabel = isRoot ? "ROOT (0 st)" : "";
              padColor = isRoot ? "#FFD600" : semi < 0 ? "#FFD600" : "#D4D4D8";
            } else if (akai16Type === "velocity") {
              const vel = AKAI_16_LEVELS_VELOCITIES[idx];
              valueLabel = `${Math.round(vel * 100)}%`;
              subLabel = idx === 15 ? "MAX (100%)" : idx === 0 ? "GHOST (10%)" : `VEL ${idx + 1}`;
              padColor = idx === 15 ? "#FFD600" : idx >= 10 ? "#EAB308" : idx >= 5 ? "#D4D4D8" : "#FFD600";
            } else if (akai16Type === "filter") {
              const freq = AKAI_16_LEVELS_FILTERS[idx];
              valueLabel = freq >= 1000 ? `${(freq / 1000).toFixed(1)} kHz` : `${freq} Hz`;
              subLabel = idx === 15 ? "OPEN (18kHz)" : idx === 0 ? "SUB (300Hz)" : "LPF";
              padColor = idx >= 6 ? "#FFD600" : "#A1A1AA";
            } else if (akai16Type === "decay") {
              const dec = AKAI_16_LEVELS_DECAYS[idx];
              valueLabel = dec < 1.0 ? `${Math.round(dec * 1000)} ms` : `${dec.toFixed(1)} s`;
              subLabel = idx === 15 ? "FULL (4s)" : idx === 0 ? "CLICK (80ms)" : "DECAY";
              padColor = idx >= 12 ? "#D4D4D8" : idx >= 6 ? "#FFD600" : "#D4D4D8";
            }

            return (
              <div
                key={padNum}
                onPointerDown={() => onTrigger16Level(padNum)}
                onPointerUp={() => {
                  if (triggerMode === "hold") onStopAudio();
                }}
                onPointerLeave={() => {
                  if (triggerMode === "hold" && active16LevelPad === padNum) onStopAudio();
                }}
                style={{
                  height: "56px",
                  minWidth: 0,
                  overflow: "hidden",
                  boxSizing: "border-box",
                  backgroundColor: isPlaying ? padColor : isRoot ? "#172314" : "#121318",
                  color: isPlaying ? "#111111" : "#FFFFFF",
                  border: isRoot
                    ? isPlaying
                      ? "2px solid #FFFFFF"
                      : "1.8px solid #FFD600"
                    : isPlaying
                    ? "2px solid #FFFFFF"
                    : `1.2px solid ${padColor}77`,
                  borderRadius: "4px",
                  boxShadow: isPlaying
                    ? `0 0 16px ${padColor}`
                    : isRoot
                    ? "0 0 10px rgba(255, 214, 0, 0.4)"
                    : "inset 0 1px 2px rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.5)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "4px 6px",
                  transform: isPlaying ? "scale(0.96)" : "scale(1)",
                  transition: "all 0.05s ease",
                  userSelect: "none",
                }}
              >
                <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", lineHeight: 1 }}>
                  <span
                    style={{
                      fontSize: "0.56rem",
                      fontWeight: 900,
                      backgroundColor: isPlaying ? "#111111" : padColor,
                      color: isPlaying ? padColor : "#111111",
                      padding: "1px 4px",
                      borderRadius: "2px",
                    }}
                  >
                    LVL {padNum}
                  </span>
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontWeight: 900,
                      fontFamily: "monospace",
                      backgroundColor: isPlaying ? "#FFFFFF" : "#090A0D",
                      color: isPlaying ? "#000000" : padColor,
                      border: `1px solid ${isPlaying ? "#FFFFFF" : padColor}`,
                      padding: "0 3px",
                      borderRadius: "2px",
                    }}
                  >
                    [{keyLabel}]
                  </span>
                </div>

                <div style={{ textAlign: "center", width: "100%" }}>
                  <div
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 900,
                      color: isPlaying ? "#111111" : isRoot ? "#FFD600" : "#FFFFFF",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {valueLabel}
                  </div>
                  {subLabel && (
                    <span
                      style={{
                        fontSize: "0.48rem",
                        fontWeight: 900,
                        color: isPlaying ? "#111111" : padColor,
                        letterSpacing: "0.4px",
                      }}
                    >
                      {subLabel}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "2px",
                    backgroundColor: padColor,
                    borderRadius: "1px",
                    opacity: isPlaying ? 1 : 0.6,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 900, color: "#FFFFFF" }}>
            SERATO CUE PADS:
          </span>
          <span style={{ fontSize: "0.58rem", color: "#8E939E" }}>
            (Doble clic o ✏️ para renombrar)
          </span>
        </div>
        <span style={{ fontSize: "0.62rem", color: "#FFD600", fontWeight: 800 }}>
          ⌨️ Teclado:{" "}
          <strong
            style={{
              color: "#FFFFFF",
              backgroundColor: "#1B202D",
              padding: "1px 5px",
              borderRadius: "2px",
              letterSpacing: "1px",
            }}
          >
            {activeBank === "ALL"
              ? "Q W E R T Y U I · A S D F G H J K"
              : activeBank === "B"
              ? "A S D F G H J K"
              : "Q W E R T Y U I"}
          </strong>
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
          gap: "6px",
          width: "100%",
          minWidth: 0,
        }}
      >
        {visibleCues.map((cue) => {
          const isPlaying = activeCueId === cue.id;
          const isSelected = selectedCueId === cue.id;
          const isEditing = editingCueId === cue.id;
          const { endLimitSec, naturalDurationSec, nextCue } = calculateSliceBoundary(
            cue.id,
            cues,
            totalDuration
          );

          return (
            <div
              key={cue.id}
              onPointerDown={() => onTriggerCue(cue)}
              onPointerUp={() => {
                if (triggerMode === "hold") onStopAudio();
              }}
              onPointerLeave={() => {
                if (triggerMode === "hold" && activeCueId === cue.id) onStopAudio();
              }}
              style={{
                height: "64px",
                minWidth: 0,
                overflow: "hidden",
                boxSizing: "border-box",
                backgroundColor: isPlaying || isSelected ? "#FFD600" : "#E4E4E7",
                color: "#090A0D",
                border: isPlaying ? "2px solid #FFFFFF" : "1.5px solid #090A0D",
                borderRadius: "5px",
                boxShadow: isPlaying
                  ? "inset 0 2px 4px rgba(0,0,0,0.3), 0 0 18px rgba(255,214,0,0.85)"
                  : isSelected
                  ? "inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 0 #07080A, 0 0 10px rgba(255,214,0,0.5)"
                  : "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -2px 0 rgba(0,0,0,0.12), 0 4px 0 #07080A",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "5px 7px",
                transform: isPlaying ? "translateY(3px)" : "translateY(0)",
                transition: "all 0.05s ease",
                position: "relative",
                userSelect: "none",
              }}
            >
              {/* Pad Header */}
              <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", lineHeight: 1 }}>
                <span
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 900,
                    backgroundColor: cue.color,
                    color: "#111111",
                    padding: "1px 4px",
                    borderRadius: "2px",
                  }}
                >
                  CUE {cue.id}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontWeight: 900,
                      fontFamily: "monospace",
                      backgroundColor: isPlaying ? "#FFFFFF" : "#090A0D",
                      color: isPlaying ? "#000000" : cue.color,
                      border: `1px solid ${isPlaying ? "#FFFFFF" : cue.color}`,
                      padding: "0 3px",
                      borderRadius: "2px",
                    }}
                    title={`Presiona tecla [${PAD_DISPLAY_KEYS[cue.id] || cue.id}]`}
                  >
                    [{PAD_DISPLAY_KEYS[cue.id] || cue.id}]
                  </span>

                  {cues.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => onDeleteCue(e, cue.id)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: isPlaying || isSelected ? "#111111" : "#52525B",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        opacity: 0.75,
                      }}
                      title="Eliminar este Cue"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              </div>

              {/* Pad Center: Editable Name */}
              <div
                onDoubleClick={(e) => onStartRename(e, cue)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "3px",
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                {isEditing ? (
                  <input
                    type="text"
                    autoFocus
                    value={editingCueName}
                    onChange={(e) => onChangeEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSaveRename(cue.id);
                      else if (e.key === "Escape") onCancelRename();
                    }}
                    onBlur={() => onSaveRename(cue.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "98%",
                      backgroundColor: "#07080B",
                      border: "1px solid #FFD600",
                      borderRadius: "2px",
                      color: "#FFFFFF",
                      fontSize: "0.64rem",
                      fontWeight: 900,
                      textAlign: "center",
                      padding: "1px 2px",
                      outline: "none",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "3px",
                      width: "100%",
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.66rem",
                        fontWeight: 900,
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        letterSpacing: "-0.2px",
                        minWidth: 0,
                      }}
                      title={cue.name}
                    >
                      {cue.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => onStartRename(e, cue)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: isPlaying || isSelected ? "#111111" : "#52525B",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        opacity: 0.7,
                        flexShrink: 0,
                      }}
                      title="Editar nombre del Cue"
                    >
                      <Pencil size={9} />
                    </button>
                  </div>
                )}
              </div>

              {/* Pad Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "4px", minWidth: 0, lineHeight: 1 }}>
                <span
                  style={{
                    fontSize: "0.52rem",
                    color: isPlaying || isSelected ? "#090A0D" : "#52525B",
                    fontFamily: "monospace",
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minWidth: 0,
                  }}
                  title={`Corte: ${formatSeconds(cue.startSec)} hasta ${formatSeconds(endLimitSec)} (${naturalDurationSec.toFixed(1)}s)`}
                >
                  ⏱️ {formatSeconds(cue.startSec)} ➔ {formatSeconds(endLimitSec)}
                </span>

                <span
                  style={{
                    fontSize: "0.50rem",
                    color: isPlaying || isSelected ? "#090A0D" : "#52525B",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    flexShrink: 0,
                  }}
                  title={nextCue ? `Límite: Marcador #${nextCue.id}` : "Límite: Fin del audio"}
                >
                  {isSelected ? "● ACTIVO" : `${naturalDurationSec.toFixed(1)}s`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
