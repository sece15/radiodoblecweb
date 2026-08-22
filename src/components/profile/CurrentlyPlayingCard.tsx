"use client";

import { PlayCircle } from "lucide-react";
import { CurrentTrack } from "@/types";

interface CurrentlyPlayingCardProps {
  currentTrack: CurrentTrack;
  isPlaying: boolean;
  liveStatusText: string;
  onTogglePlayPause: () => void;
}

export const CurrentlyPlayingCard = ({
  currentTrack,
  isPlaying,
  liveStatusText,
  onTogglePlayPause,
}: CurrentlyPlayingCardProps) => {
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
        SINTONIZANDO EN ESTE MOMENTO
      </h3>

      <div
        className="neo-card"
        style={{
          backgroundColor: "var(--primary)",
          color: "white",
          boxShadow: "6px 6px 0px var(--primary-container)",
          border: "3px solid var(--primary)",
        }}
      >
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                backgroundColor: currentTrack?.isLive ? "#BA1A1A" : "var(--primary-container)",
                color: currentTrack?.isLive ? "white" : "var(--primary)",
                border: "1px solid currentColor",
                padding: "2px 8px",
                fontSize: "0.65rem",
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              {currentTrack?.isLive ? "🔴 EN VIVO" : "DISCO A LA CARTA"}
            </div>
            <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>
              {liveStatusText}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <img
                src={currentTrack?.imageUrl || "/hitsandbeats.jpg"}
                alt={currentTrack?.title}
                className={isPlaying ? "spinning-vinyl" : ""}
                style={{
                  width: "46px",
                  height: "46px",
                  objectFit: "cover",
                  border: "2px solid var(--primary-container)",
                  flexShrink: 0,
                  borderRadius: "50%",
                }}
              />
              <div style={{ minWidth: 0 }}>
                <h4
                  style={{
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    margin: 0,
                  }}
                >
                  {currentTrack?.title || "RADIO DOBLE C"}
                </h4>
                <p
                  style={{
                    fontSize: "0.68rem",
                    opacity: 0.8,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    margin: "2px 0 0 0",
                  }}
                >
                  {currentTrack?.artist || currentTrack?.album || "SELECCIÓN OFICIAL"}
                </p>
              </div>
            </div>

            <button
              onClick={onTogglePlayPause}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? (
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "var(--primary-container)",
                    border: "2px solid var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "2px 2px 0px var(--primary)",
                  }}
                >
                  <span style={{ display: "flex", gap: "3px" }}>
                    <span style={{ width: "3.5px", height: "13px", backgroundColor: "var(--primary)" }}></span>
                    <span style={{ width: "3.5px", height: "13px", backgroundColor: "var(--primary)" }}></span>
                  </span>
                </div>
              ) : (
                <PlayCircle size={40} style={{ color: "var(--primary-container)" }} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
