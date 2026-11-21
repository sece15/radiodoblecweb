"use client";

import Link from "next/link";
import { ArrowLeft, History, X } from "lucide-react";

interface DiggerHeaderBarProps {
  isStandalone: boolean;
  isAuthenticated: boolean;
  userName: string;
  userAvatarUrl?: string;
  showCrateDrawer: boolean;
  playedHistoryCount: number;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleHistoryDrawer: () => void;
  onOpenSampler?: () => void;
  onClose?: () => void;
}

export function DiggerHeaderBar({
  isStandalone,
  isAuthenticated,
  userName,
  userAvatarUrl,
  showCrateDrawer,
  playedHistoryCount,
  onSignIn,
  onSignOut,
  onToggleHistoryDrawer,
  onOpenSampler,
  onClose,
}: DiggerHeaderBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: "1200px",
        marginBottom: "10px",
        flexShrink: 0,
        gap: "12px",
      }}
    >
      {isStandalone ? (
        <Link
          href="/"
          className="neo-button fun-hover-wobble"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            backgroundColor: "#161922",
            color: "#CCFF00",
            border: "2px solid #CCFF00",
            boxShadow: "2px 2px 0px #CCFF00",
            borderRadius: "4px",
            fontSize: "0.7rem",
            fontWeight: 900,
            textDecoration: "none",
            cursor: "pointer",
          }}
          title="Volver a la señal en vivo de Radio Doble C"
        >
          <ArrowLeft size={13} />
          <span>VOLVER A LA RADIO</span>
        </Link>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.74rem", fontWeight: 900, color: "#CCFF00", letterSpacing: "1px" }}>
            C-DIGGER
          </span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "#94A3B8", letterSpacing: "0.5px" }}>
          RADIO DOBLE C · <span style={{ color: "#CCFF00" }}>STUDIO</span>
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {isAuthenticated ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 8px",
              backgroundColor: "#161B26",
              border: "1px solid #232838",
              borderRadius: "4px",
            }}
            title={`Conectado como ${userName}. Cuota personal activa.`}
          >
            {userAvatarUrl && (
              <img
                src={userAvatarUrl}
                alt={userName}
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid #CCFF00",
                }}
              />
            )}
            <span style={{ fontSize: "0.68rem", fontWeight: 900, color: "#CCFF00", letterSpacing: "0.5px" }}>
              {userName.split(" ")[0]} · VINCULADO
            </span>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                background: "transparent",
                border: "none",
                color: "#94A3B8",
                fontSize: "0.6rem",
                cursor: "pointer",
                padding: "0 2px",
              }}
              title="Desconectar cuenta"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 10px",
              backgroundColor: "#161B26",
              color: "#CCFF00",
              border: "1px solid #CCFF00",
              borderRadius: "4px",
              fontSize: "0.68rem",
              fontWeight: 900,
              cursor: "pointer",
            }}
            title="Vincular tu cuenta de Google / Supabase"
          >
            <span>⚡</span>
            <span>VINCULAR GOOGLE</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleHistoryDrawer}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            backgroundColor: showCrateDrawer ? "#CCFF00" : "#161B26",
            color: showCrateDrawer ? "#000000" : "#FFFFFF",
            border: "1px solid #232838",
            borderRadius: "4px",
            fontSize: "0.7rem",
            fontWeight: 800,
            cursor: "pointer",
          }}
          title="Abrir historial de vinilos escuchados y pistas guardadas"
        >
          <History size={13} />
          <span>HISTORIAL ({playedHistoryCount})</span>
        </button>

        {onOpenSampler && (
          <button
            type="button"
            onClick={onOpenSampler}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              backgroundColor: "#101D24",
              color: "#00E5FF",
              border: "1px solid #00E5FF",
              borderRadius: "4px",
              fontSize: "0.7rem",
              fontWeight: 900,
              cursor: "pointer",
            }}
            title="Ir al laboratorio de sampleo y stems C-Sampler"
          >
            <span>🎚️</span>
            <span>C-SAMPLER</span>
          </button>
        )}

        {!isStandalone && onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 10px",
              backgroundColor: "#161B26",
              color: "#FFFFFF",
              border: "1px solid #232838",
              borderRadius: "4px",
              fontSize: "0.7rem",
              fontWeight: 900,
              cursor: "pointer",
            }}
            title="Cerrar C-Digger"
          >
            <X size={14} />
            <span>SALIR</span>
          </button>
        )}
      </div>
    </div>
  );
}
