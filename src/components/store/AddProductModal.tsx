"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { Upload, Image as ImageIcon, Check } from "lucide-react";
import { NeoModal } from "../common/NeoModal";
import { CreateProductInput } from "@/services/productService";
import { sanitizePriceInput, formatPrice } from "@/lib/priceUtils";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProductInput) => Promise<void>;
  isSubmitting: boolean;
}

const DEFAULT_SMART_LABELS = [
  "VISTA FRONTAL",
  "PARTE DE ATRÁS",
  "VISTA LATERAL",
  "DETALLE",
  "ETIQUETA",
];

export const AddProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: AddProductModalProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [specs, setSpecs] = useState("");
  const [care, setCare] = useState("");
  const [badge, setBadge] = useState("🔥 NUEVO INGRESO");
  const [sizes, setSizes] = useState<string[]>(["S", "M", "L", "XL"]);
  const [colors, setColors] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageLabels, setImageLabels] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const addedFiles = Array.from(files);
      const currentCount = imageFiles.length;
      setImageFiles((prev) => [...prev, ...addedFiles]);
      const newPreviews = addedFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
      const newLabels = addedFiles.map(
        (_, i) =>
          DEFAULT_SMART_LABELS[currentCount + i] ||
          `VISTA ${currentCount + i + 1}`
      );
      setImageLabels((prev) => [...prev, ...newLabels]);
    }
  };

  const handleUpdateImageLabel = (index: number, label: string) => {
    setImageLabels((prev) => {
      const updated = [...prev];
      updated[index] = label;
      return updated;
    });
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageLabels((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleAddColorChip = (colorName: string) => {
    setColors((prev) => {
      const currentList = prev
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!currentList.includes(colorName)) {
        return currentList.length > 0 ? `${prev}, ${colorName}` : colorName;
      }
      return prev;
    });
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setDesc("");
    setSpecs("");
    setCare("");
    setColors("");
    setImageFiles([]);
    setImagePreviews([]);
    setImageLabels([]);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim() || imageFiles.length === 0) {
      alert("Por favor completa el nombre, precio y sube al menos una foto de la prenda.");
      return;
    }

    try {
      const colorsArr = colors
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);

      await onSubmit({
        name,
        price: formatPrice(price),
        description: desc,
        imageFiles,
        imageLabels,
        badge,
        sizes: sizes.length > 0 ? sizes : ["ÚNICA"],
        colors: colorsArr.length > 0 ? colorsArr : undefined,
        specs: specs.trim() || undefined,
        careInstructions: care.trim() || undefined,
      });

      setSuccessMsg(`¡Prenda "${name}" guardada con éxito!`);
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert(`Error al agregar producto: ${msg}`);
    }
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          resetForm();
          onClose();
        }
      }}
      title="AGREGAR PRENDA A LA TIENDA"
      badgeText="⚡ PANEL DE ADMINISTRADOR"
      maxWidth="500px"
      backgroundColor="var(--background)"
    >
      {successMsg ? (
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
            ¡PRENDA AGREGADA CON ÉXITO!
          </h3>
          <p style={{ fontSize: "0.75rem", fontWeight: "bold", opacity: 0.85, margin: 0 }}>
            {successMsg}
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            textAlign: "left",
          }}
        >
          {/* Fotos de la prenda / Multi-Uploader con nombres de vistas */}
          <div>
            <label
              style={{
                fontSize: "0.7rem",
                fontWeight: 900,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "4px",
              }}
            >
              <ImageIcon size={14} /> FOTOS Y VISTAS ({imagePreviews.length}) *
            </label>

            {imagePreviews.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    padding: "8px",
                    border: "2px solid var(--primary)",
                    backgroundColor: "white",
                    borderRadius: "4px",
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {imagePreviews.map((previewUrl, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "6px",
                        border: idx === 0 ? "2px solid var(--primary)" : "1px solid #ddd",
                        backgroundColor: idx === 0 ? "rgba(186, 26, 26, 0.04)" : "#fafafa",
                        borderRadius: "4px",
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          position: "relative",
                          width: "55px",
                          height: "55px",
                          borderRadius: "4px",
                          overflow: "hidden",
                          border: "1.5px solid var(--primary)",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={previewUrl}
                          alt={`Foto ${idx + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor:
                              idx === 0 ? "var(--primary-container)" : "rgba(0,0,0,0.7)",
                            color: idx === 0 ? "var(--primary)" : "white",
                            fontSize: "0.45rem",
                            fontWeight: 900,
                            textAlign: "center",
                            padding: "1px 0",
                          }}
                        >
                          #{idx + 1}
                        </div>
                      </div>

                      {/* Editable label & quick presets */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span style={{ fontSize: "0.6rem", fontWeight: 900, opacity: 0.8 }}>
                          {idx === 0
                            ? "FOTO 1 (PORTADA / COLOR)"
                            : `FOTO ${idx + 1} (VISTA / VARIANTE)`}
                          :
                        </span>
                        <input
                          type="text"
                          value={imageLabels[idx] || ""}
                          onChange={(e) => handleUpdateImageLabel(idx, e.target.value)}
                          placeholder="Ej. MORADO, PARTE DE ATRÁS, VISTA LATERAL"
                          className="neo-input"
                          style={{
                            width: "100%",
                            padding: "4px 8px",
                            fontSize: "0.7rem",
                            fontWeight: "bold",
                            border: "1.5px solid var(--primary)",
                            backgroundColor: "white",
                          }}
                        />
                        {/* Quick label chips */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {[
                            "MORADO",
                            "VISTA FRONTAL",
                            "PARTE DE ATRÁS",
                            "VISTA LATERAL",
                            "DETALLE",
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleUpdateImageLabel(idx, preset)}
                              style={{
                                padding: "2px 6px",
                                fontSize: "0.55rem",
                                fontWeight: 800,
                                border: "1px solid #999",
                                backgroundColor:
                                  imageLabels[idx] === preset
                                    ? "var(--primary-container)"
                                    : "white",
                                color:
                                  imageLabels[idx] === preset ? "var(--primary)" : "#333",
                                cursor: "pointer",
                                borderRadius: "2px",
                              }}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          backgroundColor: "#BA1A1A",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          width: "24px",
                          height: "24px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                        title="Eliminar esta foto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Botón para agregar más imágenes */}
                <label
                  style={{
                    border: "2px dashed var(--primary)",
                    borderRadius: "4px",
                    padding: "8px",
                    textAlign: "center",
                    backgroundColor: "rgba(0,0,0,0.02)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                  }}
                >
                  <Upload size={16} /> AGREGAR MÁS FOTOS / VISTAS
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            ) : (
              <div
                style={{
                  border: "2px dashed var(--primary)",
                  borderRadius: "4px",
                  padding: "16px",
                  textAlign: "center",
                  backgroundColor: "rgba(0,0,0,0.02)",
                  cursor: "pointer",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Upload size={28} style={{ color: "var(--primary)", opacity: 0.7 }} />
                <span style={{ fontSize: "0.65rem", fontWeight: 800 }}>
                  HAZ CLICK PARA SELECCIONAR FOTOS (PUEDES ELEGIR VARIAS)
                </span>
                <span style={{ fontSize: "0.55rem", opacity: 0.7 }}>
                  PNG, JPG, WEBP • Puedes nombrar cada vista o color individualmente
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                />
              </div>
            )}
          </div>

          {/* Nombre de la prenda */}
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
              NOMBRE DE LA PRENDA *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="EJ. POLERA DOBLE C OVERSIZE MORADA"
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
                BADGE / ETIQUETA
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="EJ. 🔥 EXCLUSIVO"
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

          {/* Tallas disponibles */}
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
              TALLAS DISPONIBLES
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {["S", "M", "L", "XL", "XXL", "ÚNICA"].map((size) => {
                const isSelected = sizes.includes(size);
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
                      backgroundColor: isSelected ? "var(--primary-container)" : "white",
                      color: "var(--primary)",
                      cursor: "pointer",
                      boxShadow: isSelected ? "2px 2px 0px var(--primary)" : "none",
                    }}
                  >
                    {size} {isSelected ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colores / Variantes */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <label
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                COLORES / VARIANTES (OPCIONAL)
              </label>
              <span style={{ fontSize: "0.55rem", opacity: 0.7, fontWeight: "bold" }}>
                💡 Si lo dejas vacío, se usarán los nombres de tus fotos
              </span>
            </div>
            <input
              type="text"
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              placeholder="EJ. MORADO, PARTE DE ATRÁS, VISTA LATERAL"
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
            {/* Sugerencias rápidas */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
              {["MORADO", "PARTE DE ATRÁS", "VISTA LATERAL", "NEGRO", "BLANCO", "GRIS", "AZUL"].map(
                (c) => (
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
                )
              )}
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
              placeholder="Algodón reactivo 100% pesado, estampado de alta durabilidad..."
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

          {/* Especificaciones Técnicas */}
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
              ⚙️ ESPECIFICACIONES TÉCNICAS (OPCIONAL)
            </label>
            <textarea
              rows={3}
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              placeholder={
                "Composición: 100% Algodón Peinado premium\nGramaje: 240 g/m²\nEstampado: Serigrafía textil"
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

          {/* Instrucciones de Cuidado */}
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
              🧼 INSTRUCCIONES DE CUIDADO (OPCIONAL)
            </label>
            <textarea
              rows={2}
              value={care}
              onChange={(e) => setCare(e.target.value)}
              placeholder={
                "Lavar a máquina en ciclo suave con agua fría.\nNo usar blanqueador. Secar colgado."
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="neo-button fun-hover-wobble"
            style={{
              backgroundColor: isSubmitting
                ? "var(--surface-container)"
                : "var(--primary-container)",
              color: "var(--primary)",
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
            {isSubmitting
              ? "SUBIENDO PRENDA Y FOTOS..."
              : "GUARDAR PRENDA EN LA TIENDA ⚡"}
          </button>
        </form>
      )}
    </NeoModal>
  );
};
