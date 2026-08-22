"use client";

import { Station } from "@/types";

interface SavedStationsSectionProps {
  savedStations: Station[];
  onPlayStation: (station: Station) => void;
  onNavigateToPlayer: () => void;
}

export const SavedStationsSection = ({
  savedStations,
  onPlayStation,
  onNavigateToPlayer,
}: SavedStationsSectionProps) => {
  if (savedStations.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "800px",
        gap: "12px",
        marginTop: "12px",
      }}
    >
      <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
        📻 RADIOS Y FRECUENCIAS GUARDADAS ({savedStations.length})
      </h3>

      <div style={{ display: "flex", gap: "12px", overflowX: "auto", padding: "6px 0" }}>
        {savedStations.map((station) => (
          <div
            key={station.id}
            onClick={() => {
              onPlayStation(station);
              onNavigateToPlayer();
            }}
            className="neo-card fun-hover-wobble"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              width: "110px",
              flexShrink: 0,
              cursor: "pointer",
              padding: "6px",
              backgroundColor: "var(--surface-container)",
              boxShadow: "3px 3px 0px var(--primary)",
              border: "2px solid var(--primary)",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "1/1",
                overflow: "hidden",
                border: "1.5px solid var(--primary)",
              }}
            >
              <img
                src={station.imageUrl}
                alt={station.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 900,
                textTransform: "uppercase",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
                textAlign: "center",
              }}
            >
              {station.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
