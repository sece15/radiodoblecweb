"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useAudio } from "@/hooks/useAudio";

interface LiveNowBannerProps {
  liveShowName: string;
  liveTrackTitle: string;
  liveStatusText: string;
  onPlayLive: () => void;
  onNavigateToPlayer: (tab?: "player" | "chat") => void;
}

const ASSET_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1";

const MASCOT_QUOTES = [
  "¡Ugh! ¡Odio la Navidad y tus clics! 🤢",
  "¿Otro clic? ¡Me das alergia navideña! 🎄💢",
  "¡Ja! ¿Creías que era Papá Noel? ¡Estúpido! 😈",
  "¡Deja de picarme o me robo la radio! 📻💚",
  "¡Bah! Demasiados villancicos por hoy... 🙄",
  "¡Te pillé! No hay regalos para ti 🎁❌",
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
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);
  const [animPhase, setAnimPhase] = useState<"idle" | "anticipation" | "ducking" | "emerging">("idle");
  const [mascotForm, setMascotForm] = useState<"santa" | "grinch">("santa");
  const [showPaws] = useState(true);

  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const duckStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const duckInTimerRef = useRef<NodeJS.Timeout | null>(null);
  const emergeDoneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const duckOutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const settleOutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const returnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastQuoteIndexRef = useRef<number>(-1);

  const isLunaOnAir = /^Luna\s*[-–—]\s*continuidad\s+AutoDJ\b/i.test(liveTrackTitle.trim());

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  const clearMascotTimers = useCallback(() => {
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (duckStartTimerRef.current) clearTimeout(duckStartTimerRef.current);
    if (duckInTimerRef.current) clearTimeout(duckInTimerRef.current);
    if (emergeDoneTimerRef.current) clearTimeout(emergeDoneTimerRef.current);
    if (duckOutTimerRef.current) clearTimeout(duckOutTimerRef.current);
    if (settleOutTimerRef.current) clearTimeout(settleOutTimerRef.current);
    if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
  }, []);

  const handleMascotClick = useCallback(() => {
    // Bloquear nuevos clics hasta que termine completamente la animación actual
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);

    // 1. Limpiar temporizadores previos por seguridad
    clearMascotTimers();

    // 2. Elegir frase diferente a la mostrada inmediatamente antes
    let nextIndex = Math.floor(Math.random() * MASCOT_QUOTES.length);
    if (nextIndex === lastQuoteIndexRef.current && MASCOT_QUOTES.length > 1) {
      nextIndex = (nextIndex + 1) % MASCOT_QUOTES.length;
    }
    lastQuoteIndexRef.current = nextIndex;
    const randomQuote = MASCOT_QUOTES[nextIndex];

    // 3. Paso 1 (0ms -> 220ms): Sube un poco junto con las garritas (anticipación)
    setSpeechBubble(null);
    setMascotForm("santa");
    setIsClicked(true);
    setAnimPhase("anticipation");

    // 4. Paso 2 (220ms -> 620ms): Baja y se oculta detrás del card (zIndex: 5 < 10)
    duckStartTimerRef.current = setTimeout(() => {
      setAnimPhase("ducking");
    }, 220);

    // 5. Paso 3 (620ms -> 980ms): Cambia a Grinch detrás del card y sube por encima del borde (zIndex: 5)
    duckInTimerRef.current = setTimeout(() => {
      setMascotForm("grinch");
      setAnimPhase("emerging");
    }, 620);

    // 6. Paso 4 (980ms): Pasa al frente (zIndex: 15) y se asienta tapando el card + muestra frase
    emergeDoneTimerRef.current = setTimeout(() => {
      setAnimPhase("idle");
      setSpeechBubble(randomQuote);
    }, 980);

    // 7. Paso 5 (3.6s -> 4.0s): Se vuelve a ocultar detrás del card para regresar a Papá Noel
    returnTimerRef.current = setTimeout(() => {
      setAnimPhase("ducking");
      setSpeechBubble(null);
    }, 3600);

    // 8. Paso 6 (4.0s -> 4.36s): Cambia a Papá Noel y sube por detrás del card
    duckOutTimerRef.current = setTimeout(() => {
      setMascotForm("santa");
      setAnimPhase("emerging");
    }, 4000);

    // 9. Paso 7 (4.36s): Pasa al frente (zIndex: 15) y se asienta tapando el borde del card
    settleOutTimerRef.current = setTimeout(() => {
      setAnimPhase("idle");
      setIsClicked(false);
      isAnimatingRef.current = false;
      setIsAnimating(false);
    }, 4360);
  }, [clearMascotTimers]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      isAnimatingRef.current = false;
      clearMascotTimers();
    };
  }, [clearMascotTimers]);

  return (
    <div
      className="mascot-hero-section select-none"
      style={{ width: "100%", position: "relative" }}
      aria-label="Radio Doble C - Transmisión en Vivo con Mascota"
    >
      {/* 1. LAYER TRASERO: MASCOTA CON ALAS DESPLEGABLES QUE SE MUEVEN */}
      <div className="mascot-stage-container">
        {/* ALAS DETRÁS DE TODO AL FONDO (z-index: 1 < card z-index: 10 < rostro z-index: 15) */}
        <div
          className="mascot-wings-layer"
          style={{
            zIndex: 1,
            transform:
              animPhase === "anticipation"
                ? "translateX(-50%) translateY(-18px) scale(1.04)"
                : animPhase === "ducking"
                ? "translateX(-50%) translateY(65px) scale(0.75)"
                : animPhase === "emerging"
                ? "translateX(-50%) translateY(-18px) scale(1.02)"
                : "translateX(-50%) translateY(0px) scale(1)",
            opacity: animPhase === "ducking" ? 0 : 1,
            transition:
              animPhase === "ducking"
                ? "transform 0.38s cubic-bezier(0.55, 0.05, 0.68, 0.53), opacity 0.2s ease 0.14s"
                : "transform 0.42s cubic-bezier(0.34, 1.45, 0.64, 1), opacity 0.22s ease",
          }}
          aria-hidden="true"
        >
          {/* Ala Izquierda */}
          <div
            className={`mascot-wing-socket mascot-wing-left-socket ${
              hasEntered ? "wing-deployed" : "wing-folded"
            } ${isClicked ? "wing-socket-clicked" : ""}`}
          >
            <Image
              src={`/mascot/wing_left_vector_clean.png?v=${ASSET_VERSION}`}
              alt="Ala izquierda del murciélago"
              width={260}
              height={268}
              unoptimized
              className={`mascot-wing-graphic mascot-wing-left ${
                isPlaying || mascotForm === "grinch"
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
              src={`/mascot/wing_right_vector_clean.png?v=${ASSET_VERSION}`}
              alt="Ala derecha del murciélago"
              width={260}
              height={268}
              unoptimized
              className={`mascot-wing-graphic mascot-wing-right ${
                isPlaying || mascotForm === "grinch"
                  ? "wing-beating-right"
                  : "wing-flapping-right"
              }`}
              draggable={false}
              priority
            />
          </div>
        </div>

        {/* Personaje de la mascota (delante del card en reposo, detrás del card al agacharse) */}
        <div
          className={`mascot-character-wrapper ${
            hasEntered ? "mascot-revealed" : "mascot-peeking"
          } ${isPlaying ? "mascot-beating" : "mascot-hovering"} ${
            isClicked ? "mascot-clicked-jump" : ""
          }`}
          style={{
            zIndex: animPhase === "ducking" || animPhase === "emerging" ? 5 : 15,
            cursor: isAnimating ? "default" : "pointer",
          }}
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

          {/* Ondas sonoras de los audífonos DJ cuando hay música */}
          {isPlaying && (
            <div className="mascot-soundwaves" aria-hidden="true">
              <span className="wave-ring wave-ring-1" />
              <span className="wave-ring wave-ring-2" />
              <span className="wave-ring wave-ring-3" />
            </div>
          )}

          {/* Imagen central de la cabeza del murciélago (Se oculta detrás del card sin sobresalir por abajo) */}
          <div
            className="mascot-body-box"
            style={{
              clipPath: "inset(-140px -80px -28px -80px)",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                opacity: animPhase === "ducking" ? 0 : 1,
                transform:
                  animPhase === "anticipation"
                    ? "translateY(-22px) scale(1.03)"
                    : animPhase === "ducking"
                    ? "translateY(115%) scale(0.88)"
                    : animPhase === "emerging"
                    ? "translateY(-24px) scale(0.95)"
                    : mascotForm === "grinch"
                    ? "translateY(0%) scale(0.92)"
                    : "translateY(0%) scale(1)",
                transformOrigin: "center bottom",
                transition:
                  animPhase === "anticipation"
                    ? "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.15s ease"
                    : animPhase === "ducking"
                    ? "transform 0.38s cubic-bezier(0.55, 0.05, 0.68, 0.53), opacity 0.16s ease 0.2s"
                    : animPhase === "emerging"
                    ? "transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease"
                    : "transform 0.28s cubic-bezier(0.34, 1.45, 0.64, 1), opacity 0.18s ease",
              }}
            >
              <Image
                src={
                  mascotForm === "grinch"
                    ? `/mascot/mascot_character_grinch.png?v=${ASSET_VERSION}`
                    : `/mascot/mascot_character_santa_beard.png?v=${ASSET_VERSION}`
                }
                alt={
                  mascotForm === "grinch"
                    ? "Mascota oficial murciélago Radio Doble C modo Grinch"
                    : "Mascota oficial murciélago Radio Doble C Papá Noel"
                }
                width={380}
                height={392}
                priority
                unoptimized
                className="mascot-image-asset"
                style={{
                  filter:
                    mascotForm === "grinch"
                      ? "drop-shadow(0 0 18px rgba(163, 230, 53, 0.85)) drop-shadow(0 10px 16px rgba(0, 0, 0, 0.45))"
                      : "drop-shadow(0 10px 16px rgba(0, 0, 0, 0.45))",
                }}
                draggable={false}
              />
              {/* Precarga real de la imagen Grinch (sin display:none para que producción la descargue antes del 1er clic) */}
              <Image
                src={`/mascot/mascot_character_grinch.png?v=${ASSET_VERSION}`}
                alt=""
                aria-hidden="true"
                width={380}
                height={392}
                priority
                unoptimized
                style={{
                  position: "absolute",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                  pointerEvents: "none",
                  overflow: "hidden",
                }}
              />
            </div>
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
                color: "var(--on-primary)",
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
              <span style={{ fontSize: "0.7rem", fontWeight: "bold", color: "var(--on-primary-container)" }}>
                {liveStatusText}
              </span>
            </div>
          </div>

          <h3
            style={{
              fontSize: "1.4rem",
              fontWeight: 900,
              textTransform: "uppercase",
              color: "var(--on-primary-container)",
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
              opacity: 0.85,
              color: "var(--on-primary-container)",
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
