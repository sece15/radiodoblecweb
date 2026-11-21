"use client";

import { RotaryKnob } from "../sampler/RotaryKnob";

interface CutPadPitchPanelProps {
  pitchSemi: number;
  isReversed: boolean;
  isTapeStopping: boolean;
  loopOn: boolean;
  onChangePitch: (val: number) => void;
  onToggleReverse: () => void;
  onTapeStopStart: () => void;
  onTapeStopEnd: () => void;
  onToggleLoop: () => void;
}

export function CutPadPitchPanel({
  pitchSemi,
  isReversed,
  isTapeStopping,
  loopOn,
  onChangePitch,
  onToggleReverse,
  onTapeStopStart,
  onTapeStopEnd,
  onToggleLoop,
}: CutPadPitchPanelProps) {
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
        gap: "10px",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <div style={{ borderBottom: "1px solid rgba(255,214,0,0.3)", paddingBottom: "4px", textAlign: "center" }}>
        <span style={{ fontSize: "0.58rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "1.4px" }}>
          PITCH / TONO
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <RotaryKnob
          label=""
          valText=""
          deg={(pitchSemi / 12) * 135}
          min={-12}
          max={12}
          step={1}
          value={pitchSemi}
          size={54}
          title="Arrastra arriba/abajo o usa la rueda del mouse (-12 a +12 st). Doble clic para 0 st."
          onChange={onChangePitch}
          onReset={() => onChangePitch(0)}
        />
        <span style={{ fontSize: "1.15rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", textShadow: "0 0 10px rgba(255,214,0,0.5)" }}>
          {pitchSemi > 0 ? `+${pitchSemi}` : pitchSemi} st
        </span>
        <span style={{ fontSize: "0.50rem", color: "#A1A1AA", fontFamily: "monospace", textAlign: "center" }}>
          Arrastra arriba/abajo · 2x clic = 0
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "4px" }}>
          <button
            type="button"
            onClick={onToggleReverse}
            style={{
              padding: "5px 4px",
              backgroundColor: isReversed ? "#FFD600" : "#E4E4E7",
              color: "#090A0D",
              border: "1px solid #090A0D",
              borderRadius: "4px",
              boxShadow: "0 2px 0 #07080A",
              fontSize: "0.56rem",
              fontWeight: 900,
              fontFamily: "monospace",
              cursor: "pointer",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title="Invierte el audio del pad (Reverse)"
          >
            ◀ {isReversed ? "REV ON" : "REVERSA"}
          </button>
          <button
            type="button"
            onPointerDown={onTapeStopStart}
            onPointerUp={onTapeStopEnd}
            onPointerLeave={onTapeStopEnd}
            style={{
              padding: "5px 4px",
              backgroundColor: isTapeStopping ? "#FFD600" : "#E4E4E7",
              color: "#090A0D",
              border: "1px solid #090A0D",
              borderRadius: "4px",
              boxShadow: "0 2px 0 #07080A",
              fontSize: "0.56rem",
              fontWeight: 900,
              fontFamily: "monospace",
              cursor: "pointer",
              userSelect: "none",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title="Mantén presionado mientras suena o grabas para frenar la cinta estilo vinilo (Tape Stop)"
          >
            🛑 TAPE STOP
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleLoop}
          style={{
            padding: "5px 8px",
            backgroundColor: loopOn ? "#FFD600" : "#E4E4E7",
            color: "#090A0D",
            border: "1px solid #090A0D",
            borderRadius: "4px",
            boxShadow: "0 2px 0 #07080A",
            fontSize: "0.60rem",
            fontWeight: 900,
            fontFamily: "monospace",
            cursor: "pointer",
          }}
        >
          LOOP CORTE: {loopOn ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}
