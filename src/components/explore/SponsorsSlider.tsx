"use client";

import { InfiniteSlider } from "../common/InfiniteSlider";

const SPONSORS_DATA = [
  { id: "1", name: "Radio Doble C", src: "/RADIO.png" },
  { id: "2", name: "Doble C 2026", src: "/RADIO-2026.png" },
  { id: "3", name: "Radio Doble C", src: "/RADIO.png" },
  { id: "4", name: "Doble C 2026", src: "/RADIO-2026.png" },
  { id: "5", name: "Radio Doble C", src: "/RADIO.png" },
  { id: "6", name: "Doble C 2026", src: "/RADIO-2026.png" },
];

export const SponsorsSlider = () => {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        margin: "4px 0 12px 0",
      }}
    >
      <h3
        className="sponsors-title"
        style={{
          fontWeight: 900,
          textTransform: "uppercase",
          color: "var(--primary)",
          margin: "0 0 6px 0",
          textAlign: "center",
        }}
      >
        AUSPICIADORES &amp; MARCAS ALIADAS
      </h3>

      <InfiniteSlider gap={75} speed={36} speedOnHover={0} style={{ padding: "8px 0" }}>
        {SPONSORS_DATA.map((sponsor, idx) => (
          <div
            key={`${sponsor.id}-${idx}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              cursor: "pointer",
              padding: "4px 12px",
              transition: "transform 0.2s ease, opacity 0.2s ease",
            }}
            title={sponsor.name}
          >
            <img
              src={sponsor.src}
              alt={sponsor.name}
              className="sponsor-logo-img"
              style={{
                objectFit: "contain",
                filter: "drop-shadow(0px 2px 5px rgba(0,0,0,0.12))",
              }}
            />
          </div>
        ))}
      </InfiniteSlider>
    </div>
  );
};
