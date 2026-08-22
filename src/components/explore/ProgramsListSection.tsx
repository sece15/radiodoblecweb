"use client";

import { Heart, Share2 } from "lucide-react";
import { Station, RadioProgram } from "@/types";

interface ProgramsListSectionProps {
  stations: Station[];
  programs: RadioProgram[];
  isPlaying: boolean;
  currentTrackTitle: string;
  onSelectHostProgram: (program: RadioProgram) => void;
  onToggleLike: (stationId: string) => void;
  onShare: (stationName: string) => void;
}

export const ProgramsListSection = ({
  stations,
  programs,
  isPlaying,
  currentTrackTitle,
  onSelectHostProgram,
  onToggleLike,
  onShare,
}: ProgramsListSectionProps) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h3 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase" }}>
        PROGRAMAS DOBLE C
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {stations.map((station, idx) => {
          const rotations = [-0.5, 0.8, -0.3];
          const rot = rotations[idx % rotations.length];
          const isCurrent = isPlaying && currentTrackTitle === station.name;
          return (
            <div
              key={station.id}
              className="neo-card store-card-hover"
              style={{
                transform: isCurrent ? `translate(5px, 5px) rotate(0deg)` : `rotate(${rot}deg)`,
                cursor: "pointer",
                boxShadow: isCurrent ? "1px 1px 0px var(--primary)" : "6px 6px 0px var(--primary)",
                backgroundColor: isCurrent ? "var(--primary-container)" : "var(--card-bg)",
              }}
              onClick={() => {
                const matchingProg = programs.find(
                  (p) => p.id === station.id || p.title.toLowerCase() === station.name.toLowerCase()
                );
                onSelectHostProgram(
                  matchingProg || {
                    id: station.id,
                    title: station.name,
                    host: "Locutor Doble C",
                    timeSlot: station.frequency,
                    genre: station.style,
                    imageUrl: station.imageUrl,
                    description: station.description,
                  }
                );
              }}
            >
              {/* Cover Photo */}
              <div style={{ position: "relative", width: "100%", height: "160px", backgroundColor: "#1A1D10" }}>
                <img
                  src={station.imageUrl}
                  alt={station.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                />

                {/* Frequency tag */}
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    backgroundColor: "var(--primary-container)",
                    border: "2px solid var(--primary)",
                    padding: "2px 8px",
                    fontSize: "0.7rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                  }}
                >
                  {station.frequency}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <h4
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    borderBottom: "4px solid var(--primary-container)",
                    paddingBottom: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                  title={station.name}
                >
                  {station.name}
                </h4>
                <p
                  style={{
                    fontSize: "0.75rem",
                    opacity: 0.8,
                    lineHeight: "1.1rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {station.description}
                </p>

                {/* Action buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "2px solid var(--primary)",
                    paddingTop: "10px",
                    marginTop: "8px",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onToggleLike(station.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                  >
                    <Heart
                      size={24}
                      style={{
                        fill: station.isLiked ? "#BA1A1A" : "none",
                        color: station.isLiked ? "#BA1A1A" : "var(--primary)",
                      }}
                    />
                  </button>

                  <span
                    style={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--primary)",
                      padding: "2px 6px",
                      fontSize: "0.65rem",
                      fontWeight: "bold",
                    }}
                  >
                    {station.style}
                  </span>

                  <button
                    onClick={() => onShare(station.name)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                  >
                    <Share2 size={22} style={{ color: "var(--primary)" }} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
