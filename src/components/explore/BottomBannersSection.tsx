"use client";

import { Megaphone } from "lucide-react";

interface BottomBannersSectionProps {
  onPlayRadar: () => void;
  onNavigateToPlayer: () => void;
  onOpenDjModal: () => void;
}

export const BottomBannersSection = ({
  onPlayRadar,
  onNavigateToPlayer,
  onOpenDjModal,
}: BottomBannersSectionProps) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        marginTop: "16px",
      }}
    >
      {/* RADAR & SIGNAL STATUS */}
      <div
        className="neo-card store-card-hover"
        onClick={() => {
          onPlayRadar();
          onNavigateToPlayer();
        }}
        style={{
          backgroundColor: "var(--primary)",
          color: "white",
          cursor: "pointer",
          boxShadow: "10px 10px 0px var(--primary-container)",
          transform: "rotate(1.5deg)",
          overflow: "hidden",
          margin: 0,
        }}
      >
        <div
          className="scanlines"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Radar scope */}
          <div
            style={{
              position: "relative",
              width: "120px",
              height: "120px",
              border: "2px solid var(--primary-container)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Spinning Radar Line */}
            <div
              className="radar-sweep"
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                top: 0,
                left: 0,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "2px",
                  height: "50%",
                  backgroundColor: "var(--primary-container)",
                }}
              ></div>
            </div>

            <span
              style={{
                color: "var(--primary-container)",
                fontSize: "0.7rem",
                fontWeight: 900,
                fontFamily: "monospace",
                zIndex: 2,
              }}
            >
              SIGNAL OK
            </span>
          </div>

          <div style={{ textAlign: "center" }}>
            <h4
              style={{
                color: "var(--primary-container)",
                fontSize: "1.1rem",
                fontStyle: "italic",
                fontWeight: 900,
              }}
            >
              EL RADAR EN LÍNEA
            </h4>
            <p
              style={{
                fontSize: "0.65rem",
                opacity: 0.8,
                marginTop: "8px",
                lineHeight: "0.95rem",
              }}
            >
              Descubre lo que suena en las alcantarillas de la ciudad. Click para sintonía al azar.
            </p>
          </div>
        </div>
      </div>

      {/* COMIC SPEECH BUBBLE: DJ RECRUITMENT */}
      <div
        className="comic-bubble-wrapper store-card-hover"
        onClick={onOpenDjModal}
        style={{ margin: 0, transform: "rotate(-1.5deg)", cursor: "pointer" }}
      >
        <div
          className="comic-bubble-container"
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: "80px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              color: "var(--primary)",
            }}
          >
            <Megaphone style={{ width: "56px", height: "56px" }} />
            <h4
              style={{
                fontWeight: 900,
                fontSize: "1.3rem",
                letterSpacing: "-0.02em",
                textAlign: "center",
              }}
            >
              ¿QUIERES SER LOCUTOR O DJ?
            </h4>
            <p
              style={{
                fontWeight: "bold",
                fontSize: "0.75rem",
                textAlign: "center",
                color: "#BA1A1A",
              }}
            >
              ¡HAZ CLICK AQUÍ PARA POSTULAR! 📡
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
