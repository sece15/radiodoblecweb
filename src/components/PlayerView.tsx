import React, { useRef } from "react";
import { useAudio } from "@/context/AudioContext";
import { Play, Pause, Volume2, VolumeX, FastForward, X } from "lucide-react";

interface PlayerViewProps {
  onClose: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({ onClose }) => {
  const {
    isPlaying,
    currentTrack,
    progress,
    currentTime,
    totalTime,
    volume,
    isMuted,
    togglePlayPause,
    toggleMute,
    seekToProgress,
    seekToLiveEdge,
  } = useAudio();

  const progressTrackRef = useRef<HTMLDivElement>(null);

  // Format time MM:SS or negative timeshift offset
  const formatTime = (secs: number) => {
    if (secs < 0) return secs.toString();
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatProgressTime = () => {
    if (currentTrack.isLive) {
      if (progress >= 0.95) {
        return "LIVE";
      } else {
        const offsetSecs = Math.round((progress - 1) * totalTime);
        return formatTime(offsetSecs);
      }
    }
    return formatTime(currentTime);
  };

  const formatTotalTime = () => {
    if (currentTrack.isLive) return "LIVE";
    return formatTime(totalTime);
  };

  // Click & Drag Progress Calculator
  const handleProgressAction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressTrackRef.current) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    seekToProgress(newProgress);
  };

  return (
    <div
      className="scanlines"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "var(--background)",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      {/* A. CLOSE BUTTON */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "24px",
          right: "24px",
          backgroundColor: "var(--primary)",
          color: "var(--on-primary)",
          border: "3px solid var(--primary)",
          boxShadow: "3px 3px 0px var(--primary-container)",
          padding: "8px 16px",
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "0.85rem",
          fontWeight: 900,
          cursor: "pointer",
          transform: "rotate(2deg)",
          zIndex: 10,
        }}
      >
        CERRAR X
      </button>

      {/* B. PLAYER DECK CONTAINER */}
      <div
        className="neo-card"
        style={{
          backgroundColor: "var(--card-bg)",
          border: "4px solid var(--primary)",
          boxShadow: "8px 8px 0px var(--primary)",
          padding: "32px",
          width: "100%",
          maxWidth: "450px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          position: "relative",
          transform: "rotate(-1deg)",
        }}
      >
        {/* Stickers overlays */}
        <div
          style={{
            position: "absolute",
            top: "-20px",
            left: "20px",
            backgroundColor: "var(--primary-container)",
            color: "var(--primary)",
            padding: "4px 10px",
            fontSize: "0.65rem",
            fontWeight: "black",
            border: "2px solid var(--primary)",
            transform: "rotate(-8deg)",
            boxShadow: "2px 2px 0px var(--primary)",
          }}
        >
          ★ REPRODUCTOR PUNK ★
        </div>

        {/* 1. SPINNING VINYL RECORD ART */}
        <div style={{ position: "relative", width: "240px", height: "240px", marginTop: "8px" }}>
          {/* Vinyl background disc */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              backgroundColor: "#111111",
              border: "8px double #333333",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.8), 5px 5px 15px rgba(0,0,0,0.3)",
              animation: isPlaying ? "spin 6s linear infinite" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Vinyl grooves */}
            <div
              style={{
                width: "80%",
                height: "80%",
                borderRadius: "50%",
                border: "1px solid #222",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Album art cover at the center */}
              <div
                style={{
                  width: "110px",
                  height: "110px",
                  borderRadius: "50%",
                  border: "4px solid #111",
                  overflow: "hidden",
                  boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                }}
              >
                <img
                  src={currentTrack.imageUrl}
                  alt="Carátula"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
            {/* Center spindle hole */}
            <div
              style={{
                position: "absolute",
                width: "12px",
                height: "12px",
                backgroundColor: "var(--background)",
                borderRadius: "50%",
                border: "2px solid #000",
                zIndex: 5,
              }}
            ></div>
          </div>

          {/* Status sticker badge */}
          <div
            className="pulse-dot"
            style={{
              position: "absolute",
              top: "-10px",
              right: "-10px",
              backgroundColor: "var(--primary-container)",
              border: "2.5px solid var(--primary)",
              padding: "6px 12px",
              fontSize: "0.65rem",
              fontWeight: 900,
              color: "var(--primary)",
              transform: "rotate(5deg)",
              boxShadow: "2px 2px 0px var(--primary)",
            }}
          >
            {isPlaying ? "ON AIR 📡" : "MUTED ✕"}
          </div>
        </div>

        {/* 2. TRACK METADATA */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "100%" }}>
          <h2
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              fontSize: "1.2rem",
              fontWeight: 900,
              padding: "6px 16px",
              textAlign: "center",
              textTransform: "uppercase",
              width: "max-content",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transform: "rotate(1deg)",
            }}
          >
            {currentTrack.title}
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              fontWeight: 900,
              color: "var(--secondary)",
              textAlign: "center",
            }}
          >
            {currentTrack.album || currentTrack.artist}
          </p>
        </div>

        {/* 3. SEEK PROGRESS BAR */}
        <div style={{ display: "flex", width: "100%", alignItems: "center", gap: "10px", padding: "0 4px" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: "bold", width: "35px", textAlign: "right" }}>
            {formatProgressTime()}
          </span>

          <div
            ref={progressTrackRef}
            onClick={handleProgressAction}
            className="neo-slider-track"
            style={{ flex: 1 }}
          >
            <div className="neo-slider-fill" style={{ width: `${progress * 100}%` }}></div>
            <div className="neo-slider-thumb" style={{ left: `calc(${progress * 100}% - 10px)` }}></div>
          </div>

          <span style={{ fontSize: "0.65rem", fontWeight: "bold", width: "35px", textAlign: "left" }}>
            {formatTotalTime()}
          </span>
        </div>

        {/* 4. CONTROL BUTTONS */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", width: "100%" }}>
          {/* Mute toggle button */}
          <button
            onClick={toggleMute}
            className="neo-button-circular"
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "var(--card-bg)",
              border: "3.5px solid var(--primary)",
              boxShadow: "3px 3px 0px var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>

          {/* Large circular Play/Pause button */}
          <button
            onClick={togglePlayPause}
            className="neo-button-circular"
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: "var(--primary-container)",
              border: "3.5px solid var(--primary)",
              boxShadow: "5px 5px 0px var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {isPlaying ? (
              <Pause size={32} style={{ fill: "var(--primary)", color: "var(--primary)" }} />
            ) : (
              <Play size={32} style={{ fill: "var(--primary)", color: "var(--primary)", marginLeft: "4px" }} />
            )}
          </button>

          {/* Catch-up Live button */}
          <button
            onClick={seekToLiveEdge}
            className="neo-button-circular"
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "var(--card-bg)",
              border: "3.5px solid var(--primary)",
              boxShadow: "3px 3px 0px var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            disabled={!currentTrack.isLive}
          >
            <FastForward size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};
