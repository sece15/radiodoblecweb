"use client";

import { Award } from "lucide-react";

interface BadgesAlbumSectionProps {
  listenedSeconds: number;
  streakDays: number;
  favoriteSongsCount: number;
  cCoins: number;
}

export const BadgesAlbumSection = ({
  listenedSeconds,
  streakDays,
  cCoins,
}: BadgesAlbumSectionProps) => {
  const hours = Math.floor((listenedSeconds || 0) / 3600);

  // Top 3 insignias clave para maximizar espacio y destacar C-Coins
  const BADGES = [
    {
      id: "streak_7",
      title: "Racha de Oro C",
      icon: "🔥",
      unlocked: streakDays >= 3,
      req: "3 días en sintonía",
    },
    {
      id: "hours_5",
      title: "Melómano Doble C",
      icon: "🎧",
      unlocked: hours >= 2,
      req: "2 hrs de radio",
    },
    {
      id: "coins_5",
      title: "Billetera Doble C",
      icon: "🪙",
      unlocked: cCoins >= 3,
      req: "3 C-Coins ganadas",
    },
  ];

  const unlockedCount = BADGES.filter((b) => b.unlocked).length;

  return (
    <div
      className="neo-card"
      style={{
        width: "100%",
        maxWidth: "800px",
        padding: "14px 16px",
        backgroundColor: "var(--surface-container)",
        border: "2px solid var(--primary)",
        boxShadow: "4px 4px 0px var(--primary)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Award size={16} style={{ color: "#FFB000" }} />
          <span style={{ fontSize: "0.78rem", fontWeight: 900, textTransform: "uppercase" }}>
            INSIGNIAS DESTACADAS DOBLE C
          </span>
        </div>
        <span
          style={{
            backgroundColor: "var(--primary-container)",
            border: "1px solid var(--primary)",
            padding: "2px 6px",
            fontSize: "0.6rem",
            fontWeight: 900,
          }}
        >
          {unlockedCount} / {BADGES.length} DESBLOQUEADAS
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
        }}
      >
        {BADGES.map((badge) => (
          <div
            key={badge.id}
            style={{
              backgroundColor: badge.unlocked ? "#FFFFFF" : "#F5F5F5",
              border: badge.unlocked ? "2px solid var(--primary)" : "1.5px dashed #BBB",
              padding: "10px 6px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "3px",
              opacity: badge.unlocked ? 1 : 0.55,
              transform: badge.unlocked ? "none" : "grayscale(60%)",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>{badge.icon}</span>
            <span style={{ fontSize: "0.65rem", fontWeight: 900, color: "var(--primary)" }}>
              {badge.title}
            </span>
            <span style={{ fontSize: "0.55rem", opacity: 0.75, fontWeight: "bold" }}>
              {badge.unlocked ? "✓ Obtenida" : badge.req}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
