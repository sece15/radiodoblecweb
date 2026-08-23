"use client";

import React, { useState } from "react";
import { NeoModal } from "../common/NeoModal";
import { SponsorBusiness, updateSponsorDeliveryMode } from "@/services/sponsorService";
import { MessageCircle, MapPin, Tag, Sparkles, ExternalLink, Shield, Settings2, RefreshCw } from "lucide-react";
import { useAudio } from "@/hooks/useAudio";
import { isAdmin } from "@/lib/permissions";

interface BrandInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: SponsorBusiness | null;
  onOpenOrderModal?: (slug: string) => void;
}

export const BrandInfoModal: React.FC<BrandInfoModalProps> = ({
  isOpen,
  onClose,
  brand,
  onOpenOrderModal,
}) => {
  const { userProfile } = useAudio();
  const userIsAdmin = isAdmin(userProfile?.role || "");

  // Estado local para overrides de administración en tiempo real
  const [overrideDelivery, setOverrideDelivery] = useState<Record<string, boolean>>({});
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);

  if (!brand) return null;

  // Cálculo derivado puro (0 renders en cascada y sincronización inmediata)
  const hasDeliveryState =
    overrideDelivery[brand.id] !== undefined
      ? overrideDelivery[brand.id]
      : (brand.has_delivery ?? (brand.category === "comida" || brand.category === "bebidas"));

  const handleToggleDeliveryMode = async () => {
    if (!brand || isUpdatingDelivery) return;
    setIsUpdatingDelivery(true);
    const nextState = !hasDeliveryState;
    try {
      await updateSponsorDeliveryMode(brand.id, nextState);
      setOverrideDelivery((prev) => ({ ...prev, [brand.id]: nextState }));
    } catch (e) {
      console.error("Error al actualizar modo delivery:", e);
    } finally {
      setIsUpdatingDelivery(false);
    }
  };

  const handleWhatsAppChat = () => {
    const phone = brand.whatsapp_number.replace(/[^0-9]/g, "");
    const message = encodeURIComponent(
      `¡Hola *${brand.name}*! 👋 Los encontré a través de *Radio Doble C Online* y me gustaría consultar información sobre sus servicios y promociones.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const isFoodOrBeverage = hasDeliveryState;

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title={brand.name}
      badgeText="⚡ MARCA ALIADA OFICIAL"
      maxWidth="620px"
      backgroundColor="var(--background)"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", color: "var(--foreground)" }}>
        {/* Panel de Control Admin para la Marca */}
        {userIsAdmin && (
          <div
            className="neo-card"
            style={{
              backgroundColor: "var(--primary-container)",
              border: "2px solid var(--primary)",
              boxShadow: "3px 3px 0px var(--primary)",
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "var(--primary)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                <Shield size={14} style={{ color: "#BA1A1A" }} /> 🛡️ ADMIN: OPCIÓN DE AUSPICIO ({brand.name.split(" ")[0]})
              </span>
              <span style={{ fontSize: "0.58rem", fontWeight: 900, backgroundColor: "#BA1A1A", color: "#FFF", padding: "1px 6px", borderRadius: "3px" }}>
                MODO ADMIN
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                Tipo de Auspicio:{" "}
                <span style={{ fontWeight: 900, color: hasDeliveryState ? "#22c55e" : "#0066FF" }}>
                  {hasDeliveryState ? "🛵 PEDIDOS & DELIVERY ACTIVO" : "🏷️ SOLO VITRINA DE MARCA / SERVICIOS"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleDeliveryMode}
                disabled={isUpdatingDelivery}
                className="neo-button"
                style={{
                  padding: "5px 10px",
                  fontSize: "0.70rem",
                  fontWeight: 900,
                  backgroundColor: hasDeliveryState ? "#FF5500" : "#22c55e",
                  color: "#FFFFFF",
                  border: "2px solid var(--primary)",
                  boxShadow: "2px 2px 0px var(--primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {isUpdatingDelivery ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Settings2 size={13} />
                )}
                <span>
                  {hasDeliveryState ? "CAMBIAR A SOLO VITRINA" : "HABILITAR PEDIDOS DELIVERY"}
                </span>
              </button>
            </div>
            <div style={{ fontSize: "0.62rem", opacity: 0.85, color: "var(--foreground)" }}>
              💡 Al habilitar &quot;Pedidos &amp; Delivery&quot;, la marca aparecerá en el carrito de compras y acordeón de pedidos. Al dejarlo en &quot;Solo Vitrina&quot;, se presentará con su bio y contacto.
            </div>
          </div>
        )}

        {/* Cabecera Principal de la Marca */}
        <div
          className="neo-card"
          style={{
            backgroundColor: "var(--surface-container, var(--card-bg))",
            border: "2.5px solid var(--primary)",
            boxShadow: "3px 3px 0px var(--primary)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "10px",
            position: "relative",
          }}
        >
          {/* Logo Central Circular */}
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              backgroundColor: "#000000",
              border: "3px solid var(--primary)",
              boxShadow: "3px 3px 0px var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: brand.slug === "mikaja" ? "12px" : "6px",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            <img
              src={brand.logo_url || "/RADIO.png"}
              alt={brand.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: brand.slug === "doble-c" ? "translateY(-6px)" : "none",
              }}
            />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  margin: 0,
                  color: "var(--foreground)",
                }}
              >
                {brand.name}
              </h2>
            </div>
            <p
              style={{
                fontSize: "0.80rem",
                fontWeight: 700,
                color: "var(--foreground)",
                opacity: 0.85,
                margin: "4px 0 0",
              }}
            >
              {brand.tagline}
            </p>
            {brand.address && (
              <p
                style={{
                  fontSize: "0.72rem",
                  opacity: 0.75,
                  margin: "4px 0 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  color: "var(--foreground)",
                }}
              >
                <MapPin size={12} style={{ color: "#BA1A1A" }} /> {brand.address}
              </p>
            )}
          </div>

          {/* Badge de Beneficios para Oyentes */}
          <div
            style={{
              backgroundColor: "var(--primary-container)",
              color: "var(--primary, #000)",
              fontWeight: 900,
              fontSize: "0.76rem",
              padding: "4px 12px",
              border: "2px solid var(--primary)",
              boxShadow: "2px 2px 0px var(--primary)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "4px",
              marginTop: "2px",
            }}
          >
            <Tag size={13} />
            <span>BENEFICIOS EXCLUSIVOS: PRÓXIMAMENTE ⚡</span>
          </div>
        </div>

        {/* Descripción / Historia de la Marca */}
        {brand.about && (
          <div
            className="neo-card"
            style={{
              backgroundColor: "var(--surface-container, var(--card-bg))",
              border: "2px solid var(--primary)",
              boxShadow: "2.5px 2.5px 0px var(--primary)",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: "0.76rem",
                fontWeight: 900,
                textTransform: "uppercase",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Sparkles size={13} style={{ color: "#BA1A1A" }} /> ACERCA DE LA MARCA
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: "0.78rem",
                lineHeight: "1.5",
                color: "var(--foreground)",
                opacity: 0.9,
              }}
            >
              {brand.about}
            </p>
          </div>
        )}

        {/* Catálogo de Servicios / Productos Principales */}
        {brand.menu_items && brand.menu_items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h4
              style={{
                margin: 0,
                fontSize: "0.74rem",
                fontWeight: 900,
                textTransform: "uppercase",
                color: "var(--foreground)",
                letterSpacing: "0.5px",
              }}
            >
              📦 SERVICIOS &amp; PRODUCTOS DESTACADOS:
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {brand.menu_items.map((item) => (
                <div
                  key={item.id}
                  className="neo-card"
                  style={{
                    backgroundColor: "var(--surface-container, var(--card-bg))",
                    border: "1.5px solid var(--primary)",
                    boxShadow: "1.5px 1.5px 0px var(--primary)",
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "1.05rem" }}>{item.icon || "✨"}</span>
                      <strong style={{ fontSize: "0.78rem", fontWeight: 900, color: "var(--foreground)" }}>
                        {item.name}
                      </strong>
                    </div>
                    {item.description && (
                      <p style={{ margin: "2px 0 0", fontSize: "0.68rem", opacity: 0.8, color: "var(--foreground)" }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 900,
                      color: "#BA1A1A",
                      backgroundColor: "var(--primary-container)",
                      padding: "3px 8px",
                      border: "1.5px solid var(--primary)",
                      boxShadow: "1.5px 1.5px 0px var(--primary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    S/ {item.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
          <button
            type="button"
            onClick={handleWhatsAppChat}
            className="neo-button"
            style={{
              flex: 1,
              backgroundColor: "#25D366",
              color: "#FFFFFF",
              fontWeight: 900,
              padding: "11px",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              border: "2.5px solid var(--primary)",
              boxShadow: "3px 3px 0px var(--primary)",
              cursor: "pointer",
              textTransform: "uppercase",
              minWidth: "180px",
            }}
          >
            <MessageCircle size={17} />
            <span>CONTACTAR POR WHATSAPP</span>
          </button>

          {brand.play_store_url && (
            <a
              href={brand.play_store_url}
              target="_blank"
              rel="noreferrer"
              className="neo-button"
              style={{
                backgroundColor: "#000000",
                color: "#CCFF00",
                fontWeight: 900,
                padding: "11px 16px",
                fontSize: "0.80rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                border: "2.5px solid var(--primary)",
                boxShadow: "3px 3px 0px var(--primary)",
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              <span>📲 DESCARGAR EN GOOGLE PLAY</span>
              <ExternalLink size={14} />
            </a>
          )}

          {isFoodOrBeverage && onOpenOrderModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOrderModal(brand.slug);
              }}
              className="neo-button"
              style={{
                backgroundColor: "var(--primary-container)",
                color: "var(--primary, #000)",
                fontWeight: 900,
                padding: "11px 16px",
                fontSize: "0.80rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                border: "2.5px solid var(--primary)",
                boxShadow: "3px 3px 0px var(--primary)",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              <span>PEDIDO DELIVERY</span>
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>
    </NeoModal>
  );
};
