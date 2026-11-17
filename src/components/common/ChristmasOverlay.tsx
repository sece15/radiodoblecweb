"use client";

import { usePathname } from "next/navigation";

const LIGHT_COLORS = ["#FF2A54", "#CCFF00", "#FFD600", "#00FFCC"];

const SNOWFLAKES = [
  { left: "2%", size: 15, duration: "7.5s", delay: "0s", char: "❄" },
  { left: "5%", size: 11, duration: "9.5s", delay: "-3.2s", char: "•" },
  { left: "8%", size: 18, duration: "8.2s", delay: "-1.5s", char: "❄" },
  { left: "11%", size: 13, duration: "10.5s", delay: "-5.1s", char: "❅" },
  { left: "14%", size: 16, duration: "7.8s", delay: "-2.4s", char: "❄" },
  { left: "18%", size: 12, duration: "9.2s", delay: "-6.0s", char: "•" },
  { left: "21%", size: 20, duration: "8.6s", delay: "-0.8s", char: "❄" },
  { left: "25%", size: 14, duration: "11s", delay: "-4.3s", char: "❆" },
  { left: "28%", size: 17, duration: "7.4s", delay: "-2.9s", char: "❄" },
  { left: "32%", size: 12, duration: "9.8s", delay: "-7.2s", char: "•" },
  { left: "35%", size: 19, duration: "8.0s", delay: "-1.1s", char: "❄" },
  { left: "39%", size: 15, duration: "10.2s", delay: "-5.6s", char: "❅" },
  { left: "42%", size: 13, duration: "8.9s", delay: "-3.7s", char: "❄" },
  { left: "46%", size: 21, duration: "7.6s", delay: "-0.4s", char: "❄" },
  { left: "49%", size: 12, duration: "9.4s", delay: "-6.5s", char: "•" },
  { left: "53%", size: 17, duration: "8.3s", delay: "-2.1s", char: "❆" },
  { left: "56%", size: 14, duration: "10.8s", delay: "-4.8s", char: "❄" },
  { left: "60%", size: 19, duration: "7.9s", delay: "-1.7s", char: "❄" },
  { left: "63%", size: 12, duration: "9.1s", delay: "-5.9s", char: "•" },
  { left: "67%", size: 16, duration: "8.4s", delay: "-3.0s", char: "❅" },
  { left: "70%", size: 20, duration: "7.3s", delay: "-0.9s", char: "❄" },
  { left: "74%", size: 14, duration: "10.1s", delay: "-6.8s", char: "❄" },
  { left: "77%", size: 13, duration: "9.6s", delay: "-2.6s", char: "•" },
  { left: "81%", size: 18, duration: "8.1s", delay: "-4.1s", char: "❆" },
  { left: "84%", size: 15, duration: "10.4s", delay: "-7.5s", char: "❄" },
  { left: "88%", size: 21, duration: "7.7s", delay: "-1.3s", char: "❄" },
  { left: "91%", size: 13, duration: "9.3s", delay: "-5.2s", char: "•" },
  { left: "94%", size: 17, duration: "8.5s", delay: "-2.8s", char: "❅" },
  { left: "97%", size: 15, duration: "9.9s", delay: "-6.1s", char: "❄" },
];

export const ChristmasOverlay = () => {
  const pathname = usePathname();

  // Mantener limpio el DAW / Estudio de producción
  if (pathname?.startsWith("/studio")) {
    return null;
  }

  const bulbCount = 24;

  return (
    <>
      {/* 1. Guirnalda de luces navideñas fija arriba */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "24px",
          zIndex: 60,
          pointerEvents: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "0 10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            backgroundColor: "#1A1D10",
            opacity: 0.75,
          }}
        />
        {Array.from({ length: bulbCount }).map((_, idx) => {
          const color = LIGHT_COLORS[idx % LIGHT_COLORS.length];
          const delay = `${(idx % 4) * 0.35}s`;
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  backgroundColor: "#1A1D10",
                  borderRadius: "1px",
                }}
              />
              <div
                style={{
                  width: "9px",
                  height: "12px",
                  borderRadius: "50% 50% 45% 45%",
                  backgroundColor: color,
                  border: "1.5px solid #111111",
                  boxShadow: `0 0 8px ${color}`,
                  animation: `christmas-twinkle 1.6s ease-in-out ${delay} infinite`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 2. Copos de nieve cayendo suavemente */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {SNOWFLAKES.map((flake, idx) => (
          <span
            key={idx}
            style={{
              position: "absolute",
              top: "-5vh",
              left: flake.left,
              fontSize: `${flake.size}px`,
              color: "#FFFFFF",
              textShadow: "0 0 6px rgba(56, 189, 248, 0.75), 0 1px 3px rgba(0,0,0,0.45)",
              animation: `christmas-snowfall ${flake.duration} linear ${flake.delay} infinite`,
              userSelect: "none",
            }}
          >
            {flake.char}
          </span>
        ))}
      </div>
    </>
  );
};
