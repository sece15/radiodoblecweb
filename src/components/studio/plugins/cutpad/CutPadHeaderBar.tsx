"use client";

import { Scissors, X } from "lucide-react";

interface CutPadHeaderBarProps {
  padLabel: string;
  rangeLabel: string;
  effectiveDurationSec: number;
  liveIsRealAudio: boolean;
  hasYoutubeFallback: boolean;
  errorNotice: string | null;
  onRequestLoadAudio?: () => void;
  onClose: () => void;
}

export function CutPadHeaderBar({
  padLabel,
  rangeLabel,
  effectiveDurationSec,
  liveIsRealAudio,
  hasYoutubeFallback,
  errorNotice,
  onRequestLoadAudio,
  onClose,
}: CutPadHeaderBarProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 14px",
          backgroundColor: "#141519",
          borderBottom: "1px solid rgba(255,214,0,0.45)",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", minWidth: 0 }}>
          <span
            style={{
              background: "linear-gradient(180deg, #3A3C42 0%, #23252A 100%)",
              color: "#FFD600",
              fontWeight: 900,
              fontFamily: "monospace",
              fontSize: "0.68rem",
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
            <Scissors size={11} />
            <span>CORTAR PAD</span>
          </span>
          <span style={{ fontSize: "0.70rem", fontWeight: 900, color: "#FFFFFF", fontFamily: "monospace" }}>
            {padLabel}
          </span>
          <span style={{ fontSize: "0.60rem", color: "#A1A1AA", fontFamily: "monospace" }}>
            {rangeLabel} · Recorte: {effectiveDurationSec.toFixed(2)}s
          </span>
          <span
            style={{
              fontSize: "0.52rem",
              fontWeight: 900,
              fontFamily: "monospace",
              padding: "2px 6px",
              borderRadius: "3px",
              backgroundColor: liveIsRealAudio ? "#162A1B" : hasYoutubeFallback ? "#231E0C" : "#2A1F14",
              color: liveIsRealAudio ? "#4ADE80" : "#FFD600",
              border: liveIsRealAudio ? "1px solid #22C55E" : "1px solid #FFD600",
            }}
          >
            {liveIsRealAudio
              ? "AUDIO REAL DEL CORTE"
              : hasYoutubeFallback
              ? "CANCIÓN REAL (YOUTUBE)"
              : "AUDIO SINTÉTICO"}
          </span>
        </div>

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
            flexShrink: 0,
          }}
          title="Cerrar editor de corte"
        >
          <X size={14} />
        </button>
      </div>

      {errorNotice && (
        <div
          style={{
            padding: "8px 14px",
            backgroundColor: "rgba(255, 214, 0, 0.08)",
            borderBottom: "1px solid rgba(255, 214, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.62rem", color: "#FDE047", fontFamily: "monospace", fontWeight: 700, flex: 1 }}>
            {errorNotice}
          </span>
          {onRequestLoadAudio && (
            <button
              type="button"
              onClick={onRequestLoadAudio}
              style={{
                padding: "4px 10px",
                backgroundColor: "#FFD600",
                color: "#090A0D",
                border: "none",
                borderRadius: "3px",
                fontSize: "0.60rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: "pointer",
              }}
            >
              CARGAR AUDIO
            </button>
          )}
        </div>
      )}
    </>
  );
}
