"use client";

import { useState, useMemo, MouseEvent } from "react";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types";

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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 3000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "80px 16px 40px 16px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        className="neo-card scanlines"
        style={{
          backgroundColor: "var(--background)",
          backgroundImage: product.isFeatured
            ? "repeating-linear-gradient(-45deg, rgba(204, 255, 0, 0.04) 0px, rgba(204, 255, 0, 0.04) 10px, transparent 10px, transparent 20px)"
            : "none",
          border: product.isFeatured
            ? "4px solid var(--primary-container)"
            : "4px solid var(--primary)",
          boxShadow: "10px 10px 0px var(--primary)",
          width: "100%",
          maxWidth: "760px",
          padding: "24px",
          position: "relative",
          transform: "rotate(0.5deg)",
          margin: "0 auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tilted Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "-15px",
            right: "15px",
            backgroundColor: "var(--error)",
            color: "white",
            border: "2.5px solid var(--primary)",
            boxShadow: "2px 2px 0px var(--primary)",
            padding: "4px 10px",
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "0.75rem",
            fontWeight: 900,
            cursor: "pointer",
            transform: "rotate(-3deg)",
            zIndex: 10,
          }}
        >
          CERRAR X
        </button>

        {/* Split layout wrapper */}
        <div className="modal-split-container">
          {/* Left Column: Carousel */}
          <div className="modal-split-left">
            {/* Main Image Container */}
            <div
              className="neo-card"
              style={{
                width: "100%",
                aspectRatio: "1/1",
                borderWidth: "3px",
                boxShadow: "5px 5px 0px var(--primary)",
                transform: "rotate(-1.5deg)",
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
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "white",
                      border: "2.5px solid var(--primary)",
                      boxShadow: "2px 2px 0px var(--primary)",
                      cursor: "pointer",
                      zIndex: 20,
                      fontWeight: 900,
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
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "white",
                      border: "2.5px solid var(--primary)",
                      boxShadow: "2px 2px 0px var(--primary)",
                      cursor: "pointer",
                      zIndex: 20,
                      fontWeight: 900,
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
                  color: "white",
                  border: "2px solid var(--primary-container)",
                  padding: "4px 8px",
                  fontSize: "0.8rem",
                  fontWeight: 900,
                  boxShadow: "1.5px 1.5px 0px var(--primary)",
                  transform: "rotate(-3deg)",
                }}
              >
                {product.price}
              </div>
            </div>

            {/* Thumbnails grid below active image */}
            {activeImages.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "12px",
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
                      className="store-card-hover"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "3px",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          border: isActive
                            ? "3px solid var(--primary-container)"
                            : "2px solid var(--primary)",
                          boxShadow: isActive
                            ? "2px 2px 0px var(--primary)"
                            : "1px 1px 0px var(--primary)",
                          overflow: "hidden",
                          backgroundColor: "white",
                          transform: isActive ? "scale(1.05) rotate(-1deg)" : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={label || `Vista ${idx + 1}`}
                          loading="lazy"
                          decoding="async"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      {label && (
                        <span
                          style={{
                            fontSize: "0.45rem",
                            fontWeight: 900,
                            textTransform: "uppercase",
                            color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
                            textAlign: "center",
                            maxWidth: "52px",
                            lineHeight: "0.55rem",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
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

          {/* Right Column: Title, Description, Selectors, Button */}
          <div className="modal-split-right">
            <div>
              <span
                style={{
                  backgroundColor: "var(--primary-container)",
                  border: "1.5px solid var(--primary)",
                  padding: "2px 6px",
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  width: "max-content",
                  display: "block",
                  transform: "rotate(1deg)",
                  marginBottom: "6px",
                }}
              >
                PRENDA OFICIAL
              </span>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  lineHeight: "1.7rem",
                  color: "var(--primary)",
                  marginBottom: "4px",
                }}
              >
                {product.name}
              </h3>
              <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--primary)" }}>
                {product.price}
              </span>
            </div>

            {/* Description Accordion */}
            <div>
              <button
                onClick={() => setDescriptionExpanded(!isDescriptionExpanded)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "var(--primary-container)",
                  border: "2px solid var(--primary)",
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  boxShadow: "2px 2px 0px var(--primary)",
                  marginBottom: "6px",
                }}
              >
                <span>Detalles del producto</span>
                <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                  {isDescriptionExpanded ? "▲" : "▼"}
                </span>
              </button>

              <div
                style={{
                  maxHeight: isDescriptionExpanded ? "500px" : "0px",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease, padding 0.3s ease, border 0.3s ease",
                  border: isDescriptionExpanded ? "2px solid var(--primary)" : "none",
                  backgroundColor: "white",
                  padding: isDescriptionExpanded ? "10px" : "0 10px",
                  fontSize: "0.7rem",
                  opacity: 0.9,
                  lineHeight: "1.1rem",
                }}
              >
                {product.description}
              </div>
            </div>

            {/* Colors / Views Selector */}
            <div>
              <h5
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                Variantes / Vistas:
              </h5>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {product.colors.map((color, colorIdx) => {
                  const mappedUrl = product.variantImages?.[color];
                  const mappedIndex = mappedUrl ? activeImages.indexOf(mappedUrl) : colorIdx;
                  const isSelected = currentColor === color || mappedIndex === activeImgIndex;
                  return (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      style={{
                        backgroundColor: isSelected ? "var(--primary)" : "white",
                        color: isSelected ? "var(--on-primary)" : "var(--primary)",
                        border: "2px solid var(--primary)",
                        padding: "4px 10px",
                        fontSize: "0.6rem",
                        fontWeight: 900,
                        cursor: "pointer",
                        boxShadow: isSelected
                          ? "1px 1px 0px var(--primary)"
                          : "2px 2px 0px var(--primary)",
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
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                Tallas disponibles:
              </h5>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {product.sizes.map((size) => {
                  const isSelected = currentSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        backgroundColor: isSelected ? "var(--primary-container)" : "white",
                        color: "var(--primary)",
                        border: "2px solid var(--primary)",
                        padding: "4px 10px",
                        fontSize: "0.6rem",
                        fontWeight: 900,
                        cursor: "pointer",
                        boxShadow: isSelected
                          ? "1px 1px 0px var(--primary)"
                          : "2px 2px 0px var(--primary)",
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
                backgroundColor: "var(--card-bg)",
                border: "2px solid var(--primary)",
                boxShadow: "2px 2px 0px var(--primary)",
                padding: "4px 8px",
                fontSize: "0.6rem",
                fontWeight: 900,
                cursor: "pointer",
                width: "max-content",
                marginTop: "4px",
                transform: "rotate(1deg)",
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
                border: "3.5px solid var(--primary)",
                padding: "10px",
                fontSize: "0.8rem",
                fontWeight: 900,
                width: "100%",
                boxShadow: "3px 3px 0px var(--primary)",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <ShoppingCart size={14} />
              <span>AÑADIR AL CARRITO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
