"use client";

import { useState } from "react";
import { NeoModal } from "../common/NeoModal";
import { useAudio } from "@/hooks/useAudio";
import { COIN_PACKS_LIST, createMercadoPagoPreference } from "@/services/mercadoPagoService";
import {
  Flame,
  CreditCard,
  Smartphone,
  ExternalLink,
  Loader2,
  AlertCircle,
  Zap,
} from "lucide-react";

interface CoinRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedPackId?: string;
}

export const CoinRechargeModal = ({
  isOpen,
  onClose,
  suggestedPackId = "pack_trono",
}: CoinRechargeModalProps) => {
  const { userProfile, puntosC } = useAudio();
  const [selectedPackId, setSelectedPackId] = useState<string>(suggestedPackId);
  const [paymentMethod, setPaymentMethod] = useState<"mercadopago" | "yape">("mercadopago");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedPack = COIN_PACKS_LIST.find((p) => p.id === selectedPackId) || COIN_PACKS_LIST[2];

  const handlePayMercadoPago = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await createMercadoPagoPreference({
        packId: selectedPack.id,
        userId: userProfile?.id,
        userName: userProfile?.name,
        userEmail: "oyente@radiodoblec.com",
      });

      if (res.init_point) {
        // Redirigir a la pasarela de Mercado Pago de forma segura
        window.location.assign(res.init_point);
      } else if (res.isMock) {
        alert(`🔔 MODO DEMOSTRACIÓN / PREVIEW:\n\n${res.message}\n\nPaquete Seleccionado: ${selectedPack.title}\nPrecio: S/ ${selectedPack.pricePen.toFixed(2)} PEN`);
        setIsLoading(false);
      } else {
        throw new Error(res.error || "No se pudo generar el enlace de pago de Mercado Pago.");
      }
    } catch (err: unknown) {
      console.error("Payment error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Error al iniciar el pago con Mercado Pago.");
      setIsLoading(false);
    }
  };

  const handleYapeWhatsApp = () => {
    const text = encodeURIComponent(
      `📻 ¡Hola Radio Doble C! Quiero recargar el *${selectedPack.title}* (${selectedPack.coins.toLocaleString()} C-Coins) por *S/ ${selectedPack.pricePen.toFixed(2)} PEN*.\n\n👤 Mi Usuario: ${userProfile?.name || "Oyente"}\n📱 Adjunto mi comprobante de Yape/Plin.`
    );
    window.open(`https://wa.me/51999999999?text=${text}`, "_blank");
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title="CENTRO DE RECARGA C-COINS"
      badgeText="🪙 BANCO OFICIAL"
      maxWidth="620px"
      backgroundColor="var(--background)"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "4px 0" }}>
        {/* User Balance Header */}
        <div
          style={{
            backgroundColor: "#161E00",
            color: "#CCFF00",
            border: "2.5px solid var(--primary)",
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            boxShadow: "3px 3px 0px var(--primary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Zap size={18} style={{ color: "#CCFF00", fill: "#CCFF00" }} />
            <span style={{ fontSize: "0.82rem", fontWeight: 900 }}>
              SALDO ACTUAL: {(puntosC || 0).toLocaleString()} C-COINS
            </span>
          </div>
          <span style={{ fontSize: "0.72rem", opacity: 0.85, fontWeight: 700 }}>
            👤 @{userProfile?.name || "Oyente"}
          </span>
        </div>

        {/* Packs Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.5px" }}>
            1. SELECCIONA TU PAQUETE DE C-COINS:
          </span>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "10px",
            }}
          >
            {COIN_PACKS_LIST.map((pack) => {
              const isSelected = pack.id === selectedPackId;

              return (
                <div
                  key={pack.id}
                  onClick={() => setSelectedPackId(pack.id)}
                  className="fun-hover-wobble"
                  style={{
                    backgroundColor: isSelected ? (pack.popular ? "#FFDE82" : "#CCFF00") : "var(--card-bg)",
                    color: "#111",
                    border: isSelected ? "3px solid var(--primary)" : "2px solid var(--primary)",
                    boxShadow: isSelected ? "4px 4px 0px var(--primary)" : "2px 2px 0px var(--primary)",
                    padding: "12px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    transform: isSelected ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {pack.badge && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "6px",
                        backgroundColor: "#BA1A1A",
                        color: "white",
                        fontSize: "0.55rem",
                        fontWeight: 900,
                        padding: "1px 5px",
                        borderRadius: "2px",
                        border: "1px solid var(--primary)",
                      }}
                    >
                      {pack.badge}
                    </span>
                  )}

                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 900, display: "block" }}>
                      {pack.title}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", margin: "4px 0" }}>
                      <Flame size={14} style={{ color: "#BA1A1A", fill: "#BA1A1A" }} />
                      <span style={{ fontSize: "1rem", fontWeight: 900 }}>
                        {pack.coins.toLocaleString()} Coins
                      </span>
                    </div>
                    <p style={{ fontSize: "0.65rem", opacity: 0.85, margin: "2px 0 8px 0", lineHeight: "0.95rem" }}>
                      {pack.description}
                    </p>
                  </div>

                  <div
                    style={{
                      borderTop: "1.5px dashed var(--primary)",
                      paddingTop: "6px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <span style={{ fontSize: "0.95rem", fontWeight: 900, color: "#111" }}>
                      S/ {pack.pricePen.toFixed(2)}
                    </span>
                    <span style={{ fontSize: "0.62rem", opacity: 0.75, fontWeight: 700 }}>
                      ${pack.priceUsd} USD
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Method Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.5px" }}>
            2. MÉTODO DE PAGO:
          </span>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setPaymentMethod("mercadopago")}
              className="neo-button"
              style={{
                flex: "1 1 180px",
                backgroundColor: paymentMethod === "mercadopago" ? "#009EE3" : "var(--card-bg)",
                color: paymentMethod === "mercadopago" ? "white" : "var(--primary)",
                border: "2px solid var(--primary)",
                padding: "10px",
                fontSize: "0.78rem",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: paymentMethod === "mercadopago" ? "3px 3px 0px var(--primary)" : "1.5px 1.5px 0px var(--primary)",
              }}
            >
              <CreditCard size={16} />
              MERCADO PAGO (TARJETAS / PAGOEFECTIVO)
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("yape")}
              className="neo-button"
              style={{
                flex: "1 1 180px",
                backgroundColor: paymentMethod === "yape" ? "#6A1B9A" : "var(--card-bg)",
                color: paymentMethod === "yape" ? "white" : "var(--primary)",
                border: "2px solid var(--primary)",
                padding: "10px",
                fontSize: "0.78rem",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: paymentMethod === "yape" ? "3px 3px 0px var(--primary)" : "1.5px 1.5px 0px var(--primary)",
              }}
            >
              <Smartphone size={16} />
              YAPE / PLIN (DIRECTO PERÚ)
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: "#FFEBEE",
              color: "#BA1A1A",
              border: "1.5px solid #BA1A1A",
              padding: "8px 12px",
              fontSize: "0.75rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AlertCircle size={15} />
            {errorMessage}
          </div>
        )}

        {/* Action button based on payment method */}
        {paymentMethod === "mercadopago" ? (
          <button
            type="button"
            onClick={handlePayMercadoPago}
            disabled={isLoading}
            className="neo-button fun-hover-wobble"
            style={{
              backgroundColor: isLoading ? "#E0E0E0" : "#009EE3",
              color: "white",
              border: "2.5px solid var(--primary)",
              boxShadow: "4px 4px 0px var(--primary)",
              padding: "14px",
              fontSize: "0.88rem",
              fontWeight: 900,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "4px",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>CONECTANDO CON MERCADO PAGO...</span>
              </>
            ) : (
              <>
                <CreditCard size={18} />
                <span>PAGAR S/ {selectedPack.pricePen.toFixed(2)} CON MERCADO PAGO ⚡</span>
              </>
            )}
          </button>
        ) : (
          <div
            style={{
              backgroundColor: "#F3E5F5",
              border: "2px solid #6A1B9A",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 900, color: "#6A1B9A" }}>
                📱 PAGO DIRECTO POR YAPE / PLIN:
              </span>
              <span style={{ fontSize: "0.95rem", fontWeight: 900, color: "#111" }}>
                Monto: S/ {selectedPack.pricePen.toFixed(2)} PEN
              </span>
            </div>

            <div style={{ backgroundColor: "white", border: "1.5px solid #6A1B9A", padding: "10px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 900 }}>
                Número Yape / Plin: <span style={{ color: "#6A1B9A", fontSize: "1rem" }}>999 999 999</span>
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.7rem", opacity: 0.85 }}>
                Titular: Radio Doble C Oficial
              </p>
            </div>

            <button
              type="button"
              onClick={handleYapeWhatsApp}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: "#25D366",
                color: "white",
                border: "2px solid var(--primary)",
                boxShadow: "3px 3px 0px var(--primary)",
                padding: "10px",
                fontSize: "0.8rem",
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <ExternalLink size={16} />
              ENVIAR COMPROBANTE POR WHATSAPP Y ACREDITAR COINS
            </button>
          </div>
        )}
      </div>
    </NeoModal>
  );
};
