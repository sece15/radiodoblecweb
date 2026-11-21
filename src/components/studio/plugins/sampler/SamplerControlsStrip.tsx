"use client";

import { RefreshCw } from "lucide-react";
import type { SamplerTriggerMode } from "@/types/studio";
import { RotaryKnob } from "./RotaryKnob";

interface SamplerControlsStripProps {
  bpm: number;
  pitchSemi: number;
  chopGatePct: number;
  fineTuneCents: number;
  startOffsetMs: number;
  triggerMode: SamplerTriggerMode;
  activeBank: "A" | "B" | "ALL";
  cuesCount: number;
  onControlKnobChange: (id: "pitch" | "control" | "fine" | "offset", v: number) => void;
  onControlKnobReset: (id: "pitch" | "control" | "fine" | "offset") => void;
  onChangeTriggerMode: (mode: SamplerTriggerMode) => void;
  onChangeBank: (bank: "A" | "B" | "ALL") => void;
  onResetAll: () => void;
}

export function SamplerControlsStrip({
  bpm,
  pitchSemi,
  chopGatePct,
  fineTuneCents,
  startOffsetMs,
  triggerMode,
  activeBank,
  cuesCount,
  onControlKnobChange,
  onControlKnobReset,
  onChangeTriggerMode,
  onChangeBank,
  onResetAll,
}: SamplerControlsStripProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1.05fr) minmax(0, 1.25fr) minmax(0, 1.15fr) auto",
        gap: "12px",
        backgroundColor: "#111215",
        padding: "10px 14px",
        borderRadius: "5px",
        border: "1px solid rgba(255,214,0,0.55)",
        alignItems: "center",
      }}
    >
      {/* Display BPM + 4 Perillas (PITCH, CONTROL, FINE, OFFSET) */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          <span style={{ fontSize: "0.48rem", color: "#FFD600", fontWeight: 900, letterSpacing: "1.2px", fontFamily: "monospace" }}>
            BPM
          </span>
          <div
            style={{
              minWidth: "84px",
              padding: "6px 10px",
              borderRadius: "4px",
              backgroundColor: "#141106",
              border: "1px solid rgba(255,214,0,0.65)",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.95)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              lineHeight: 1.05,
            }}
            title="Display BPM / Pitch"
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "1.05rem",
                fontWeight: 900,
                color: "#FFD600",
                letterSpacing: "1.5px",
                textShadow: "0 0 8px rgba(255,214,0,0.5)",
              }}
            >
              {bpm.toFixed(1)}
            </span>
            <span style={{ fontSize: "0.48rem", color: "#A1A1AA", fontFamily: "monospace" }}>
              {pitchSemi > 0 ? `+${pitchSemi} st` : `${pitchSemi} st`}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <RotaryKnob
            label="PITCH"
            valText={pitchSemi > 0 ? `+${pitchSemi} st` : `${pitchSemi} st`}
            deg={(pitchSemi / 12) * 135}
            min={-12}
            max={12}
            step={1}
            value={pitchSemi}
            title="Perilla PITCH (-12 a +12 st). Arrastra verticalmente o rueda del mouse; doble clic para centrar en 0 st."
            onChange={(v) => onControlKnobChange("pitch", v)}
            onReset={() => onControlKnobReset("pitch")}
          />
          <RotaryKnob
            label="CONTROL"
            valText={`${chopGatePct}%`}
            deg={((chopGatePct - 10) / 90) * 270 - 135}
            min={10}
            max={100}
            step={5}
            value={chopGatePct}
            title="CONTROL / GATE: Duración del golpe del pad (10% staccato a 100% completo). Arrastra arriba/abajo."
            onChange={(v) => onControlKnobChange("control", v)}
            onReset={() => onControlKnobReset("control")}
          />
          <RotaryKnob
            label="FINE"
            valText={fineTuneCents > 0 ? `+${fineTuneCents}ct` : `${fineTuneCents}ct`}
            deg={(fineTuneCents / 50) * 135}
            min={-50}
            max={50}
            step={5}
            value={fineTuneCents}
            title="FINE TUNE: Micro-afinación fina (-50 a +50 cents) para cuadrar samples. Arrastra arriba/abajo."
            onChange={(v) => onControlKnobChange("fine", v)}
            onReset={() => onControlKnobReset("fine")}
          />
          <RotaryKnob
            label="OFFSET"
            valText={startOffsetMs > 0 ? `+${startOffsetMs}ms` : `${startOffsetMs}ms`}
            deg={(startOffsetMs / 200) * 135}
            min={-200}
            max={200}
            step={10}
            value={startOffsetMs}
            title="START OFFSET: Micro-ajuste del punto de inicio del pad (-200ms a +200ms). Arrastra arriba/abajo."
            onChange={(v) => onControlKnobChange("offset", v)}
            onReset={() => onControlKnobReset("offset")}
          />
        </div>
      </div>

      {/* Trigger Mode */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", textAlign: "center", minWidth: 0 }}>
        <span style={{ fontSize: "0.52rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "0.8px" }}>
          TRIGGER / MODE
        </span>
        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
          {(
            [
              { mode: "hold" as const, label: "HOLD (GATE)", title: "Corta el sonido en el momento al soltar el pad o la tecla" },
              { mode: "one_shot" as const, label: "1-SHOT", title: "Disparo tradicional de chop (hasta el siguiente marcador)" },
              { mode: "full_track" as const, label: "LOOP / TODO", title: "Suena toda la canción completa desde este cue" },
            ]
          ).map(({ mode, label, title }) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChangeTriggerMode(mode)}
              style={{
                padding: "4px 8px",
                fontSize: "0.56rem",
                fontWeight: 900,
                fontFamily: "monospace",
                backgroundColor: triggerMode === mode ? "#FFD600" : "#E4E4E7",
                color: "#090A0D",
                border: "1px solid #090A0D",
                borderRadius: "3px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 0 #07080A",
                transform: triggerMode === mode ? "translateY(1px)" : "translateY(0)",
                cursor: "pointer",
                transition: "all 0.08s ease",
              }}
              title={title}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bank Selectors */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", textAlign: "center", minWidth: 0 }}>
        <span style={{ fontSize: "0.52rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "0.8px" }}>
          BANK
        </span>
        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
          {(
            [
              { id: "A" as const, label: "A (1-8)" },
              { id: "B" as const, label: "B (9-16)" },
              { id: "ALL" as const, label: `ALL (${cuesCount})` },
            ]
          ).map((bank) => (
            <button
              key={bank.id}
              type="button"
              onClick={() => onChangeBank(bank.id)}
              style={{
                padding: "4px 7px",
                fontSize: "0.56rem",
                fontWeight: 900,
                fontFamily: "monospace",
                backgroundColor: activeBank === bank.id ? "#FFD600" : "#E4E4E7",
                color: "#090A0D",
                border: "1px solid #090A0D",
                borderRadius: "3px",
                boxShadow: "0 2px 0 #07080A",
                cursor: "pointer",
              }}
            >
              {bank.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Reset */}
      <button
        type="button"
        onClick={onResetAll}
        style={{
          padding: "4px 9px",
          fontSize: "0.62rem",
          fontWeight: 900,
          fontFamily: "monospace",
          backgroundColor: "#E4E4E7",
          color: "#090A0D",
          border: "1px solid #090A0D",
          borderRadius: "4px",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85), 0 3px 0 #07080A",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
        }}
      >
        <RefreshCw size={11} />
        <span>REINICIAR</span>
      </button>
    </div>
  );
}
