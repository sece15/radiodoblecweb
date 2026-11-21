"use client";

import { Download } from "lucide-react";

interface MasterFooterBarProps {
  onExportMasterMix: () => void;
}

export function MasterFooterBar({ onExportMasterMix }: MasterFooterBarProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.58rem", color: "#A1A1AA", fontFamily: "monospace" }}>
        Exporta tu corte mezclado con batería y bajo 808 o descarga cada canal limpio en WAV.
      </span>
      <button
        type="button"
        onClick={onExportMasterMix}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          background: "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)",
          color: "#090A0D",
          border: "1px solid #FFE866",
          borderRadius: "4px",
          boxShadow: "0 0 14px rgba(255,214,0,0.75), 0 3px 0 #07080A",
          fontSize: "0.66rem",
          fontWeight: 900,
          fontFamily: "monospace",
          cursor: "pointer",
        }}
      >
        <Download size={12} />
        <span>EXPORTAR MASTER WAV</span>
      </button>
    </div>
  );
}
