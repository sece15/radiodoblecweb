"use client";

interface LiveNowBannerProps {
  liveShowName: string;
  liveTrackTitle: string;
  liveStatusText: string;
  onPlayLive: () => void;
  onNavigateToPlayer: () => void;
}

export const LiveNowBanner = ({
  liveShowName,
  liveTrackTitle,
  liveStatusText,
  onPlayLive,
  onNavigateToPlayer,
}: LiveNowBannerProps) => {
  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <div
        onClick={() => {
          onPlayLive();
          onNavigateToPlayer();
        }}
        className="neo-card store-card-hover"
        style={{
          backgroundColor: "var(--primary-container)",
          padding: "16px",
          transform: "rotate(-1deg)",
          cursor: "pointer",
          boxShadow: "6px 6px 0px var(--primary)",
          maxWidth: "480px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* Live Indicator */}
            <div
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-container)",
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.7rem",
                fontFamily: "monospace",
                fontWeight: "bold",
              }}
            >
              <div
                className="pulse-dot"
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: "#BA1A1A",
                  borderRadius: "50%",
                }}
              ></div>
              LIVE NOW
            </div>

            <span style={{ fontSize: "0.7rem", fontWeight: "bold", color: "var(--primary)" }}>
              {liveStatusText}
            </span>
          </div>

          <h3
            style={{
              fontSize: "1.4rem",
              fontWeight: 900,
              textTransform: "uppercase",
              color: "var(--primary)",
              lineHeight: "1.6rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {liveShowName}
          </h3>
          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: "bold",
              opacity: 0.8,
              color: "var(--primary)",
              margin: 0,
            }}
          >
            Sintonizado: {liveTrackTitle}
          </p>
        </div>
      </div>
    </div>
  );
};
