"use client";

import React from "react";

interface SpookyCobwebsProps {
  /** Opacidad general de las telarañas (por defecto 0.6) */
  opacity?: number;
  /** Si se deben mostrar las 4 esquinas o solo las superiores */
  allCorners?: boolean;
}

export const SpookyCobwebs: React.FC<SpookyCobwebsProps> = ({
  opacity = 0.55,
  allCorners = true,
}) => {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1100,
        overflow: "hidden",
      }}
    >
      {/* 1. Esquina Superior Izquierda */}
      <div
        className="spooky-cobweb-corner spooky-cobweb-tl"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          opacity,
        }}
      >
        <CornerCobwebSvg corner="top-left" hasSpider={true} />
      </div>

      {/* 2. Esquina Superior Derecha */}
      <div
        className="spooky-cobweb-corner spooky-cobweb-tr"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          opacity,
        }}
      >
        <CornerCobwebSvg corner="top-right" hasSpider={true} />
      </div>

      {/* 3. Esquinas Inferiores */}
      {allCorners && (
        <>
          {/* Esquina Inferior Izquierda */}
          <div
            className="spooky-cobweb-corner spooky-cobweb-bl"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              opacity,
            }}
          >
            <CornerCobwebSvg corner="bottom-left" hasSpider={false} />
          </div>

          {/* Esquina Inferior Derecha (Mismo modelo que la superior, direccionada al ángulo inferior derecho) */}
          <div
            className="spooky-cobweb-corner spooky-cobweb-br"
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              opacity,
            }}
          >
            <CornerCobwebSvg corner="bottom-right" hasSpider={true} />
          </div>
        </>
      )}
    </div>
  );
};

interface CornerCobwebSvgProps {
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  hasSpider?: boolean;
}

/**
 * SVG vectorizado de alta fidelidad para telaraña gótica de esquina.
 * Se orienta matemáticamente hacia el punto del ángulo exacto según la esquina seleccionada.
 */
const CornerCobwebSvg: React.FC<CornerCobwebSvgProps> = ({
  corner = "top-left",
  hasSpider = true,
}) => {
  // Matriz de transformación para orientar los hilos concéntricos y radiales hacia el vértice de la esquina
  let webTransform = "";
  if (corner === "top-right") {
    webTransform = "translate(160, 0) scale(-1, 1)";
  } else if (corner === "bottom-left") {
    webTransform = "translate(0, 160) scale(1, -1)";
  } else if (corner === "bottom-right") {
    webTransform = "translate(160, 160) scale(-1, -1)";
  }

  // Coordenadas calculadas para que la pequeña araña cuelgue verticalmente hacia abajo con gravedad natural
  const isRight = corner === "top-right" || corner === "bottom-right";
  const isBottom = corner === "bottom-left" || corner === "bottom-right";
  const spiderX = isRight ? 46 : 114;
  const spiderHangStartY = isBottom ? 46 : 114;
  const spiderHangEndY = isBottom ? 66 : 132;
  const spiderBodyY = isBottom ? 68 : 134;
  const spiderHeadY = isBottom ? 66 : 132;
  const spiderLegsY1 = isBottom ? 67 : 133;
  const spiderLegsY2 = isBottom ? 69 : 135;

  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* CUERPO PRINCIPAL DE LA TELARAÑA (Direccionado al vértice de la esquina) */}
      <g transform={webTransform}>
        {/* Hilos radiales estructurales que parten desde el vértice de la esquina (0,0) */}
        <g stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.2" strokeLinecap="round">
          {/* Rayo 1 (borde horizontal) */}
          <line x1="0" y1="0" x2="160" y2="0" strokeWidth="1.6" />
          {/* Rayo 2 (~15°) */}
          <line x1="0" y1="0" x2="156" y2="42" />
          {/* Rayo 3 (~30°) */}
          <line x1="0" y1="0" x2="138" y2="80" />
          {/* Rayo 4 (~45° central diagonal hacia el interior) */}
          <line x1="0" y1="0" x2="114" y2="114" strokeWidth="1.4" />
          {/* Rayo 5 (~60°) */}
          <line x1="0" y1="0" x2="80" y2="138" />
          {/* Rayo 6 (~75°) */}
          <line x1="0" y1="0" x2="42" y2="156" />
          {/* Rayo 7 (borde vertical) */}
          <line x1="0" y1="0" x2="0" y2="160" strokeWidth="1.6" />
        </g>

        {/* Arcos parabólicos concéntricos (catenarias de la telaraña) */}
        <g stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1" strokeLinecap="round">
          {/* Anillo 1 (cercano al centro del ángulo) */}
          <path d="M 28 0 Q 25 5 27 7 Q 22 10 24 14 Q 18 16 20 20 Q 15 22 14 24 Q 10 25 7 27 Q 5 25 0 28" />

          {/* Anillo 2 */}
          <path d="M 54 0 Q 48 10 52 14 Q 44 20 46 27 Q 35 32 38 38 Q 30 42 27 46 Q 20 44 14 52 Q 9 49 0 54" />

          {/* Anillo 3 */}
          <path d="M 85 0 Q 75 16 83 22 Q 68 31 72 42 Q 57 48 60 60 Q 48 57 42 72 Q 31 68 22 83 Q 16 75 0 85" />

          {/* Anillo 4 */}
          <path d="M 120 0 Q 106 22 117 31 Q 97 44 103 60 Q 80 68 85 85 Q 68 80 60 103 Q 44 97 31 117 Q 22 106 0 120" />

          {/* Anillo 5 (exterior rasgado con extremos realistas) */}
          <path d="M 152 0 Q 134 28 148 40 Q 124 56 131 76 Q 102 86 108 108 Q 86 102 76 131 Q 56 124 40 148 Q 28 134 0 152" />
        </g>

        {/* Detalles orgánicos: Hilos sueltos y rotos que cuelgan sutilmente */}
        <g stroke="rgba(255, 255, 255, 0.45)" strokeWidth="0.8" strokeLinecap="round">
          <path d="M 108 108 Q 112 124 110 134 Q 108 140 114 146" />
          <path d="M 76 131 Q 72 142 75 152" />
          <path d="M 131 76 Q 138 88 135 96" />
        </g>
      </g>

      {/* PEQUEÑA ARAÑITA SILUETA COLGANDO HACIA ABAJO (Cae naturalmente por gravedad) */}
      {hasSpider && (
        <g>
          {/* Hilo que cuelga */}
          <line
            x1={spiderX}
            y1={spiderHangStartY}
            x2={spiderX}
            y2={spiderHangEndY}
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="0.8"
            strokeDasharray="1 1"
          />
          {/* Cuerpo de la mini-araña */}
          <ellipse
            cx={spiderX}
            cy={spiderBodyY}
            rx="2.5"
            ry="3.2"
            fill="#1A1D10"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="0.5"
          />
          <circle cx={spiderX} cy={spiderHeadY} r="1.5" fill="#1A1D10" />
          {/* Ojito neón brillante Radio Doble C */}
          <circle cx={spiderX - 0.5} cy={spiderHeadY} r="0.4" fill="#CCFF00" />
          <circle cx={spiderX + 0.5} cy={spiderHeadY} r="0.4" fill="#CCFF00" />
          {/* Patitas finas */}
          <path
            d={`M ${spiderX - 2} ${spiderLegsY1} Q ${spiderX - 5} ${spiderLegsY1 - 2} ${spiderX - 6} ${spiderLegsY1} 
               M ${spiderX - 2} ${spiderLegsY2} Q ${spiderX - 6} ${spiderLegsY2} ${spiderX - 7} ${spiderLegsY2 + 2} 
               M ${spiderX + 2} ${spiderLegsY1} Q ${spiderX + 5} ${spiderLegsY1 - 2} ${spiderX + 6} ${spiderLegsY1} 
               M ${spiderX + 2} ${spiderLegsY2} Q ${spiderX + 6} ${spiderLegsY2} ${spiderX + 7} ${spiderLegsY2 + 2}`}
            stroke="#1A1D10"
            strokeWidth="0.6"
            fill="none"
          />
        </g>
      )}
    </svg>
  );
};
