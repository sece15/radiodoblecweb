"use client";

import { Sparkles, Gift, X } from "lucide-react";

interface LiveDropNotificationProps {
  drop: { id: string; amount: number; message: string } | null;
  onClaim: () => void;
  onDismiss: () => void;
}

export const LiveDropNotification = ({
  drop,
  onClaim,
  onDismiss,
}: LiveDropNotificationProps) => {
  if (!drop) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "95px",
        left: "20px",
        zIndex: 3500,
        maxWidth: "340px",
        animation: "fadeIn 0.3s ease-out, bounce 1s infinite alternate",
      }}
    >
      <div
        className="neo-card"
        style={{
          backgroundColor: "#CCFF00",
          color: "#111111",
          border: "3px solid var(--primary)",
          boxShadow: "5px 5px 0px var(--primary)",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Gift size={16} style={{ color: "#BA1A1A" }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
              ¡C-DROP EN VIVO! 📻⚡
            </span>
          </div>
          <button
            onClick={onDismiss}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <X size={14} />
          </button>
        </div>

        <p style={{ fontSize: "0.68rem", fontWeight: "bold", margin: 0, lineHeight: "1.1rem" }}>
          {drop.message}
        </p>

        <button
          onClick={onClaim}
          className="neo-button fun-hover-wobble"
          style={{
            backgroundColor: "var(--primary-container)",
            color: "var(--primary)",
            padding: "6px 12px",
            fontSize: "0.7rem",
            fontWeight: 900,
            border: "2px solid var(--primary)",
            boxShadow: "2px 2px 0px var(--primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <Sparkles size={13} />
          <span>RECLAMAR +{drop.amount} C-COIN 🎁</span>
        </button>
      </div>
    </div>
  );
};
