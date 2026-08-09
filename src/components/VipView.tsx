import { useAudio } from "@/hooks/useAudio";
import { isVip } from "@/lib/permissions";
import { DriveAlbumsSection } from "./DriveAlbumsSection";
import { Sparkles, Crown, Lock } from "lucide-react";

interface VipViewProps {
  onNavigateToPlayer: () => void;
}

export const VipView = ({ onNavigateToPlayer }: VipViewProps) => {
  const { userProfile } = useAudio();
  const userIsVip = isVip(userProfile.role);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        padding: "20px 16px 180px 16px",
        width: "100%",
        maxWidth: "850px",
        margin: "0 auto",
      }}
    >
      {/* 1. VIP WELCOME / STATUS BANNER */}
      {userIsVip ? (
        <div
          className="neo-card scanlines"
          style={{
            backgroundColor: "var(--primary-container)",
            border: "4px solid var(--primary)",
            boxShadow: "8px 8px 0px var(--primary)",
            padding: "22px",
            position: "relative",
            transform: "rotate(-0.5deg)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Crown style={{ color: "#BA1A1A", fill: "#FFB000" }} size={28} />
              <h2 style={{ fontSize: "1.4rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>
                ZONA EXCLUSIVA VIP • DISCOTECA
              </h2>
            </div>
            <span
              style={{
                backgroundColor: "#FFB000",
                color: "black",
                border: "2px solid var(--primary)",
                padding: "3px 10px",
                fontSize: "0.7rem",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Sparkles size={14} /> MEMBRESÍA ACTIVA ({userProfile.role})
            </span>
          </div>

          <p style={{ fontSize: "0.75rem", lineHeight: "1.15rem", opacity: 0.9, margin: 0 }}>
            Como miembro **VIP**, tienes acceso desbloqueado a las producciones discográficas oficiales alojadas en Google Drive, streaming en alta definición y descarga directa de archivos MP3 en alta fidelidad. ¡Gracias por apoyar la radio libre! ⚡
          </p>
        </div>
      ) : (
        <div
          className="neo-card"
          style={{
            backgroundColor: "#FFF8E1",
            border: "4px solid var(--primary)",
            boxShadow: "8px 8px 0px var(--primary)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            transform: "rotate(-0.5deg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div
              style={{
                backgroundColor: "#BA1A1A",
                color: "white",
                padding: "6px 12px",
                border: "2px solid var(--primary)",
                fontSize: "0.75rem",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Lock size={14} /> CONTENIDO EXCLUSIVO VIP
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
              DISCOTECA Y ÁLBUMES DE ESTUDIO
            </h2>
          </div>

          <p style={{ fontSize: "0.8rem", lineHeight: "1.25rem", color: "#333", margin: 0 }}>
            Esta sección contiene la discografía completa de Radio Doble C, sesiones de autor y canciones exclusivas en alta definición. Suscríbete al Club VIP para desbloquear la escucha a la carta y descargas directas.
          </p>

          <a
            href="https://wa.me/51999999999?text=Hola%2C%20quiero%20suscribirme%20al%20Club%20VIP%20de%20Radio%20Doble%20C"
            target="_blank"
            rel="noopener noreferrer"
            className="neo-button fun-hover-wobble"
            style={{
              backgroundColor: "var(--primary-container)",
              padding: "12px 20px",
              fontSize: "0.85rem",
              fontWeight: 900,
              width: "fit-content",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "4px 4px 0px var(--primary)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Sparkles size={16} /> OBTENER MEMBRESÍA VIP ⚡
          </a>
        </div>
      )}

      {/* 2. GOOGLE DRIVE ALBUMS & DISCOGRAPHY */}
      <DriveAlbumsSection requireVip={true} onNavigateToPlayer={onNavigateToPlayer} />
    </div>
  );
};
