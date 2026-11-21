"use client";

import Link from "next/link";
import { ArrowLeft, Disc } from "lucide-react";

interface SamplerHeaderBarProps {
  isStandalone: boolean;
  onSendToSequencer?: () => void;
  onOpenDigger?: () => void;
  onClose: () => void;
}

export function SamplerHeaderBar({
  isStandalone,
  onSendToSequencer,
  onOpenDigger,
  onClose,
}: SamplerHeaderBarProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
        alignItems: "center",
        gap: "12px",
        padding: "8px 14px",
        backgroundColor: "#141519",
        borderBottom: "1px solid rgba(255,214,0,0.45)",
      }}
    >
      {/* Izquierda: C-SAMPLER + VOLVER A LA RADIO */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", minWidth: 0 }}>
        <div
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
            letterSpacing: "1px",
          }}
        >
          C-SAMPLER
        </div>

        {isStandalone && (
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "linear-gradient(180deg, #3A3C42 0%, #23252A 100%)",
              color: "#FFD600",
              fontWeight: 900,
              fontFamily: "monospace",
              fontSize: "0.68rem",
              padding: "3px 9px",
              borderRadius: "3px",
              border: "1px solid #4B4E57",
              boxShadow: "0 2px 0 #07080A",
              letterSpacing: "1px",
              textDecoration: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            title="Volver a la señal en vivo de Radio Doble C"
          >
            <ArrowLeft size={11} />
            <span>VOLVER A LA RADIO</span>
          </Link>
        )}
      </div>

      {/* Centro: RADIO DOBLE C */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span
          style={{
            fontSize: "0.78rem",
            fontWeight: 900,
            color: "#FFD600",
            letterSpacing: "1.4px",
            fontFamily: "monospace",
            whiteSpace: "nowrap",
          }}
        >
          RADIO DOBLE C
        </span>
      </div>

      {/* Derecha: BEAT BREAKDOWN + IR A C-DIGGER + Cerrar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", minWidth: 0 }}>
        {onSendToSequencer && (
          <button
            type="button"
            onClick={onSendToSequencer}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              backgroundColor: "var(--primary-container)",
              color: "var(--on-primary-container)",
              fontWeight: 900,
              fontFamily: "monospace",
              fontSize: "0.68rem",
              padding: "3px 10px",
              borderRadius: "3px",
              border: "1.5px solid var(--primary)",
              boxShadow: "0 2px 0 #07080A",
              letterSpacing: "1px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            title="Enviar sample cortado al Secuenciador Beat Breakdown"
          >
            <span>BEAT BREAKDOWN →</span>
          </button>
        )}
        {onOpenDigger && (
          <button
            type="button"
            onClick={onOpenDigger}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "linear-gradient(180deg, #3A3C42 0%, #23252A 100%)",
              color: "#FFD600",
              fontWeight: 900,
              fontFamily: "monospace",
              fontSize: "0.68rem",
              padding: "3px 9px",
              borderRadius: "3px",
              border: "1px solid #4B4E57",
              boxShadow: "0 2px 0 #07080A",
              letterSpacing: "1px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            title="Explorar y samplear vinilos en C-Digger"
          >
            <Disc size={11} />
            <span>IR A C-DIGGER</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "3px 6px",
            backgroundColor: "#262830",
            border: "1px solid #3A3D48",
            borderRadius: "3px",
            boxShadow: "0 2px 0 #090A0D",
            color: "#D4D4D8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Cerrar sampler"
        >
          <img
            src="/emojis/msn/c-calavera-48.png"
            alt="Cerrar sampler"
            style={{ width: "20px", height: "20px", objectFit: "contain", display: "block" }}
          />
        </button>
        <span
          style={{
            width: "9px",
            height: "9px",
            borderRadius: "50%",
            backgroundColor: "#2C2F38",
            border: "1px solid #0B0C0F",
            boxShadow: "inset 0 1px 1px rgba(0,0,0,0.9)",
            display: "inline-block",
          }}
        />
      </div>
    </div>
  );
}
