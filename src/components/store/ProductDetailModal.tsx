"use client";

import { useState, useMemo, MouseEvent } from "react";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/priceUtils";
import { NeoModal } from "../common/NeoModal";

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, color: string, size: string) => void;
  onOpenSpecs: () => void;
}

export const ProductDetailModal = ({
  product,
  onClose,
  onAddToCart,
  onOpenSpecs,
}: ProductDetailModalProps) => {
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const [isDescriptionExpanded, setDescriptionExpanded] = useState<boolean>(false);

  // Memoized array of unique images for the carousel
  const activeImages = useMemo(() => {
    if (!product) return [];
    const imgs: string[] = [];
    if (product.imageUrl) {
      imgs.push(product.imageUrl);
    }
    if (product.variantImages) {
      Object.values(product.variantImages).forEach((url) => {
        if (url && !imgs.includes(url)) {
          imgs.push(url);
        }
      });
    }
    return imgs;
  }, [product]);

  // Helper: get the label (variantImages key) for a given image URL
  const getLabelForImage = (url: string): string => {
    if (!product?.variantImages) return "";
    const entry = Object.entries(product.variantImages).find(([, v]) => v === url);
    return entry ? entry[0] : "";
  };

  const syncColorFromImage = (index: number) => {
    if (!product || !product.variantImages) return;
    const url = activeImages[index];
    if (!url) return;
    const matchingColor = Object.keys(product.variantImages).find(
      (color) => product.variantImages?.[color] === url
    );
    if (matchingColor) {
      setSelectedColor(matchingColor);
    }
  };

  const handlePrevImage = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeImages.length <= 1) return;
    const nextIdx = (activeImgIndex - 1 + activeImages.length) % activeImages.length;
    setActiveImgIndex(nextIdx);
    syncColorFromImage(nextIdx);
  };

  const handleNextImage = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeImages.length <= 1) return;
    const nextIdx = (activeImgIndex + 1) % activeImages.length;
    setActiveImgIndex(nextIdx);
    syncColorFromImage(nextIdx);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    if (!product) return;

    if (product.variantImages?.[color]) {
      const url = product.variantImages[color];
      const index = activeImages.indexOf(url);
      if (index !== -1) {
        setActiveImgIndex(index);
        return;
      }
    }

    const colorIndex = product.colors.indexOf(color);
    if (colorIndex !== -1 && colorIndex < activeImages.length) {
      setActiveImgIndex(colorIndex);
    }
  };

  const handleThumbnailSelect = (index: number) => {
    setActiveImgIndex(index);
    syncColorFromImage(index);
  };

  if (!product) return null;

  const currentColor = selectedColor || product.colors[0] || "ÚNICO";
  const currentSize = selectedSize || product.sizes[0] || "M";

  return (
    <NeoModal
      isOpen={!!product}
      onClose={onClose}
      title={product.name}
      badgeText={product.badge || "MERCH OFICIAL"}
      maxWidth="780px"
      backgroundColor="var(--background)"
    >
      {/* Split layout wrapper */}
      <div className="modal-split-container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Left Column: Carousel */}
        <div className="modal-split-left" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Main Image Container */}
          <div
            className="neo-card"
            style={{
              width: "100%",
              aspectRatio: "1/1",
              border: "3px solid var(--primary)",
              boxShadow: "4px 4px 0px var(--primary)",
              overflow: "hidden",
              backgroundColor: "white",
              position: "relative",
            }}
          >
            {/* Badge Overlay */}
            {product.badge && (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  backgroundColor: "var(--primary-container)",
                  color: "var(--primary)",
                  border: "2px solid var(--primary)",
                  padding: "3px 8px",
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  zIndex: 10,
                  transform: "rotate(-4deg)",
                  boxShadow: "2px 2px 0px var(--primary)",
                  textTransform: "uppercase",
                }}
              >
                {product.badge}
              </div>
            )}

            <img
              src={activeImages[activeImgIndex] || product.imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* Carousel Navigation Arrows */}
            {activeImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Foto anterior"
                  className="neo-button"
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "white",
                    border: "2px solid var(--primary)",
                    boxShadow: "2px 2px 0px var(--primary)",
                    cursor: "pointer",
                    zIndex: 20,
                    fontWeight: 900,
                    color: "#000",
                  }}
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Foto siguiente"
                  className="neo-button"
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "white",
                    border: "2px solid var(--primary)",
                    boxShadow: "2px 2px 0px var(--primary)",
                    cursor: "pointer",
                    zIndex: 20,
                    fontWeight: 900,
                    color: "#000",
                  }}
                >
                  ▶
                </button>
              </>
            )}

            {/* Indicator Index Pill */}
            {activeImages.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  backgroundColor: "var(--primary-container)",
                  color: "var(--primary)",
                  border: "2px solid var(--primary)",
                  padding: "2px 8px",
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  zIndex: 10,
                  boxShadow: "1.5px 1.5px 0px var(--primary)",
                }}
              >
                {getLabelForImage(activeImages[activeImgIndex]) ||
                  `${activeImgIndex + 1} / ${activeImages.length}`}
              </div>
            )}

            {/* Price Tag overlay badge */}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                backgroundColor: "var(--primary)",
                color: "var(--primary-container, #CCFF00)",
                border: "2px solid var(--primary)",
                padding: "4px 8px",
                fontSize: "0.85rem",
                fontWeight: 900,
                boxShadow: "2px 2px 0px var(--primary)",
                transform: "rotate(-3deg)",
              }}
            >
              {formatPrice(product.price)}
            </div>
          </div>

          {/* Thumbnails grid below active image */}
          {activeImages.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {activeImages.map((imgUrl, idx) => {
                const isActive = idx === activeImgIndex;
                const label = getLabelForImage(imgUrl);
                return (
                  <div
                    key={idx}
                    onClick={() => handleThumbnailSelect(idx)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "3px",
                        border: isActive
                          ? "2.5px solid var(--primary-container)"
                          : "1.5px solid var(--primary)",
                        boxShadow: isActive
                          ? "2px 2px 0px var(--primary)"
                          : "1px 1px 0px var(--primary)",
                        overflow: "hidden",
                        backgroundColor: "white",
                        opacity: isActive ? 1 : 0.65,
                        transform: isActive ? "scale(1.05)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <img
                        src={imgUrl}
                        alt={`Vista ${idx + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    {label && (
                      <span
                        style={{
                          fontSize: "0.52rem",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          color: isActive ? "var(--primary)" : "var(--foreground)",
                          maxWidth: "46px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Product details & Actions */}
        <div className="modal-split-right" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  margin: 0,
                  color: "var(--foreground)",
                }}
              >
                {product.name}
              </h3>
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 900,
                  color: "#BA1A1A",
                  whiteSpace: "nowrap",
                }}
              >
                {formatPrice(product.price)}
              </span>
            </div>
            <p
              style={{
                fontSize: "0.65rem",
                color: "var(--foreground)",
                opacity: 0.7,
                textTransform: "uppercase",
                marginTop: "2px",
                marginBottom: "4px",
                fontWeight: 800,
              }}
            >
              MERCH OFICIAL • RADIO DOBLE C
            </p>
          </div>

          {/* Description */}
          <div>
            <p
              style={{
                fontSize: "0.75rem",
                lineHeight: "1.4",
                color: "var(--foreground)",
                opacity: 0.85,
                margin: 0,
              }}
            >
              {isDescriptionExpanded || product.description.length <= 140
                ? product.description
                : `${product.description.slice(0, 140)}...`}
            </p>
            {product.description.length > 140 && (
              <button
                type="button"
                onClick={() => setDescriptionExpanded(!isDescriptionExpanded)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "2px 0",
                  color: "var(--primary)",
                  fontSize: "0.68rem",
                  fontWeight: 900,
                  cursor: "pointer",
                  textDecoration: "underline",
                  marginTop: "2px",
                }}
              >
                {isDescriptionExpanded ? "Ver menos" : "Leer más"}
              </button>
            )}
          </div>

          {/* Colors Selector */}
          <div>
            <h5
              style={{
                fontSize: "0.70rem",
                fontWeight: 900,
                textTransform: "uppercase",
                margin: "0 0 6px 0",
                color: "var(--foreground)",
              }}
            >
              Color seleccionado: <span style={{ color: "#BA1A1A" }}>{currentColor}</span>
            </h5>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {product.colors.map((color) => {
                const isSelected = currentColor === color;
                return (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    style={{
                      backgroundColor: isSelected ? "var(--primary-container)" : "var(--surface-container, var(--card-bg))",
                      color: isSelected ? "var(--primary)" : "var(--foreground)",
                      border: "2px solid var(--primary)",
                      padding: "4px 8px",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: isSelected ? "1.5px 1.5px 0px var(--primary)" : "1px 1px 0px var(--primary)",
                      transform: isSelected ? "translate(1px, 1px)" : "none",
                    }}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sizes Selector */}
          <div>
            <h5
              style={{
                fontSize: "0.70rem",
                fontWeight: 900,
                textTransform: "uppercase",
                margin: "0 0 6px 0",
                color: "var(--foreground)",
              }}
            >
              Tallas disponibles: <span style={{ color: "#BA1A1A" }}>{currentSize}</span>
            </h5>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {product.sizes.map((size) => {
                const isSelected = currentSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      backgroundColor: isSelected ? "var(--primary-container)" : "var(--surface-container, var(--card-bg))",
                      color: isSelected ? "var(--primary)" : "var(--foreground)",
                      border: "2px solid var(--primary)",
                      padding: "4px 8px",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: isSelected ? "1.5px 1.5px 0px var(--primary)" : "1px 1px 0px var(--primary)",
                      transform: isSelected ? "translate(1px, 1px)" : "none",
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Guide & Technical Specs Button */}
          <button
            onClick={onOpenSpecs}
            className="neo-button"
            style={{
              backgroundColor: "var(--surface-container, var(--card-bg))",
              color: "var(--foreground)",
              border: "1.5px solid var(--primary)",
              boxShadow: "2px 2px 0px var(--primary)",
              padding: "4px 8px",
              fontSize: "0.62rem",
              fontWeight: 900,
              cursor: "pointer",
              width: "max-content",
              marginTop: "2px",
            }}
          >
            📐 MEDIDAS Y ESPECIFICACIONES
          </button>

          {/* Add to Cart Action */}
          <button
            onClick={() => {
              onAddToCart(product, currentColor, currentSize);
              onClose();
            }}
            className="neo-button"
            style={{
              backgroundColor: "var(--primary-container)",
              color: "var(--primary, #000)",
              border: "2.5px solid var(--primary)",
              padding: "10px",
              fontSize: "0.80rem",
              fontWeight: 900,
              width: "100%",
              boxShadow: "3px 3px 0px var(--primary)",
              marginTop: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <ShoppingCart size={15} />
            <span>AÑADIR AL CARRITO</span>
          </button>
        </div>
      </div>
    </NeoModal>
  );
};
