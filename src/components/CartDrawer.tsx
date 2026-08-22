import { CSSProperties, useState } from "react";
import { ShoppingCart, X, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { CartItem } from "@/types";
import { parsePrice, formatPrice } from "@/lib/priceUtils";
import { calculateCartTotals } from "@/lib/cartCalculator";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateCartItemQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  isAuthenticated: boolean;
  showToast: (message: string, type?: "info" | "error" | "success") => void;
  setActiveTab: (tab: "explore" | "store" | "profile" | "vip") => void;
  onCheckout: () => void;
}

export const CartDrawer = ({
  isOpen,
  onClose,
  cart,
  updateCartItemQuantity,
  removeFromCart,
  isAuthenticated,
  showToast,
  setActiveTab,
  onCheckout,
}: CartDrawerProps) => {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");

  if (!isOpen) return null;

  // Single source of truth calculation engine
  const {
    subtotal,
    totalItems,
    discountPercent,
    discountAmount,
    shippingCost,
    total,
    couponMessage,
    isCouponValid,
  } = calculateCartTotals(cart, appliedCoupon);

  const handleApplyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    setAppliedCoupon(couponCode.trim().toUpperCase());
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(3px)",
        zIndex: 3000,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        className="cart-drawer-active"
        style={{
          width: "100%",
          maxWidth: "420px",
          height: "100%",
          backgroundColor: "var(--background)",
          borderLeft: "4px solid var(--primary)",
          boxShadow: "-6px 0px 0px var(--primary)",
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "4px solid var(--primary)", paddingBottom: "12px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingCart size={20} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
              TU CESTA
            </h3>
            <span
              style={{
                backgroundColor: "var(--primary-container)",
                border: "1.5px solid var(--primary)",
                padding: "2px 6px",
                fontSize: "0.65rem",
                fontWeight: 900,
              }}
            >
              {totalItems} {totalItems === 1 ? "ITEM" : "ITEMS"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="neo-button fun-hover-wobble"
            style={{
              padding: "4px 8px",
              fontSize: "0.7rem",
              backgroundColor: "white",
              boxShadow: "2px 2px 0px var(--primary)",
              cursor: "pointer",
              "--rest-rot": "0deg",
            } as CSSProperties}
          >
            <X size={16} />
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
          {cart.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", opacity: 0.8, padding: "40px 0" }}>
              <span style={{ fontSize: "3rem" }}>📻</span>
              <p style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase" }}>
                Tu cesta está vacía
              </p>
              <p style={{ fontSize: "0.7rem", textAlign: "center" }}>
                ¡Explora la tienda oficial y consigue tus prendas de Radio Doble C!
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const unitPrice = parsePrice(item.product.price);
              const lineTotal = unitPrice * item.quantity;

              return (
                <div
                  key={item.id}
                  className="neo-card"
                  style={{
                    padding: "10px",
                    backgroundColor: "var(--surface-container)",
                    display: "flex",
                    gap: "10px",
                    boxShadow: "3px 3px 0px var(--primary)",
                    border: "2px solid var(--primary)",
                  }}
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    style={{ width: "68px", height: "68px", objectFit: "cover", border: "2px solid var(--primary)", flexShrink: 0, backgroundColor: "#000" }}
                  />
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "0 0 2px 0" }}>
                        {item.product.name}
                      </h4>
                      <p style={{ fontSize: "0.6rem", fontWeight: "bold", opacity: 0.8, margin: 0 }}>
                        {item.color} • TALLA {item.size}
                      </p>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                      {/* Quantity control */}
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          style={{ width: "20px", height: "20px", border: "1.5px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "white", padding: 0 }}
                        >
                          <Minus size={10} />
                        </button>
                        <span style={{ fontSize: "0.72rem", fontWeight: 900, minWidth: "16px", textAlign: "center" }}>{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          style={{ width: "20px", height: "20px", border: "1.5px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "white", padding: 0 }}
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 900 }}>
                          {formatPrice(lineTotal)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "var(--error)" }}
                          title="Eliminar de la cesta"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary, Coupons & Checkout */}
        {cart.length > 0 && (
          <div style={{ borderTop: "4px solid var(--primary)", paddingTop: "14px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Discount Coupon Box */}
            <div
              style={{
                backgroundColor: "var(--surface-container)",
                border: "1.5px solid var(--primary)",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                <input
                  type="text"
                  placeholder="CUPÓN (Ej. DOBLEC2026)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    padding: "4px 8px",
                    fontSize: "0.65rem",
                    border: "1.5px solid var(--primary)",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    backgroundColor: "white",
                  }}
                />
                <button
                  onClick={handleApplyCoupon}
                  className="neo-button"
                  style={{
                    padding: "4px 10px",
                    backgroundColor: "#CCFF00",
                    color: "#111",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    border: "1.5px solid var(--primary)",
                    cursor: "pointer",
                  }}
                >
                  APLICAR
                </button>
              </div>
              {couponMessage && (
                <span
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 900,
                    color: isCouponValid ? "#008800" : "#BA1A1A",
                  }}
                >
                  {couponMessage}
                </span>
              )}
            </div>

            {/* Subtotal, Discount, Shipping, Total */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: "bold" }}>
              <span>SUBTOTAL</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {discountPercent > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: "bold", color: "#008800" }}>
                <span>DESCUENTO ({discountPercent}%)</span>
                <span>- {formatPrice(discountAmount)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: "bold", opacity: 0.85 }}>
              <span>COSTO DE ENVÍO</span>
              <span>{shippingCost === 0 ? "GRATIS" : formatPrice(shippingCost)}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 900, borderTop: "2px dashed var(--primary)", paddingTop: "6px", marginTop: "2px" }}>
              <span>TOTAL ESTIMADO</span>
              <span style={{ color: "var(--primary)" }}>
                {formatPrice(total)}
              </span>
            </div>

            {!isAuthenticated && (
              <p style={{ fontSize: "0.65rem", color: "var(--error)", fontWeight: "bold", textAlign: "center", margin: "2px 0" }}>
                ⚠️ Debes iniciar sesión en la pestaña Perfil para completar tu pedido.
              </p>
            )}

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  showToast("Por favor, inicia sesión en la sección Mi Perfil para continuar con tu compra.", "error");
                  setActiveTab("profile");
                  onClose();
                  return;
                }
                onClose();
                onCheckout();
              }}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: "#CCFF00",
                color: "#111111",
                width: "100%",
                padding: "12px",
                fontSize: "0.85rem",
                fontWeight: 900,
                boxShadow: "3px 3px 0px var(--primary)",
                border: "2.5px solid var(--primary)",
                cursor: "pointer",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>COMPRAR AHORA 🛒</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
