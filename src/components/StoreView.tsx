import { useState, useEffect, MouseEvent } from "react";
import { ShoppingCart, Star, Sparkles } from "lucide-react";
import { Product } from "@/types";
import { STORE_PRODUCTS } from "@/constants";

interface StoreViewProps {
  addToCart: (product: Product, color: string, size: string) => void;
  onModalToggle?: (isOpen: boolean) => void;
}

export const StoreView = ({ addToCart, onModalToggle }: StoreViewProps) => {
  const products = STORE_PRODUCTS;

  // Modal Detail States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");

  // Trigger modal callback for parent stacking context z-index adjustment
  useEffect(() => {
    if (onModalToggle) {
      onModalToggle(!!selectedProduct);
    }
  }, [selectedProduct, onModalToggle]);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const [isSpecsOpen, setSpecsOpen] = useState<boolean>(false);
  const [isDescriptionExpanded, setDescriptionExpanded] = useState<boolean>(false);

  const handleOpenDetail = (product: Product) => {
    setSelectedProduct(product);
    setSelectedColor(product.colors[0] || "");
    setSelectedSize(product.sizes[0] || "");
    setActiveImgIndex(0);
    setSpecsOpen(false);
    setDescriptionExpanded(false);
  };

  // Helper to collect all unique images for the carousel
  const activeImages: string[] = [];
  if (selectedProduct) {
    activeImages.push(selectedProduct.imageUrl);
    if (selectedProduct.variantImages) {
      Object.values(selectedProduct.variantImages).forEach((url) => {
        if (!activeImages.includes(url)) {
          activeImages.push(url);
        }
      });
    }
  }

  const syncColorFromImage = (index: number) => {
    if (!selectedProduct || !selectedProduct.variantImages) return;
    const url = activeImages[index];
    const matchingColor = Object.keys(selectedProduct.variantImages).find(
      (color) => selectedProduct.variantImages?.[color] === url
    );
    if (matchingColor) {
      setSelectedColor(matchingColor);
    }
  };

  const handlePrevImage = (e: MouseEvent) => {
    e.stopPropagation();
    if (activeImages.length <= 1) return;
    const nextIdx = (activeImgIndex - 1 + activeImages.length) % activeImages.length;
    setActiveImgIndex(nextIdx);
    syncColorFromImage(nextIdx);
  };

  const handleNextImage = (e: MouseEvent) => {
    e.stopPropagation();
    if (activeImages.length <= 1) return;
    const nextIdx = (activeImgIndex + 1) % activeImages.length;
    setActiveImgIndex(nextIdx);
    syncColorFromImage(nextIdx);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    if (selectedProduct?.variantImages?.[color]) {
      const url = selectedProduct.variantImages[color];
      const index = activeImages.indexOf(url);
      if (index !== -1) {
        setActiveImgIndex(index);
      }
    }
  };

  const handleThumbnailSelect = (index: number) => {
    setActiveImgIndex(index);
    syncColorFromImage(index);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "20px 16px 180px 16px",
        position: "relative",
        width: "100%",
        maxWidth: "768px",
        margin: "0 auto",
      }}
    >
      {/* URBAN BACKGROUND GRAFFITI & STAR DECORATIONS */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "-40px",
          fontSize: "9rem",
          fontWeight: 900,
          fontFamily: "Space Grotesk, sans-serif",
          color: "var(--primary)",
          opacity: 0.05,
          transform: "rotate(-20deg)",
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
        }}
      >
        PUNK
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "-30px",
          fontSize: "7rem",
          fontWeight: 900,
          fontFamily: "Space Grotesk, sans-serif",
          color: "var(--primary-container)",
          opacity: 0.07,
          transform: "rotate(15deg)",
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
        }}
      >
        DOBLE C
      </div>

      <div
        style={{
          position: "absolute",
          top: "45%",
          right: "10%",
          fontSize: "5rem",
          fontWeight: 900,
          fontFamily: "Space Grotesk, sans-serif",
          color: "var(--primary)",
          opacity: 0.04,
          transform: "rotate(-10deg)",
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
        }}
      >
        STREET
      </div>

      <Star
        size={140}
        style={{
          position: "absolute",
          top: "25%",
          right: "-50px",
          color: "var(--primary-container)",
          fill: "var(--primary-container)",
          opacity: 0.06,
          transform: "rotate(25deg)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Star
        size={120}
        style={{
          position: "absolute",
          bottom: "10%",
          left: "-40px",
          color: "var(--primary)",
          fill: "var(--primary)",
          opacity: 0.05,
          transform: "rotate(-35deg)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Sparkles
        size={80}
        style={{
          position: "absolute",
          top: "5%",
          right: "20%",
          color: "var(--primary)",
          opacity: 0.05,
          transform: "rotate(15deg)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* HEADER SECTION */}
      <h2
        className="neo-card"
        style={{
          backgroundColor: "var(--primary-container)",
          padding: "8px 16px",
          transform: "rotate(-2deg)",
          fontSize: "1.5rem",
          fontWeight: 900,
          textTransform: "uppercase",
          borderWidth: "4px",
          boxShadow: "4px 4px 0px var(--primary)",
          zIndex: 1,
        }}
      >
        TIENDA OFICIAL
      </h2>

      <p style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", opacity: 0.8, zIndex: 1 }}>
        APOYA A LA RADIO, VÍSTETE BRUTAL.
      </p>

      {/* COMPACT PRODUCT GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: "24px",
          width: "100%",
          maxWidth: "800px",
          marginTop: "16px",
          zIndex: 1,
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {/* Product Card */}
            <div
              onClick={() => handleOpenDetail(product)}
              className="neo-card store-card-hover"
              style={{
                width: "100%",
                aspectRatio: "1/1",
                transform: `rotate(${product.rotation}deg)`,
                overflow: "hidden",
                boxShadow: product.isFeatured ? "6px 6px 0px var(--primary)" : "4px 4px 0px var(--primary)",
                borderWidth: product.isFeatured ? "4px" : "3px",
                borderColor: product.isFeatured ? "var(--primary-container)" : "var(--primary)",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                {product.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      backgroundColor: product.isFeatured ? "var(--primary-container)" : "var(--card-bg)",
                      color: "var(--primary)",
                      border: "2px solid var(--primary)",
                      padding: "2px 6px",
                      fontSize: "0.55rem",
                      fontWeight: 900,
                      zIndex: 10,
                      transform: "rotate(-5deg)",
                      boxShadow: "2px 2px 0px var(--primary)",
                      textTransform: "uppercase",
                    }}
                  >
                    {product.badge}
                  </div>
                )}

                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />

                {/* Price Badge */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    backgroundColor: "var(--primary)",
                    color: "var(--on-primary)",
                    border: "2px solid var(--primary-container)",
                    padding: "2px 6px",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    transform: `rotate(${product.rotation < 0 ? 4 : -4}deg)`,
                    boxShadow: "1px 1px 0px var(--primary)",
                  }}
                >
                  {product.price}
                </div>
              </div>
            </div>

            {/* Product Name */}
            <h4
              onClick={() => handleOpenDetail(product)}
              style={{
                fontSize: "0.95rem",
                fontWeight: 900,
                textAlign: "center",
                lineHeight: "1.15rem",
                height: "2.3rem",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                marginTop: "6px",
                cursor: "pointer",
                textTransform: "uppercase",
                color: "var(--primary)",
              }}
            >
              {product.name}
            </h4>

            {/* Add to Cart Button */}
            <button
              onClick={() => addToCart(product, product.colors[0], product.sizes[0])}
              className="neo-button"
              style={{
                width: "100%",
                padding: "6px 10px",
                fontSize: "0.65rem",
                backgroundColor: "var(--primary-container)",
                boxShadow: "3px 3px 0px var(--primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingCart size={12} style={{ marginRight: "4px" }} />
              AÑADIR
            </button>
          </div>
        ))}
      </div>

      {/* NEO-BRUTALIST PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div
          style={{
            position: "fixed",
            top: 0, // Cover the header!
            left: 0,
            width: "100vw",
            height: "100vh", // Full screen
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 3000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "80px 16px 40px 16px",
            overflowY: "auto",
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="neo-card scanlines"
            style={{
              backgroundColor: "var(--background)",
              backgroundImage: selectedProduct.isFeatured 
                ? "repeating-linear-gradient(-45deg, rgba(204, 255, 0, 0.04) 0px, rgba(204, 255, 0, 0.04) 10px, transparent 10px, transparent 20px)" 
                : "none",
              border: selectedProduct.isFeatured ? "4px solid var(--primary-container)" : "4px solid var(--primary)",
              boxShadow: "10px 10px 0px var(--primary)",
              width: "100%",
              maxWidth: "760px",
              padding: "24px",
              position: "relative",
              transform: "rotate(0.5deg)",
              margin: "0 auto",
            }}
            onClick={(e) => e.stopPropagation()} // Prevent click-away
          >
            {/* Tilted Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
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
                  {selectedProduct.badge && (
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
                      {selectedProduct.badge}
                    </div>
                  )}

                  <img
                    src={activeImages[activeImgIndex] || selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {/* Carousel Navigation Arrows */}
                  {activeImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
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
                          backgroundColor: "var(--card-bg)",
                          border: "2px solid var(--primary)",
                          boxShadow: "2px 2px 0px var(--primary)",
                          cursor: "pointer",
                          zIndex: 5,
                        }}
                      >
                        ◀
                      </button>
                      <button
                        onClick={handleNextImage}
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
                          backgroundColor: "var(--card-bg)",
                          border: "2px solid var(--primary)",
                          boxShadow: "2px 2px 0px var(--primary)",
                          cursor: "pointer",
                          zIndex: 5,
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
                        padding: "2px 6px",
                        fontSize: "0.65rem",
                        fontWeight: 900,
                        boxShadow: "1px 1px 0px var(--primary)",
                      }}
                    >
                      {activeImgIndex + 1} / {activeImages.length}
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
                    {selectedProduct.price}
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
                      return (
                        <div
                          key={idx}
                          onClick={() => handleThumbnailSelect(idx)}
                          className="store-card-hover"
                          style={{
                            width: "44px",
                            height: "44px",
                            border: isActive ? "3px solid var(--primary-container)" : "2px solid var(--primary)",
                            boxShadow: isActive ? "2px 2px 0px var(--primary)" : "1px 1px 0px var(--primary)",
                            cursor: "pointer",
                            overflow: "hidden",
                            backgroundColor: "white",
                            transform: isActive ? "scale(1.05) rotate(-1deg)" : "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt="preview"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
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
                    {selectedProduct.name}
                  </h3>
                  <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--primary)" }}>
                    {selectedProduct.price}
                  </span>
                </div>

                {/* Description */}
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
                    {selectedProduct.description}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <h5 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "6px" }}>
                    Variantes / Colores:
                  </h5>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {selectedProduct.colors.map((color) => {
                      const isSelected = selectedColor === color;
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
                            boxShadow: isSelected ? "1px 1px 0px var(--primary)" : "2px 2px 0px var(--primary)",
                            transform: isSelected ? "translate(1px, 1px)" : "none",
                          }}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h5 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "6px" }}>
                    Tallas disponibles:
                  </h5>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {selectedProduct.sizes.map((size) => {
                      const isSelected = selectedSize === size;
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
                            boxShadow: isSelected ? "1px 1px 0px var(--primary)" : "2px 2px 0px var(--primary)",
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
                  onClick={() => setSpecsOpen(true)}
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
                    addToCart(selectedProduct, selectedColor, selectedSize);
                    setSelectedProduct(null);
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
      )}

      {/* NEO-BRUTALIST SPECIFICATIONS & SIZE GUIDE MODAL */}
      {isSpecsOpen && selectedProduct && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(5px)",
            zIndex: 3500, // superposed on top of details modal (3000)
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setSpecsOpen(false)}
        >
          <div
            className="neo-card scanlines"
            style={{
              backgroundColor: "var(--background)",
              border: "4px solid var(--primary)",
              boxShadow: "8px 8px 0px var(--primary)",
              width: "100%",
              maxWidth: "680px",
              padding: "24px",
              position: "relative",
              transform: "translateY(20px) rotate(-0.5deg)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing
          >
            {/* Specs Close Button */}
            <button
              onClick={() => setSpecsOpen(false)}
              style={{
                position: "absolute",
                top: "-12px",
                right: "12px",
                backgroundColor: "var(--error)",
                color: "white",
                border: "2px solid var(--primary)",
                boxShadow: "2px 2px 0px var(--primary)",
                padding: "3px 8px",
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "0.65rem",
                fontWeight: 900,
                cursor: "pointer",
                transform: "rotate(3deg)",
                zIndex: 10,
              }}
            >
              CERRAR X
            </button>

            {/* Header */}
            <div>
              <span
                style={{
                  backgroundColor: "var(--primary-container)",
                  border: "1.5px solid var(--primary)",
                  padding: "2px 6px",
                  fontSize: "0.55rem",
                  fontWeight: 900,
                  width: "max-content",
                  display: "block",
                  transform: "rotate(-1deg)",
                  marginBottom: "6px",
                }}
              >
                FICHA TÉCNICA Y TALLAS
              </span>
              <h4
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color: "var(--primary)",
                }}
              >
                {selectedProduct.name}
              </h4>
            </div>

            {/* Split layout: Sizing vs Technical Specs */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: "20px",
                width: "100%",
              }}
            >
              {/* Left Column: Sizing / Dimensions */}
              <div style={{ flex: "1 1 260px", minWidth: "260px" }}>
                {selectedProduct.id !== "4" ? (
                  /* TABLA DE MEDIDAS PARA ROPA */
                  <div>
                    <h5 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "6px" }}>
                      📏 Tabla de Medidas (Prenda plana):
                    </h5>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        border: "3px solid var(--primary)",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        textAlign: "center",
                        backgroundColor: "white",
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: "var(--primary-container)", borderBottom: "3px solid var(--primary)" }}>
                          <th style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>TALLA</th>
                          <th style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>ANCHO (cm)</th>
                          <th style={{ padding: "6px" }}>LARGO (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "2px solid var(--primary)" }}>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)", fontWeight: 900 }}>S</td>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>50 cm</td>
                          <td style={{ padding: "6px" }}>68 cm</td>
                        </tr>
                        <tr style={{ borderBottom: "2px solid var(--primary)" }}>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)", fontWeight: 900 }}>M</td>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>53 cm</td>
                          <td style={{ padding: "6px" }}>71 cm</td>
                        </tr>
                        <tr style={{ borderBottom: "2px solid var(--primary)" }}>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)", fontWeight: 900 }}>L</td>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>56 cm</td>
                          <td style={{ padding: "6px" }}>74 cm</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)", fontWeight: 900 }}>XL</td>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>60 cm</td>
                          <td style={{ padding: "6px" }}>77 cm</td>
                        </tr>
                      </tbody>
                    </table>
                    <p style={{ fontSize: "0.55rem", marginTop: "4px", color: "var(--secondary)" }}>
                      * Margen +/- 1.5 cm. Medidas de sisa a sisa.
                    </p>
                  </div>
                ) : (
                  /* DETALLES DE MEDIDA PARA STICKER PACK */
                  <div>
                    <h5 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "6px" }}>
                      📏 Dimensiones físicas:
                    </h5>
                    <div
                      style={{
                        border: "2px solid var(--primary)",
                        padding: "8px",
                        backgroundColor: "white",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div>• Sticker promedio: ~ 8.0 cm x 8.0 cm</div>
                      <div>• Formato de corte: Troquelado (Die-cut)</div>
                      <div>• Empaque: 10.0 x 15.0 cm en sobre kraft</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Technical Specs */}
              <div style={{ flex: "1 1 260px", minWidth: "260px" }}>
                <h5 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "6px" }}>
                  ⚙️ Especificaciones Técnicas:
                </h5>
                <div
                  style={{
                    border: "2px solid var(--primary)",
                    padding: "8px",
                    backgroundColor: "white",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {selectedProduct.id === "1" && (
                    <>
                      <div><strong>Composición:</strong> 100% Algodón Peinado premium</div>
                      <div><strong>Gramaje:</strong> 240 g/m² (Heavyweight)</div>
                      <div><strong>Estampado:</strong> Serigrafía textil de alta densidad</div>
                      <div><strong>Origen:</strong> Confeccionado artesanalmente local</div>
                    </>
                  )}
                  {selectedProduct.id === "2" && (
                    <>
                      <div><strong>Composición:</strong> 80% Algodón Peinado, 20% Poliéster</div>
                      <div><strong>Tejido:</strong> Felpa perchada ultra-suave</div>
                      <div><strong>Gramaje:</strong> 350 g/m² (Heavy hoodie)</div>
                      <div><strong>Capucha:</strong> Doble forro con cordón plano</div>
                    </>
                  )}
                  {selectedProduct.id === "3" && (
                    <>
                      <div><strong>Material:</strong> 100% Algodón Ripstop (Anti-desgarros)</div>
                      <div><strong>Gramaje:</strong> 260 g/m²</div>
                      <div><strong>Cintura:</strong> Elástica con cordón interior</div>
                      <div><strong>Bolsillos:</strong> 2 laterales con cierre, 1 posterior</div>
                    </>
                  )}
                  {selectedProduct.id === "4" && (
                    <>
                      <div><strong>Material:</strong> Vinilo adhesivo monomérico premium</div>
                      <div><strong>Espesor:</strong> 100 micras</div>
                      <div><strong>Protección:</strong> Laminado mate resistente a UV/lluvia</div>
                      <div><strong>Adhesivo:</strong> Acrílico permanente sin residuos</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* INSTRUCCIONES DE CUIDADO */}
            <div>
              <h5 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "4px" }}>
                🧼 Cuidado y Durabilidad:
              </h5>
              <p style={{ fontSize: "0.6rem", opacity: 0.9, lineHeight: "0.85rem" }}>
                {selectedProduct.id !== "4" 
                  ? "Lavar a máquina en ciclo suave con agua fría. Lavar al revés para proteger el estampado. No usar blanqueador. Secar colgado a la sombra. No planchar sobre el diseño."
                  : "Limpiar y secar la superficie antes de pegar. Apto para laptops, guitarras, patinetas, termos y automóviles. Resistente al agua."}
              </p>
            </div>

            {/* Aceptar / Volver */}
            <button
              onClick={() => setSpecsOpen(false)}
              className="neo-button"
              style={{
                backgroundColor: "var(--primary-container)",
                border: "2.5px solid var(--primary)",
                padding: "8px",
                fontSize: "0.7rem",
                fontWeight: 900,
                boxShadow: "2px 2px 0px var(--primary)",
                cursor: "pointer",
                textAlign: "center",
                width: "100%",
                marginTop: "4px",
              }}
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
