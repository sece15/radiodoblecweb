"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ZineBackgroundFrame } from "@/components/ZineBackgroundFrame";
import { RadioLogo } from "@/components/RadioLogo";
import { SpotifyPlayerBar } from "@/components/SpotifyPlayerBar";
import { ChatSidebar } from "@/components/ChatSidebar";
import { PlayerView } from "@/components/PlayerView";
import { useAudio } from "@/hooks/useAudio";
import {
  Radio,
  ArrowLeft,
  Home,
  Calendar,
  Disc,
  Play,
  Pause,
  AlertTriangle,
  Volume2,
  Headphones,
  Compass,
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const { isPlaying, togglePlayPause, playLiveStream, currentTrack } = useAudio();
  const [isPlayerExpanded, setPlayerExpanded] = useState(false);
  const [isChatSidebarOpen, setChatSidebarOpen] = useState(false);

  const handleTuneIn = () => {
    if (!isPlaying) {
      playLiveStream();
    } else {
      togglePlayPause();
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        color: "var(--on-background)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div style={{ flex: 1, paddingBottom: "120px" }}>
        <ZineBackgroundFrame>
          {/* TOP NAV BAR */}
          <header
            style={{
              padding: "16px 20px",
              borderBottom: "4px solid var(--primary)",
              backgroundColor: "var(--card-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              boxShadow: "0 4px 0 0 var(--primary)",
              position: "sticky",
              top: 0,
              zIndex: 30,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  textDecoration: "none",
                  color: "var(--primary)",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    backgroundColor: "var(--primary-container)",
                    border: "3px solid var(--primary)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "3px 3px 0 0 var(--primary)",
                  }}
                >
                  <RadioLogo size={28} />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 900,
                      lineHeight: 1.1,
                      letterSpacing: "0.02em",
                      margin: 0,
                    }}
                  >
                    RADIO DOBLE C
                  </h2>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--primary)",
                      opacity: 0.8,
                    }}
                  >
                    Frecuencia Perdida // 404
                  </span>
                </div>
              </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => router.back()}
                className="neo-button"
                style={{
                  padding: "8px 12px",
                  fontSize: "0.78rem",
                  gap: "6px",
                  backgroundColor: "var(--background)",
                }}
                title="Regresar a la página anterior"
              >
                <ArrowLeft size={16} />
                <span>Atrás</span>
              </button>

              <Link
                href="/"
                className="neo-button"
                style={{
                  padding: "8px 14px",
                  fontSize: "0.78rem",
                  gap: "6px",
                  backgroundColor: "var(--primary-container)",
                  color: "var(--on-primary-container)",
                  textDecoration: "none",
                }}
              >
                <Home size={16} />
                <span>Inicio</span>
              </Link>
            </div>
          </header>

          {/* TAPE BANNER */}
          <div
            style={{
              backgroundColor: "#1A1D10",
              color: "#CCFF00",
              padding: "8px 12px",
              fontWeight: 900,
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              borderBottom: "3px solid var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            <AlertTriangle size={15} color="#CCFF00" />
            <span>⚠️ ERROR 404: SEÑAL FUERA DE BANDA • RUIDO BLANCO EN EL DIAL • FRECUENCIA NO ENCONTRADA ⚠️</span>
            <AlertTriangle size={15} color="#CCFF00" />
          </div>

          {/* MAIN CONTENT HERO */}
          <div
            style={{
              maxWidth: "840px",
              margin: "32px auto",
              padding: "0 16px",
              display: "flex",
              flexDirection: "column",
              gap: "28px",
            }}
          >
            {/* BIG NEO CARD CONTAINER */}
            <section
              className="neo-card scanlines"
              style={{
                padding: "36px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                borderRadius: "12px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* STICKER TOP RIGHT */}
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "-28px",
                  backgroundColor: "#FF0D43",
                  color: "#FFFFFF",
                  padding: "4px 36px",
                  fontWeight: 900,
                  fontSize: "0.72rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  border: "2px solid var(--primary)",
                  transform: "rotate(18deg)",
                  boxShadow: "2px 2px 0 var(--primary)",
                }}
              >
                OFF-AIR
              </div>

              {/* HUGE 404 GLITCH DISPLAY */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "var(--primary-container)",
                  border: "4px solid var(--primary)",
                  boxShadow: "8px 8px 0px 0px var(--primary)",
                  padding: "12px 28px",
                  borderRadius: "16px",
                  marginBottom: "20px",
                  transform: "rotate(-1.5deg)",
                }}
              >
                <h1
                  style={{
                    fontSize: "clamp(3.5rem, 10vw, 6.5rem)",
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    margin: 0,
                    color: "var(--on-primary-container)",
                    textShadow: "3px 3px 0 rgba(0,0,0,0.15)",
                  }}
                >
                  404
                </h1>
              </div>

              {/* SUBTITLE BADGE */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "var(--primary)",
                  color: "var(--on-primary)",
                  padding: "6px 16px",
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: "20px",
                }}
              >
                <Radio size={16} />
                <span>DIAL SINTONIZADO EN EL VACÍO</span>
              </div>

              {/* COMIC SPEECH BUBBLE MESSAGE */}
              <div
                style={{
                  backgroundColor: "var(--bubble-bg)",
                  border: "3px solid var(--primary)",
                  boxShadow: "6px 6px 0 var(--primary)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  maxWidth: "580px",
                  width: "100%",
                  marginBottom: "28px",
                  textAlign: "center",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    color: "var(--primary)",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <span>¡TE SALISTE DE LA TRANSMISIÓN!</span>
                  <span>📻⚡</span>
                </h3>
                <p
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                    color: "var(--primary)",
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  La página o pista que buscas se perdió en la estática de la medianoche, fue
                  devorada por el algoritmo o fue cambiada de dial subterráneo. No te preocupes: la
                  música en vivo nunca se apaga.
                </p>
              </div>

              {/* INTERACTIVE EMERGENCY TUNER CONSOLE */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "580px",
                  backgroundColor: "var(--background)",
                  border: "3px solid var(--primary)",
                  boxShadow: "5px 5px 0 var(--primary)",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "2px dashed var(--primary)",
                    paddingBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Headphones size={15} /> Sintonizador de Emergencia
                  </span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 900,
                      backgroundColor: isPlaying ? "#CCFF00" : "#E2E2E2",
                      color: "#161E00",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      border: "1.5px solid var(--primary)",
                    }}
                  >
                    {isPlaying ? "● EN VIVO AL AIRE" : "○ EN ESPERA"}
                  </span>
                </div>

                {/* TRACK INFO DISPLAY */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 900,
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {currentTrack.title || "Radio Doble C en Vivo"}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.75,
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {currentTrack.artist || "Radio Online Independiente"}
                    </p>
                  </div>

                  {/* QUICK PLAY/PAUSE BUTTON */}
                  <button
                    onClick={handleTuneIn}
                    className="neo-button"
                    style={{
                      padding: "10px 16px",
                      backgroundColor: isPlaying ? "#FF0D43" : "var(--primary-container)",
                      color: isPlaying ? "#FFFFFF" : "var(--on-primary-container)",
                      fontSize: "0.8rem",
                      gap: "8px",
                    }}
                  >
                    {isPlaying ? (
                      <>
                        <Pause size={16} /> Pausar
                      </>
                    ) : (
                      <>
                        <Play size={16} /> Sintonizar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS GRID */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: "14px",
                  width: "100%",
                  maxWidth: "580px",
                }}
              >
                <Link
                  href="/"
                  className="neo-button"
                  style={{
                    padding: "14px 18px",
                    backgroundColor: "var(--primary-container)",
                    color: "var(--on-primary-container)",
                    textDecoration: "none",
                    gap: "8px",
                    fontSize: "0.85rem",
                  }}
                >
                  <Radio size={18} />
                  <span>Volver a la Radio</span>
                </Link>

                <Link
                  href="/horarios"
                  className="neo-button"
                  style={{
                    padding: "14px 18px",
                    backgroundColor: "var(--card-bg)",
                    color: "var(--primary)",
                    textDecoration: "none",
                    gap: "8px",
                    fontSize: "0.85rem",
                  }}
                >
                  <Calendar size={18} />
                  <span>Ver Horarios</span>
                </Link>

                <button
                  onClick={() => router.back()}
                  className="neo-button"
                  style={{
                    padding: "14px 18px",
                    backgroundColor: "var(--background)",
                    color: "var(--primary)",
                    gap: "8px",
                    fontSize: "0.85rem",
                  }}
                >
                  <ArrowLeft size={18} />
                  <span>Canal Anterior</span>
                </button>
              </div>
            </section>

            {/* SECONDARY SECTION: ALTERNATIVE FREQUENCIES */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              {/* CARD 1: EXPLORER */}
              <Link
                href="/?tab=explore"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  className="neo-card"
                  style={{
                    padding: "20px",
                    borderRadius: "10px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: "var(--primary-container)",
                      border: "2px solid var(--primary)",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Compass size={20} color="var(--primary)" />
                  </div>
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 900 }}>
                    Explorar Música &amp; Géneros
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.8, lineHeight: 1.4 }}>
                    Descubre estaciones punk, underground, lo-fi, podcasts y sesiones en vivo de
                    nuestros DJs.
                  </p>
                </div>
              </Link>

              {/* CARD 2: VIP ROCOLA */}
              <Link
                href="/?tab=rocola"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  className="neo-card"
                  style={{
                    padding: "20px",
                    borderRadius: "10px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: "#FF0D43",
                      color: "#FFFFFF",
                      border: "2px solid var(--primary)",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Disc size={20} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 900 }}>
                    Rocola VIP En Vivo
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.8, lineHeight: 1.4 }}>
                    Pide tus canciones favoritas usando tus C-Coins y pon a sonar tu música para toda
                    la audiencia.
                  </p>
                </div>
              </Link>

              {/* CARD 3: AUDIOTECA DRIVE */}
              <Link
                href="/?tab=drive"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  className="neo-card"
                  style={{
                    padding: "20px",
                    borderRadius: "10px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: "#FFB000",
                      color: "#150F05",
                      border: "2px solid var(--primary)",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Volume2 size={20} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 900 }}>
                    Audioteca Subterránea
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.8, lineHeight: 1.4 }}>
                    Accede a grabaciones de programas pasados, bootlegs y archivos de audio
                    exclusivos.
                  </p>
                </div>
              </Link>
            </section>
          </div>
        </ZineBackgroundFrame>
      </div>

      {/* PERSISTENT FOOTER PLAYER */}
      <SpotifyPlayerBar
        isChatOpen={isChatSidebarOpen}
        onToggleChat={() => setChatSidebarOpen(!isChatSidebarOpen)}
        onExpand={() => setPlayerExpanded(true)}
      />

      {/* CHAT SIDEBAR DRAWER */}
      {isChatSidebarOpen && (
        <ChatSidebar onClose={() => setChatSidebarOpen(false)} />
      )}

      {/* FULL SCREEN PLAYER MODAL */}
      {isPlayerExpanded && (
        <PlayerView onClose={() => setPlayerExpanded(false)} />
      )}
    </main>
  );
}
