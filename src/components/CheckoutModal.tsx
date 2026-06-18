import { ArrowLeft, Copy, Check, Upload, Megaphone } from "lucide-react";
import { CartItem } from "@/hooks/useCart";
import { MP_ALIAS, MP_CVU } from "@/constants";
import { useCheckout, CheckoutStep } from "@/hooks/useCheckout";

interface CheckoutModalProps {
  step: "shipping" | "payment" | "success";
  setCheckoutStep: (step: "idle" | "shipping" | "payment" | "success") => void;
  cart: CartItem[];
  onSuccessBackToStore: () => void;
}

export const CheckoutModal = ({
  step,
  setCheckoutStep,
  cart,
  onSuccessBackToStore,
}: CheckoutModalProps) => {
  const {
    shippingName,
    setShippingName,
    shippingPhone,
    setShippingPhone,
    shippingEmail,
    setShippingEmail,
    shippingAddress,
    setShippingAddress,
    shippingCity,
    setShippingCity,
    paymentTxId,
    setPaymentTxId,
    paymentReceiptName,
    setPaymentReceiptName,
    isCopiedAlias,
    setIsCopiedAlias,
    isCopiedCvu,
    setIsCopiedCvu,
    isSubmittingOrder,
    orderError,
    submitOrder,
  } = useCheckout(step as CheckoutStep, setCheckoutStep as (step: CheckoutStep) => void);

  const subtotal = cart.reduce((acc, item) => acc + parseFloat(item.product.price.replace("$", "")) * item.quantity, 0);
  const totalAmount = subtotal + 5;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCopyAlias = () => {
    if (MP_ALIAS) navigator.clipboard.writeText(MP_ALIAS);
    setIsCopiedAlias(true);
    setTimeout(() => setIsCopiedAlias(false), 2000);
  };

  const handleCopyCvu = () => {
    if (MP_CVU) navigator.clipboard.writeText(MP_CVU);
    setIsCopiedCvu(true);
    setTimeout(() => setIsCopiedCvu(false), 2000);
  };

  if (step === "shipping") {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 3100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          paddingBottom: "100px",
        }}
      >
        <div
          className="neo-card"
          style={{
            width: "100%",
            maxWidth: "420px",
            maxHeight: "calc(100vh - 140px)",
            overflowY: "auto",
            backgroundColor: "var(--background)",
            padding: "20px",
            boxShadow: "8px 8px 0px var(--primary)",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => {
                setCheckoutStep("idle");
              }}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, color: "var(--primary)" }}
            >
              <ArrowLeft size={20} />
            </button>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase" }}>
              DATOS DE ENVÍO
            </h3>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCheckoutStep("payment");
            }}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                NOMBRE COMPLETO *
              </label>
              <input
                type="text"
                required
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                placeholder="Ej. Carlos Gomez"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "3px solid var(--primary)",
                  outline: "none",
                  fontSize: "0.8rem",
                  fontFamily: "inherit",
                  boxShadow: "3px 3px 0px var(--primary)",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                  TELÉFONO / WHATSAPP *
                </label>
                <input
                  type="tel"
                  required
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="Ej. +54 9 11 1234 5678"
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "3px solid var(--primary)",
                    outline: "none",
                    fontSize: "0.8rem",
                    fontFamily: "inherit",
                    boxShadow: "3px 3px 0px var(--primary)",
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                  EMAIL *
                </label>
                <input
                  type="email"
                  required
                  value={shippingEmail}
                  onChange={(e) => setShippingEmail(e.target.value)}
                  placeholder="carlos@gmail.com"
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "3px solid var(--primary)",
                    outline: "none",
                    fontSize: "0.8rem",
                    fontFamily: "inherit",
                    boxShadow: "3px 3px 0px var(--primary)",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                DIRECCIÓN DE ENTREGA *
              </label>
              <input
                type="text"
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Ej. Calle Falsa 123, Depto 2B"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "3px solid var(--primary)",
                  outline: "none",
                  fontSize: "0.8rem",
                  fontFamily: "inherit",
                  boxShadow: "3px 3px 0px var(--primary)",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                CIUDAD / PROVINCIA *
              </label>
              <input
                type="text"
                required
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                placeholder="Ej. Buenos Aires"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "3px solid var(--primary)",
                  outline: "none",
                  fontSize: "0.8rem",
                  fontFamily: "inherit",
                  boxShadow: "3px 3px 0px var(--primary)",
                }}
              />
            </div>

            {/* Order summary mini block */}
            <div style={{ border: "2.5px solid var(--primary)", padding: "10px", marginTop: "8px", backgroundColor: "var(--surface-container)" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 900, display: "block", borderBottom: "1.5px solid var(--primary)", paddingBottom: "2px", marginBottom: "4px" }}>
                RESUMEN DE COMPRA
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", fontWeight: "bold" }}>
                <span>PRODUCTOS ({totalItemsCount})</span>
                <span>
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", fontWeight: "bold" }}>
                <span>COSTO DE ENVÍO</span>
                <span>$5.00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 900, borderTop: "1.5px dashed var(--primary)", paddingTop: "4px", marginTop: "4px" }}>
                <span>TOTAL A PAGAR</span>
                <span>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="neo-button"
              style={{
                backgroundColor: "var(--primary-container)",
                width: "100%",
                padding: "10px",
                fontSize: "0.75rem",
                marginTop: "8px",
              }}
            >
              PROCEDER AL PAGO ⚡
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 3100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          paddingBottom: "100px",
        }}
      >
        <div
          className="neo-card"
          style={{
            width: "100%",
            maxWidth: "420px",
            maxHeight: "calc(100vh - 140px)",
            overflowY: "auto",
            backgroundColor: "var(--background)",
            padding: "20px",
            boxShadow: "8px 8px 0px var(--primary)",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setCheckoutStep("shipping")}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, color: "var(--primary)" }}
            >
              <ArrowLeft size={20} />
            </button>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase" }}>
              PAGO CON MERCADO PAGO
            </h3>
          </div>

          <div style={{ textAlign: "center", margin: "4px 0" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: "bold", opacity: 0.8 }}>MONTO A TRANSFERIR:</span>
            <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)" }}>
              ${totalAmount.toFixed(2)}
            </h2>
          </div>

          {/* MP Transfer details box */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", border: "3px solid var(--primary)", padding: "12px", backgroundColor: "var(--surface-container)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.6rem", fontWeight: "bold", opacity: 0.7 }}>ALIAS</span>
                <p style={{ fontSize: "0.8rem", fontWeight: 900, fontFamily: "monospace" }}>{MP_ALIAS || "—"}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyAlias}
                className="neo-button"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.6rem",
                  backgroundColor: isCopiedAlias ? "var(--primary-container)" : "white",
                  boxShadow: "2px 2px 0px var(--primary)",
                  cursor: "pointer",
                }}
              >
                {isCopiedAlias ? <Check size={10} /> : <Copy size={10} />}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid var(--primary)", paddingTop: "6px" }}>
              <div>
                <span style={{ fontSize: "0.6rem", fontWeight: "bold", opacity: 0.7 }}>CVU MERCADO PAGO</span>
                <p style={{ fontSize: "0.8rem", fontWeight: 900, fontFamily: "monospace" }}>{MP_CVU || "—"}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyCvu}
                className="neo-button"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.6rem",
                  backgroundColor: isCopiedCvu ? "var(--primary-container)" : "white",
                  boxShadow: "2px 2px 0px var(--primary)",
                  cursor: "pointer",
                }}
              >
                {isCopiedCvu ? <Check size={10} /> : <Copy size={10} />}
              </button>
            </div>

            <div style={{ borderTop: "2px solid var(--primary)", paddingTop: "6px", fontSize: "0.7rem" }}>
              <div>
                <span style={{ fontSize: "0.6rem", fontWeight: "bold", opacity: 0.7 }}>TITULAR:</span>
                <span style={{ fontWeight: 900, marginLeft: "4px" }}>RADIO DOBLE C SRL</span>
              </div>
              <div>
                <span style={{ fontSize: "0.6rem", fontWeight: "bold", opacity: 0.7 }}>CUIT:</span>
                <span style={{ fontWeight: 900, marginLeft: "4px" }}>30-71829384-9</span>
              </div>
            </div>
          </div>

          {/* QR Mockup Area */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", border: "2.5px solid var(--primary)", padding: "10px", backgroundColor: "#fff" }}>
            <div style={{ width: "64px", height: "64px", border: "2px solid var(--primary)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "4px", backgroundColor: "#000", color: "#fff", fontFamily: "monospace", fontSize: "0.35rem", fontWeight: 900 }}>
              <div>[QR]</div>
              <div>MP-PAY</div>
              <div>[QR]</div>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 900, display: "block", textTransform: "uppercase" }}>
                Escanea desde Mercado Pago
              </span>
              <p style={{ fontSize: "0.55rem", opacity: 0.8 }}>
                Abre la app de MP, selecciona &quot;Escanear QR&quot; y transfiere el total para validación instantánea.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitOrder(cart, totalAmount);
            }}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                NÚMERO / ID DE TRANSACCIÓN *
              </label>
              <input
                type="text"
                required
                value={paymentTxId}
                onChange={(e) => setPaymentTxId(e.target.value)}
                placeholder="Ej. 18294829384"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "3px solid var(--primary)",
                  outline: "none",
                  fontSize: "0.8rem",
                  fontFamily: "inherit",
                  boxShadow: "3px 3px 0px var(--primary)",
                }}
              />
            </div>

            {/* Upload Screenshot simulation */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                CAPTURA DE COMPROBANTE (OPCIONAL)
              </label>
              <div
                className="mock-upload-box"
                onClick={() => setPaymentReceiptName("comprobante_pago_doblec.png")}
              >
                <Upload size={20} style={{ margin: "0 auto 4px auto", color: "var(--primary)" }} />
                <span style={{ fontSize: "0.7rem", fontWeight: 900, display: "block" }}>
                  {paymentReceiptName ? `✓ ${paymentReceiptName}` : "HAZ CLICK PARA SUBIR CAPTURA 📸"}
                </span>
                <span style={{ fontSize: "0.55rem", opacity: 0.7 }}>
                  Formatos JPG, PNG • Max 5MB
                </span>
              </div>
            </div>

            {orderError && (
              <p style={{ fontSize: "0.7rem", color: "var(--error)", fontWeight: "bold", textAlign: "center" }}>
                {orderError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmittingOrder}
              className="neo-button"
              style={{
                backgroundColor: isSubmittingOrder ? "var(--surface-container)" : "var(--primary-container)",
                width: "100%",
                padding: "10px",
                fontSize: "0.75rem",
                marginTop: "6px",
                opacity: isSubmittingOrder ? 0.7 : 1,
                cursor: isSubmittingOrder ? "not-allowed" : "pointer",
              }}
            >
              {isSubmittingOrder ? "REGISTRANDO PEDIDO... ⏳" : "VALIDAR TRANSFERENCIA 🛡️"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(4px)",
          zIndex: 3200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          paddingBottom: "100px",
        }}
      >
        <div
          className="neo-card"
          style={{
            width: "100%",
            maxWidth: "400px",
            backgroundColor: "var(--background)",
            padding: "24px",
            boxShadow: "8px 8px 0px var(--primary)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-container)",
              border: "3px solid var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse 0.8s infinite alternate ease-in-out",
            }}
          >
            <Megaphone size={36} style={{ color: "var(--primary)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 900, textTransform: "uppercase" }}>
              ¡COMPROBANTE EN COLA! 📡
            </h3>
            <p style={{ fontSize: "0.75rem", fontWeight: "bold", opacity: 0.8 }}>
              Hola <strong>{shippingName}</strong>, registramos la transferencia de Mercado Pago con ID de operación <strong>#{paymentTxId}</strong>.
            </p>
            <p style={{ fontSize: "0.7rem", opacity: 0.9, lineHeight: "1.1rem" }}>
              Verificaremos el saldo en el búnker. Te enviaremos la confirmación de envío a <strong>{shippingEmail}</strong> y nos contactaremos a tu número <strong>{shippingPhone}</strong> para coordinar la entrega a <strong>{shippingAddress}, {shippingCity}</strong>.
            </p>
          </div>

          <button
            onClick={onSuccessBackToStore}
            className="neo-button"
            style={{
              backgroundColor: "white",
              padding: "10px 16px",
              fontSize: "0.75rem",
              width: "100%",
              marginTop: "8px",
            }}
          >
            ENTENDIDO, VOLVER A LA TIENDA 📻
          </button>
        </div>
      </div>
    );
  }

  return null;
};
