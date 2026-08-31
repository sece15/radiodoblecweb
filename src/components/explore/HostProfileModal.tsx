"use client";

import { Clock, User, Sparkles, Heart, ScrollText } from "lucide-react";
import { RadioProgram } from "@/types";
import { NeoModal } from "../common/NeoModal";

interface HostProfileModalProps {
  program: RadioProgram | null;
  onClose: () => void;
}

export const HostProfileModal = ({
  program,
  onClose,
}: HostProfileModalProps) => {
  if (!program) return null;

  return (
    <NeoModal
      isOpen={Boolean(program)}
      onClose={onClose}
      title={program.title}
      badgeText="🎙️ PERFIL DEL LOCUTOR"
      maxWidth="880px"
      bodyOverflow="auto"
      backgroundColor="var(--background)"
      footer={
        <button
          onClick={onClose}
          className="neo-button fun-hover-wobble"
          style={{
            backgroundColor: "white",
            padding: "8px 22px",
            fontSize: "0.75rem",
            fontWeight: 900,
            boxShadow: "3px 3px 0px var(--primary)",
            border: "2px solid var(--primary)",
            cursor: "pointer",
          }}
        >
          CERRAR VENTANA
        </button>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "20px",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* LADO IZQUIERDO: FOTO, GÉNERO Y HORARIO */}
        <div
          style={{
            flex: "0 0 160px",
            maxWidth: "180px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            margin: "0 auto",
            alignItems: "center",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <div
            className="neo-card"
            style={{
              width: "140px",
              height: "140px",
              overflow: "hidden",
              border: "2.5px solid var(--primary)",
              boxShadow: "3px 3px 0px var(--primary)",
              backgroundColor: "var(--surface-container)",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <img
              src={program.imageUrl}
              alt={program.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "6px",
                left: "6px",
                backgroundColor: "var(--primary)",
                color: "var(--on-primary)",
                padding: "1px 5px",
                fontSize: "0.55rem",
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              {program.genre}
            </div>
          </div>

          {/* Horario */}
          <div
            style={{
              width: "100%",
              border: "1.5px solid var(--primary)",
              backgroundColor: "var(--surface-container)",
              padding: "6px",
              textAlign: "center",
              fontSize: "0.65rem",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <Clock size={12} /> {program.timeSlot}
          </div>
        </div>

        {/* LADO DERECHO: DATOS DEL PERFIL DEL LOCUTOR Y SHOW */}
        <div
          style={{
            flex: "1 1 340px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            minWidth: 0,
          }}
        >
          {/* Cuadro del Locutor */}
          <div
            style={{
              backgroundColor: "var(--primary-container)",
              border: "2px solid var(--primary)",
              padding: "10px 12px",
              boxShadow: "2px 2px 0px var(--primary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
              <User size={14} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "0.6rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.8 }}>
                {program.hostRole || "LOCUTOR / HOST"}
              </span>
            </div>
            <h4 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
              {program.host}
            </h4>
          </div>

          {/* Quién es / Biografía */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.7, display: "flex", alignItems: "center", gap: "4px" }}>
              <Sparkles size={12} /> ¿QUIÉN ESTÁ DETRÁS DEL MICRÓFONO?
            </span>
            <div
              style={{
                border: "2px solid var(--primary)",
                backgroundColor: "var(--surface-container)",
                padding: "10px",
                fontSize: "0.75rem",
                lineHeight: "1.25rem",
                color: "var(--primary)",
                boxShadow: "2px 2px 0px var(--primary)",
              }}
            >
              <p style={{ margin: 0 }}>
                {program.hostBio || program.description}
              </p>
            </div>
          </div>

          {/* Hobbies e Intereses */}
          {program.hostHobbies && program.hostHobbies.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.7, display: "flex", alignItems: "center", gap: "4px" }}>
                <Heart size={12} /> HOBBIES &amp; PASIONES
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {program.hostHobbies.map((hobby, hIdx) => (
                  <span
                    key={hIdx}
                    style={{
                      backgroundColor: "#FFDE82",
                      border: "1.5px solid var(--primary)",
                      padding: "3px 8px",
                      fontSize: "0.65rem",
                      fontWeight: 900,
                      boxShadow: "1.5px 1.5px 0px var(--primary)",
                      textTransform: "uppercase",
                    }}
                  >
                    ✦ {hobby}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sobre el Programa */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.7 }}>
                📻 CONCEPTO DEL PROGRAMA
              </span>
              {program.slogan && (
                <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#BA1A1A" }}>
                  ✨ “{program.slogan}”
                </span>
              )}
            </div>
            <div
              style={{
                border: "2px solid var(--primary)",
                backgroundColor: "white",
                padding: "10px",
                fontSize: "0.74rem",
                lineHeight: "1.25rem",
                boxShadow: "2px 2px 0px var(--primary)",
              }}
            >
              <p style={{ margin: 0 }}>{program.description}</p>
            </div>
          </div>

          {/* ESTRUCTURA DEL SHOW */}
          {program.showStructure && (
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.7, display: "flex", alignItems: "center", gap: "4px" }}>
                <ScrollText size={12} /> 🎙️ ESTRUCTURA DEL SHOW
              </span>
              <div
                style={{
                  border: "2px solid var(--primary)",
                  backgroundColor: "#FDFBF7",
                  padding: "10px",
                  fontSize: "0.72rem",
                  lineHeight: "1.25rem",
                  boxShadow: "2px 2px 0px var(--primary)",
                  whiteSpace: "pre-line",
                }}
              >
                {program.showStructure}
              </div>
            </div>
          )}

          {/* ESCALETA / GUION */}
          {program.segments && program.segments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "2px" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
                <ScrollText size={13} /> ESTRUCTURA &amp; CONTROLES DEL SHOW
              </span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {program.segments.map((seg, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      backgroundColor: "white",
                      border: "1.5px solid var(--primary)",
                      padding: "6px 8px",
                      fontSize: "0.68rem",
                      lineHeight: "1.1rem",
                      boxShadow: "1.5px 1.5px 0px var(--primary)",
                    }}
                  >
                    <div style={{ fontWeight: 900, color: "#111", marginBottom: "2px" }}>
                      {seg.icon} {seg.control}
                    </div>
                    <div style={{ opacity: 0.85, whiteSpace: "pre-line" }}>{seg.locution}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </NeoModal>
  );
};
