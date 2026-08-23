"use client";

import React, { useState, useEffect, useMemo } from "react";
import { NeoModal } from "../common/NeoModal";
import { useAudio } from "@/hooks/useAudio";
import { isAdmin } from "@/lib/permissions";
import {
  SponsorBusiness,
  SponsorMenuItem,
  SponsorOrderItem,
  fetchSponsorBusinesses,
  submitSponsorOrder,
  buildSponsorWhatsAppUrl,
  updateSponsorWhatsApp,
  INITIAL_SPONSORS,
} from "@/services/sponsorService";
import {
  ShoppingBag,
  Coffee,
  Pizza,
  Plus,
  Minus,
  Send,
  CheckCircle,
  MapPin,
  Phone,
  User,
  Tag,
  Sparkles,
  Shield,
  Save,
  Check,
  MessageCircle,
} from "lucide-react";

interface SponsorOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSponsorSlug?: string;
  userName?: string;
}

export const SponsorOrderModal: React.FC<SponsorOrderModalProps> = ({
  isOpen,
  onClose,
  initialSponsorSlug = "ponches",
  userName = "",
}) => {
  const { userProfile } = useAudio();
  const userIsAdmin = isAdmin(userProfile?.role || "");

  const [sponsors, setSponsors] = useState<SponsorBusiness[]>(INITIAL_SPONSORS);
  const [selectedSponsorIdOverride, setSelectedSponsorIdOverride] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup" | "reservation">("delivery");
  const [customerName, setCustomerName] = useState(userProfile?.name || userName || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string>("");

  // Estado Admin para personalizar número de WhatsApp por auspiciador
  const [adminPhoneOverrides, setAdminPhoneOverrides] = useState<Record<string, string>>({});
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneSavedSuccess, setPhoneSavedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchSponsorBusinesses().then((data) => {
      if (isMounted && data && data.length > 0) {
        setSponsors(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Solo marcas con servicio de pedidos y delivery (Comida y Bebidas)
  const deliverySponsors = useMemo(() => {
    const filtered = sponsors.filter((s) => s.category === "comida" || s.category === "bebidas");
    return filtered.length > 0 ? filtered : sponsors;
  }, [sponsors]);

  // Cálculo puramente derivado (sin useEffect ni renders en cascada)
  const currentSponsor = useMemo(() => {
    if (selectedSponsorIdOverride) {
      const found = deliverySponsors.find((s) => s.id === selectedSponsorIdOverride);
      if (found) return found;
    }
    if (initialSponsorSlug) {
      const foundBySlug = deliverySponsors.find((s) => s.slug === initialSponsorSlug);
      if (foundBySlug) return foundBySlug;
    }
    return deliverySponsors[0] || INITIAL_SPONSORS[0];
  }, [deliverySponsors, selectedSponsorIdOverride, initialSponsorSlug]);

  const currentAdminPhone = adminPhoneOverrides[currentSponsor?.id] ?? currentSponsor?.whatsapp_number ?? "";

  const handleUpdateQuantity = (item: SponsorMenuItem, delta: number) => {
    setCart((prev) => {
      const curr = prev[item.id] || 0;
      const next = Math.max(0, curr + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return { ...prev, [item.id]: next };
    });
  };

  const { subtotal, discount, total, orderItems } = useMemo(() => {
    if (!currentSponsor) {
      return { subtotal: 0, discount: 0, total: 0, orderItems: [] };
    }

    let sub = 0;
    const items: SponsorOrderItem[] = [];

    (currentSponsor.menu_items || []).forEach((item) => {
      const qty = cart[item.id] || 0;
      if (qty > 0) {
        sub += item.price * qty;
        items.push({
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity: qty,
        });
      }
    });

    const discPercent = currentSponsor.discount_percent || 0;
    const disc = sub > 0 ? (sub * discPercent) / 100 : 0;
    const tot = Math.max(0, sub - disc);

    return { subtotal: sub, discount: disc, total: tot, orderItems: items };
  }, [currentSponsor, cart]);

  const handleSaveSponsorPhone = async () => {
    if (!currentAdminPhone.trim()) {
      alert("⚠️ Ingresa un número de WhatsApp válido.");
      return;
    }

    setIsSavingPhone(true);
    try {
      const ok = await updateSponsorWhatsApp(currentSponsor.id, currentAdminPhone.trim());
      if (ok) {
        setSponsors((prev) =>
          prev.map((s) =>
            s.id === currentSponsor.id ? { ...s, whatsapp_number: currentAdminPhone.trim() } : s
          )
        );
        setPhoneSavedSuccess(true);
        setTimeout(() => setPhoneSavedSuccess(false), 3000);
      } else {
        alert("⚠️ No se pudo guardar en la base de datos (verifica permisos).");
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar número de auspiciador.");
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleDirectWhatsAppChat = () => {
    if (!currentSponsor) return;
    const phone = userIsAdmin && currentAdminPhone.trim() ? currentAdminPhone.trim() : currentSponsor.whatsapp_number;
    const message = encodeURIComponent(
      `¡Hola *${currentSponsor.name}*! 👋 Los escucho a través de *Radio Doble C Online* y me gustaría hacer una consulta sobre sus servicios y productos.`
    );
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${message}`;
    window.open(url, "_blank");
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert("⚠️ Selecciona al menos un producto para realizar tu pedido.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("⚠️ Por favor completa tu nombre y teléfono para el contacto.");
      return;
    }
    if (deliveryType === "delivery" && !address.trim()) {
      alert("⚠️ Por favor ingresa tu dirección de entrega para el delivery.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        sponsorId: currentSponsor.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryType,
        address: deliveryType === "delivery" ? address.trim() : undefined,
        items: orderItems,
        subtotal,
        discount,
        total,
        notes: notes.trim() || undefined,
      };

      await submitSponsorOrder(orderPayload);
      const effectivePhone = userIsAdmin && currentAdminPhone.trim() ? currentAdminPhone.trim() : currentSponsor.whatsapp_number;
      const waUrl = buildSponsorWhatsAppUrl(currentSponsor, orderPayload, effectivePhone);
      setLastWhatsAppUrl(waUrl);
      setOrderCompleted(true);
      window.open(waUrl, "_blank");
    } catch (err) {
      console.error("Error al procesar pedido:", err);
      alert("Hubo un error al registrar el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOrder = () => {
    setCart({});
    setOrderCompleted(false);
    setNotes("");
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={() => {
        setSelectedSponsorIdOverride(null);
        onClose();
      }}
      title="PEDIDOS & AUSPICIADORES AL AIRE"
      badgeText="🍵 BENEFICIO OYENTES"
      maxWidth="680px"
      backgroundColor="var(--background)"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: "var(--foreground)" }}>
        {/* Selector de Negocios Auspiciadores con Delivery */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "2px" }}>
          {deliverySponsors.map((s) => {
            const isSelected = s.id === currentSponsor.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSponsorIdOverride(s.id);
                  setCart({});
                  setOrderCompleted(false);
                }}
                className="neo-button"
                style={{
                  padding: "8px 14px",
                  fontSize: "0.74rem",
                  fontWeight: 900,
                  backgroundColor: isSelected ? "var(--primary-container)" : "var(--surface-container, var(--card-bg))",
                  color: isSelected ? "var(--primary, #000)" : "var(--foreground)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "2px solid var(--primary)",
                  boxShadow: isSelected ? "3px 3px 0px var(--primary)" : "2px 2px 0px var(--primary)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {s.logo_url ? (
                  <img
                    src={s.logo_url}
                    alt={s.name}
                    style={{ width: "16px", height: "16px", objectFit: "contain", borderRadius: "2px" }}
                  />
                ) : s.category === "bebidas" ? (
                  <Coffee size={14} />
                ) : s.category === "comida" ? (
                  <Pizza size={14} />
                ) : (
                  <Sparkles size={14} />
                )}
                <span>{s.name.split(" ")[0].toUpperCase()}</span>
                <span style={{ backgroundColor: "#CCFF00", color: "#000", padding: "1px 5px", fontSize: "0.58rem", borderRadius: "3px", fontWeight: 900 }}>
                  PRÓX.
                </span>
              </button>
            );
          })}
        </div>

        {/* Panel Exclusivo de Administrador: Configuración de WhatsApp de Pruebas */}
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
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.70rem", fontWeight: 900, color: "var(--primary)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                <Shield size={14} style={{ color: "#BA1A1A" }} /> 🛡️ PANEL ADMIN: NÚMERO WHATSAPP DE DESTINO ({currentSponsor.name.split(" ")[0]})
              </span>
              <span style={{ fontSize: "0.58rem", fontWeight: 900, backgroundColor: "#BA1A1A", color: "#FFF", padding: "1px 6px", borderRadius: "3px" }}>
                MODO PRUEBAS ADMIN
              </span>
            </div>

            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="tel"
                value={currentAdminPhone}
                onChange={(e) => setAdminPhoneOverrides((prev) => ({ ...prev, [currentSponsor.id]: e.target.value }))}
                placeholder="Ej. 51999999999 (tu número para recibir el pedido de prueba)"
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  backgroundColor: "var(--surface-container, var(--card-bg))",
                  color: "var(--foreground)",
                  border: "2px solid var(--primary)",
                  boxShadow: "1.5px 1.5px 0px var(--primary)",
                  fontSize: "0.75rem",
                  fontWeight: 900,
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                onClick={handleSaveSponsorPhone}
                disabled={isSavingPhone}
                className="neo-button"
                style={{
                  padding: "6px 12px",
                  fontSize: "0.70rem",
                  fontWeight: 900,
                  backgroundColor: phoneSavedSuccess ? "#22c55e" : "#CCFF00",
                  color: "#111111",
                  border: "2px solid var(--primary)",
                  boxShadow: "2px 2px 0px var(--primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                {phoneSavedSuccess ? (
                  <>
                    <Check size={13} /> ¡GUARDADO!
                  </>
                ) : isSavingPhone ? (
                  "GUARDANDO..."
                ) : (
                  <>
                    <Save size={13} /> GUARDAR NÚMERO EN BD
                  </>
                )}
              </button>
            </div>
            <div style={{ fontSize: "0.62rem", opacity: 0.85, color: "var(--foreground)" }}>
              💡 Al pulsar &quot;Enviar Pedido&quot;, se abrirá el WhatsApp con destino a este número para que puedas verificar exactamente el formato del pedido.
            </div>
          </div>
        )}

        {/* Tarjeta de Resumen del Auspiciador */}
        <div
          className="neo-card"
          style={{
            backgroundColor: "var(--surface-container, var(--card-bg))",
            border: "2px solid var(--primary)",
            padding: "12px 14px",
            boxShadow: "2.5px 2.5px 0px var(--primary)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {currentSponsor.logo_url && (
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#000",
                    border: "2px solid var(--primary)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                    flexShrink: 0,
                    boxShadow: "2px 2px 0px var(--primary)",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={currentSponsor.logo_url}
                    alt={currentSponsor.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
              )}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 900, color: "var(--foreground)", textTransform: "uppercase" }}>
                    {currentSponsor.name}
                  </h3>
                  <span style={{ fontSize: "0.55rem", backgroundColor: "var(--primary)", color: "var(--primary-container)", padding: "1px 5px", borderRadius: "2px", fontWeight: 900 }}>
                    ⚡ MARCA ALIADA
                  </span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", opacity: 0.85, color: "var(--foreground)" }}>
                  {currentSponsor.tagline}
                </p>
                {currentSponsor.address && (
                  <p style={{ margin: "2px 0 0", fontSize: "0.68rem", opacity: 0.75, display: "flex", alignItems: "center", gap: "4px", color: "var(--foreground)" }}>
                    <MapPin size={11} style={{ color: "#BA1A1A" }} /> {currentSponsor.address}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <div
                style={{
                  backgroundColor: "var(--primary-container)",
                  color: "var(--primary, #000)",
                  fontWeight: 900,
                  fontSize: "0.70rem",
                  padding: "4px 8px",
                  border: "1.5px solid var(--primary)",
                  boxShadow: "2px 2px 0px var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  borderRadius: "3px",
                }}
              >
                <Tag size={12} /> BENEFICIOS: PRÓXIMAMENTE ⚡
              </div>

              <button
                type="button"
                onClick={handleDirectWhatsAppChat}
                className="neo-button"
                style={{
                  backgroundColor: "#25D366",
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: "0.68rem",
                  padding: "4px 8px",
                  border: "1.5px solid var(--primary)",
                  boxShadow: "2px 2px 0px var(--primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title="Abrir chat directo en WhatsApp con este auspiciador"
              >
                <MessageCircle size={12} /> CHAT DIRECTO
              </button>
            </div>
          </div>

          {/* Breve descripción detallada de la marca */}
          {currentSponsor.about && (
            <div
              style={{
                backgroundColor: "var(--background)",
                border: "1px dashed var(--primary)",
                padding: "8px 10px",
                borderRadius: "3px",
                fontSize: "0.72rem",
                lineHeight: "1.4",
                color: "var(--foreground)",
                opacity: 0.9,
              }}
            >
              {currentSponsor.about}
            </div>
          )}
        </div>

        {orderCompleted ? (
          /* Pantalla de Éxito / Confirmación */
          <div
            className="neo-card"
            style={{
              backgroundColor: "var(--surface-container, var(--card-bg))",
              border: "3px solid #22c55e",
              padding: "20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              boxShadow: "4px 4px 0px #22c55e",
            }}
          >
            <CheckCircle size={48} color="#22c55e" />
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900, color: "#22c55e", textTransform: "uppercase" }}>
              ¡PEDIDO REGISTRADO EXITOSAMENTE!
            </h3>
            <p style={{ fontSize: "0.80rem", margin: 0, color: "var(--foreground)", opacity: 0.9, maxWidth: "450px" }}>
              Tu orden ha sido registrada en Radio Doble C y despachada a{" "}
              <strong>{currentSponsor.name}</strong> por WhatsApp con tu descuento exclusivo de oyente.
            </p>
            {lastWhatsAppUrl && (
              <a
                href={lastWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="neo-button"
                style={{
                  backgroundColor: "#22c55e",
                  color: "#000",
                  fontWeight: 900,
                  padding: "10px 18px",
                  fontSize: "0.82rem",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "2px solid var(--primary)",
                  boxShadow: "3px 3px 0px var(--primary)",
                  marginTop: "4px",
                }}
              >
                <Send size={15} /> REABRIR CHAT DE WHATSAPP
              </a>
            )}
            <button
              onClick={resetOrder}
              className="neo-button"
              style={{
                backgroundColor: "transparent",
                color: "var(--foreground)",
                border: "1.5px solid var(--primary)",
                padding: "5px 12px",
                fontSize: "0.72rem",
                cursor: "pointer",
                marginTop: "2px",
              }}
            >
              Hacer otro pedido
            </button>
          </div>
        ) : (
          /* Menú de Productos y Formulario */
          <form onSubmit={handleConfirmOrder} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }} className="modal-split-container">
              {/* Columna Izquierda: Menú de Productos */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Sparkles size={12} style={{ color: "#BA1A1A" }} /> 1. SELECCIONA TUS PRODUCTOS:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
                  {(currentSponsor.menu_items || []).map((item) => {
                    const qty = cart[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className="neo-card"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          backgroundColor: qty > 0 ? "var(--primary-container)" : "var(--surface-container, var(--card-bg))",
                          border: "2px solid var(--primary)",
                          boxShadow: qty > 0 ? "2.5px 2.5px 0px var(--primary)" : "1.5px 1.5px 0px var(--primary)",
                          padding: "8px 10px",
                          gap: "6px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ fontSize: "1.05rem" }}>{item.icon || "📦"}</span>
                            <strong style={{ fontSize: "0.76rem", color: "var(--foreground)", fontWeight: 900 }}>
                              {item.name}
                            </strong>
                          </div>
                          <p style={{ margin: "2px 0 0", fontSize: "0.65rem", opacity: 0.8, color: "var(--foreground)" }}>
                            {item.description}
                          </p>
                          <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#BA1A1A", marginTop: "2px" }}>
                            S/ {item.price.toFixed(2)}
                          </div>
                        </div>

                        {/* Stepper + / - */}
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item, -1)}
                            disabled={qty === 0}
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "3px",
                              border: "1.5px solid var(--primary)",
                              backgroundColor: qty > 0 ? "#BA1A1A" : "var(--card-bg)",
                              color: qty > 0 ? "#FFFFFF" : "var(--foreground)",
                              fontWeight: 900,
                              cursor: qty > 0 ? "pointer" : "not-allowed",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: qty === 0 ? 0.5 : 1,
                            }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontSize: "0.82rem", fontWeight: 900, minWidth: "14px", textAlign: "center", color: "var(--foreground)" }}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item, 1)}
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "3px",
                              border: "1.5px solid var(--primary)",
                              backgroundColor: "#CCFF00",
                              color: "#111111",
                              fontWeight: 900,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "1.5px 1.5px 0px var(--primary)",
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna Derecha: Modalidad, Datos y Resumen */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  2. MODALIDAD & DATOS DE ENTREGA:
                </div>

                {/* Tipo de Entrega */}
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("delivery")}
                    className="neo-button"
                    style={{
                      flex: 1,
                      padding: "5px",
                      fontSize: "0.68rem",
                      fontWeight: 900,
                      backgroundColor: deliveryType === "delivery" ? "var(--primary-container)" : "var(--surface-container, var(--card-bg))",
                      color: deliveryType === "delivery" ? "var(--primary, #000)" : "var(--foreground)",
                      border: "2px solid var(--primary)",
                      boxShadow: deliveryType === "delivery" ? "2px 2px 0px var(--primary)" : "1px 1px 0px var(--primary)",
                      cursor: "pointer",
                    }}
                  >
                    🛵 Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("pickup")}
                    className="neo-button"
                    style={{
                      flex: 1,
                      padding: "5px",
                      fontSize: "0.68rem",
                      fontWeight: 900,
                      backgroundColor: deliveryType === "pickup" ? "var(--primary-container)" : "var(--surface-container, var(--card-bg))",
                      color: deliveryType === "pickup" ? "var(--primary, #000)" : "var(--foreground)",
                      border: "2px solid var(--primary)",
                      boxShadow: deliveryType === "pickup" ? "2px 2px 0px var(--primary)" : "1px 1px 0px var(--primary)",
                      cursor: "pointer",
                    }}
                  >
                    🏪 Recojo
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("reservation")}
                    className="neo-button"
                    style={{
                      flex: 1,
                      padding: "5px",
                      fontSize: "0.68rem",
                      fontWeight: 900,
                      backgroundColor: deliveryType === "reservation" ? "var(--primary-container)" : "var(--surface-container, var(--card-bg))",
                      color: deliveryType === "reservation" ? "var(--primary, #000)" : "var(--foreground)",
                      border: "2px solid var(--primary)",
                      boxShadow: deliveryType === "reservation" ? "2px 2px 0px var(--primary)" : "1px 1px 0px var(--primary)",
                      cursor: "pointer",
                    }}
                  >
                    🪑 Reserva
                  </button>
                </div>

                {/* Datos del Cliente */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
                  <div>
                    <label style={{ fontSize: "0.62rem", fontWeight: 900, color: "var(--foreground)", display: "flex", alignItems: "center", gap: "3px", textTransform: "uppercase" }}>
                      <User size={10} /> Nombre *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Tu nombre"
                      required
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        backgroundColor: "var(--surface-container, var(--card-bg))",
                        color: "var(--foreground)",
                        border: "2px solid var(--primary)",
                        boxShadow: "1.5px 1.5px 0px var(--primary)",
                        fontSize: "0.72rem",
                        marginTop: "2px",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.62rem", fontWeight: 900, color: "var(--foreground)", display: "flex", alignItems: "center", gap: "3px", textTransform: "uppercase" }}>
                      <Phone size={10} /> WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej. 999 999 999"
                      required
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        backgroundColor: "var(--surface-container, var(--card-bg))",
                        color: "var(--foreground)",
                        border: "2px solid var(--primary)",
                        boxShadow: "1.5px 1.5px 0px var(--primary)",
                        fontSize: "0.72rem",
                        marginTop: "2px",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>

                {deliveryType === "delivery" && (
                  <div>
                    <label style={{ fontSize: "0.62rem", fontWeight: 900, color: "var(--foreground)", display: "flex", alignItems: "center", gap: "3px", textTransform: "uppercase" }}>
                      <MapPin size={10} /> Dirección de Entrega (Huánuco) *
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej. Jr. 28 de Julio #450"
                      required
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        backgroundColor: "var(--surface-container, var(--card-bg))",
                        color: "var(--foreground)",
                        border: "2px solid var(--primary)",
                        boxShadow: "1.5px 1.5px 0px var(--primary)",
                        fontSize: "0.72rem",
                        marginTop: "2px",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: "0.62rem", fontWeight: 900, color: "var(--foreground)", textTransform: "uppercase" }}>
                    Notas o Preferencias (Opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Bastante canela / bien caliente"
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      backgroundColor: "var(--surface-container, var(--card-bg))",
                      color: "var(--foreground)",
                      border: "2px solid var(--primary)",
                      boxShadow: "1.5px 1.5px 0px var(--primary)",
                      fontSize: "0.72rem",
                      marginTop: "2px",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Resumen Financiero con Descuento */}
                <div
                  className="neo-card"
                  style={{
                    backgroundColor: "var(--surface-container, var(--card-bg))",
                    border: "2px solid var(--primary)",
                    boxShadow: "2.5px 2.5px 0px var(--primary)",
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                    marginTop: "auto",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--foreground)", opacity: 0.85 }}>
                    <span>Subtotal ({orderItems.reduce((acc, i) => acc + i.quantity, 0)} items):</span>
                    <span>S/ {subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#22c55e", fontWeight: 900 }}>
                    <span>Descuento Radio Doble C (-{currentSponsor.discount_percent}%):</span>
                    <span>-S/ {discount.toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.90rem",
                      fontWeight: 900,
                      color: "#BA1A1A",
                      borderTop: "2px dashed var(--primary)",
                      paddingTop: "3px",
                    }}
                  >
                    <span>TOTAL:</span>
                    <span>S/ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isSubmitting || orderItems.length === 0}
              className="neo-button"
              style={{
                backgroundColor: orderItems.length > 0 ? "#CCFF00" : "var(--surface-container)",
                color: "#111111",
                fontWeight: 900,
                padding: "11px",
                fontSize: "0.82rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                border: "2.5px solid var(--primary)",
                boxShadow: orderItems.length > 0 ? "3.5px 3.5px 0px var(--primary)" : "none",
                cursor: orderItems.length > 0 ? "pointer" : "not-allowed",
                opacity: orderItems.length > 0 ? 1 : 0.6,
                textTransform: "uppercase",
              }}
            >
              <ShoppingBag size={17} />
              {isSubmitting ? "REGISTRANDO PEDIDO..." : "🚀 ENVIAR PEDIDO POR WHATSAPP CON DESCUENTO"}
            </button>
          </form>
        )}
      </div>
    </NeoModal>
  );
};
