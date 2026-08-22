"use client";

interface VisualThemesSectionProps {
  activeTheme: string;
  onSelectTheme: (themeId: string) => void;
}

const AVAILABLE_THEMES = [
  { id: "PUNK_NEON", name: "Fanzine Brutal", colors: ["#CCFF00", "#F9FBE5"] },
  { id: "COSMIC_DARK", name: "Cosmic Slate", colors: ["#00FFCC", "#12141C"] },
  { id: "CYBER_RED", name: "Cyberpunk Red", colors: ["#FF0D43", "#FAE000"] },
  { id: "RETRO_AMBER", name: "Amber CRT", colors: ["#FF8000", "#150F05"] },
  { id: "TROPICAL", name: "Isla Tropical", colors: ["#EC008C", "#FFB6D9"] },
];

export const VisualThemesSection = ({
  activeTheme,
  onSelectTheme,
}: VisualThemesSectionProps) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "800px",
        gap: "12px",
        marginTop: "12px",
      }}
    >
      <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
        🎨 TEMAS VISUALES
      </h3>

      <div style={{ display: "flex", gap: "12px", overflowX: "auto", padding: "10px 4px" }}>
        {AVAILABLE_THEMES.map((theme, idx) => {
          const isSelected = activeTheme === theme.id;
          const restRotation = idx % 2 === 0 ? -1.5 : 1.5;
          return (
            <div
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              className="neo-card fun-hover-wobble"
              style={{
                width: "120px",
                flexShrink: 0,
                backgroundColor: theme.colors[1],
                borderWidth: "2.5px",
                borderColor: "var(--primary)",
                boxShadow: isSelected
                  ? "0px 0px 0px var(--primary)"
                  : "4px 4px 0px var(--primary)",
                transform: isSelected
                  ? `translate(3px, 3px) rotate(0deg)`
                  : `rotate(${restRotation}deg)`,
                padding: "10px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: theme.colors[0],
                    border: "1px solid black",
                  }}
                ></div>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: theme.colors[1],
                    border: "1px solid black",
                  }}
                ></div>
              </div>

              <h4
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color:
                    theme.id === "COSMIC_DARK" || theme.id === "RETRO_AMBER" ? "white" : "black",
                  margin: 0,
                }}
              >
                {theme.name}
              </h4>

              <div
                style={{
                  backgroundColor: isSelected ? theme.colors[0] : "lightgrey",
                  color: "black",
                  fontSize: "0.55rem",
                  fontWeight: "bold",
                  padding: "1px 4px",
                  width: "max-content",
                }}
              >
                {isSelected ? "ACTIVO" : "ELEGIR"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
