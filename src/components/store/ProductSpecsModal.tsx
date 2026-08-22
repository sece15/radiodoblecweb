"use client";

import { Product } from "@/types";

interface ProductSpecsModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

export const ProductSpecsModal = ({
  isOpen,
  product,
  onClose,
}: ProductSpecsModalProps) => {
  if (!isOpen || !product) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(5px)",
        zIndex: 3500, // superposed on top of details modal
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
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
          onClick={onClose}
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
            {product.name}
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
            {product.id !== "4" ? (
              /* TABLA DE MEDIDAS PARA ROPA */
              <div>
                <h5
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
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
                    <tr
                      style={{
                        backgroundColor: "var(--primary-container)",
                        borderBottom: "3px solid var(--primary)",
                      }}
                    >
                      <th style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>
                        TALLA
                      </th>
                      <th style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>
                        ANCHO (cm)
                      </th>
                      <th style={{ padding: "6px" }}>LARGO (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "2px solid var(--primary)" }}>
                      <td
                        style={{
                          padding: "6px",
                          borderRight: "2px solid var(--primary)",
                          fontWeight: 900,
                        }}
                      >
                        S
                      </td>
                      <td style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>
                        50 cm
                      </td>
                      <td style={{ padding: "6px" }}>68 cm</td>
                    </tr>
                    <tr style={{ borderBottom: "2px solid var(--primary)" }}>
                      <td
                        style={{
                          padding: "6px",
                          borderRight: "2px solid var(--primary)",
                          fontWeight: 900,
                        }}
                      >
                        M
                      </td>
                      <td style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>
                        53 cm
                      </td>
                      <td style={{ padding: "6px" }}>71 cm</td>
                    </tr>
                    <tr style={{ borderBottom: "2px solid var(--primary)" }}>
                      <td
                        style={{
                          padding: "6px",
                          borderRight: "2px solid var(--primary)",
                          fontWeight: 900,
                        }}
                      >
                        L
                      </td>
                      <td style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>
                        56 cm
                      </td>
                      <td style={{ padding: "6px" }}>74 cm</td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "6px",
                          borderRight: "2px solid var(--primary)",
                          fontWeight: 900,
                        }}
                      >
                        XL
                      </td>
                      <td style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>
                        60 cm
                      </td>
                      <td style={{ padding: "6px" }}>77 cm</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ fontSize: "0.55rem", marginTop: "4px", color: "var(--secondary)" }}>
                  * Margen +/- 1.5 cm. Medidas de sisa a sisa.
                </p>
              </div>
            ) : (
              /* DETALLES DE MEDIDA PARA ACCESORIOS */
              <div>
                <h5
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
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
                  <div>• Ajuste estándar: ~ 8.0 cm x 8.0 cm</div>
                  <div>• Formato de corte: Troquelado reforzado</div>
                  <div>• Empaque: Edición Especial Radio Doble C</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Technical Specs */}
          <div style={{ flex: "1 1 260px", minWidth: "260px" }}>
            <h5
              style={{
                fontSize: "0.7rem",
                fontWeight: 900,
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
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
                whiteSpace: "pre-line",
              }}
            >
              {product.specs ? (
                product.specs
              ) : (
                <span style={{ opacity: 0.5 }}>Sin especificaciones cargadas.</span>
              )}
            </div>
          </div>
        </div>

        {/* INSTRUCCIONES DE CUIDADO */}
        <div>
          <h5
            style={{
              fontSize: "0.7rem",
              fontWeight: 900,
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            🧼 Cuidado y Durabilidad:
          </h5>
          <p
            style={{
              fontSize: "0.6rem",
              opacity: 0.9,
              lineHeight: "0.85rem",
              whiteSpace: "pre-line",
            }}
          >
            {product.careInstructions
              ? product.careInstructions
              : "Lavar a máquina en ciclo suave con agua fría. Lavar al revés para proteger el estampado. No usar blanqueador. Secar colgado a la sombra. No planchar sobre el diseño."}
          </p>
        </div>

        {/* Aceptar / Volver */}
        <button
          onClick={onClose}
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
  );
};
