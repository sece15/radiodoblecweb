"use client";

import { Heart } from "lucide-react";
import type { DiggerMiniPad, DiggerTrack } from "@/types/studio";

interface DiggerTrackDossierProps {
  currentTrack: DiggerTrack;
  isCurrentFavorite: boolean;
  trackPads: DiggerMiniPad[];
  activePadId: number | null;
  onToggleFavorite: (trackId: string) => void;
  onJumpToPad: (pad: DiggerMiniPad) => void;
}

export function DiggerTrackDossier({
  currentTrack,
  isCurrentFavorite,
  trackPads,
  activePadId,
  onToggleFavorite,
  onJumpToPad,
}: DiggerTrackDossierProps) {
  return (
    <div
      style={{
        backgroundColor: "#11141C",
        border: "2px solid #1E2332",
        borderRadius: "6px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "9px",
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Track Title, Artist & Favorite Button */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", minWidth: 0 }}>
        <div style={{ overflow: "hidden", minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontSize: "0.92rem",
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "0.5px",
              lineHeight: 1.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {currentTrack.title}
          </h2>
          {currentTrack.artist &&
            !currentTrack.artist.toLowerCase().includes("desconocid") &&
            !currentTrack.artist.toLowerCase().includes("canal de") && (
              <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#CCFF00", marginTop: "2px" }}>
                👤 {currentTrack.artist}
              </div>
            )}
        </div>

        <button
          type="button"
          onClick={() => onToggleFavorite(currentTrack.id)}
          style={{
            padding: "6px 8px",
            backgroundColor: isCurrentFavorite ? "#CCFF00" : "#161B26",
            color: isCurrentFavorite ? "#000000" : "#FFFFFF",
            border: "1px solid #232838",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flexShrink: 0,
          }}
          title={isCurrentFavorite ? "Guardado en favoritos" : "Guardar en favoritos"}
        >
          <Heart size={14} fill={isCurrentFavorite ? "#000000" : "none"} />
        </button>
      </div>

      {/* Minimalist Key Metadata Badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        <span
          style={{
            padding: "3px 6px",
            backgroundColor: "#161B26",
            border: "1px solid #232838",
            color: "#FFFFFF",
            borderRadius: "3px",
            fontSize: "0.64rem",
            fontWeight: 800,
          }}
        >
          {currentTrack.year || currentTrack.decade}
        </span>
        <span
          style={{
            padding: "3px 6px",
            backgroundColor: "#161B26",
            border: "1px solid #232838",
            color: "#CCFF00",
            borderRadius: "3px",
            fontSize: "0.64rem",
            fontWeight: 800,
          }}
        >
          ⚡ {currentTrack.bpm} BPM
        </span>
        <span
          style={{
            padding: "3px 6px",
            backgroundColor: "#161B26",
            border: "1px solid #232838",
            color: "#FFFFFF",
            borderRadius: "3px",
            fontSize: "0.64rem",
            fontWeight: 800,
          }}
        >
          🎵 {currentTrack.key}
        </span>
        {currentTrack.country &&
          !currentTrack.country.toLowerCase().includes("mundial") &&
          currentTrack.country !== "Todos" && (
            <span
              style={{
                padding: "3px 6px",
                backgroundColor: "#161B26",
                border: "1px solid #232838",
                color: "#94A3B8",
                borderRadius: "3px",
                fontSize: "0.64rem",
                fontWeight: 800,
              }}
            >
              📍 {currentTrack.country}
            </span>
          )}
      </div>

      {/* Minimalist Compact 8 Mini Pads (Grid 2x4) */}
      <div
        style={{
          backgroundColor: "#0B0E14",
          border: "1px solid #1E2332",
          borderRadius: "4px",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          minWidth: 0,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", minWidth: 0 }}>
          <span style={{ fontSize: "0.64rem", fontWeight: 800, color: "#94A3B8" }}>
            8 PADS DE CORTE
          </span>
          <span style={{ fontSize: "0.58rem", color: "#CCFF00", fontWeight: 700, flexShrink: 0 }}>
            Preescucha en vivo
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "5px",
            width: "100%",
            minWidth: 0,
          }}
        >
          {trackPads.map((pad) => {
            const isSelected = activePadId === pad.id;
            return (
              <button
                key={pad.id}
                type="button"
                onClick={() => onJumpToPad(pad)}
                title={`PAD ${pad.id} — ${pad.label}`}
                style={{
                  padding: "4px 6px",
                  backgroundColor: isSelected ? "#CCFF00" : "#161B26",
                  color: isSelected ? "#000000" : "#FFFFFF",
                  border: isSelected ? "1px solid #CCFF00" : "1px solid #232838",
                  borderRadius: "3px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "1px",
                  minWidth: 0,
                  width: "100%",
                  overflow: "hidden",
                  boxSizing: "border-box",
                  transition: "all 0.1s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px", width: "100%", minWidth: 0 }}>
                  <span style={{ fontSize: "0.60rem", fontWeight: 900, whiteSpace: "nowrap" }}>
                    PAD {pad.id}
                  </span>
                  <span style={{ fontSize: "0.56rem", fontFamily: "monospace", opacity: 0.85, flexShrink: 0 }}>
                    {Math.floor(pad.timeSec / 60)}:{(pad.timeSec % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "100%",
                    maxWidth: "100%",
                    minWidth: 0,
                    textAlign: "left",
                    opacity: isSelected ? 1 : 0.85,
                  }}
                >
                  {pad.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontSize: "0.70rem",
          color: "#94A3B8",
          lineHeight: 1.35,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {currentTrack.description}
      </p>
    </div>
  );
}
