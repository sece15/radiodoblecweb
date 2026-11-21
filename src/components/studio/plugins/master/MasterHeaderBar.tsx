"use client";

import { Layers, Play, Square, X } from "lucide-react";

interface MasterHeaderBarProps {
  padLabel: string;
  rangeLabel: string;
  isPlaying: boolean;
  bpm: number;
  loopSample: boolean;
  onPlayMaster: () => void;
  onChangeBpm: (bpm: number) => void;
  onToggleLoop: () => void;
  onClose: () => void;
}

export function MasterHeaderBar({
  padLabel,
  rangeLabel,
  isPlaying,
  bpm,
  loopSample,
  onPlayMaster,
  onChangeBpm,
  onToggleLoop,
  onClose,
}: MasterHeaderBarProps) {
  return (
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
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
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
            flexShrink: 0,
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
          onClick={onPlayMaster}
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
            onChange={(e) => onChangeBpm(Math.max(60, Math.min(180, Number(e.target.value) || 95)))}
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
          onClick={onToggleLoop}
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
  );
}
