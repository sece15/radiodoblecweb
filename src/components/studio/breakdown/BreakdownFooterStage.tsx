"use client";

import type { BeatBreakdownSamplePayload, SamplerCuePoint } from "@/types/studio";

interface BreakdownFooterStageProps {
  samplePayload: BeatBreakdownSamplePayload | null;
  availableChops: SamplerCuePoint[];
  selectedChopId: number | null;
  currentCaption: { overline: string; headline: string; subline: string };
  onSelectChop: (id: number) => void;
}

export function BreakdownFooterStage({
  samplePayload,
  availableChops,
  selectedChopId,
  currentCaption,
  onSelectChop,
}: BreakdownFooterStageProps) {
  return (
    <>
      {availableChops.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
            padding: "8px 12px",
            border: "2px solid var(--primary)",
            backgroundColor: "var(--surface-container)",
          }}
        >
          <span
            style={{
              fontSize: "0.66rem",
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginRight: "4px",
            }}
          >
            MELODÍA / CHOP:
          </span>
          {samplePayload?.sampleBuffer && (
            <button
              type="button"
              onClick={() => onSelectChop(0)}
              style={{
                padding: "4px 9px",
                fontSize: "0.68rem",
                fontWeight: 900,
                border: "1.5px solid var(--primary)",
                backgroundColor: selectedChopId === 0 ? "var(--primary-container)" : "var(--card-bg)",
                color: selectedChopId === 0 ? "var(--on-primary-container)" : "var(--on-background)",
                cursor: "pointer",
              }}
            >
              {samplePayload.recordedBars
                ? `MELODÍA GRABADA (${samplePayload.recordedBars} COMP)`
                : "SAMPLE COMPLETO"}
            </button>
          )}
          {availableChops.map((cue) => {
            const isSelected = selectedChopId === cue.id;
            return (
              <button
                key={cue.id}
                type="button"
                onClick={() => onSelectChop(cue.id)}
                style={{
                  padding: "4px 9px",
                  fontSize: "0.68rem",
                  fontWeight: 900,
                  border: "1.5px solid var(--primary)",
                  backgroundColor: isSelected ? "var(--primary-container)" : "var(--card-bg)",
                  color: isSelected ? "var(--on-primary-container)" : "var(--on-background)",
                  cursor: "pointer",
                }}
              >
                {cue.name}
              </button>
            );
          })}
        </div>
      )}

      <footer
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          marginTop: "6px",
          padding: "4px 2px",
        }}
      >
        <span
          style={{
            fontSize: "0.78rem",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--on-surface-variant)",
          }}
        >
          {currentCaption.overline}
        </span>
        <h2
          style={{
            fontFamily: "'Outfit', 'Space Grotesk', sans-serif",
            fontSize: "clamp(1.75rem, 5vw, 3.1rem)",
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {currentCaption.headline}
          <br />
          <span
            style={{
              backgroundColor: "var(--primary-container)",
              color: "var(--on-primary-container)",
              padding: "0 8px",
              boxDecorationBreak: "clone",
            }}
          >
            {currentCaption.subline}
          </span>
        </h2>
        <p
          style={{
            marginTop: "8px",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "var(--on-surface-variant)",
            letterSpacing: "0.04em",
          }}
        >
          Atajos: [ESPACIO] Play/Stop · [1–5] Enfocar capa · [0] Full Loop · Clic en cada pad para editar el ritmo
        </p>
      </footer>
    </>
  );
}
