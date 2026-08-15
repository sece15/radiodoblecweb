"use client";

import { CSSProperties, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, ShoppingCart, Calendar, Menu, X, Radio, Sparkles, User, ShoppingBag } from "lucide-react";
import { useAudio } from "@/hooks/useAudio";
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
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--background)",
          borderBottom: "4px solid var(--primary)",
          padding: "10px 18px",
          height: "80px",
          width: "100%",
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
          className="header-logo-container fun-hover-wobble"
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
          <svg viewBox="0 0 1080 1080" style={{ height: "100%", width: "100%" }}>
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
            className="neo-button fun-hover-wobble"
            style={{
              padding: "7px 14px",
              backgroundColor: isMenuOpen ? "var(--primary-container)" : "var(--primary)",
              color: isMenuOpen ? "var(--primary)" : "var(--on-primary)",
              boxShadow: isMenuOpen ? "1px 1px 0px var(--primary)" : "3px 3px 0px var(--primary-container)",
              transform: isMenuOpen ? "translate(2px, 2px) rotate(0deg)" : "rotate(1deg)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "0.75rem",
              fontWeight: 900,
              letterSpacing: "0.5px",
              "--rest-rot": isMenuOpen ? "0deg" : "1deg",
            } as CSSProperties}
            aria-label="Abrir Menú Principal"
            title="Abrir Menú de Navegación"
          >
            {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
            <span>MENÚ</span>
          </button>
        </div>
      </header>

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
            paddingBottom: "12px",
            borderBottom: "3px solid var(--primary)",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              padding: "4px 10px",
              fontSize: "0.72rem",
              fontWeight: 900,
              letterSpacing: "1px",
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
              padding: "5px 10px",
              backgroundColor: "var(--card-bg)",
              fontSize: "0.68rem",
              fontWeight: 900,
              boxShadow: "2px 2px 0px var(--primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <X size={13} />
            CERRAR
          </button>
        </div>

        {/* Navigation Links with Distinct Active State */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", alignItems: "center" }}>
          {/* 1. Explorar */}
          <button
            onClick={() => handleNavClick("explore")}
            className="mobile-nav-link fun-hover-wobble"
            style={{
              backgroundColor: isExplore ? "#CCFF00" : "var(--card-bg)",
              color: isExplore ? "#161E00" : "var(--primary)",
              border: "3.5px solid var(--primary)",
              boxShadow: isExplore ? "2px 2px 0px var(--primary)" : "5px 5px 0px var(--primary)",
              transform: isExplore ? "translate(2px, 2px) rotate(0deg)" : "rotate(-1deg)",
              "--rest-rot": isExplore ? "0deg" : "-1deg",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
            } as CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Radio size={19} />
              <span>EXPLORAR RADIO</span>
            </div>
            {isExplore && (
              <span
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#CCFF00",
                  fontSize: "0.58rem",
                  fontWeight: 900,
                  padding: "2px 7px",
                  letterSpacing: "1px",
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
              border: "3.5px solid var(--primary)",
              boxShadow: isHorarios ? "2px 2px 0px var(--primary)" : "5px 5px 0px var(--primary)",
              transform: isHorarios ? "translate(2px, 2px) rotate(0deg)" : "rotate(1.5deg)",
              textDecoration: "none",
              "--rest-rot": isHorarios ? "0deg" : "1.5deg",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
            } as CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Calendar size={19} />
              <span>MÚSICA &amp; HORARIOS 24/7</span>
            </div>
            {isHorarios && (
              <span
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#CCFF00",
                  fontSize: "0.58rem",
                  fontWeight: 900,
                  padding: "2px 7px",
                  letterSpacing: "1px",
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
              border: "3.5px solid var(--primary)",
              boxShadow: isStore ? "2px 2px 0px var(--primary)" : "5px 5px 0px var(--primary)",
              transform: isStore ? "translate(2px, 2px) rotate(0deg)" : "rotate(-1.5deg)",
              "--rest-rot": isStore ? "0deg" : "-1.5deg",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
            } as CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShoppingBag size={19} />
              <span>TIENDA OFICIAL</span>
            </div>
            {isStore && (
              <span
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#CCFF00",
                  fontSize: "0.58rem",
                  fontWeight: 900,
                  padding: "2px 7px",
                  letterSpacing: "1px",
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
              border: "3.5px solid var(--primary)",
              boxShadow: isVipTab ? "2px 2px 0px var(--primary)" : "5px 5px 0px var(--primary)",
              transform: isVipTab ? "translate(2px, 2px) rotate(0deg)" : "rotate(1deg)",
              "--rest-rot": isVipTab ? "0deg" : "1deg",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
            } as CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Sparkles size={19} />
              <span>ZONA VIP ⭐</span>
            </div>
            {isVipTab && (
              <span
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#CCFF00",
                  fontSize: "0.58rem",
                  fontWeight: 900,
                  padding: "2px 7px",
                  letterSpacing: "1px",
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
              border: "3.5px solid var(--primary)",
              boxShadow: isProfile ? "2px 2px 0px var(--primary)" : "5px 5px 0px var(--primary)",
              transform: isProfile ? "translate(2px, 2px) rotate(0deg)" : "rotate(-1deg)",
              "--rest-rot": isProfile ? "0deg" : "-1deg",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
            } as CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <User size={19} />
              <span>MI PERFIL &amp; AJUSTES</span>
            </div>
            {isProfile && (
              <span
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#CCFF00",
                  fontSize: "0.58rem",
                  fontWeight: 900,
                  padding: "2px 7px",
                  letterSpacing: "1px",
                  border: "1px solid var(--primary)",
                }}
              >
                ● ACTIVO
              </span>
            )}
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
    </>
  );
};
