"use client";

import React, { useState, useEffect, useRef } from "react";

interface SpookySpiderProps {
  /** Tiempo de inactividad antes de que la araña descienda (por defecto 6.5s) */
  idleTimeoutMs?: number;
}

// Puntos de aparición horizontal distribuidos por la pantalla (evita que salga siempre del mismo lugar)
const SPAWN_POSITIONS = [14, 30, 50, 70, 86];

export const SpookySpider: React.FC<SpookySpiderProps> = ({
  idleTimeoutMs = 6500,
}) => {
  // Estados: 'hidden' (arriba), 'dropping' (bajando con patas moviéndose), 'hanging' (quieta meciéndose), 'scared' (subiendo con patas moviéndose)
  const [spiderState, setSpiderState] = useState<"hidden" | "dropping" | "hanging" | "scared">("hanging");
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);

  // Posición horizontal aleatoria y profundidad de descenso
  const [spawnPercent, setSpawnPercent] = useState<number>(82);
  const [dropDepth, setDropDepth] = useState<number>(180);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Función para elegir un nuevo punto de aparición aleatorio cada vez que se oculta
  const pickNewSpawnLocation = () => {
    setSpawnPercent((prev) => {
      const candidates = SPAWN_POSITIONS.filter((p) => Math.abs(p - prev) > 15);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)] || 50;
      return chosen;
    });
    // Profundidad de descenso aleatoria entre 160px y 250px
    setDropDepth(Math.floor(160 + Math.random() * 90));
  };

  // Detector de inactividad humana y movimiento (scroll/mouse)
  useEffect(() => {
    const handleUserActivity = () => {
      // Si la araña está en pantalla, empieza a trepar con movimiento pausado y orgánico
      setSpiderState((prev) => {
        if (prev === "hanging" || prev === "dropping") {
          return "scared";
        }
        return prev;
      });

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      // Al terminar de esconderse en el techo (2.5s), cambiar ubicación para la próxima bajada
      setTimeout(() => {
        pickNewSpawnLocation();
      }, 2500);

      // Programar la próxima bajada cuando el usuario vuelva a quedarse quieto
      idleTimerRef.current = setTimeout(() => {
        setSpiderState("dropping");
        // El descenso pausado dura 2.8s antes de quedar en reposo colgada
        setTimeout(() => {
          setSpiderState("hanging");
        }, 2800);
      }, idleTimeoutMs);
    };

    const events = ["mousemove", "scroll", "keydown", "touchstart", "touchmove"];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Primer timer de inactividad
    idleTimerRef.current = setTimeout(() => {
      setSpiderState("dropping");
      setTimeout(() => setSpiderState("hanging"), 2800);
    }, idleTimeoutMs);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [idleTimeoutMs]);

  // Al hacer clic en la Araña Calavera (Easter Egg)
  const handleSpiderClick = () => {
    setClickCount((prev) => prev + 1);
    const phrases = [
      "¡FUCKING GOOD SHIT! 💀🔥",
      "¡Radio Doble C en tus huesos! 📻⚡",
      "¡+10 C-Coins de ultratumba! 🪙",
      "¡No molestes al cráneo! 🕷️",
      "¡Sintonizando el dial maldito! 🔊",
    ];
    const phrase = phrases[clickCount % phrases.length];
    setSpeechBubble(phrase);

    setTimeout(() => {
      setSpeechBubble(null);
    }, 2800);
  };

  const isDown = spiderState === "hanging" || spiderState === "dropping";
  const isMoving = spiderState === "dropping" || spiderState === "scared";
  const translateY = isDown ? `${dropDepth}px` : "-220px";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: `${spawnPercent}%`,
        transform: "translateX(-50%)",
        zIndex: 2600,
        pointerEvents: "none",
        transition: "left 0.4s ease",
      }}
    >
      {/* Contenedor suspendido: movimiento pausado, tétrico y suave (no instantáneo) */}
      <div
        style={{
          transform: `translateY(${translateY})`,
          transition: spiderState === "scared"
            ? "transform 2.4s cubic-bezier(0.25, 1, 0.4, 1)" /* Subida con patas trepando */
            : "transform 2.8s cubic-bezier(0.33, 1, 0.68, 1)", /* Bajada suave y espeluznante */
          transformOrigin: "top center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: isDown ? "auto" : "none",
          cursor: "pointer",
        }}
        onClick={handleSpiderClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* HILO DE SEDA ANCLADO AL TECHO */}
        <div
          style={{
            width: "2px",
            height: "350px",
            backgroundColor: "rgba(204, 255, 0, 0.8)",
            position: "absolute",
            bottom: "82%",
            left: "50%",
            transform: "translateX(-50%)",
            boxShadow: "0 0 6px rgba(204, 255, 0, 0.7)",
          }}
        />

        {/* CONTENEDOR DE OSCILACIÓN PENDULAR AL ESTAR COLGADA */}
        <div
          className={spiderState === "hanging" ? "spooky-spider-pendulum" : ""}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transformOrigin: "top center",
          }}
        >
          {/* BOCADILLO DE DIÁLOGO NEOBRUTALISTA */}
          {speechBubble && (
            <div
              style={{
                position: "absolute",
                top: "-46px",
                whiteSpace: "nowrap",
                backgroundColor: "#CCFF00",
                color: "#111111",
                border: "2.5px solid #111111",
                boxShadow: "3px 3px 0px #111111",
                padding: "4px 10px",
                fontSize: "0.72rem",
                fontWeight: 900,
                fontFamily: "Space Grotesk, sans-serif",
                borderRadius: "4px",
                transform: "rotate(-3deg)",
                animation: "bubble-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                zIndex: 20,
              }}
            >
              {speechBubble}
            </div>
          )}

          {/* ==============================================================
              ENSAMBLE MULTICAPA DE LA ARAÑA CALAVERA CON PATAS ARTICULADAS
              ============================================================== */}
          <div
            style={{
              position: "relative",
              width: "154px",
              height: "118px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: isHovered
                ? "drop-shadow(0 0 16px #CCFF00) drop-shadow(4px 4px 0px rgba(0,0,0,0.95))"
                : "drop-shadow(4px 4px 0px rgba(0,0,0,0.85))",
              transition: "filter 0.25s ease, transform 0.25s ease",
              transform: isHovered ? "scale(1.08)" : "scale(1)",
            }}
          >
            {/* CAPA 1: PATAS IZQUIERDAS (Articulación independiente) */}
            <img
              src="/halloween/skull_legs_left.png"
              alt="Patas Izquierdas"
              className={isMoving ? "spooky-legs-left-crawling" : "spooky-legs-left-idle"}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 1,
              }}
            />

            {/* CAPA 2: PATAS DERECHAS (Articulación independiente en fase alterna) */}
            <img
              src="/halloween/skull_legs_right.png"
              alt="Patas Derechas"
              className={isMoving ? "spooky-legs-right-crawling" : "spooky-legs-right-idle"}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 1,
              }}
            />

            {/* CAPA 3: CRÁNEO FRONTAL RADIO DOBLE C (Con logo grabado en la frente) */}
            <img
              src="/halloween/skull_head.png"
              alt="Cráneo Araña Radio Doble C"
              className={isMoving ? "spooky-head-crawling" : ""}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 2,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
