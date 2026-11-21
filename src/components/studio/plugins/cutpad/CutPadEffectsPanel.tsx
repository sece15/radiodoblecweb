"use client";

import { RotaryKnob } from "../sampler/RotaryKnob";

interface CutPadEffectsPanelProps {
  filterSweep: number;
  resonance: number;
  crunch: number;
  echoMix: number;
  onChangeFilterSweep: (v: number) => void;
  onChangeResonance: (v: number) => void;
  onChangeCrunch: (v: number) => void;
  onChangeEchoMix: (v: number) => void;
  onApplyPreset: (preset: { filterSweep: number; resonance: number; crunch: number; echoMix: number; volume: number }) => void;
}

const PRESETS = [
  { label: "FLAT", values: { filterSweep: 0, resonance: 1, crunch: 0, echoMix: 0, volume: 100 } },
  { label: "LO-FI 12B", values: { filterSweep: -45, resonance: 3, crunch: 55, echoMix: 0, volume: 105 } },
  { label: "RADIO TEL", values: { filterSweep: 55, resonance: 6, crunch: 35, echoMix: 0, volume: 105 } },
  { label: "DUB ECHO", values: { filterSweep: -30, resonance: 4, crunch: 15, echoMix: 45, volume: 100 } },
] as const;

export function CutPadEffectsPanel({
  filterSweep,
  resonance,
  crunch,
  echoMix,
  onChangeFilterSweep,
  onChangeResonance,
  onChangeCrunch,
  onChangeEchoMix,
  onApplyPreset,
}: CutPadEffectsPanelProps) {
  return (
    <div
      style={{
        backgroundColor: "#0A0B0E",
        border: "1px solid rgba(255,214,0,0.4)",
        borderRadius: "6px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "8px",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <div style={{ borderBottom: "1px solid rgba(255,214,0,0.3)", paddingBottom: "4px", textAlign: "center" }}>
        <span style={{ fontSize: "0.58rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "1.4px" }}>
          EFECTOS DEL CORTE
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
        <RotaryKnob
          label="FILTER"
          valText={filterSweep === 0 ? "FLAT" : filterSweep < 0 ? `LP ${filterSweep}` : `HP +${filterSweep}`}
          deg={(filterSweep / 100) * 135}
          min={-100}
          max={100}
          step={2}
          value={filterSweep}
          size={32}
          title="Filtro DJ Sweep (-100 LowPass a +100 HighPass). Arrastra arriba/abajo."
          onChange={onChangeFilterSweep}
          onReset={() => onChangeFilterSweep(0)}
        />
        <RotaryKnob
          label="RESO (Q)"
          valText={`Q ${resonance}`}
          deg={((resonance - 1) / 14) * 270 - 135}
          min={1}
          max={15}
          step={1}
          value={resonance}
          size={32}
          title="Resonancia del filtro (1 a 15) para barridos tipo SP-404 / Acid."
          onChange={onChangeResonance}
          onReset={() => onChangeResonance(1)}
        />
        <RotaryKnob
          label="CRUNCH"
          valText={`${crunch}%`}
          deg={(crunch / 100) * 270 - 135}
          min={0}
          max={100}
          step={2}
          value={crunch}
          size={32}
          title="Saturación 12-Bit / Vinyl Drive (0% a 100%)."
          onChange={onChangeCrunch}
          onReset={() => onChangeCrunch(0)}
        />
        <RotaryKnob
          label="DUB ECHO"
          valText={`${echoMix}%`}
          deg={(echoMix / 80) * 270 - 135}
          min={0}
          max={80}
          step={2}
          value={echoMix}
          size={32}
          title="Eco espacial sincronizado al BPM (0% a 80%)."
          onChange={onChangeEchoMix}
          onReset={() => onChangeEchoMix(0)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "4px" }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onApplyPreset(preset.values)}
            style={{
              padding: "3px 4px",
              backgroundColor: "#E4E4E7",
              color: "#090A0D",
              border: "1px solid #090A0D",
              borderRadius: "3px",
              fontSize: "0.52rem",
              fontWeight: 900,
              cursor: "pointer",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
