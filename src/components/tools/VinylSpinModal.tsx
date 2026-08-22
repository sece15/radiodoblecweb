"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { NeoModal } from "../common/NeoModal";
import { SpinReward } from "@/hooks/useGamification";

interface VinylSpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  canSpinToday: boolean;
  isSpinning: boolean;
  onSpin: () => Promise<SpinReward>;
}

export const VinylSpinModal = ({
  isOpen,
  onClose,
  canSpinToday,
  isSpinning,
  onSpin,
}: VinylSpinModalProps) => {
  const [reward, setReward] = useState<SpinReward | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSpinClick = async () => {
    setErrorMessage(null);
    try {
      const res = await onSpin();
      setReward(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Error al girar la tornamesa.");
      }
    }
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title="LA TORNAMESA DOBLE C"
      badgeText="🎰 GIRO DIARIO GRATIS"
      maxWidth="460px"
      backgroundColor="var(--background)"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          textAlign: "center",
          padding: "8px 0",
        }}
      >
        <p style={{ fontSize: "0.75rem", fontWeight: "bold", margin: 0, opacity: 0.9 }}>
          Gira la tornamesa oficial de Radio Doble C cada día para ganar C-Coins, pases de saludo al aire y descuentos exclusivos.
        </p>

        {/* Animated Vinyl Disc Spinner */}
        <div
          style={{
            position: "relative",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            backgroundColor: "#111111",
            border: "5px solid var(--primary)",
            boxShadow: "6px 6px 0px var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "8px 0",
            animation: isSpinning ? "spin 0.4s linear infinite" : "none",
            transition: "transform 0.5s ease",
          }}
        >
          {/* Vinyl grooves */}
          <div
            style={{
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              border: "1px dashed rgba(255, 255, 255, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                border: "1px dashed rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Center Center Label */}
              <div
                style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "50%",
                  backgroundColor: "#CCFF00",
                  border: "2px solid #000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#000" }}>DOBLE C</span>
                <span style={{ fontSize: "0.45rem", fontWeight: 900, color: "#BA1A1A" }}>SPIN</span>
              </div>
            </div>
          </div>

          {/* Needle Tonearm Indicator */}
          <div
            style={{
              position: "absolute",
              top: "-8px",
              right: "12px",
              width: "4px",
              height: "45px",
              backgroundColor: "#BA1A1A",
              border: "1px solid #000",
              transformOrigin: "top",
              transform: isSpinning ? "rotate(25deg)" : "rotate(10deg)",
              transition: "transform 0.3s ease",
            }}
          />
        </div>

        {/* Reward Display */}
        {reward && (
          <div
            className="neo-card fun-hover-wobble"
            style={{
              backgroundColor: "#CCFF00",
              color: "#111",
              border: "2.5px solid var(--primary)",
              boxShadow: "3px 3px 0px var(--primary)",
              padding: "12px 16px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "1.8rem" }}>{reward.icon}</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase" }}>
              ¡PREMIO OBTENIDO!
            </span>
            <span style={{ fontSize: "1.1rem", fontWeight: 900 }}>{reward.label}</span>
            {reward.code && (
              <span
                style={{
                  backgroundColor: "white",
                  padding: "2px 8px",
                  border: "1px solid black",
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  marginTop: "4px",
                }}
              >
                CÓDIGO: {reward.code}
              </span>
            )}
          </div>
        )}

        {errorMessage && (
          <p style={{ fontSize: "0.7rem", color: "#BA1A1A", fontWeight: 900, margin: 0 }}>
            {errorMessage}
          </p>
        )}

        {/* Spin Button */}
        {!reward ? (
          <button
            onClick={handleSpinClick}
            disabled={!canSpinToday || isSpinning}
            className="neo-button fun-hover-wobble"
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "0.85rem",
              fontWeight: 900,
              backgroundColor: canSpinToday && !isSpinning ? "var(--primary-container)" : "#ccc",
              color: "var(--primary)",
              boxShadow: "4px 4px 0px var(--primary)",
              border: "2.5px solid var(--primary)",
              cursor: canSpinToday && !isSpinning ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Sparkles size={16} />
            <span>{isSpinning ? "GIRANDO TORNAMESA..." : canSpinToday ? "¡GIRAR TORNAMESA AHORA! ⚡" : "YA GIRASTE HOY (VUELVE MAÑANA)"}</span>
          </button>
        ) : (
          <button
            onClick={onClose}
            className="neo-button"
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "0.75rem",
              fontWeight: 900,
              backgroundColor: "white",
              border: "2px solid var(--primary)",
              boxShadow: "3px 3px 0px var(--primary)",
            }}
          >
            CERRAR Y DISFRUTAR PREMIO ✓
          </button>
        )}
      </div>
    </NeoModal>
  );
};
