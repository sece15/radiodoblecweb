"use client";

import { useState, useEffect } from "react";
import { useAudio } from "@/hooks/useAudio";
import { InfiniteSlider } from "../common/InfiniteSlider";
import { BrandInfoModal } from "../sponsors/BrandInfoModal";
import { SponsorBusiness, fetchSponsorBusinesses, INITIAL_SPONSORS } from "@/services/sponsorService";

const SPONSORS_DATA = [
  {
    id: "1",
    name: "Radio Doble C",
    slug: "doble-c",
    src: "/RADIO.png",
    padding: "6px",
    transform: "translateY(-6px)",
  },
  {
    id: "2",
    name: "Koyote Studios • Sala de Ensayos",
    slug: "koyote",
    src: "/sponsors/koyote.jpg",
    padding: "4px",
    transform: "translateY(3px)",
  },
  {
    id: "3",
    name: "Mikaja • Control de Inventario con IA",
    slug: "mikaja",
    src: "/sponsors/mikaja.png",
    padding: "4px",
    transform: "translateY(-4px) scale(0.9)",
  },
  {
    id: "4",
    name: "Doble C 2026",
    slug: "doble-c",
    src: "/RADIO-2026.png",
    padding: "6px",
    transform: "translateY(-6px)",
  },
  {
    id: "5",
    name: "Koyote Studios",
    slug: "koyote",
    src: "/sponsors/koyote.jpg",
    padding: "4px",
    transform: "translateY(3px)",
  },
  {
    id: "6",
    name: "Mikaja • Control de Inventario con IA",
    slug: "mikaja",
    src: "/sponsors/mikaja.png",
    padding: "4px",
    transform: "translateY(-4px) scale(0.9)",
  },
  {
    id: "7",
    name: "Radio Doble C",
    slug: "doble-c",
    src: "/RADIO.png",
    padding: "6px",
    transform: "translateY(-6px)",
  },
];

export const SponsorsSlider = () => {
  const { setIsSponsorModalOpen, setActiveSponsorSlug } = useAudio();
  const [brands, setBrands] = useState<SponsorBusiness[]>(INITIAL_SPONSORS);
  const [selectedBrand, setSelectedBrand] = useState<SponsorBusiness | null>(null);

  useEffect(() => {
    fetchSponsorBusinesses().then((data) => {
      if (data && data.length > 0) {
        setBrands(data);
      }
    });
  }, []);

  const handleSponsorClick = (slug: string) => {
    const found = brands.find((b) => b.slug === slug) || INITIAL_SPONSORS.find((b) => b.slug === slug);
    if (found) {
      setSelectedBrand(found);
    }
  };

  return (
    <>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          margin: "8px 0 16px 0",
        }}
      >
        <h3
          className="sponsors-title"
          style={{
            fontWeight: 900,
            textTransform: "uppercase",
            color: "var(--primary)",
            margin: "0 0 4px 0",
            textAlign: "center",
            fontSize: "0.85rem",
            letterSpacing: "0.5px",
          }}
        >
          AUSPICIADORES &amp; MARCAS ALIADAS
        </h3>

        <InfiniteSlider gap={55} speed={28} speedOnHover={0} style={{ padding: "8px 0" }}>
          {SPONSORS_DATA.map((sponsor, idx) => (
            <div
              key={`${sponsor.id}-${idx}`}
              onClick={() => handleSponsorClick(sponsor.slug)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                cursor: "pointer",
                padding: "4px",
                transition: "transform 0.2s ease",
              }}
              title={`Ver información de ${sponsor.name}`}
            >
              {/* Círculo Ampliado con Padding y Alineación Óptima según el Logo */}
              <div
                style={{
                  width: "82px",
                  height: "82px",
                  borderRadius: "50%",
                  backgroundColor: "#000000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  padding: sponsor.padding || "8px",
                  boxSizing: "border-box",
                }}
              >
                <img
                  src={sponsor.src}
                  alt={sponsor.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transform: sponsor.transform || "none",
                  }}
                />
              </div>
            </div>
          ))}
        </InfiniteSlider>
      </div>

      {/* Modal Dedicado de Información & Perfil de Marca */}
      <BrandInfoModal
        isOpen={!!selectedBrand}
        onClose={() => setSelectedBrand(null)}
        brand={selectedBrand}
        onOpenOrderModal={(slug) => {
          setSelectedBrand(null);
          setActiveSponsorSlug(slug);
          setIsSponsorModalOpen(true);
        }}
      />
    </>
  );
};
