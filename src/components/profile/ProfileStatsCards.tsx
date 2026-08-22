"use client";

import { Clock, Star, Flame } from "lucide-react";
import { LISTENER_LEVELS } from "@/hooks/useGamification";

interface ProfileStatsCardsProps {
  listenedSeconds: number;
  totalFavoritesCount: number;
  favoriteSongsCount: number;
  savedStationsCount: number;
  cCoins?: number;
  streakDays?: number;
}

export const ProfileStatsCards = ({
  listenedSeconds,
  totalFavoritesCount,
  favoriteSongsCount,
  savedStationsCount,
  cCoins = 2,
  streakDays = 1,
}: ProfileStatsCardsProps) => {
  const totalSeconds = listenedSeconds || 0;
  const hoursListened = Math.floor(totalSeconds / 3600);
  const minutesListened = Math.floor((totalSeconds % 3600) / 60);

  // Compute Level
  let currentLevel = LISTENER_LEVELS[0];
  for (const lvl of LISTENER_LEVELS) {
    if (hoursListened >= lvl.minHours) {
      currentLevel = lvl;
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        width: "100%",
        maxWidth: "800px",
        gap: "16px",
        justifyContent: "center",
      }}
    >
      {/* 1. Real Listening Time & Rank Card */}
      <div
        className="neo-card fun-hover-wobble"
        style={{
          flex: "1 1 220px",
          padding: "16px",
          transform: "rotate(0.5deg)",
          boxShadow: "5px 5px 0px var(--primary)",
          backgroundColor: "var(--surface-container)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
            SINTONÍA & RANGO C
          </span>
          <Clock size={18} style={{ color: "var(--primary)" }} />
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "10px 0" }}>
          <span style={{ fontSize: "2rem", fontWeight: 900, fontFamily: "Space Grotesk, sans-serif" }}>
            {hoursListened > 0 ? `${hoursListened}h ${minutesListened}m` : `${minutesListened} MIN`}
          </span>
        </div>

        <div
          style={{
            backgroundColor: "var(--primary)",
            color: "white",
            padding: "3px 8px",
            fontSize: "0.62rem",
            fontWeight: 900,
            width: "fit-content",
            marginBottom: "6px",
          }}
        >
          {currentLevel.icon} {currentLevel.title.toUpperCase()}
        </div>

        <span style={{ fontSize: "0.58rem", opacity: 0.7, display: "block" }}>
          ⏱️ +1 C-Coin cada 30 min de sintonía.
        </span>
      </div>

      {/* 2. C-Coins & Daily Streak Card (SUPER DESTACADO) */}
      <div
        className="neo-card fun-hover-wobble"
        style={{
          flex: "1 1 240px",
          padding: "16px",
          transform: "rotate(-0.5deg)",
          boxShadow: "6px 6px 0px var(--primary)",
          backgroundColor: "#CCFF00",
          color: "#111111",
          border: "3px solid var(--primary)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 900, textTransform: "uppercase", color: "#111" }}>
            BILLETERA C-COINS 🪙
          </span>
          <Flame size={20} style={{ color: "#BA1A1A", fill: "#BA1A1A" }} />
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "8px 0" }}>
          <span style={{ fontSize: "2.4rem", fontWeight: 900, fontFamily: "Space Grotesk, sans-serif", color: "#111" }}>
            {cCoins}
          </span>
          <span style={{ fontSize: "0.9rem", fontWeight: 900, color: "#111" }}>
            {cCoins === 1 ? "C-COIN" : "C-COINS"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <div
            style={{
              backgroundColor: "white",
              color: "#111",
              border: "1.5px solid var(--primary)",
              padding: "2px 8px",
              fontSize: "0.62rem",
              fontWeight: 900,
            }}
          >
            🔥 RACHA: {streakDays} {streakDays === 1 ? "DÍA" : "DÍAS"}
          </div>
          <div
            style={{
              backgroundColor: "var(--primary)",
              color: "white",
              padding: "2px 8px",
              fontSize: "0.62rem",
              fontWeight: 900,
            }}
          >
            CANJEABLE POR MERCH & SALUDOS
          </div>
        </div>
      </div>

      {/* 3. Real Favorites Stats Card */}
      <div
        className="neo-card fun-hover-wobble"
        style={{
          flex: "1 1 220px",
          padding: "16px",
          transform: "rotate(0.5deg)",
          boxShadow: "5px 5px 0px var(--primary)",
          backgroundColor: "var(--surface-container)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
            FAVORITOS
          </span>
          <Star size={18} style={{ color: "#FFCC00", fill: "#FFCC00" }} />
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "10px 0" }}>
          <span style={{ fontSize: "2rem", fontWeight: 900, fontFamily: "Space Grotesk, sans-serif" }}>
            {totalFavoritesCount}
          </span>
          <span style={{ fontSize: "0.75rem", fontWeight: 900, opacity: 0.8 }}>
            GUARDADOS
          </span>
        </div>

        <div
          style={{
            backgroundColor: "var(--primary-container)",
            border: "1.5px solid var(--primary)",
            padding: "3px 8px",
            fontSize: "0.62rem",
            fontWeight: 900,
            width: "fit-content",
          }}
        >
          {favoriteSongsCount} TEMAS • {savedStationsCount} RADIOS
        </div>
      </div>
    </div>
  );
};
