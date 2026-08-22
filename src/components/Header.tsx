"use client";

import { CSSProperties, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, ShoppingCart, Calendar, Menu, X, Radio, Sparkles, User, ShoppingBag, Newspaper } from "lucide-react";
import { RadioLogo } from "@/components/RadioLogo";
import { HeaderNewsTicker } from "@/components/HeaderNewsTicker";
import { NewsModal } from "@/components/NewsModal";
import { useAudio } from "@/hooks/useAudio";
import { useNews } from "@/hooks/useNews";
import { isVip } from "@/lib/permissions";

type ActiveTab = "explore" | "store" | "profile" | "vip";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  setSearchActive: (active: boolean) => void;
  setFilteredStyle: (style: string | null) => void;
  setCartOpen: (open: boolean) => void;
  cartCount: number;
}

export const Header = ({
  activeTab,
  setActiveTab,
  setSearchActive,
  setFilteredStyle,
  setCartOpen,
  cartCount,
}: HeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userProfile } = useAudio();

  // News hook integration
  const {
    news,
    selectedCategory,
    setSelectedCategory,
    selectedNewsItem,
    setSelectedNewsItem,
    isNewsModalOpen,
    setNewsModalOpen,
    isLoading: isNewsLoading,
    refreshNews,
    lastUpdated,
  } = useNews();

  const isVipUser = isVip(userProfile.role);

  // Active status checks
  const isHorarios = pathname === "/horarios";
  const isExplore = pathname === "/" && activeTab === "explore";
  const isStore = pathname === "/" && activeTab === "store";
  const isVipTab = pathname === "/" && activeTab === "vip";
  const isProfile = pathname === "/" && activeTab === "profile";

  // Navigation handler that works across routes
  const handleNavClick = (tab: ActiveTab) => {
    setIsMenuOpen(false);
    setFilteredStyle(null);
    if (pathname === "/") {
      setActiveTab(tab);
    } else {
      router.push(`/?tab=${tab}`);
    }
  };

  // Close menu on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  return (
    <>
      <div style={{ position: "sticky", top: 0, zIndex: 100, width: "100%" }}>
        {/* 1. TOP BREAKING NEWS TICKER */}
        <HeaderNewsTicker
          news={news}
          onOpenNews={(item) => {
            if (item) setSelectedNewsItem(item);
            setNewsModalOpen(true);
          }}
          isLoading={isNewsLoading}
        />

        {/* 2. MAIN APP BAR */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--background)",
            borderBottom: "4px solid var(--primary)",
            padding: "10px 18px",
            height: "80px",
            width: "100%",
            position: "relative",
          }}
        >
        {/* 1. LEFT SIDE: BUSCAR BUTTON */}
        <button
          onClick={() => setSearchActive(true)}
          className="neo-button fun-hover-wobble"
          style={{
            padding: "7px 14px",
            fontSize: "0.75rem",
            fontWeight: 900,
            backgroundColor: "var(--card-bg)",
            boxShadow: "3px 3px 0px var(--primary)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            transform: "rotate(-1.5deg)",
            "--rest-rot": "-1.5deg",
          } as CSSProperties}
          title="Buscar estaciones, canciones y programas"
        >
          <Search size={14} />
          <span>BUSCAR</span>
        </button>

        {/* 2. CENTER: LOGO (CENTERED & CLEAN) */}
        <div
          onClick={() => handleNavClick("explore")}
          className="header-logo-container"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            height: "72px",
            width: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          title="Radio Doble C - Inicio"
        >
          <RadioLogo />
        </div>

        {/* 3. RIGHT SIDE: VIP + CART + BURGER MENU BUTTON */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* VIP Badge (Desktop only if VIP) */}
          {isVipUser && (
            <button
              onClick={() => handleNavClick("vip")}
              className="neo-button fun-hover-wobble desktop-only-flex"
              style={{
                padding: "6px 12px",
                fontSize: "0.72rem",
                fontWeight: 900,
                backgroundColor: isVipTab ? "#CCFF00" : "#FFDE82",
                color: "#111111",
                boxShadow: isVipTab ? "1px 1px 0px var(--primary)" : "2.5px 2.5px 0px var(--primary)",
                cursor: "pointer",
                transform: isVipTab ? "translate(1.5px, 1.5px) rotate(0deg)" : "rotate(1.5deg)",
                "--rest-rot": isVipTab ? "0deg" : "1.5deg",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              } as CSSProperties}
            >
              <Sparkles size={13} />
              ZONA VIP ⭐
            </button>
          )}

          {/* Cart Button */}
          <button
            onClick={() => setCartOpen(true)}
            className="neo-button fun-hover-wobble"
            style={{
              padding: "7px 11px",
              fontSize: "0.75rem",
              fontWeight: 900,
              backgroundColor: "var(--card-bg)",
              boxShadow: "2.5px 2.5px 0px var(--primary)",
              cursor: "pointer",
              transform: "rotate(-1deg)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              position: "relative",
              "--rest-rot": "-1deg",
            } as CSSProperties}
            title="Ver Carrito de Compras"
          >
            <ShoppingCart size={15} />
            {cartCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-7px",
                  right: "-7px",
                  backgroundColor: "#BA1A1A",
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
                {cartCount}
              </span>
            )}
          </button>

          {/* MAIN BURGER MENU BUTTON */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="neo-button fun-hover-wobble header-menu-btn"
            style={{
              padding: "6px 12px",
              backgroundColor: isMenuOpen ? "var(--primary-container)" : "var(--primary)",
              color: isMenuOpen ? "var(--primary)" : "var(--on-primary)",
              boxShadow: isMenuOpen ? "1px 1px 0px var(--primary)" : "2.5px 2.5px 0px var(--primary-container)",
              transform: isMenuOpen ? "translate(1.5px, 1.5px) rotate(0deg)" : "rotate(1deg)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.72rem",
              fontWeight: 900,
              letterSpacing: "0.5px",
              "--rest-rot": isMenuOpen ? "0deg" : "1deg",
            } as CSSProperties}
            aria-label="Abrir Menú Principal"
            title="Abrir Menú de Navegación"
          >
            {isMenuOpen ? <X size={15} /> : <Menu size={15} />}
            <span>MENÚ</span>
          </button>
        </div>
      </header>
    </div>

      {/* 4. BACKDROP OVERLAY */}
      <div
        className={`side-menu-backdrop ${isMenuOpen ? "open" : ""}`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* 5. SIDE DRAWER NAVIGATION PANEL */}
      <aside className={`mobile-menu-drawer ${isMenuOpen ? "open" : ""}`}>
        {/* Drawer Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingBottom: "10px",
            borderBottom: "2.5px solid var(--primary)",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              padding: "3px 8px",
              fontSize: "0.68rem",
              fontWeight: 900,
              letterSpacing: "0.8px",
              transform: "rotate(-1.5deg)",
              boxShadow: "2px 2px 0px var(--primary-container)",
            }}
          >
            📻 MENÚ RADIO DOBLE C
          </div>

          <button
            onClick={() => setIsMenuOpen(false)}
            className="neo-button fun-hover-wobble"
            style={{
              padding: "4px 8px",
              backgroundColor: "var(--card-bg)",
              fontSize: "0.65rem",
              fontWeight: 900,
              boxShadow: "1.5px 1.5px 0px var(--primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <X size={12} />
            CERRAR
          </button>
        </div>

        {/* Navigation Links with Distinct Active State */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", alignItems: "center" }}>
          {/* 1. Explorar */}
          <button
            onClick={() => handleNavClick("explore")}
            className="mobile-nav-link fun-hover-wobble"
            style={{
              backgroundColor: isExplore ? "#CCFF00" : "var(--card-bg)",
              color: isExplore ? "#161E00" : "var(--primary)",
              border: "2.5px solid var(--primary)",
              boxShadow: isExplore ? "1.5px 1.5px 0px var(--primary)" : "3.5px 3.5px 0px var(--primary)",
              transform: isExplore ? "translate(1.5px, 1.5px) rotate(0deg)" : "rotate(-1deg)",
              "--rest-rot": isExplore ? "0deg" : "-1deg",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 14px",
            } as CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Radio size={16} />
              <span>EXPLORAR RADIO</span>
            </div>
            {isExplore && (
              <span
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#CCFF00",
                  fontSize: "0.55rem",
                  fontWeight: 900,
                  padding: "2px 6px",
                  letterSpacing: "0.8px",
                  border: "1px solid var(--primary)",
                }}
              >
                ● ACTIVO
              </span>
            )}
          </button>

          {/* 2. Horarios & Canciones */}
          <Link
            href="/horarios"
            onClick={() => setIsMenuOpen(false)}
            className="mobile-nav-link fun-hover-wobble"
            style={{
              backgroundColor: isHorarios ? "#CCFF00" : "var(--card-bg)",
              color: isHorarios ? "#161E00" : "var(--primary)",
              border: "2.5px solid var(--primary)",
              boxShadow: isHorarios ? "1.5px 1.5px 0px var(--primary)" : "3.5px 3.5px 0px var(--primary)",
              transform: isHorarios ? "translate(1.5px, 1.5px) rotate(0deg)" : "rotate(1.5deg)",
              textDecoration: "none",
              "--rest-rot": isHorarios ? "0deg" : "1.5deg",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 14px",
            } as CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={16} />
              <span>MÚSICA &amp; HORARIOS 24/7</span>
            </div>
            {isHorarios && (
              <span
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#CCFF00",
                  fontSize: "0.55rem",
                  fontWeight: 900,
                  padding: "2px 6px",
                  letterSpacing: "0.8px",
                  border: "1px solid var(--primary)",
                }}
              >
                ● ACTIVO
              </span>
            )}
          </Link>

          {/* 3. Tienda */}
          <button
            onClick={() => handleNavClick("store")}
            className="mobile-nav-link fun-hover-wobble"
            style={{
              backgroundColor: isStore ? "#CCFF00" : "var(--card-bg)",
              color: isStore ? "#161E00" : "var(--primary)",
              border: "2.5px solid var(--primary)",
              boxShadow: isStore ? "1.5px 1.5px 0px var(--primary)" : "3.5px 3.5px 0px var(--primary)",
              transform: isStore ? "translate(1.5px, 1.5px) rotate(0deg)" : "rotate(-1.5deg)",
              "--rest-rot": isStore ? "0deg" : "-1.5deg",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 14px",
            } as CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShoppingBag size={16} />
              <span>TIENDA OFICIAL</span>
            </div>
            {isStore && (
              <span
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#CCFF00",
                  fontSize: "0.55rem",
                  fontWeight: 900,
                  padding: "2px 6px",
                  letterSpacing: "0.8px",
                  border: "1px solid var(--primary)",
                }}
              >
                ● ACTIVO
              </span>
            )}
          </button>

          {/* 4. Zona VIP */}
          <button
            onClick={() => handleNavClick("vip")}
            className="mobile-nav-link fun-hover-wobble"
            style={{
              backgroundColor: isVipTab ? "#CCFF00" : isVipUser ? "#FFDE82" : "var(--card-bg)",
              color: isVipTab ? "#161E00" : "var(--primary)",
              border: "2.5px solid var(--primary)",
              boxShadow: isVipTab ? "1.5px 1.5px 0px var(--primary)" : "3.5px 3.5px 0px var(--primary)",
              transform: isVipTab ? "translate(1.5px, 1.5px) rotate(0deg)" : "rotate(1deg)",
              "--rest-rot": isVipTab ? "0deg" : "1deg",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 14px",
            } as CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} />
              <span>ZONA VIP ⭐</span>
            </div>
            {isVipTab && (
              <span
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#CCFF00",
                  fontSize: "0.55rem",
                  fontWeight: 900,
                  padding: "2px 6px",
                  letterSpacing: "0.8px",
                  border: "1px solid var(--primary)",
                }}
              >
                ● ACTIVO
              </span>
            )}
          </button>

          {/* 5. Mi Perfil */}
          <button
            onClick={() => handleNavClick("profile")}
            className="mobile-nav-link fun-hover-wobble"
            style={{
              backgroundColor: isProfile ? "#CCFF00" : "var(--card-bg)",
              color: isProfile ? "#161E00" : "var(--primary)",
              border: "2.5px solid var(--primary)",
              boxShadow: isProfile ? "1.5px 1.5px 0px var(--primary)" : "3.5px 3.5px 0px var(--primary)",
              transform: isProfile ? "translate(1.5px, 1.5px) rotate(0deg)" : "rotate(-1deg)",
              "--rest-rot": isProfile ? "0deg" : "-1deg",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 14px",
            } as CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={16} />
              <span>MI PERFIL &amp; AJUSTES</span>
            </div>
            {isProfile && (
              <span
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#CCFF00",
                  fontSize: "0.55rem",
                  fontWeight: 900,
                  padding: "2px 6px",
                  letterSpacing: "0.8px",
                  border: "1px solid var(--primary)",
                }}
              >
                ● ACTIVO
              </span>
            )}
          </button>

          {/* 6. Noticias Mundo & Latam */}
          <button
            onClick={() => {
              setIsMenuOpen(false);
              setNewsModalOpen(true);
            }}
            className="mobile-nav-link fun-hover-wobble"
            style={{
              backgroundColor: isNewsModalOpen ? "#CCFF00" : "var(--card-bg)",
              color: isNewsModalOpen ? "#161E00" : "var(--primary)",
              border: "2.5px solid var(--primary)",
              boxShadow: isNewsModalOpen ? "1.5px 1.5px 0px var(--primary)" : "3.5px 3.5px 0px var(--primary)",
              transform: isNewsModalOpen ? "translate(1.5px, 1.5px) rotate(0deg)" : "rotate(-1deg)",
              "--rest-rot": isNewsModalOpen ? "0deg" : "-1deg",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 14px",
            } as CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Newspaper size={16} />
              <span>FLASH DEL MUNDO</span>
            </div>
            <span
              style={{
                backgroundColor: "#BA1A1A",
                color: "#FFFFFF",
                fontSize: "0.55rem",
                fontWeight: 900,
                padding: "2px 6px",
                letterSpacing: "0.8px",
                border: "1px solid var(--primary)",
              }}
            >
              ● EN VIVO
            </span>
          </button>
        </div>

        {/* Small radio sticker badge at bottom */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "16px",
            borderTop: "2px dashed var(--primary)",
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "1px" }}>
            📻 APOYE A SU RADIO LOCAL
          </div>
          <div style={{ fontSize: "0.62rem", fontWeight: "bold", opacity: 0.75 }}>
            FUCKING GOOD SHIT © 2026 • RADIO DOBLE C
          </div>
        </div>
      </aside>

      {/* 6. MODAL DE NOTICIAS MUNDO & LATAM */}
      <NewsModal
        isOpen={isNewsModalOpen}
        onClose={() => {
          setNewsModalOpen(false);
          setSelectedNewsItem(null);
        }}
        news={news}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedNewsItem={selectedNewsItem}
        setSelectedNewsItem={setSelectedNewsItem}
        isLoading={isNewsLoading}
        refreshNews={refreshNews}
        lastUpdated={lastUpdated}
      />
    </>
  );
};
