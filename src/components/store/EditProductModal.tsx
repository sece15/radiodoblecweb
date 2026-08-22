"use client";

import { useState, FormEvent } from "react";
import { Check } from "lucide-react";
import { NeoModal } from "../common/NeoModal";
import { Product } from "@/types";
import { UpdateProductInput } from "@/services/productService";
import { sanitizePriceInput, formatPrice, parsePrice } from "@/lib/priceUtils";

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSubmit: (input: UpdateProductInput) => Promise<void>;
  isSubmitting: boolean;
}

interface EditProductFormProps {
  product: Product;
  onClose: () => void;
  onSubmit: (input: UpdateProductInput) => Promise<void>;
  isSubmitting: boolean;
}

const EditProductForm = ({
  product,
  onClose,
  onSubmit,
  isSubmitting,
}: EditProductFormProps) => {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(
    parsePrice(product.price).toString()
  );
  const [desc, setDesc] = useState(product.description || "");
  const [specs, setSpecs] = useState(product.specs || "");
  const [care, setCare] = useState(product.careInstructions || "");
  const [colors, setColors] = useState(product.colors.join(", "));
  const [sizes, setSizes] = useState<string[]>(
    product.sizes && product.sizes.length > 0 ? product.sizes : ["S", "M", "L", "XL"]
  );
  const [badge, setBadge] = useState(product.badge || "");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleToggleSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleAddColorChip = (colorName: string) => {
    setColors((prev) => {
      const list = prev
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!list.includes(colorName)) {
        return list.length > 0 ? `${prev}, ${colorName}` : colorName;
      }
      return prev;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const colorsArr = colors
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);

      await onSubmit({
        id: product.id,
        name,
        price: formatPrice(price),
        description: desc,
        badge,
        sizes: sizes.length > 0 ? sizes : ["S", "M", "L", "XL"],
        colors: colorsArr.length > 0 ? colorsArr : undefined,
        specs,
        careInstructions: care,
        variantImages: product.variantImages,
        imageUrl: product.imageUrl,
      });

      setSuccessMsg("¡Prenda actualizada con éxito!");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert(`Error al actualizar: ${msg}`);
    }
  };

  if (successMsg) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "20px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            backgroundColor: "var(--primary-container)",
            border: "3px solid var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={28} style={{ color: "var(--primary)" }} />
        </div>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 900,
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          ¡ACTUALIZADO!
        </h3>
        <p style={{ fontSize: "0.75rem", fontWeight: "bold", opacity: 0.85, margin: 0 }}>
          {successMsg}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        textAlign: "left",
      }}
    >
      {/* Nombre */}
      <div>
        <label
          style={{
            fontSize: "0.7rem",
            fontWeight: 900,
            textTransform: "uppercase",
            display: "block",
            marginBottom: "4px",
          }}
        >
          NOMBRE *
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="neo-input"
          style={{
            width: "100%",
            padding: "8px 10px",
            fontSize: "0.75rem",
            border: "2px solid var(--primary)",
            fontWeight: "bold",
            backgroundColor: "white",
          }}
        />
      </div>

      {/* Precio & Badge */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label
            style={{
              fontSize: "0.7rem",
              fontWeight: 900,
              textTransform: "uppercase",
              display: "block",
              marginBottom: "4px",
            }}
          >
            PRECIO (S/.) *
          </label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--primary-container)",
                border: "2px solid var(--primary)",
                borderRight: "none",
                fontWeight: 900,
                fontSize: "0.8rem",
                color: "var(--primary)",
              }}
            >
              S/.
            </span>
            <input
              type="text"
              inputMode="decimal"
              required
              value={price}
              onChange={(e) => setPrice(sanitizePriceInput(e.target.value))}
              placeholder="129.90"
              className="neo-input"
              style={{
                flex: 1,
                padding: "8px 10px",
                fontSize: "0.75rem",
                border: "2px solid var(--primary)",
                fontWeight: "bold",
                backgroundColor: "white",
              }}
            />
          </div>
        </div>
        <div>
          <label
            style={{
              fontSize: "0.7rem",
              fontWeight: 900,
              textTransform: "uppercase",
              display: "block",
              marginBottom: "4px",
            }}
          >
            BADGE
          </label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="🔥 EXCLUSIVO"
            className="neo-input"
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: "0.75rem",
              border: "2px solid var(--primary)",
              fontWeight: "bold",
              backgroundColor: "white",
            }}
          />
        </div>
      </div>

      {/* Tallas */}
      <div>
        <label
          style={{
            fontSize: "0.7rem",
            fontWeight: 900,
            textTransform: "uppercase",
            display: "block",
            marginBottom: "4px",
          }}
        >
          TALLAS
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {["S", "M", "L", "XL", "XXL", "ÚNICA"].map((size) => {
            const isSel = sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleToggleSize(size)}
                style={{
                  padding: "4px 10px",
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  border: "2px solid var(--primary)",
                  backgroundColor: isSel ? "var(--primary-container)" : "white",
                  color: "var(--primary)",
                  cursor: "pointer",
                  boxShadow: isSel ? "2px 2px 0px var(--primary)" : "none",
                }}
              >
                {size} {isSel ? "✓" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colores */}
      <div>
        <label
          style={{
            fontSize: "0.7rem",
            fontWeight: 900,
            textTransform: "uppercase",
            display: "block",
            marginBottom: "4px",
          }}
        >
          COLORES / VARIANTES
        </label>
        <input
          type="text"
          value={colors}
          onChange={(e) => setColors(e.target.value)}
          placeholder="MORADO, PARTE DE ATRÁS, VISTA LATERAL"
          className="neo-input"
          style={{
            width: "100%",
            padding: "8px 10px",
            fontSize: "0.75rem",
            border: "2px solid var(--primary)",
            fontWeight: "bold",
            backgroundColor: "white",
          }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
          {[
            "VISTA FRONTAL",
            "PARTE DE ATRÁS",
            "VISTA LATERAL",
            "MORADO",
            "NEGRO",
            "BLANCO",
            "GRIS",
            "AZUL",
            "ROJO",
          ].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleAddColorChip(c)}
              style={{
                padding: "2px 8px",
                fontSize: "0.6rem",
                fontWeight: 800,
                border: "1px solid var(--primary)",
                backgroundColor: "white",
                color: "var(--primary)",
                cursor: "pointer",
                borderRadius: "2px",
              }}
            >
              + {c}
            </button>
          ))}
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label
          style={{
            fontSize: "0.7rem",
            fontWeight: 900,
            textTransform: "uppercase",
            display: "block",
            marginBottom: "4px",
          }}
        >
          DESCRIPCIÓN
        </label>
        <textarea
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Descripción de la prenda..."
          className="neo-input"
          style={{
            width: "100%",
            padding: "8px 10px",
            fontSize: "0.75rem",
            border: "2px solid var(--primary)",
            fontWeight: "500",
            backgroundColor: "white",
            resize: "vertical",
          }}
        />
      </div>

      {/* Especificaciones técnicas */}
      <div>
        <label
          style={{
            fontSize: "0.7rem",
            fontWeight: 900,
            textTransform: "uppercase",
            display: "block",
            marginBottom: "4px",
          }}
        >
          ⚙️ ESPECIFICACIONES TÉCNICAS
        </label>
        <textarea
          rows={3}
          value={specs}
          onChange={(e) => setSpecs(e.target.value)}
          placeholder={"Composición: 100% Algodón Peinado premium\nGramaje: 240 g/m²"}
          className="neo-input"
          style={{
            width: "100%",
            padding: "8px 10px",
            fontSize: "0.75rem",
            border: "2px solid var(--primary)",
            fontWeight: "500",
            backgroundColor: "white",
            resize: "vertical",
          }}
        />
      </div>

      {/* Instrucciones de cuidado */}
      <div>
        <label
          style={{
            fontSize: "0.7rem",
            fontWeight: 900,
            textTransform: "uppercase",
            display: "block",
            marginBottom: "4px",
          }}
        >
          🧼 INSTRUCCIONES DE CUIDADO
        </label>
        <textarea
          rows={2}
          value={care}
          onChange={(e) => setCare(e.target.value)}
          placeholder={
            "Lavar a máquina en ciclo suave con agua fría.\nNo usar blanqueador."
          }
          className="neo-input"
          style={{
            width: "100%",
            padding: "8px 10px",
            fontSize: "0.75rem",
            border: "2px solid var(--primary)",
            fontWeight: "500",
            backgroundColor: "white",
            resize: "vertical",
          }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="neo-button fun-hover-wobble"
        style={{
          backgroundColor: isSubmitting ? "var(--surface-container)" : "#1A6BB5",
          color: "white",
          border: "3px solid var(--primary)",
          padding: "10px",
          fontSize: "0.75rem",
          fontWeight: 900,
          boxShadow: "3px 3px 0px var(--primary)",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginTop: "6px",
        }}
      >
        {isSubmitting ? "GUARDANDO CAMBIOS..." : "GUARDAR CAMBIOS ✓"}
      </button>
    </form>
  );
};

export const EditProductModal = ({
  isOpen,
  product,
  onClose,
  onSubmit,
  isSubmitting,
}: EditProductModalProps) => {
  if (!isOpen || !product) return null;

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title={`EDITAR: ${product.name}`}
      badgeText="✏️ EDICIÓN (ADMIN)"
      maxWidth="500px"
      backgroundColor="var(--background)"
    >
      <EditProductForm
        key={product.id}
        product={product}
        onClose={onClose}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </NeoModal>
  );
};
