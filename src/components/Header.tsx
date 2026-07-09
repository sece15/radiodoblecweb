import { CSSProperties, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { useAudio } from "@/context/AudioContext";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userProfile } = useAudio();

  const isVipUser =
    userProfile.role.toUpperCase().includes("VIP") ||
    userProfile.role.toUpperCase().includes("ADMIN") ||
    userProfile.role.toUpperCase().includes("MOD") ||
    userProfile.role.toUpperCase().includes("STREAMER");

  return (
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
        height: "88px",
      }}
    >
      {/* Left Side: BUSCAR button */}
      <button
        onClick={() => setSearchActive(true)}
        className="neo-button fun-hover-wobble search-button"
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
          "--rest-rot": "-1.5deg",
        } as CSSProperties}
      >
        <Search size={14} />
        <span className="search-button-text">BUSCAR</span>
      </button>

      {/* Center: Logo */}
      <div
        className="header-logo-container"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          height: "80px",
          width: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        onClick={() => {
          setFilteredStyle(null);
          setActiveTab("explore");
          setIsMobileMenuOpen(false);
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

      {/* Right Side (Desktop Only): Navigation Links + Cart */}
      <nav className="desktop-only-flex" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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
            boxShadow: activeTab === "explore" ? "0px 0px 0px var(--primary)" : "3px 3px 0px var(--primary)",
            transform: activeTab === "explore" ? "translate(3px, 3px) rotate(0deg)" : "rotate(1.5deg)",
            cursor: "pointer",
            "--rest-rot": activeTab === "explore" ? "0deg" : "1.5deg",
          } as CSSProperties}
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
            boxShadow: activeTab === "store" ? "0px 0px 0px var(--primary)" : "3px 3px 0px var(--primary)",
            transform: activeTab === "store" ? "translate(3px, 3px) rotate(0deg)" : "rotate(-1.5deg)",
            cursor: "pointer",
            "--rest-rot": activeTab === "store" ? "0deg" : "-1.5deg",
          } as CSSProperties}
        >
          TIENDA
        </button>

        {isVipUser && (
          <button
            onClick={() => setActiveTab("vip")}
            className="neo-button fun-hover-wobble"
            style={{
              padding: "6px 12px",
              fontSize: "0.75rem",
              fontWeight: 900,
              backgroundColor: activeTab === "vip" ? "var(--primary-container)" : "var(--card-bg)",
              boxShadow: activeTab === "vip" ? "0px 0px 0px var(--primary)" : "3px 3px 0px var(--primary)",
              transform: activeTab === "vip" ? "translate(3px, 3px) rotate(0deg)" : "rotate(2deg)",
              cursor: "pointer",
              "--rest-rot": activeTab === "vip" ? "0deg" : "2deg",
              color: "var(--primary)",
            } as CSSProperties}
          >
            ZONA VIP ⭐
          </button>
        )}

        <button
          onClick={() => setActiveTab("profile")}
          className="neo-button fun-hover-wobble"
          style={{
            padding: "6px 12px",
            fontSize: "0.75rem",
            fontWeight: 900,
            backgroundColor: activeTab === "profile" ? "var(--primary-container)" : "var(--card-bg)",
            boxShadow: activeTab === "profile" ? "0px 0px 0px var(--primary)" : "3px 3px 0px var(--primary)",
            transform: activeTab === "profile" ? "translate(3px, 3px) rotate(0deg)" : "rotate(1deg)",
            cursor: "pointer",
            "--rest-rot": activeTab === "profile" ? "0deg" : "1deg",
          } as CSSProperties}
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
            "--rest-rot": "-1deg",
          } as CSSProperties}
        >
          <ShoppingCart size={14} />
          {cartCount > 0 && (
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
              {cartCount}
            </span>
          )}
        </button>
      </nav>

      {/* Right Side (Mobile Only): Cart Icon + Radio-Styled Hamburger Button */}
      <div className="mobile-only-flex" style={{ gap: "8px", alignItems: "center" }}>
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
            "--rest-rot": "-1deg",
          } as CSSProperties}
        >
          <ShoppingCart size={14} />
          {cartCount > 0 && (
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
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="neo-button fun-hover-wobble"
          style={{
            padding: "6px",
            backgroundColor: isMobileMenuOpen ? "var(--primary-container)" : "var(--card-bg)",
            boxShadow: isMobileMenuOpen ? "1px 1px 0px var(--primary)" : "3px 3px 0px var(--primary)",
            transform: isMobileMenuOpen ? "translate(2px, 2px) rotate(0deg)" : "rotate(1.5deg)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "38px",
            height: "38px",
            "--rest-rot": isMobileMenuOpen ? "0deg" : "1.5deg",
          } as CSSProperties}
          aria-label="Menú principal"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: "block" }}
          >
            {/* Tilted Radio Antenna */}
            <line x1="8" y1="5" x2="16" y2="1.5" />
            <circle cx="16" cy="1.5" r="1.5" fill="var(--primary)" />
            
            {/* Radio Body / Chassis */}
            <rect x="2" y="5" width="20" height="17" rx="2" fill="var(--card-bg)" stroke="var(--primary)" strokeWidth="2.5" />
            
            {/* Speaker Lines / Hamburger or X */}
            {isMobileMenuOpen ? (
              <>
                <line x1="7" y1="10" x2="17" y2="17" />
                <line x1="17" y1="10" x2="7" y2="17" />
              </>
            ) : (
              <>
                <line x1="6" y1="10" x2="18" y2="10" />
                <line x1="6" y1="13.5" x2="18" y2="13.5" />
                <line x1="6" y1="17" x2="14" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Navigation Panel */}
      <div className={`mobile-menu-drawer ${isMobileMenuOpen ? "open" : ""}`}>
        {/* Decorative Badge */}
        <div
          style={{
            backgroundColor: "var(--primary-container)",
            color: "var(--primary)",
            padding: "6px 12px",
            fontSize: "0.8rem",
            fontWeight: 900,
            border: "3px solid var(--primary)",
            transform: "rotate(-2deg)",
            boxShadow: "3px 3px 0px var(--primary)",
            width: "max-content",
            marginBottom: "16px",
          }}
        >
          📻 RADIO DOBLE C MENU
        </div>

        {/* Links */}
        <button
          onClick={() => {
            setFilteredStyle(null);
            setActiveTab("explore");
            setIsMobileMenuOpen(false);
          }}
          className="mobile-nav-link fun-hover-wobble"
          style={{
            backgroundColor: activeTab === "explore" ? "var(--primary-container)" : "var(--card-bg)",
            transform: "rotate(-1.5deg)",
            "--rest-rot": "-1.5deg",
          } as CSSProperties}
        >
          EXPLORAR
        </button>

        <button
          onClick={() => {
            setActiveTab("store");
            setIsMobileMenuOpen(false);
          }}
          className="mobile-nav-link fun-hover-wobble"
          style={{
            backgroundColor: activeTab === "store" ? "var(--primary-container)" : "var(--card-bg)",
            transform: "rotate(1.5deg)",
            "--rest-rot": "1.5deg",
          } as CSSProperties}
        >
          TIENDA
        </button>

        {isVipUser && (
          <button
            onClick={() => {
              setActiveTab("vip");
              setIsMobileMenuOpen(false);
            }}
            className="mobile-nav-link fun-hover-wobble"
            style={{
              backgroundColor: activeTab === "vip" ? "var(--primary-container)" : "var(--card-bg)",
              transform: "rotate(-2deg)",
              "--rest-rot": "-2deg",
              color: "var(--primary)",
            } as CSSProperties}
          >
            ZONA VIP ⭐
          </button>
        )}

        <button
          onClick={() => {
            setActiveTab("profile");
            setIsMobileMenuOpen(false);
          }}
          className="mobile-nav-link fun-hover-wobble"
          style={{
            backgroundColor: activeTab === "profile" ? "var(--primary-container)" : "var(--card-bg)",
            transform: "rotate(-1deg)",
            "--rest-rot": "-1deg",
          } as CSSProperties}
        >
          MI PERFIL
        </button>

        {/* Small radio status sticker at bottom of menu */}
        <div
          style={{
            marginTop: "auto",
            fontSize: "0.75rem",
            fontWeight: "bold",
            color: "var(--secondary)",
            opacity: 0.8,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div>APOYE A SU RADIO LOCAL</div>
          <div style={{ fontSize: "0.6rem" }}>FUCKING GOOD SHIT © 2026</div>
        </div>
      </div>
    </header>
  );
};

