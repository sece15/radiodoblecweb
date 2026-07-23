"use client";

import { useState } from "react";
import { useAudio } from "@/hooks/useAudio";
import { ZineBackgroundFrame } from "@/components/ZineBackgroundFrame";
import { ExploreView } from "@/components/ExploreView";
import { PlayerView } from "@/components/PlayerView";
import { ProfileView } from "@/components/ProfileView";
import { StoreView } from "@/components/StoreView";
import { VipView } from "@/components/VipView";
import { SearchOverlay } from "@/components/SearchOverlay";
import { ChatSidebar } from "@/components/ChatSidebar";
import { SpotifyPlayerBar } from "@/components/SpotifyPlayerBar";
import { Play, Pause } from "lucide-react";

// Custom Hooks
import { useToast } from "@/hooks/useToast";
import { useCart } from "@/hooks/useCart";
import { CheckoutStep } from "@/hooks/useCheckout";

// Modular UI Components
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Toast } from "@/components/Toast";

type ActiveTab = "explore" | "store" | "profile" | "vip";

export default function Home() {
  const { isPlaying, currentTrack, togglePlayPause, isAuthenticated } = useAudio();

  const [activeTab, setActiveTab] = useState<ActiveTab>("explore");
  const [isSearchActive, setSearchActive] = useState(false);
  const [filteredStyle, setFilteredStyle] = useState<string | null>(null);

  // Layout states
  const [isChatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [isPlayerExpanded, setPlayerExpanded] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Hook integrations
  const { toastMessage, toastType, showToast, setToastMessage } = useToast();
  const { cart, isCartOpen, setCartOpen, addToCart, removeFromCart, updateCartItemQuantity, clearCart } = useCart();

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("idle");

  // Helper to render current active panel/tab
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
        return <StoreView addToCart={addToCart} onModalToggle={setIsProductModalOpen} />;
      case "vip":
        return <VipView onNavigateToPlayer={() => setPlayerExpanded(true)} />;
      default:
        return (
          <ExploreView
            onNavigateToPlayer={() => setPlayerExpanded(true)}
            filteredStyle={filteredStyle}
          />
        );
    }
  };

  const handleSuccessBackToStore = () => {
    setCheckoutStep("idle");
    clearCart();
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <main
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* 1. TOP APP BAR */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSearchActive={setSearchActive}
        setFilteredStyle={setFilteredStyle}
        setCartOpen={setCartOpen}
        cartCount={cartCount}
      />

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
            position: "relative",
            zIndex: isProductModalOpen ? 4000 : "auto",
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
                Fucking good Shit
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
        /* FLOATING COMPACT PLAYER ON BOTTOM-RIGHT */
        <div
          onClick={() => setPlayerExpanded(true)}
          className="neo-card store-card-hover"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
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
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        updateCartItemQuantity={updateCartItemQuantity}
        removeFromCart={removeFromCart}
        isAuthenticated={isAuthenticated}
        showToast={showToast}
        setActiveTab={setActiveTab}
        onCheckout={() => setCheckoutStep("shipping")}
      />

      {/* 7, 8, 9. CHECKOUT MODALS */}
      {checkoutStep !== "idle" && (
        <CheckoutModal
          step={checkoutStep}
          setCheckoutStep={setCheckoutStep}
          cart={cart}
          onSuccessBackToStore={handleSuccessBackToStore}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage(null)}
      />
    </main>
  );
}
