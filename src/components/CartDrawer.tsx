import { CSSProperties } from "react";
import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react";
import { CartItem } from "@/hooks/useCart";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateCartItemQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  isAuthenticated: boolean;
  showToast: (message: string, type?: "info" | "error" | "success") => void;
  setActiveTab: (tab: "explore" | "store" | "profile") => void;
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
  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + parseFloat(item.product.price.replace("$", "")) * item.quantity, 0);
  const shippingCost = 5.0;
  const total = subtotal + shippingCost;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
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
          maxWidth: "400px",
          height: "100%",
          backgroundColor: "var(--background)",
          borderLeft: "4px solid var(--primary)",
          boxShadow: "-6px 0px 0px var(--primary)",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "4px solid var(--primary)", paddingBottom: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingCart size={20} />
            <h3 style={{ fontSize: "1.3rem", fontWeight: 900, textTransform: "uppercase" }}>
              TU CESTA
            </h3>
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
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px" }}>
          {cart.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", opacity: 0.8 }}>
              <span style={{ fontSize: "3rem" }}>📻</span>
              <p style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase" }}>
                Tu cesta está vacía
              </p>
              <p style={{ fontSize: "0.7rem", textAlign: "center" }}>
                ¡Ve a la tienda y sintoniza algo de merch pirata!
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const itemPrice = parseFloat(item.product.price.replace("$", ""));
              return (
                <div
                  key={item.id}
                  className="neo-card"
                  style={{
                    padding: "10px",
                    backgroundColor: "var(--surface-container)",
                    display: "flex",
                    gap: "10px",
                    boxShadow: "4px 4px 0px var(--primary)",
                  }}
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    style={{ width: "64px", height: "64px", objectFit: "cover", border: "2px solid var(--primary)", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>
                        {item.product.name}
                      </h4>
                      <p style={{ fontSize: "0.6rem", fontWeight: "bold", opacity: 0.8 }}>
                        {item.color} • TALLA {item.size}
                      </p>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                      {/* Quantity control */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          style={{ width: "20px", height: "20px", border: "1.5px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "white", padding: 0 }}
                        >
                          <Minus size={10} />
                        </button>
                        <span style={{ fontSize: "0.7rem", fontWeight: 900 }}>{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          style={{ width: "20px", height: "20px", border: "1.5px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "white", padding: 0 }}
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 900 }}>
                          ${(itemPrice * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "var(--error)" }}
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

        {/* Footer Summary & Checkout */}
        {cart.length > 0 && (
          <div style={{ borderTop: "4px solid var(--primary)", paddingTop: "16px", marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "bold" }}>
              <span>SUBTOTAL</span>
              <span>
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "bold", opacity: 0.8 }}>
              <span>COSTO DE ENVÍO</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", fontWeight: 900, borderTop: "2px dashed var(--primary)", paddingTop: "8px", marginTop: "4px" }}>
              <span>TOTAL ESTIMADO</span>
              <span>
                ${total.toFixed(2)}
              </span>
            </div>

            {!isAuthenticated && (
              <p style={{ fontSize: "0.7rem", color: "var(--error)", fontWeight: "bold", textAlign: "center", margin: "4px 0" }}>
                ⚠️ Debés iniciar sesión en la pestaña Perfil para realizar tu pedido.
              </p>
            )}

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  showToast("Por favor, iniciá sesión en la sección Mi Perfil para continuar con tu compra.", "error");
                  setActiveTab("profile");
                  onClose();
                  return;
                }
                onClose();
                onCheckout();
              }}
              className="neo-button"
              style={{
                backgroundColor: "var(--primary-container)",
                width: "100%",
                padding: "12px",
                fontSize: "0.8rem",
                boxShadow: "3px 3px 0px var(--primary)",
                marginTop: "8px",
              }}
            >
              COMPRAR AHORA 🛒
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
