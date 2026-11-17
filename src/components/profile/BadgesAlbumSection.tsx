"use client";

import { useState, useEffect } from "react";
import { Award, Gift } from "lucide-react";

interface BadgesAlbumSectionProps {
  listenedSeconds: number;
  streakDays: number;
  savedStationsCount: number;
  cCoins: number;
  onClaimCoins?: (amount: number) => void;
}

interface BadgeDef {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
  req: string;
  progressLabel: string;
  rewardCoins: number;
}

const CLAIMED_BADGES_KEY = "doblec_claimed_badges_v1";

export const BadgesAlbumSection = ({
  listenedSeconds,
  streakDays,
  savedStationsCount,
  cCoins,
  onClaimCoins,
}: BadgesAlbumSectionProps) => {
  const hours = Math.floor((listenedSeconds || 0) / 3600);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CLAIMED_BADGES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setClaimedIds(parsed as string[]);
      }
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, []);

  const BADGES: BadgeDef[] = [
    {
      id: "streak_7",
      title: "Racha de Hierro",
      icon: "🔥",
      unlocked: streakDays >= 7,
      req: "7 días seguidos en sintonía",
      progressLabel: `${Math.min(streakDays, 7)} / 7 días`,
      rewardCoins: 2,
    },
    {
      id: "streak_30",
      title: "Racha Inmortal",
      icon: "👑",
      unlocked: streakDays >= 30,
      req: "30 días seguidos en sintonía",
      progressLabel: `${Math.min(streakDays, 30)} / 30 días`,
      rewardCoins: 8,
    },
    {
      id: "hours_10",
      title: "Melómano Nocturno",
      icon: "🎧",
      unlocked: hours >= 10,
      req: "10 hrs de radio acumuladas",
      progressLabel: `${Math.min(hours, 10)} / 10 hrs`,
      rewardCoins: 2,
    },
    {
      id: "hours_50",
      title: "Leyenda del Dial",
      icon: "📻",
      unlocked: hours >= 50,
      req: "50 hrs de radio acumuladas",
      progressLabel: `${Math.min(hours, 50)} / 50 hrs`,
      rewardCoins: 6,
    },
    {
      id: "hours_100",
      title: "Capitán Supremo C",
      icon: "⚡",
      unlocked: hours >= 100,
      req: "100 hrs de radio acumuladas",
      progressLabel: `${Math.min(hours, 100)} / 100 hrs`,
      rewardCoins: 15,
    },
    {
      id: "coins_15",
      title: "Coleccionista C",
      icon: "🪙",
      unlocked: cCoins >= 15,
      req: "15 C-Coins en billetera",
      progressLabel: `${Math.min(cCoins, 15)} / 15 🪙`,
      rewardCoins: 3,
    },
    {
      id: "coins_50",
      title: "Magnate Doble C",
      icon: "💎",
      unlocked: cCoins >= 50,
      req: "50 C-Coins en billetera",
      progressLabel: `${Math.min(cCoins, 50)} / 50 🪙`,
      rewardCoins: 10,
    },
    {
      id: "stations_5",
      title: "Explorador de Radios",
      icon: "📡",
      unlocked: savedStationsCount >= 5,
      req: "5 emisoras guardadas",
      progressLabel: `${Math.min(savedStationsCount, 5)} / 5 radios`,
      rewardCoins: 2,
    },
  ];

  const unlockedCount = BADGES.filter((b) => b.unlocked).length;

  const handleClaimBadge = (badge: BadgeDef) => {
    if (!badge.unlocked || claimedIds.includes(badge.id)) return;
    const next = [...claimedIds, badge.id];
    setClaimedIds(next);
    try {
      window.localStorage.setItem(CLAIMED_BADGES_KEY, JSON.stringify(next));
    } catch {
      // Ignorar
    }
    onClaimCoins?.(badge.rewardCoins);
  };

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Award size={16} style={{ color: "#FFB000" }} />
          <span style={{ fontSize: "0.78rem", fontWeight: 900, textTransform: "uppercase" }}>
            INSIGNIAS DESTACADAS DOBLE C (PREMIAN C-COINS)
          </span>
        </div>
        <span
          style={{
            backgroundColor: "var(--primary-container)",
            color: "var(--on-primary-container)",
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
          gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
          gap: "10px",
        }}
      >
        {BADGES.map((badge) => {
          const isClaimed = claimedIds.includes(badge.id);
          return (
            <div
              key={badge.id}
              style={{
                backgroundColor: badge.unlocked ? "var(--card-bg)" : "var(--secondary-container)",
                color: "var(--on-background)",
                border: badge.unlocked ? "2px solid var(--primary)" : "1.5px dashed var(--on-surface-variant)",
                padding: "10px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "center",
                gap: "5px",
                opacity: badge.unlocked ? 1 : 0.78,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                <span style={{ fontSize: "1.5rem", filter: badge.unlocked ? "none" : "grayscale(75%)" }}>
                  {badge.icon}
                </span>
                <span style={{ fontSize: "0.66rem", fontWeight: 900, color: "var(--on-background)" }}>
                  {badge.title}
                </span>
                <span style={{ fontSize: "0.54rem", color: "var(--on-surface-variant)", fontWeight: "bold" }}>
                  {badge.req}
                </span>
              </div>

              {badge.unlocked ? (
                isClaimed ? (
                  <span
                    style={{
                      fontSize: "0.56rem",
                      fontWeight: 900,
                      color: "#15803D",
                      backgroundColor: "#DCFCE7",
                      border: "1px solid #16A34A",
                      padding: "2px 6px",
                    }}
                  >
                    ✓ Reclamado (+{badge.rewardCoins} 🪙)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleClaimBadge(badge)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      backgroundColor: "#CCFF00",
                      color: "#111111",
                      border: "1.5px solid var(--primary)",
                      boxShadow: "2px 2px 0px var(--primary)",
                      fontSize: "0.58rem",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    <Gift size={11} />
                    <span>RECLAMAR +{badge.rewardCoins} 🪙</span>
                  </button>
                )
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <span
                    style={{
                      fontSize: "0.54rem",
                      fontWeight: 900,
                      color: "#111",
                      backgroundColor: "#FFE082",
                      border: "1px solid #FFB000",
                      padding: "1px 6px",
                    }}
                  >
                    Premio: +{badge.rewardCoins} 🪙
                  </span>
                  <span style={{ fontSize: "0.52rem", opacity: 0.7, fontWeight: "bold" }}>
                    Progreso: {badge.progressLabel}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
