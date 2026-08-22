"use client";

import { Clock, Star } from "lucide-react";

interface ProfileStatsCardsProps {
  listenedSeconds: number;
  totalFavoritesCount: number;
  favoriteSongsCount: number;
  savedStationsCount: number;
}

export const ProfileStatsCards = ({
  listenedSeconds,
  totalFavoritesCount,
  favoriteSongsCount,
  savedStationsCount,
}: ProfileStatsCardsProps) => {
  const totalSeconds = listenedSeconds || 0;
  const hoursListened = Math.floor(totalSeconds / 3600);
  const minutesListened = Math.floor((totalSeconds % 3600) / 60);

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
      {/* Real Listening Time Card */}
      <div
        className="neo-card fun-hover-wobble"
        style={{
          flex: "1 1 240px",
          padding: "16px",
          transform: "rotate(1deg)",
          boxShadow: "5px 5px 0px var(--primary)",
          backgroundColor: "var(--surface-container)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
            TIEMPO EN SINTONÍA REAL
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
            width: "100%",
            height: "12px",
            border: "2px solid var(--primary)",
            backgroundColor: "white",
            padding: "1px",
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(5, (totalSeconds / 36000) * 100))}%`,
              height: "100%",
              backgroundColor: "var(--primary-container)",
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <span style={{ fontSize: "0.58rem", opacity: 0.7, marginTop: "4px", display: "block" }}>
          ⏱️ Calculado automáticamente mientras escuchas la radio.
        </span>
      </div>

      {/* Real Favorites Stats Card */}
      <div
        className="neo-card fun-hover-wobble"
        style={{
          flex: "1 1 240px",
          padding: "16px",
          transform: "rotate(-1deg)",
          boxShadow: "5px 5px 0px var(--primary)",
          backgroundColor: "var(--surface-container)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
            COLECCIÓN DE FAVORITOS
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
            fontSize: "0.65rem",
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
