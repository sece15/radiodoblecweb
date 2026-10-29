"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useAudio } from "@/hooks/useAudio";

interface LiveNowBannerProps {
  liveShowName: string;
  liveTrackTitle: string;
  liveStatusText: string;
  onPlayLive: () => void;
  onNavigateToPlayer: (tab?: "player" | "chat") => void;
}

const MASCOT_QUOTES = [
  "¡FUCKING GOOD SHIT!",
  "¡Radio Doble C en el aire!",
  "¡Súbele a ese bajo, DJ!",
  "¡Pura música sin filtro!",
  "¡Doble C no duerme nunca!",
  "¡Puro vinilo y buena vibra!",
  "¡Directo desde el underground!",
];

export const LiveNowBanner = ({
  liveShowName,
  liveTrackTitle,
  liveStatusText,
  onPlayLive,
  onNavigateToPlayer,
}: LiveNowBannerProps) => {
  const isPlaying = useAudio((s) => s.isPlaying);
  const [hasEntered, setHasEntered] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [isClicked, setIsClicked] = useState(false);
  const [showPaws] = useState(true);

  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastQuoteIndexRef = useRef<number>(-1);

  const isLunaOnAir = /^Luna\s*[-–—]\s*continuidad\s+AutoDJ\b/i.test(liveTrackTitle.trim());

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  const handleMascotClick = useCallback(() => {
    // 1. Limpiar temporizadores activos anteriores para evitar colisiones
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);

    // 2. Elegir frase diferente a la mostrada inmediatamente antes
    let nextIndex = Math.floor(Math.random() * MASCOT_QUOTES.length);
    if (nextIndex === lastQuoteIndexRef.current && MASCOT_QUOTES.length > 1) {
      nextIndex = (nextIndex + 1) % MASCOT_QUOTES.length;
    }
    lastQuoteIndexRef.current = nextIndex;
    const randomQuote = MASCOT_QUOTES[nextIndex];

    // 3. Forzar reinicio de estado para que la animación CSS se reproduzca en cada clic
    setIsClicked(false);
    setSpeechBubble(null);

    requestAnimationFrame(() => {
      setIsClicked(true);
      setSpeechBubble(randomQuote);
    });

    // 4. Temporizadores coordinados
    clickTimerRef.current = setTimeout(() => {
      setIsClicked(false);
    }, 1200);

    bubbleTimerRef.current = setTimeout(() => {
      setSpeechBubble(null);
    }, 2800);
  }, []);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, []);

  return (
    <div
      className="mascot-hero-section select-none"
      style={{ width: "100%", position: "relative" }}
      aria-label="Radio Doble C - Transmisión en Vivo con Mascota"
    >
      {/* 1. LAYER TRASERO: MASCOTA CON ALAS DESPLEGABLES QUE SE MUEVEN */}
      <div className="mascot-stage-container">
        {/* Personaje de la mascota con alas articuladas */}
        <div
          className={`mascot-character-wrapper ${
            hasEntered ? "mascot-revealed" : "mascot-peeking"
          } ${isPlaying ? "mascot-beating" : "mascot-hovering"} ${
            isClicked ? "mascot-clicked-jump" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleMascotClick();
          }}
          title="¡Haz clic en la mascota de Radio Doble C! 🦇"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              handleMascotClick();
            }
          }}
        >
          {/* Bocadillo de cómic flotante en la frente del personaje al hacer clic */}
          {speechBubble && (
            <div
              className="mascot-speech-bubble"
              role="status"
              aria-live="polite"
            >
              <span className="mascot-speech-text">{speechBubble}</span>
              <div className="mascot-speech-arrow" />
            </div>
          )}
          {/* ALAS QUE SALEN Y ALETEAN CONTINUAMENTE */}
          <div className="mascot-wings-layer" aria-hidden="true">
            {/* Ala Izquierda */}
            <div
              className={`mascot-wing-socket mascot-wing-left-socket ${
                hasEntered ? "wing-deployed" : "wing-folded"
              } ${isClicked ? "wing-socket-clicked" : ""}`}
            >
              <Image
                src="/mascot/wing_left_vector_clean.png"
                alt="Ala izquierda del murciélago"
                width={260}
                height={268}
                className={`mascot-wing-graphic mascot-wing-left ${
                  isClicked
                    ? "wing-burst-left"
                    : isPlaying
                    ? "wing-beating-left"
                    : "wing-flapping-left"
                }`}
                draggable={false}
                priority
              />
            </div>

            {/* Ala Derecha */}
            <div
              className={`mascot-wing-socket mascot-wing-right-socket ${
                hasEntered ? "wing-deployed" : "wing-folded"
              } ${isClicked ? "wing-socket-clicked" : ""}`}
            >
              <Image
                src="/mascot/wing_right_vector_clean.png"
                alt="Ala derecha del murciélago"
                width={260}
                height={268}
                className={`mascot-wing-graphic mascot-wing-right ${
                  isClicked
                    ? "wing-burst-right"
                    : isPlaying
                    ? "wing-beating-right"
                    : "wing-flapping-right"
                }`}
                draggable={false}
                priority
              />
            </div>
          </div>

          {/* Ondas sonoras de los audífonos DJ cuando hay música */}
          {isPlaying && (
            <div className="mascot-soundwaves" aria-hidden="true">
              <span className="wave-ring wave-ring-1" />
              <span className="wave-ring wave-ring-2" />
              <span className="wave-ring wave-ring-3" />
            </div>
          )}

          {/* Imagen central de la cabeza del murciélago */}
          <div className="mascot-body-box">
            <Image
              src="/mascot/mascot_character_v2.png"
              alt="Mascota oficial murciélago Radio Doble C"
              width={380}
              height={392}
              priority
              unoptimized
              className="mascot-image-asset"
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* 2. LAYER DELANTERO: EL CARD EXACTO ORIGINAL DE LIVE NOW */}
      <div
        onClick={() => {
          onPlayLive();
          onNavigateToPlayer("player");
        }}
        className={`neo-card store-card-hover ${
          isClicked ? "card-electric-impact" : ""
        }`}
        style={{
          position: "relative",
          zIndex: 10,
          backgroundColor: "#CCFF00",
          background: "var(--primary-container, #CCFF00)",
          border: "4px solid var(--primary, #1A1D10)",
          boxShadow: "6px 6px 0px var(--primary, #1A1D10)",
          borderRadius: 0,
          padding: "16px",
          transform: "rotate(-1deg)",
          cursor: "pointer",
          maxWidth: "480px",
          width: "100%",
        }}
      >
        {/* Rayos y arcos eléctricos neón que explotan sobre el cartel al hacer clic */}
        {isClicked && (
          <div className="mascot-electric-sparks-layer" aria-hidden="true">
            <svg
              className="electric-lightning-svg"
              viewBox="0 0 520 120"
              preserveAspectRatio="none"
            >
              {/* Rayos desde garra izquierda */}
              <polyline
                className="spark-path spark-path-1"
                points="75,8 95,26 82,36 122,54 106,62 145,76"
              />
              <polyline
                className="spark-path spark-path-2"
                points="88,14 112,6 126,24 152,14 175,32"
              />
              {/* Rayos desde garra derecha */}
              <polyline
                className="spark-path spark-path-3"
                points="445,8 425,26 438,36 398,54 414,62 375,76"
              />
              <polyline
                className="spark-path spark-path-4"
                points="432,14 408,6 394,24 368,14 345,32"
              />
              {/* Descarga central entre ambas garras sobre el borde del cartel */}
              <polyline
                className="spark-path spark-path-center"
                points="120,10 160,3 200,16 240,4 280,15 320,3 360,14 400,10"
              />
            </svg>
          </div>
        )}

        {/* Garras de murciélago que sujetan con fuerza el borde superior del cartel */}
        <div
          className={`mascot-paws-anchor ${
            showPaws ? "paws-visible" : "paws-hidden"
          } ${isClicked ? "paws-clicked-slam" : ""}`}
          aria-hidden="true"
        >
          {/* Garra izquierda plantada en el borde */}
          <div
            className={`mascot-paw-wrapper mascot-paw-left ${
              isClicked ? "paw-claw-electric" : isPlaying ? "paw-tapping-left" : ""
            }`}
          >
            <Image
              src="/mascot/paw_left.png"
              alt="Garra izquierda"
              width={78}
              height={64}
              unoptimized
              className="mascot-paw-img"
              draggable={false}
              style={{ width: "100%", height: "auto" }}
            />
          </div>

          {/* Garra derecha plantada en el borde */}
          <div
            className={`mascot-paw-wrapper mascot-paw-right ${
              isClicked ? "paw-claw-electric" : isPlaying ? "paw-tapping-right" : ""
            }`}
          >
            <Image
              src="/mascot/paw_right.png"
              alt="Garra derecha"
              width={78}
              height={64}
              unoptimized
              className="mascot-paw-img"
              draggable={false}
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        </div>

        {/* CONTENIDO EXACTO ORIGINAL DE LIVE NOW */}
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

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: "bold", color: "var(--primary)" }}>
                {liveStatusText}
              </span>
            </div>
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
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={isLunaOnAir ? "Luna, tu compañía al aire" : `Sintonizando: ${liveTrackTitle}`}
          >
            {isLunaOnAir ? "Luna, tu compañía al aire" : `Sintonizando: ${liveTrackTitle}`}
          </p>
        </div>
      </div>
    </div>
  );
};
