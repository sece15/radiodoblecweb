import React, { useRef } from "react";
import { useAudio } from "@/context/AudioContext";
import { Play, Pause, Volume2, VolumeX, MessageSquare, SkipBack, SkipForward, FastForward } from "lucide-react";

interface SpotifyPlayerBarProps {
  isChatOpen: boolean;
  onToggleChat: () => void;
  onExpand: () => void;
}

export const SpotifyPlayerBar: React.FC<SpotifyPlayerBarProps> = ({
  isChatOpen,
  onToggleChat,
  onExpand,
}) => {
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
  const handleProgressAction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
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
        style={{
          display: "flex",
          alignItems: "center",
          width: "25%",
          minWidth: "180px",
        }}
      >
        {/* Footer Logo */}
        <div
          style={{
            height: "36px",
            width: "36px",
            marginRight: "12px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            viewBox="0 0 1080 1080"
            style={{
              height: "100%",
              width: "100%",
            }}
          >
            <g>
              <g>
                <path
                  fill="var(--primary)"
                  d="M760.9,637.1v97.7c0,65.1-36.2,101.3-101.3,101.3H416.4c-65.1,0-101.3-36.2-101.3-101.3V474.3c0-65.1,36.2-101.3,101.3-101.3h243.2c65.1,0,101.3,36.2,101.3,101.3v99.2c0,4.3-2.9,7.2-7.2,7.2H550.3c-4.3,0-7.2-2.9-7.2-7.2v-73.1h-29v208.4h29v-71.7c0-4.3,2.9-7.2,7.2-7.2h203.4C758,629.9,760.9,632.8,760.9,637.1z"
                />
              </g>
              <g>
                <path
                  fill="var(--background)"
                  d="M611.7,790.2H459.2c-30.9,0-56-25.1-56-56V476c0-30.9,25.1-56,56-56h152.5c30.9,0,56,25.1,56,56v64.7c0,9.6-7.8,17.4-17.4,17.4c-9.6,0-17.4-7.8-17.4-17.4V476c0-11.7-9.5-21.2-21.2-21.2H459.2c-11.7,0-21.2,9.5-21.2,21.2v258.1c0,11.7,9.5,21.2,21.2,21.2h152.5c11.7,0,21.2-9.5,21.2-21.2v-57.4c0-9.6,7.8-17.4,17.4-17.4c9.6,0,17.4,7.8,17.4,17.4v57.4C667.7,765,642.6,790.2,611.7,790.2z"
                />
              </g>
              <g>
                <g>
                  <path fill="var(--primary)" d="M748.6,325.5c-7.2,0-13-5.8-13-13v-23.2c0-7.2,5.8-13,13-13c7.2,0,13,5.8,13,13v23.2C761.6,319.6,755.8,325.5,748.6,325.5z" />
                </g>
                <g>
                  <path fill="var(--primary)" d="M396,325.5c-7.2,0-13-5.8-13-13v-57.9c0-7.2,5.8-13,13-13c7.2,0,13,5.8,13,13v57.9C409,319.6,403.2,325.5,396,325.5z" />
                </g>
                <g>
                  <path fill="var(--primary)" d="M327.4,325.5c-7.2,0-13-5.8-13-13v-23.2c0-7.2,5.8-13,13-13c7.2,0,13,5.8,13,13v23.2C340.4,319.6,334.6,325.5,327.4,325.5z" />
                </g>
                <g>
                  <path fill="var(--primary)" d="M676,325.5c-7.2,0-13-5.8-13-13v-57.9c0-7.2,5.8-13,13-13s13,5.8,13,13v57.9C689,319.6,683.2,325.5,676,325.5z" />
                </g>
                <g>
                  <path fill="var(--primary)" d="M607.4,325.5c-7.2,0-13-5.8-13-13v-23.2c0-7.2,5.8-13,13-13s13,5.8,13,13v23.2C620.4,319.6,614.6,325.5,607.4,325.5z" />
                </g>
                <g>
                  <path fill="var(--primary)" d="M465.1,325.5c-7.2,0-13-5.8-13-13v-23.2c0-7.2,5.8-13,13-13s13,5.8,13,13v23.2C478.2,319.6,472.3,325.5,465.1,325.5z" />
                </g>
                <g>
                  <path fill="var(--primary)" d="M537.3,325.5c-7.2,0-13-5.8-13-13v-95.6c0-7.2,5.8-13,13-13s13,5.8,13,13v95.6C550.3,319.6,544.5,325.5,537.3,325.5z" />
                </g>
              </g>
            </g>
          </svg>
        </div>

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
          }}
        >
          <img
            src={currentTrack.imageUrl}
            alt="Track"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              animation: isPlaying ? "spin 20s linear infinite" : "none",
            }}
          />
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
