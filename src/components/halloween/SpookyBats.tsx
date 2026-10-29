"use client";

import React from "react";

interface SpookyBatsProps {
  /** Cantidad de murciélagos a generar (por defecto 5) */
  count?: number;
}

interface BatConfig {
  id: number;
  direction: "left-to-right" | "right-to-left";
  animationName: string;
  duration: number; // en segundos
  delay: number; // en segundos
  size: number; // ancho en px
  flapSpeed: number; // en segundos
  glowColor?: string; // color de ojos (neón lima por defecto)
}

const DEFAULT_BATS: BatConfig[] = [
  {
    id: 1,
    direction: "left-to-right",
    animationName: "batFlyLtoR1",
    duration: 11,
    delay: 0,
    size: 52,
    flapSpeed: 0.18,
    glowColor: "#CCFF00",
  },
  {
    id: 2,
    direction: "right-to-left",
    animationName: "batFlyRtoL1",
    duration: 9,
    delay: 3.5,
    size: 44,
    flapSpeed: 0.16,
    glowColor: "#FF0055",
  },
  {
    id: 3,
    direction: "left-to-right",
    animationName: "batFlyLtoR2",
    duration: 13,
    delay: 7,
    size: 60,
    flapSpeed: 0.2,
    glowColor: "#CCFF00",
  },
  {
    id: 4,
    direction: "right-to-left",
    animationName: "batFlyRtoL2",
    duration: 14,
    delay: 1.5,
    size: 32, // Murciélago distante
    flapSpeed: 0.14,
    glowColor: "#00FFCC",
  },
  {
    id: 5,
    direction: "left-to-right",
    animationName: "batFlyLtoR3",
    duration: 10,
    delay: 11,
    size: 40,
    flapSpeed: 0.17,
    glowColor: "#CCFF00",
  },
];

export const SpookyBats: React.FC<SpookyBatsProps> = ({ count = 5 }) => {
  const bats = DEFAULT_BATS.slice(0, count);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1150,
        overflow: "hidden",
      }}
    >
      {bats.map((bat) => (
        <div
          key={bat.id}
          className="spooky-bat-carrier"
          style={{
            position: "absolute",
            width: `${bat.size}px`,
            height: `${Math.round(bat.size * 0.56)}px`,
            animation: `${bat.animationName} ${bat.duration}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
            animationDelay: `${bat.delay}s`,
            willChange: "transform",
            transform: "translate3d(-150px, -150px, 0)", // Estado fuera de vista antes de arrancar
          }}
        >
          <BatSvg
            flapSpeed={bat.flapSpeed}
            glowColor={bat.glowColor}
            isFacingLeft={bat.direction === "right-to-left"}
          />
        </div>
      ))}


    </div>
  );
};

interface BatSvgProps {
  flapSpeed: number;
  glowColor?: string;
  isFacingLeft?: boolean;
}

/**
 * Componente gráfico SVG de Murciélago con alas articuladas y ojos brillantes
 */
const BatSvg: React.FC<BatSvgProps> = ({
  flapSpeed,
  glowColor = "#CCFF00",
  isFacingLeft = false,
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: isFacingLeft ? "scaleX(-1)" : "none",
        filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.75))",
      }}
    >
      <svg
        viewBox="0 0 64 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        {/* ALA IZQUIERDA ARTICULADA */}
        <g
          style={{
            transformOrigin: "29px 18px",
            animation: `batWingFlapL ${flapSpeed}s ease-in-out infinite`,
            willChange: "transform",
          }}
        >
          {/* Membrana del ala izquierda */}
          <path
            d="M 29 17 
               C 22 9, 12 3, 2 5 
               C 0 8, 3 15, 6 18 
               C 10 16, 13 19, 14 25 
               C 18 21, 22 23, 23 27 
               C 26 23, 28 22, 29 20 
               Z"
            fill="#12140D"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="0.5"
          />
          {/* Huesos / Falanges del ala izquierda */}
          <path
            d="M 29 17 Q 15 10 2 5 M 20 12 Q 13 18 6 18 M 22 14 Q 17 21 14 25"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="0.6"
            fill="none"
          />
        </g>

        {/* ALA DERECHA ARTICULADA */}
        <g
          style={{
            transformOrigin: "35px 18px",
            animation: `batWingFlapR ${flapSpeed}s ease-in-out infinite`,
            willChange: "transform",
          }}
        >
          {/* Membrana del ala derecha */}
          <path
            d="M 35 17 
               C 42 9, 52 3, 62 5 
               C 64 8, 61 15, 58 18 
               C 54 16, 51 19, 50 25 
               C 46 21, 42 23, 41 27 
               C 38 23, 36 22, 35 20 
               Z"
            fill="#12140D"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="0.5"
          />
          {/* Huesos / Falanges del ala derecha */}
          <path
            d="M 35 17 Q 49 10 62 5 M 44 12 Q 51 18 58 18 M 42 14 Q 47 21 50 25"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="0.6"
            fill="none"
          />
        </g>

        {/* CUERPO CENTRAL Y CABEZA CON OREJAS PICUDAS */}
        <g
          style={{
            animation: `batBodyBob ${flapSpeed}s ease-in-out infinite`,
            willChange: "transform",
          }}
        >
          {/* Orejas picudas */}
          <polygon points="29,13 28,5 31,10" fill="#1A1D10" />
          <polygon points="35,13 36,5 33,10" fill="#1A1D10" />

          {/* Cabeza y cuerpo */}
          <ellipse cx="32" cy="14" rx="4.5" ry="4" fill="#1A1D10" />
          <ellipse cx="32" cy="22" rx="4" ry="7" fill="#12140D" />
          <polygon points="30,28 34,28 32,32" fill="#1A1D10" />

          {/* Ojos brillantes neón */}
          <circle cx="30.2" cy="13.2" r="1.1" fill={glowColor} />
          <circle cx="33.8" cy="13.2" r="1.1" fill={glowColor} />
          <circle cx="30.2" cy="13.2" r="0.5" fill="#FFFFFF" />
          <circle cx="33.8" cy="13.2" r="0.5" fill="#FFFFFF" />

          {/* Colmillos minúsculos */}
          <polygon points="30.5,16.5 31.2,16.5 30.85,18" fill="#FFFFFF" />
          <polygon points="32.8,16.5 33.5,16.5 33.15,18" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};
