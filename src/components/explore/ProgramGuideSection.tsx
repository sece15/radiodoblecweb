"use client";

import { RadioProgram } from "@/types";

interface ProgramGuideSectionProps {
  programs: RadioProgram[];
  onOpenProgram: (program: RadioProgram) => void;
}

export const ProgramGuideSection = ({
  programs,
  onOpenProgram,
}: ProgramGuideSectionProps) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h3
        style={{
          fontSize: "1.2rem",
          fontWeight: 900,
          textTransform: "uppercase",
          borderBottom: "4px solid var(--primary)",
          paddingBottom: "6px",
          width: "max-content",
        }}
      >
        GUIA DE PROGRAMAS
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {programs.map((prog, idx) => {
          const rotations = [0.5, -0.8, 0.3, -0.5];
          const rot = rotations[idx % rotations.length];
          return (
            <div
              key={prog.id}
              className="neo-card store-card-hover"
              style={{
                transform: `rotate(${rot}deg)`,
                cursor: "pointer",
                boxShadow: "5px 5px 0px var(--primary)",
                backgroundColor: "var(--surface-container)",
                padding: "12px",
              }}
              onClick={() => onOpenProgram(prog)}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <img
                  src={prog.imageUrl}
                  alt={prog.title}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "64px",
                    height: "64px",
                    objectFit: "cover",
                    border: "2px solid var(--primary)",
                  }}
                />

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "6px",
                      minWidth: 0,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        lineHeight: "1rem",
                        whiteSpace: "normal",
                        flex: 1,
                      }}
                      title={prog.title}
                    >
                      {prog.title}
                    </h4>
                    <span
                      style={{
                        backgroundColor: "var(--primary-container)",
                        border: "1px solid var(--primary)",
                        padding: "1px 6px",
                        fontSize: "0.55rem",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "110px",
                        flexShrink: 0,
                      }}
                      title={prog.genre}
                    >
                      {prog.genre}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.7rem", fontWeight: "bold", opacity: 0.8, margin: 0 }}>
                    LOCUTOR: {prog.host.toUpperCase()}
                  </p>
                  <p style={{ fontSize: "0.65rem", fontWeight: 900, color: "#BA1A1A", margin: 0 }}>
                    {prog.timeSlot}
                  </p>
                  <p
                    style={{
                      fontSize: "0.65rem",
                      opacity: 0.7,
                      lineHeight: "0.9rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      margin: 0,
                    }}
                  >
                    {prog.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
