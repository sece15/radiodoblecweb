"use client";

import { ArrowRight } from "lucide-react";
import type { DiggerTrack } from "@/types/studio";

interface DiggerFooterBarProps {
  currentTrack: DiggerTrack;
  isExtracting: boolean;
  onSendToSampler: () => void;
}

export function DiggerFooterBar({
  currentTrack,
  isExtracting,
  onSendToSampler,
}: DiggerFooterBarProps) {
  return (
    <div
      style={{
        backgroundColor: "#0D1017",
        borderTop: "2px solid #1E2332",
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexShrink: 0,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.74rem", color: "#94A3B8", minWidth: 0 }}>
        <span style={{ color: "#CCFF00", fontWeight: 900, letterSpacing: "0.5px", flexShrink: 0 }}>PISTA:</span>
        <span style={{ color: "#FFFFFF", fontWeight: 800 }}>{currentTrack.artist}</span>
        <span>—</span>
        <span style={{ color: "#FFFFFF", fontWeight: 800 }}>{currentTrack.title}</span>
        <span style={{ fontSize: "0.68rem", opacity: 0.8, fontFamily: "monospace" }}>
          ({currentTrack.bpm} BPM · {currentTrack.key})
        </span>
      </div>

      <button
        type="button"
        onClick={onSendToSampler}
        disabled={isExtracting}
        className="neo-button fun-hover-wobble"
        style={{
          minWidth: "180px",
          padding: "10px 22px",
          backgroundColor: "#CCFF00",
          color: "#000000",
          border: "2px solid #000000",
          boxShadow: "3px 3px 0px #FFFFFF",
          borderRadius: "4px",
          fontSize: "0.85rem",
          fontWeight: 900,
          cursor: isExtracting ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          letterSpacing: "0.8px",
          opacity: isExtracting ? 0.7 : 1,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        title="Avanzar al siguiente paso: samplear y cortar en C-Sampler"
      >
        {isExtracting ? (
          <span>CARGANDO...</span>
        ) : (
          <>
            <span>SIGUIENTE</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </div>
  );
}
