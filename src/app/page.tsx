"use client";

import React, { useState } from "react";
import { useAudio } from "@/context/AudioContext";
import { ZineBackgroundFrame } from "@/components/ZineBackgroundFrame";
import { ExploreView } from "@/components/ExploreView";
import { PlayerView } from "@/components/PlayerView";
import { ProfileView } from "@/components/ProfileView";
import { StoreView } from "@/components/StoreView";
import { SearchOverlay } from "@/components/SearchOverlay";
import { ChatSidebar } from "@/components/ChatSidebar";
import { SpotifyPlayerBar } from "@/components/SpotifyPlayerBar";
import { 
  Search, Play, Pause, ShoppingCart, Trash2, Plus, Minus, 
  X, Copy, Check, Upload, ArrowLeft, Megaphone 
} from "lucide-react";

type ActiveTab = "explore" | "store" | "profile";

interface CartItem {
  id: string; // combination: productId-color-size
  product: {
    id: string;
    name: string;
    price: string; // e.g. "$25.00"
    imageUrl: string;
  };
  color: string;
  size: string;
  quantity: number;
}

export default function Home() {
  const { selectTheme, isPlaying, currentTrack, togglePlayPause } = useAudio();

  const [activeTab, setActiveTab] = useState<ActiveTab>("explore");
  const [isSearchActive, setSearchActive] = useState(false);
  const [filteredStyle, setFilteredStyle] = useState<string | null>(null);
  
  // Web Refactor layout states
  const [isChatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [isPlayerExpanded, setPlayerExpanded] = useState(false);

  // Shopping Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);

  // Checkout Flow States
  const [checkoutStep, setCheckoutStep] = useState<"idle" | "shipping" | "payment" | "success">("idle");
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingEmail, setShippingEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [paymentTxId, setPaymentTxId] = useState("");
  const [paymentReceiptName, setPaymentReceiptName] = useState("");
  const [isCopiedAlias, setIsCopiedAlias] = useState(false);
  const [isCopiedCvu, setIsCopiedCvu] = useState(false);

  // Cart Helper Actions
  const addToCart = (product: any, color: string, size: string) => {
    const cartItemId = `${product.id}-${color}-${size}`;
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((item) => item.id === cartItemId);
      if (existingIdx > -1) {
        const newCart = [...prevCart];
        newCart[existingIdx].quantity += 1;
        return newCart;
      }
      return [
        ...prevCart,
        {
          id: cartItemId,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.variantImages?.[color] || product.imageUrl,
          },
          color,
          size,
          quantity: 1,
        },
      ];
    });
    // Open the cart drawer automatically so user gets feedback
    setCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== cartItemId));
  };

  const updateCartItemQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === cartItemId ? { ...item, quantity: newQty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Quick helper to choose which view to render
  const renderActiveView = () => {
    switch (activeTab) {
      case "explore":
        return (
          <ExploreView
            onNavigateToPlayer={() => setPlayerExpanded(true)}
            filteredStyle={filteredStyle}
          />
        );
      case "profile":
        return <ProfileView onNavigateToPlayer={() => setPlayerExpanded(true)} />;
      case "store":
        return <StoreView addToCart={addToCart} />;
      default:
        return (
          <ExploreView
            onNavigateToPlayer={() => setPlayerExpanded(true)}
            filteredStyle={filteredStyle}
          />
        );
    }
  };

  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* 1. TOP APP BAR */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--background)",
          border: "4px solid var(--primary)",
          padding: "8px 16px",
          height: "64px",
        }}
      >
        {/* Left Side: BUSCAR button */}
        <button
          onClick={() => setSearchActive(true)}
          className="neo-button fun-hover-wobble"
          style={{
            padding: "6px 14px",
            fontSize: "0.75rem",
            fontWeight: 900,
            backgroundColor: "var(--card-bg)",
            boxShadow: "3px 3px 0px var(--primary)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            transform: "rotate(-1.5deg)",
            ["--rest-rot" as any]: "-1.5deg",
          }}
        >
          <Search size={14} />
          <span>BUSCAR</span>
        </button>

        {/* Center: Logo */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            height: "54px",
            width: "54px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={() => {
            setFilteredStyle(null);
            setActiveTab("explore");
          }}
        >
          <svg
            viewBox="0 0 1080 1080"
            style={{
              height: "100%",
              width: "100%",
            }}
          >
            <g>
              <g>
                <path
                  fill="var(--primary)"
                  d="M760.9,637.1v97.7c0,65.1-36.2,101.3-101.3,101.3H416.4c-65.1,0-101.3-36.2-101.3-101.3V474.3c0-65.1,36.2-101.3,101.3-101.3h243.2c65.1,0,101.3,36.2,101.3,101.3v99.2c0,4.3-2.9,7.2-7.2,7.2H550.3c-4.3,0-7.2-2.9-7.2-7.2v-73.1h-29v208.4h29v-71.7c0-4.3,2.9-7.2,7.2-7.2h203.4C758,629.9,760.9,632.8,760.9,637.1z"
                />
              </g>
              <g>
                <path
                  fill="var(--background)"
                  d="M611.7,790.2H459.2c-30.9,0-56-25.1-56-56V476c0-30.9,25.1-56,56-56h152.5c30.9,0,56,25.1,56,56v64.7c0,9.6-7.8,17.4-17.4,17.4c-9.6,0-17.4-7.8-17.4-17.4V476c0-11.7-9.5-21.2-21.2-21.2H459.2c-11.7,0-21.2,9.5-21.2,21.2v258.1c0,11.7,9.5,21.2,21.2,21.2h152.5c11.7,0,21.2-9.5,21.2-21.2v-57.4c0-9.6,7.8-17.4,17.4-17.4c9.6,0,17.4,7.8,17.4,17.4v57.4C667.7,765,642.6,790.2,611.7,790.2z"
                />
              </g>
              <g>
                <g>
                  <path
                    fill="var(--primary)"
                    d="M748.6,325.5c-7.2,0-13-5.8-13-13v-23.2c0-7.2,5.8-13,13-13c7.2,0,13,5.8,13,13v23.2C761.6,319.6,755.8,325.5,748.6,325.5z"
                  />
                </g>
                <g>
                  <path
                    fill="var(--primary)"
                    d="M396,325.5c-7.2,0-13-5.8-13-13v-57.9c0-7.2,5.8-13,13-13c7.2,0,13,5.8,13,13v57.9C409,319.6,403.2,325.5,396,325.5z"
                  />
                </g>
                <g>
                  <path
                    fill="var(--primary)"
                    d="M327.4,325.5c-7.2,0-13-5.8-13-13v-23.2c0-7.2,5.8-13,13-13c7.2,0,13,5.8,13,13v23.2C340.4,319.6,334.6,325.5,327.4,325.5z"
                  />
                </g>
                <g>
                  <path
                    fill="var(--primary)"
                    d="M676,325.5c-7.2,0-13-5.8-13-13v-57.9c0-7.2,5.8-13,13-13s13,5.8,13,13v57.9C689,319.6,683.2,325.5,676,325.5z"
                  />
                </g>
                <g>
                  <path
                    fill="var(--primary)"
                    d="M607.4,325.5c-7.2,0-13-5.8-13-13v-23.2c0-7.2,5.8-13,13-13s13,5.8,13,13v23.2C620.4,319.6,614.6,325.5,607.4,325.5z"
                  />
                </g>
                <g>
                  <path
                    fill="var(--primary)"
                    d="M465.1,325.5c-7.2,0-13-5.8-13-13v-23.2c0-7.2,5.8-13,13-13s13,5.8,13,13v23.2C478.2,319.6,472.3,325.5,465.1,325.5z"
                  />
                </g>
                <g>
                  <path
                    fill="var(--primary)"
                    d="M537.3,325.5c-7.2,0-13-5.8-13-13v-95.6c0-7.2,5.8-13,13-13s13,5.8,13,13v95.6C550.3,319.6,544.5,325.5,537.3,325.5z"
                  />
                </g>
              </g>
            </g>
          </svg>
        </div>

        {/* Right Side: Navigation Links */}
        <nav style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => {
              setFilteredStyle(null);
              setActiveTab("explore");
            }}
            className="neo-button fun-hover-wobble"
            style={{
              padding: "6px 12px",
              fontSize: "0.75rem",
              fontWeight: 900,
              backgroundColor: activeTab === "explore" ? "var(--primary-container)" : "var(--card-bg)",
              boxShadow: activeTab === "explore" ? "1px 1px 0px var(--primary)" : "3px 3px 0px var(--primary)",
              transform: activeTab === "explore" ? "translate(1px, 1px) rotate(-1deg)" : "rotate(1.5deg)",
              cursor: "pointer",
              ["--rest-rot" as any]: activeTab === "explore" ? "-1deg" : "1.5deg",
            }}
          >
            EXPLORAR
          </button>
          
          <button
            onClick={() => setActiveTab("store")}
            className="neo-button fun-hover-wobble"
            style={{
              padding: "6px 12px",
              fontSize: "0.75rem",
              fontWeight: 900,
              backgroundColor: activeTab === "store" ? "var(--primary-container)" : "var(--card-bg)",
              boxShadow: activeTab === "store" ? "1px 1px 0px var(--primary)" : "3px 3px 0px var(--primary)",
              transform: activeTab === "store" ? "translate(1px, 1px) rotate(1deg)" : "rotate(-1.5deg)",
              cursor: "pointer",
              ["--rest-rot" as any]: activeTab === "store" ? "1deg" : "-1.5deg",
            }}
          >
            TIENDA
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className="neo-button fun-hover-wobble"
            style={{
              padding: "6px 12px",
              fontSize: "0.75rem",
              fontWeight: 900,
              backgroundColor: activeTab === "profile" ? "var(--primary-container)" : "var(--card-bg)",
              boxShadow: activeTab === "profile" ? "1px 1px 0px var(--primary)" : "3px 3px 0px var(--primary)",
              transform: activeTab === "profile" ? "translate(1px, 1px) rotate(-1.5deg)" : "rotate(1deg)",
              cursor: "pointer",
              ["--rest-rot" as any]: activeTab === "profile" ? "-1.5deg" : "1deg",
            }}
          >
            MI PERFIL
          </button>

          <button
            onClick={() => setCartOpen(true)}
            className="neo-button fun-hover-wobble"
            style={{
              padding: "6px 10px",
              fontSize: "0.75rem",
              fontWeight: 900,
              backgroundColor: "var(--card-bg)",
              boxShadow: "3px 3px 0px var(--primary)",
              cursor: "pointer",
              transform: "rotate(-1deg)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              position: "relative",
              ["--rest-rot" as any]: "-1deg",
            }}
          >
            <ShoppingCart size={14} />
            {cart.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  backgroundColor: "var(--error)",
                  color: "white",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid var(--primary)",
                  boxShadow: "1px 1px 0px var(--primary)",
                }}
              >
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </button>
        </nav>
      </header>

      {/* 2. BODY CONTENT SIDE-BY-SIDE GRID */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden", position: "relative" }}>
        {/* Main page scroll view */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            paddingBottom: activeTab === "store" ? "80px" : "120px", // spacing for footer bar/floating player
          }}
        >
          <ZineBackgroundFrame>
            {/* Massive body header title */}
            <div
              className="zine-header-title-container"
              style={{
                padding: "24px 16px 8px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                textAlign: "center",
              }}
            >
              <h1 className="zine-title-large">
                RADIO DOBLE C
              </h1>
              <div className="zine-subtitle-sticker">
                📻 98.9 FM — EL FANZINE RADIO BRUTAL
              </div>
            </div>

            {renderActiveView()}
          </ZineBackgroundFrame>
        </div>

        {/* Collapsible chat sidebar drawer */}
        {isChatSidebarOpen && (
          <ChatSidebar onClose={() => setChatSidebarOpen(false)} />
        )}
      </div>

      {/* 3. PERSISTENT SPOTIFY-STYLE FOOTER PLAYER BAR OR FLOATING PLAYER */}
      {activeTab === "store" ? (
        /* FLOATING COMPACT PLAYER ON BOTTOM-LEFT */
        <div
          onClick={() => setPlayerExpanded(true)}
          className="neo-card store-card-hover"
          style={{
            position: "fixed",
            bottom: "24px",
            left: "24px",
            zIndex: 1000,
            backgroundColor: "var(--primary-container)",
            border: "3px solid var(--primary)",
            boxShadow: "4px 4px 0px var(--primary)",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            transform: "rotate(-2deg)",
            maxWidth: "240px",
          }}
        >
          {/* Mini Spinning Vinyl Cover */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "2px solid var(--primary)",
              overflow: "hidden",
              flexShrink: 0,
              animation: isPlaying ? "spin 6s linear infinite" : "none",
            }}
          >
            <img
              src={currentTrack.imageUrl}
              alt="Vinyl"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Title & Play/Pause */}
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
            <div
              style={{
                fontSize: "0.65rem",
                fontWeight: 900,
                textTransform: "uppercase",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "var(--primary)",
                maxWidth: "110px",
              }}
            >
              {currentTrack.title}
            </div>
            <div style={{ fontSize: "0.55rem", fontWeight: "bold", color: "var(--secondary)", opacity: 0.8 }}>
              {currentTrack.artist}
            </div>
          </div>

          {/* Compact Play/Pause button */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent opening full overlay
              togglePlayPause();
            }}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "var(--card-bg)",
              border: "2px solid var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
              boxShadow: "1px 1px 0px var(--primary)",
            }}
          >
            {isPlaying ? (
              <Pause size={10} style={{ fill: "var(--primary)", color: "var(--primary)" }} />
            ) : (
              <Play size={10} style={{ fill: "var(--primary)", color: "var(--primary)", marginLeft: "1px" }} />
            )}
          </button>
        </div>
      ) : (
        <SpotifyPlayerBar
          isChatOpen={isChatSidebarOpen}
          onToggleChat={() => setChatSidebarOpen(!isChatSidebarOpen)}
          onExpand={() => setPlayerExpanded(true)}
        />
      )}

      {/* 4. SEARCH OVERLAY LAYER */}
      {isSearchActive && (
        <SearchOverlay
          onClose={() => setSearchActive(false)}
          onNavigateToPlayer={() => setPlayerExpanded(true)}
          onNavigateToExploreWithStyle={(style) => {
            setFilteredStyle(style);
            setSearchActive(false);
            setActiveTab("explore");
          }}
        />
      )}

      {/* 5. FULL SCREEN VINYL DECK OVERLAY */}
      {isPlayerExpanded && (
        <PlayerView onClose={() => setPlayerExpanded(false)} />
      )}

      {/* 6. SHOPPING CART DRAWER */}
      {isCartOpen && (
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
          onClick={() => setCartOpen(false)}
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
                onClick={() => setCartOpen(false)}
                className="neo-button fun-hover-wobble"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.7rem",
                  backgroundColor: "white",
                  boxShadow: "2px 2px 0px var(--primary)",
                  cursor: "pointer",
                  ["--rest-rot" as any]: "0deg",
                }}
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
                    ${cart.reduce((acc, item) => acc + parseFloat(item.product.price.replace("$", "")) * item.quantity, 0).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "bold", opacity: 0.8 }}>
                  <span>COSTO DE ENVÍO</span>
                  <span>$5.00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", fontWeight: 900, borderTop: "2px dashed var(--primary)", paddingTop: "8px", marginTop: "4px" }}>
                  <span>TOTAL ESTIMADO</span>
                  <span>
                    ${(cart.reduce((acc, item) => acc + parseFloat(item.product.price.replace("$", "")) * item.quantity, 0) + 5).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutStep("shipping");
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
      )}

      {/* 7. CHECKOUT MODAL: PASO A - ENVÍO */}
      {checkoutStep === "shipping" && (
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
            paddingBottom: "100px", // Pushes the modal up to clear bottom player area
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
                  setCartOpen(true);
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
                  <span>PRODUCTOS ({cart.reduce((acc, item) => acc + item.quantity, 0)})</span>
                  <span>
                    ${cart.reduce((acc, item) => acc + parseFloat(item.product.price.replace("$", "")) * item.quantity, 0).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", fontWeight: "bold" }}>
                  <span>COSTO DE ENVÍO</span>
                  <span>$5.00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 900, borderTop: "1.5px dashed var(--primary)", paddingTop: "4px", marginTop: "4px" }}>
                  <span>TOTAL A PAGAR</span>
                  <span>
                    ${(cart.reduce((acc, item) => acc + parseFloat(item.product.price.replace("$", "")) * item.quantity, 0) + 5).toFixed(2)}
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
      )}

      {/* 8. CHECKOUT MODAL: PASO B - PAGO POR MERCADO PAGO */}
      {checkoutStep === "payment" && (
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
            paddingBottom: "100px", // Pushes the modal up to clear bottom player area
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
                ${(cart.reduce((acc, item) => acc + parseFloat(item.product.price.replace("$", "")) * item.quantity, 0) + 5).toFixed(2)}
              </h2>
            </div>

            {/* MP Transfer details box */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", border: "3px solid var(--primary)", padding: "12px", backgroundColor: "var(--surface-container)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.6rem", fontWeight: "bold", opacity: 0.7 }}>ALIAS</span>
                  <p style={{ fontSize: "0.8rem", fontWeight: 900, fontFamily: "monospace" }}>doblec.radio.mp</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("doblec.radio.mp");
                    setIsCopiedAlias(true);
                    setTimeout(() => setIsCopiedAlias(false), 2000);
                  }}
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
                  <p style={{ fontSize: "0.8rem", fontWeight: 900, fontFamily: "monospace" }}>0000003100000002394821</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("0000003100000002394821");
                    setIsCopiedCvu(true);
                    setTimeout(() => setIsCopiedCvu(false), 2000);
                  }}
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
                  Abre la app de MP, selecciona "Escanear QR" y transfiere el total para validación instantánea.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!paymentTxId) {
                  alert("Por favor ingresa el ID de transacción.");
                  return;
                }
                setCheckoutStep("success");
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

              <button
                type="submit"
                className="neo-button"
                style={{
                  backgroundColor: "var(--primary-container)",
                  width: "100%",
                  padding: "10px",
                  fontSize: "0.75rem",
                  marginTop: "6px",
                }}
              >
                VALIDAR TRANSFERENCIA 🛡️
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 9. CHECKOUT MODAL: PASO C - VALIDACIÓN EN PROCESO */}
      {checkoutStep === "success" && (
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
            paddingBottom: "100px", // Pushes the modal up to clear bottom player area
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
              onClick={() => {
                setCheckoutStep("idle");
                clearCart();
                setShippingName("");
                setShippingPhone("");
                setShippingEmail("");
                setShippingAddress("");
                setShippingCity("");
                setPaymentTxId("");
                setPaymentReceiptName("");
              }}
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
      )}
    </main>
  );
}
