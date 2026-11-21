"use client";

interface RotaryKnobProps {
  label: string;
  valText: string;
  deg: number;
  min: number;
  max: number;
  step?: number;
  value: number;
  title: string;
  size?: number;
  layout?: "horizontal" | "vertical";
  enableWheel?: boolean;
  onChange: (nextValue: number) => void;
  onReset: () => void;
}

export function RotaryKnob({
  label,
  valText,
  deg,
  min,
  max,
  step = 1,
  value,
  title,
  size = 34,
  layout = "vertical",
  enableWheel = true,
  onChange,
  onReset,
}: RotaryKnobProps) {
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startVal = value;
    const range = max - min;
    const onMove = (ev: PointerEvent) => {
      const raw = startVal + ((startY - ev.clientY) / 100) * range;
      const snapped = step > 1 ? Math.round(raw / step) * step : Math.round(raw);
      const next = Math.max(min, Math.min(max, snapped));
      onChange(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!enableWheel) return;
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const next = Math.max(min, Math.min(max, value + dir * step));
    onChange(next);
  };

  const knobDial = (
    <div
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
      onDoubleClick={onReset}
      title={title}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: "radial-gradient(circle at 50% 45%, #2B2D33 0%, #191A1E 75%, #0D0E10 100%)",
        border: "1.5px dashed #FFD600",
        boxShadow:
          layout === "horizontal"
            ? "0 0 12px rgba(255, 214, 0, 0.55), inset 0 0 8px rgba(255, 214, 0, 0.2), 0 2px 5px rgba(0,0,0,0.85)"
            : "0 0 10px rgba(255, 214, 0, 0.45), inset 0 0 6px rgba(255, 214, 0, 0.18), 0 2px 5px rgba(0,0,0,0.85)",
        position: "relative",
        cursor: "ns-resize",
        transform: `rotate(${deg}deg)`,
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "4px",
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          width: "4px",
          height: "4px",
          backgroundColor: "#FFD600",
          boxShadow:
            layout === "horizontal"
              ? "0 0 8px #FFD600, 0 0 14px rgba(255, 214, 0, 0.9)"
              : undefined,
          borderRadius: "1px",
        }}
      />
    </div>
  );

  if (layout === "horizontal") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {knobDial}
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
          <span
            style={{
              fontSize: "0.48rem",
              fontWeight: 900,
              color: "#FFD600",
              fontFamily: "monospace",
              letterSpacing: "0.8px",
              textShadow: "0 0 8px rgba(255, 214, 0, 0.65)",
            }}
          >
            {label}
          </span>
          <span style={{ fontSize: "0.52rem", fontWeight: 800, color: "#D4D4D8", fontFamily: "monospace" }}>
            {valText}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <span
        style={{
          fontSize: "0.48rem",
          fontWeight: 900,
          color: "#FFD600",
          fontFamily: "monospace",
          letterSpacing: "0.8px",
        }}
      >
        {label}
      </span>
      {knobDial}
      <span style={{ fontSize: "0.52rem", fontWeight: 900, color: "#E4E4E7", fontFamily: "monospace" }}>
        {valText}
      </span>
    </div>
  );
}
