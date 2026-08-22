"use client";

import { CSSProperties } from "react";
import { Check, Edit, Share2, LogOut } from "lucide-react";
import { UserProfile } from "@/types";
import { getRoleBadgeInfo } from "@/lib/permissions";

interface ProfileHeaderBlockProps {
  userProfile: UserProfile;
  isAuthenticated: boolean;
  copiedShare: boolean;
  onEditClick: () => void;
  onShareClick: () => void;
  onSignOut: () => void;
}

export const ProfileHeaderBlock = ({
  userProfile,
  isAuthenticated,
  copiedShare,
  onEditClick,
  onShareClick,
  onSignOut,
}: ProfileHeaderBlockProps) => {
  const badge = getRoleBadgeInfo(userProfile.role);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        width: "100%",
        maxWidth: "480px",
        textAlign: "center",
      }}
    >
      {!isAuthenticated && (
        <div
          style={{
            width: "100%",
            backgroundColor: "var(--primary-container)",
            border: "2px solid var(--primary)",
            padding: "6px 10px",
            textAlign: "center",
            color: "var(--primary)",
            fontWeight: 900,
            fontSize: "0.72rem",
            boxShadow: "3px 3px 0px var(--primary)",
          }}
        >
          📻 MODO INVITADO: INICIA SESIÓN CON GOOGLE PARA GUARDAR TU PROGRESO
        </div>
      )}

      {/* Avatar */}
      <div style={{ position: "relative", width: "160px", height: "160px", padding: "6px" }}>
        <div
          className="neo-card"
          style={{
            width: "100%",
            height: "100%",
            boxShadow: "6px 6px 0px var(--primary)",
            overflow: "hidden",
            backgroundColor: "white",
            border: "3px solid var(--primary)",
          }}
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "-4px",
            right: "-4px",
            backgroundColor: "var(--primary-container)",
            border: "2px solid var(--primary)",
            padding: "4px",
            transform: "rotate(10deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <Check size={18} style={{ color: "var(--primary)" }} />
        </div>
      </div>

      {/* Name & Role */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <h2
          style={{
            fontSize: "1.8rem",
            lineHeight: "2rem",
            textAlign: "center",
            fontWeight: 900,
            textTransform: "uppercase",
            fontFamily: "Space Grotesk, sans-serif",
            margin: 0,
          }}
        >
          {userProfile.name}
        </h2>

        {/* Dynamic Role Badge */}
        <div
          style={{
            transform: "rotate(-1.5deg)",
            backgroundColor: badge.bg,
            color: badge.color,
            border: `2px solid ${badge.border}`,
            padding: "4px 12px",
            fontSize: "0.72rem",
            fontWeight: 900,
            boxShadow: "2px 2px 0px var(--primary)",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          {badge.badge}
        </div>
      </div>

      {/* Buttons: Edit & Share */}
      <div style={{ display: "flex", width: "100%", maxWidth: "340px", gap: "12px", justifyContent: "center" }}>
        <button
          onClick={onEditClick}
          className="neo-button fun-hover-wobble"
          style={{
            flex: 1,
            backgroundColor: "var(--primary-container)",
            fontSize: "0.75rem",
            fontWeight: 900,
          } as CSSProperties}
        >
          <Edit size={15} style={{ marginRight: "6px" }} />
          {isAuthenticated ? "EDITAR PERFIL" : "ACCEDER CON GOOGLE"}
        </button>

        <button
          onClick={onShareClick}
          className="neo-button fun-hover-wobble"
          style={{
            flex: 1,
            backgroundColor: copiedShare ? "#CCFF00" : "white",
            fontSize: "0.75rem",
            fontWeight: 900,
            border: "2.5px solid var(--primary)",
          } as CSSProperties}
        >
          <Share2 size={15} style={{ marginRight: "6px" }} />
          {copiedShare ? "¡COPIADO!" : "COMPARTIR"}
        </button>
      </div>

      {isAuthenticated && (
        <button
          onClick={onSignOut}
          className="neo-button fun-hover-wobble"
          style={{
            width: "100%",
            maxWidth: "340px",
            backgroundColor: "#BA1A1A",
            color: "white",
            fontSize: "0.72rem",
            fontWeight: 900,
            boxShadow: "3px 3px 0px var(--primary)",
          } as CSSProperties}
        >
          <LogOut size={15} style={{ marginRight: "6px" }} />
          CERRAR SESIÓN
        </button>
      )}
    </div>
  );
};
