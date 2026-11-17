"use client";

import { useState, useEffect } from "react";
import { Target, Sparkles } from "lucide-react";
import { INTERMITTENT_DROP_REQUIRED_SECS } from "@/hooks/useGamification";

interface LevelInfo {
  level: number;
  minHours: number;
  title: string;
  icon: string;
  color: string;
}

interface RankAndSettingsCardProps {
  listenedSeconds: number;
  currentLevelInfo: LevelInfo;
  nextLevelInfo: LevelInfo | null;
  levelProgress: number;
  canSpinToday: boolean;
}

export const RankAndSettingsCard = ({
  listenedSeconds,
  currentLevelInfo,
  nextLevelInfo,
  levelProgress,
  canSpinToday,
}: RankAndSettingsCardProps) => {
  const [dailySecs, setDailySecs] = useState<number>(0);
  const [dropClaimedToday, setDropClaimedToday] = useState<boolean>(false);

  useEffect(() => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const rawDropDate = window.localStorage.getItem("doblec_last_cdrop_date");
      if (rawDropDate) {
        setDropClaimedToday(JSON.parse(rawDropDate) === todayStr);
      }

      const rawDailySecs = window.localStorage.getItem("doblec_daily_listened_secs");
      if (rawDailySecs) {
        setDailySecs(Number(JSON.parse(rawDailySecs)) || 0);
      }
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [listenedSeconds]);

  const totalHours = (listenedSeconds || 0) / 3600;
  const remainingSecsToNext = nextLevelInfo
    ? Math.max(0, nextLevelInfo.minHours * 3600 - (listenedSeconds || 0))
    : 0;
  const remH = Math.floor(remainingSecsToNext / 3600);
  const remM = Math.floor((remainingSecsToNext % 3600) / 60);

  const dropProgressPct = dropClaimedToday
    ? 100
    : Math.min(100, Math.round((dailySecs / INTERMITTENT_DROP_REQUIRED_SECS) * 100));

  return (
    <div
      className="neo-card"
      style={{
        width: "100%",
        maxWidth: "800px",
        padding: "16px",
        backgroundColor: "var(--surface-container)",
        border: "2px solid var(--primary)",
        boxShadow: "5px 5px 0px var(--primary)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Target size={16} style={{ color: "var(--primary)" }} />
          <span style={{ fontSize: "0.78rem", fontWeight: 900, textTransform: "uppercase" }}>
            PROGRESO DE RANGO & RADAR DE HOY
          </span>
        </div>
        <span
          style={{
            backgroundColor: "#CCFF00",
            color: "#111111",
            border: "1.5px solid var(--primary)",
            padding: "2px 8px",
            fontSize: "0.62rem",
            fontWeight: 900,
          }}
        >
          {currentLevelInfo.icon} {currentLevelInfo.title.toUpperCase()} ({totalHours.toFixed(1)}h)
        </span>
      </div>

      {/* Barra de progreso hacia el siguiente rango */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.64rem", fontWeight: 900 }}>
          <span>
            {nextLevelInfo
              ? `Siguiente: ${nextLevelInfo.icon} ${nextLevelInfo.title} (${nextLevelInfo.minHours}h)`
              : "👑 ¡Alcanzaste el rango máximo de Radio Doble C!"}
          </span>
          <span>{levelProgress}%</span>
        </div>
        <div
          style={{
            width: "100%",
            height: "14px",
            backgroundColor: "#E4E4E7",
            border: "2px solid var(--primary)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${levelProgress}%`,
              height: "100%",
              backgroundColor: "#CCFF00",
              transition: "width 0.35s ease",
            }}
          />
        </div>
        {nextLevelInfo && (
          <span style={{ fontSize: "0.58rem", opacity: 0.75, fontWeight: "bold" }}>
            ⏱️ Te faltan {remH > 0 ? `${remH}h ${remM}m` : `${remM} min`} de sintonía para subir de rango.
          </span>
        )}
      </div>

      {/* Radar rápido de bonos diarios */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "10px",
          marginTop: "2px",
        }}
      >
        <div
          style={{
            backgroundColor: canSpinToday ? "#CCFF00" : "var(--card-bg)",
            color: canSpinToday ? "#111111" : "var(--on-background)",
            border: "1.5px solid var(--primary)",
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "0.65rem", fontWeight: 900, color: canSpinToday ? "#111111" : "var(--on-background)" }}>
            🎰 TORNAMESA C
          </span>
          <span
            style={{
              fontSize: "0.58rem",
              fontWeight: 900,
              padding: "2px 6px",
              backgroundColor: canSpinToday ? "#111111" : "var(--secondary-container)",
              color: canSpinToday ? "#CCFF00" : "var(--on-background)",
              border: canSpinToday ? "none" : "1px solid var(--primary)",
            }}
          >
            {canSpinToday ? "DISPONIBLE" : "USADO"}
          </span>
        </div>

        <div
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--on-background)",
            border: "1.5px solid var(--primary)",
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "0.65rem", fontWeight: 900, color: "var(--on-background)", display: "flex", alignItems: "center", gap: "4px" }}>
            <Sparkles size={12} /> C-DROP EN VIVO (+1 🪙)
          </span>
          <span
            style={{
              fontSize: "0.58rem",
              fontWeight: 900,
              padding: "2px 6px",
              backgroundColor: dropClaimedToday ? "#DCFCE7" : "#FFE082",
              color: dropClaimedToday ? "#15803D" : "#111",
              border: "1px solid var(--primary)",
            }}
          >
            {dropClaimedToday ? "✓ COBRADO HOY" : `${dropProgressPct}% DE HOY`}
          </span>
        </div>
      </div>
    </div>
  );
};
