"use client";

import { Check, Dices, ExternalLink, Loader2, Sparkles } from "lucide-react";
import type { DiggerTrack } from "@/types/studio";
import { buildSampletteYouTubeWatchUrl } from "@/lib/studio/crateEngine";

interface DiggerPlayerStageProps {
  currentTrack: DiggerTrack;
  isCurrentInHistory: boolean;
  activePadTime: number | null;
  isPlayerLoading: boolean;
  skipNotice: string | null;
  isDiggingRandom: boolean;
  onRandomDig: () => void;
}

export function DiggerPlayerStage({
  currentTrack,
  isCurrentInHistory,
  activePadTime,
  isPlayerLoading,
  skipNotice,
  isDiggingRandom,
  onRandomDig,
}: DiggerPlayerStageProps) {
  return (
    <div
      style={{
        backgroundColor: "#11141C",
        border: "2px solid #1E2332",
        borderRadius: "6px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "stretch",
        justifyContent: "space-between",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      {/* Header de Reproducción y Estado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: "#CCFF00",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "0.70rem", fontWeight: 900, color: "#CCFF00", letterSpacing: "0.5px" }}>
              GÉNERO: {currentTrack.genre.toUpperCase()}
            </span>
          </div>

          {isCurrentInHistory ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 7px",
                backgroundColor: "#161E2E",
                border: "1px solid #3B82F6",
                borderRadius: "3px",
                color: "#60A5FA",
                fontSize: "0.62rem",
                fontWeight: 800,
              }}
              title="Este vinilo ya fue escuchado y registrado en tu historial"
            >
              <Check size={10} />
              <span>✓ EN HISTORIAL</span>
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 7px",
                backgroundColor: "#1C2611",
                border: "1px solid #CCFF00",
                borderRadius: "3px",
                color: "#CCFF00",
                fontSize: "0.62rem",
                fontWeight: 800,
              }}
              title="Primer contacto con este vinilo: totalmente inédito"
            >
              <Sparkles size={10} />
              <span>NUEVO DESCUBRIMIENTO</span>
            </span>
          )}
        </div>

        <a
          href={buildSampletteYouTubeWatchUrl(currentTrack.youtubeId, activePadTime || 0)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "0.68rem",
            color: "#94A3B8",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            textDecoration: "none",
          }}
          title="Abrir video original en YouTube"
        >
          <span>Abrir en YouTube</span>
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Direct Video Player Screen */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "260px",
          backgroundColor: "#000000",
          borderRadius: "4px",
          overflow: "hidden",
          border: "1.5px solid #1E2332",
        }}
      >
        <div
          id="cdigger-yt-player-target"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />

        {(isPlayerLoading || skipNotice) && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "#0A0C12",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              zIndex: 35,
              textAlign: "center",
              padding: "16px",
            }}
          >
            <div
              className="animate-spin"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "3px solid #1E2332",
                borderTopColor: "#CCFF00",
                borderRightColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#CCFF00",
                }}
              />
            </div>

            {skipNotice ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span style={{ color: "#CCFF00", fontWeight: 900, fontSize: "0.80rem", letterSpacing: "0.5px" }}>
                  ESCUDO ANTI-BLOQUEO
                </span>
                <span style={{ color: "#94A3B8", fontSize: "0.72rem", maxWidth: "320px", lineHeight: 1.3 }}>
                  {skipNotice}
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ color: "#CCFF00", fontSize: "0.76rem", fontWeight: 800, letterSpacing: "1px" }}>
                  SINTONIZANDO VINILO...
                </span>
                <span
                  style={{
                    color: "#94A3B8",
                    fontSize: "0.68rem",
                    maxWidth: "280px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentTrack.title} — {currentTrack.artist}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Inferior: Botón Hero C-RANDOM-SAMPLE */}
      <div
        style={{
          padding: "8px 10px",
          backgroundColor: "#161B26",
          border: "1px solid #1E2332",
          borderRadius: "5px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <button
          type="button"
          onClick={onRandomDig}
          disabled={isDiggingRandom}
          className="neo-button fun-hover-wobble"
          style={{
            width: "100%",
            padding: "10px 16px",
            backgroundColor: isDiggingRandom ? "#8CAE00" : "#CCFF00",
            color: "#000000",
            border: "2px solid #000000",
            boxShadow: "2.5px 2.5px 0px #FFFFFF",
            borderRadius: "4px",
            fontSize: "0.82rem",
            fontWeight: 900,
            cursor: isDiggingRandom ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            letterSpacing: "0.5px",
            opacity: isDiggingRandom ? 0.85 : 1,
          }}
          title="Descubrir un nuevo sample de vinilo al azar desde YouTube excluyendo los ya escuchados"
        >
          {isDiggingRandom ? (
            <>
              <Loader2 size={16} className="animate-spin" style={{ color: "#000000" }} />
              <span>BUSCANDO NUEVO VINILO EN YOUTUBE...</span>
            </>
          ) : (
            <>
              <Dices size={16} style={{ color: "#000000" }} />
              <span>C-RANDOM-SAMPLE 🎲</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
