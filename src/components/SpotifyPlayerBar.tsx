import { useRef, MouseEvent, TouchEvent } from "react";
import { useAudio } from "@/hooks/useAudio";
import { Play, Pause, Volume2, VolumeX, MessageSquare, SkipBack, SkipForward } from "lucide-react";

interface SpotifyPlayerBarProps {
  isChatOpen: boolean;
  onToggleChat: () => void;
  onExpand: () => void;
}

export const SpotifyPlayerBar = ({
  isChatOpen,
  onToggleChat,
  onExpand,
}: SpotifyPlayerBarProps) => {
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
    skipNext,
    skipPrevious,
    changeVolume,
  } = useAudio();

  const progressTrackRef = useRef<HTMLDivElement>(null);

  // Format time MM:SS or negative timeshift offset
  const formatTime = (secs: number) => {
    if (secs < 0) return secs.toString(); // e.g. -15:00
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

  // Click & Drag Progress seek
  const handleProgressAction = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if (!progressTrackRef.current) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    seekToProgress(newProgress);
  };

  return (
    <div className="spotify-player-bar">
      {/* 1. LEFT: Track details & Thumbnail */}
      <div
        className="player-bar-left"
        style={{
          display: "flex",
          alignItems: "center",
          width: "25%",
          minWidth: "180px",
        }}
      >
        <div
          onClick={onExpand}
          style={{
            width: "56px",
            height: "56px",
            border: "3px solid var(--primary)",
            boxShadow: "2px 2px 0px var(--primary)",
            backgroundColor: "white",
            marginRight: "12px",
            cursor: "pointer",
            overflow: "hidden",
            flexShrink: 0,
            transform: isPlaying ? "rotate(1.5deg)" : "none",
            transition: "transform 0.3s ease",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={currentTrack.imageUrl}
            alt="Track"
            style={{
              width: "92%",
              height: "92%",
              objectFit: "cover",
              borderRadius: "50%",
              animation: isPlaying ? "spin 20s linear infinite" : "none",
            }}
          />
          {/* Vinyl center spindle hole */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "10px",
              height: "10px",
              backgroundColor: "white",
              border: "2px solid var(--primary)",
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          ></div>
        </div>

        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <h4
            onClick={onExpand}
            style={{
              fontSize: "0.85rem",
              fontWeight: 900,
              textTransform: "uppercase",
              color: "var(--primary)",
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginBottom: "2px",
            }}
          >
            {currentTrack.title}
          </h4>
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: "bold",
              color: "var(--secondary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentTrack.artist}
          </p>
        </div>

        {/* Small live pulsing status dot */}
        {currentTrack.isLive && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginLeft: "10px",
            }}
          >
            <div
              className="pulse-dot"
              style={{
                width: "6px",
                height: "6px",
                backgroundColor: progress >= 0.95 ? "#BA1A1A" : "var(--primary-container)",
                borderRadius: "50%",
                border: "1px solid var(--primary)",
              }}
            ></div>
          </div>
        )}
      </div>

      {/* 2. CENTER: Playback Controls & Progress Timeline */}
      <div
        className="player-bar-center"
        style={{
          flex: 1,
          maxWidth: "600px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          padding: "0 16px",
        }}
      >
        {/* Playback Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={skipPrevious}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--primary)",
            }}
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={togglePlayPause}
            className="neo-button"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-container)",
              boxShadow: "2px 2px 0px var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            {isPlaying ? (
              <Pause size={18} style={{ fill: "var(--primary)" }} />
            ) : (
              <Play size={18} style={{ fill: "var(--primary)", marginLeft: "2px" }} />
            )}
          </button>

          <button
            onClick={skipNext}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--primary)",
            }}
          >
            <SkipForward size={18} />
          </button>

          {/* VIVO Catch-up button (Sticker style) */}
          {currentTrack.isLive && progress < 0.95 && (
            <button
              onClick={seekToLiveEdge}
              className="neo-button"
              style={{
                backgroundColor: "var(--error)",
                color: "white",
                fontSize: "0.55rem",
                fontWeight: 900,
                padding: "2px 6px",
                boxShadow: "2px 2px 0px var(--primary)",
                border: "2.5px solid var(--primary)",
                cursor: "pointer",
                transform: "rotate(-2deg)",
                marginLeft: "8px",
              }}
            >
              AL VIVO ⚡
            </button>
          )}
        </div>

        {/* Progress seekbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "0.65rem", fontWeight: "bold", width: "35px", textAlign: "right" }}>
            {formatProgressTime()}
          </span>

          <div
            ref={progressTrackRef}
            onClick={handleProgressAction}
            className="spotify-slider-track"
          >
            <div className="spotify-slider-fill" style={{ width: `${progress * 100}%` }}></div>
            <div className="spotify-slider-thumb" style={{ left: `calc(${progress * 100}% - 5px)` }}></div>
          </div>

          <span style={{ fontSize: "0.65rem", fontWeight: "bold", width: "35px", textAlign: "left" }}>
            {formatTotalTime()}
          </span>
        </div>
      </div>

      {/* 3. RIGHT: Volume slider & Chat toggle */}
      <div
        className="player-bar-right"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          width: "25%",
          gap: "16px",
          minWidth: "220px",
        }}
      >
        {/* Logo next to volume icon */}
        <img
          src="/RADIO-2026.png"
          alt="Radio 2026"
          style={{
            height: "48px",
            width: "48px",
            objectFit: "contain",
            flexShrink: 0,
            marginLeft: "16px",
            marginRight: "auto",
          }}
        />

        {/* Mute button */}
        <button
          onClick={toggleMute}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--primary)",
          }}
        >
          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Volume range slider */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={(e) => changeVolume(parseFloat(e.target.value))}
          style={{
            width: "80px",
            cursor: "pointer",
            accentColor: "var(--primary-container)",
            height: "4px",
            border: "1px solid var(--primary)",
            borderRadius: "2px",
            backgroundColor: "rgba(0,0,0,0.1)",
          }}
        />

        {/* Chat toggle button */}
        <button
          onClick={onToggleChat}
          className="neo-button"
          style={{
            padding: "6px 10px",
            backgroundColor: isChatOpen ? "var(--primary-container)" : "var(--card-bg)",
            transform: isChatOpen ? "translate(1px, 1px)" : "none",
            boxShadow: isChatOpen ? "1px 1px 0px var(--primary)" : "3px 3px 0px var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <MessageSquare size={16} />
        </button>
      </div>
    </div>
  );
};
