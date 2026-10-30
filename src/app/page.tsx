"use client";

import { useState, useCallback } from "react";
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
import { useWakeLock } from "@/hooks/useWakeLock";
import { CheckoutStep } from "@/hooks/useCheckout";

// Modular UI Components
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Toast } from "@/components/Toast";
import { VinylSpinModal } from "@/components/tools/VinylSpinModal";
import { SponsorOrderModal } from "@/components/sponsors/SponsorOrderModal";
import { LiveDropNotification } from "@/components/common/LiveDropNotification";
import { useGamification } from "@/hooks/useGamification";
import { SpookySpider } from "@/components/halloween/SpookySpider";
import { SpookyCobwebs } from "@/components/halloween/SpookyCobwebs";
import { SpookyBats } from "@/components/halloween/SpookyBats";
import { useShallow } from "zustand/react/shallow";

type ActiveTab = "explore" | "store" | "profile" | "vip";

export default function Home() {
  useWakeLock(true);
  const {
    isPlaying,
    currentTrack,
    togglePlayPause,
    isAuthenticated,
    userProfile,
    isSponsorModalOpen,
    setIsSponsorModalOpen,
    activeSponsorSlug,
  } = useAudio(
    useShallow((s) => ({
      isPlaying: s.isPlaying,
      currentTrack: s.currentTrack,
      togglePlayPause: s.togglePlayPause,
      isAuthenticated: s.isAuthenticated,
      userProfile: s.userProfile,
      isSponsorModalOpen: s.isSponsorModalOpen,
      setIsSponsorModalOpen: s.setIsSponsorModalOpen,
      activeSponsorSlug: s.activeSponsorSlug,
    }))
  );
  const { canSpinToday, isSpinning, spinVinyl, activeDrop, claimDrop, dismissDrop } = useGamification();
  const [isSpinModalOpen, setSpinModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as ActiveTab | null;
      if (tabParam && ["explore", "store", "profile", "vip"].includes(tabParam)) {
        return tabParam;
      }
    }
    return "explore";
  });
  const [isScrolled, setIsScrolled] = useState(false);

  // Reset scroll state during render when active tab changes (avoiding cascading effect renders)
  const [prevTab, setPrevTab] = useState(activeTab);
  if (prevTab !== activeTab) {
    setPrevTab(activeTab);
    setIsScrolled(false);
  }

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setIsScrolled(false);
  }, []);

  const [isSearchActive, setSearchActive] = useState(false);
  const [filteredStyle, setFilteredStyle] = useState<string | null>(null);

  // Layout states
  const [isChatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [isPlayerExpanded, setPlayerExpanded] = useState(false);
  const [playerInitialTab, setPlayerInitialTab] = useState<"player" | "chat">("player");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const isAnyModalOpen = isProductModalOpen || isSponsorModalOpen;

  // Hook integrations
  const { toastMessage, toastType, showToast, setToastMessage } = useToast();
  const { cart, isCartOpen, setCartOpen, addToCart, removeFromCart, updateCartItemQuantity, clearCart } = useCart();

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("idle");

  const openPlayer = (tab: "player" | "chat" = "player") => {
    setPlayerInitialTab(tab);
    setPlayerExpanded(true);
  };

  // Helper to render current active panel/tab
  const renderActiveView = () => {
    switch (activeTab) {
      case "explore":
        return (
          <ExploreView
            isChatOpen={isChatSidebarOpen}
            onNavigateToPlayer={openPlayer}
            filteredStyle={filteredStyle}
          />
        );
      case "profile":
        return <ProfileView onNavigateToPlayer={() => openPlayer("player")} />;
      case "store":
        return <StoreView addToCart={addToCart} onModalToggle={setIsProductModalOpen} />;
      case "vip":
        return <VipView onNavigateToPlayer={() => openPlayer("player")} />;
      default:
        return (
          <ExploreView
            isChatOpen={isChatSidebarOpen}
            onNavigateToPlayer={openPlayer}
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
      {!isAnyModalOpen && (
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          setSearchActive={setSearchActive}
          setFilteredStyle={setFilteredStyle}
          setCartOpen={setCartOpen}
          cartCount={cartCount}
          onOpenSpin={() => setSpinModalOpen(true)}
          isScrolled={isScrolled}
          isChatOpen={isChatSidebarOpen}
        />
      )}

      {/* 2. BODY CONTENT SIDE-BY-SIDE GRID */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "visible", position: "relative" }}>
        {/* Main page scroll view */}
        <div
          data-radio-content
          onScroll={(e) => {
            const st = e.currentTarget.scrollTop;
            if (st > 20 && !isScrolled) setIsScrolled(true);
            else if (st <= 20 && isScrolled) setIsScrolled(false);
          }}
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            paddingBottom: activeTab === "store" ? "80px" : "120px", // spacing for footer bar/floating player
            position: "relative",
            marginTop: activeTab === "explore" ? "-122px" : "0px",
            zIndex: isProductModalOpen ? 4000 : "auto",
          }}
        >
          <ZineBackgroundFrame>
            {renderActiveView()}
          </ZineBackgroundFrame>
        </div>

        {/* Collapsible chat sidebar drawer */}
        {isChatSidebarOpen && (
          <ChatSidebar onClose={() => setChatSidebarOpen(false)} />
        )}

        {/* Decoraciones y animaciones ambientales de Halloween */}
        <SpookySpider idleTimeoutMs={5000} />
        <SpookyCobwebs opacity={0.55} allCorners={true} />
        <SpookyBats count={5} />
      </div>

      {/* 3. PERSISTENT SPOTIFY-STYLE FOOTER PLAYER BAR OR FLOATING PLAYER */}
      {!isAnyModalOpen && (
        activeTab === "store" ? (
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
                src={currentTrack.imageUrl || "/RADIO.png"}
                alt="Vinyl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/RADIO.png";
                }}
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
        )
      )}

      {/* 4. SEARCH OVERLAY LAYER */}
      {isSearchActive && (
        <SearchOverlay
          onClose={() => setSearchActive(false)}
          onNavigateToPlayer={() => setPlayerExpanded(true)}
          onNavigateToExploreWithStyle={(style) => {
            setFilteredStyle(style);
            setSearchActive(false);
            handleTabChange("explore");
          }}
        />
      )}

      {/* 5. FULL SCREEN VINYL DECK OVERLAY */}
      {isPlayerExpanded && (
        <PlayerView
          onClose={() => setPlayerExpanded(false)}
          initialTab={playerInitialTab}
        />
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
        setActiveTab={handleTabChange}
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

      {/* 10. DAILY VINYL SPIN MODAL */}
      <VinylSpinModal
        isOpen={isSpinModalOpen}
        onClose={() => setSpinModalOpen(false)}
        canSpinToday={canSpinToday}
        isSpinning={isSpinning}
        onSpin={spinVinyl}
      />

      {/* 11. SPONSORS & ORDERING MODAL */}
      <SponsorOrderModal
        isOpen={isSponsorModalOpen}
        onClose={() => setIsSponsorModalOpen(false)}
        initialSponsorSlug={activeSponsorSlug || "pizzas"}
        userName={userProfile?.name}
      />

      {/* 12. LIVE STREAMING C-DROP TOAST */}
      <LiveDropNotification
        drop={activeDrop}
        onClaim={claimDrop}
        onDismiss={dismissDrop}
      />
    </main>
  );
}
