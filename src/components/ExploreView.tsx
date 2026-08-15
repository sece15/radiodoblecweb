import { useState } from "react";
import { useAudio } from "@/hooks/useAudio";
import { RadioProgram } from "@/types";
import { Heart, Share2, Play, Pause, Clock, User, Disc, Sparkles, Megaphone } from "lucide-react";
import { NeoModal } from "./common/NeoModal";
import { InfiniteSlider } from "./common/InfiniteSlider";
import { RadioVideosSection } from "./RadioVideosSection";
import { fetchProgramRecordings, getDriveStreamUrl, DriveFile } from "@/services/driveService";
import { formatFileSize, formatDate, cleanFileName } from "@/lib/formatters";

interface ExploreViewProps {
  onNavigateToPlayer: () => void;
  filteredStyle?: string | null;
}

export const ExploreView = ({ onNavigateToPlayer, filteredStyle }: ExploreViewProps) => {
  const {
    stations,
    programs,
    playLiveStream,
    playPastBroadcast,
    playRadar,
    toggleStationLike,
    liveShowName,
    liveTrackTitle,
    liveStatusText,
    currentTrack,
    isPlaying,
    togglePlayPause,
  } = useAudio();

  const [selectedStyle, setSelectedStyle] = useState<string>(filteredStyle || "TODOS");
  const [prevFilteredStyle, setPrevFilteredStyle] = useState<string | null | undefined>(filteredStyle);

  if (filteredStyle !== prevFilteredStyle) {
    setPrevFilteredStyle(filteredStyle);
    setSelectedStyle(filteredStyle || "TODOS");
  }

  // Modal 1: Perfil del Locutor y Programa (Programas Doble C)
  const [selectedHostProgram, setSelectedHostProgram] = useState<RadioProgram | null>(null);

  // Modal 2: Guía de Programas y Emisiones Pasadas (Google Drive)
  const [selectedProgram, setSelectedProgram] = useState<RadioProgram | null>(null);
  const [programRecordings, setProgramRecordings] = useState<DriveFile[]>([]);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState<boolean>(false);

  const handleOpenProgram = (prog: RadioProgram) => {
    setSelectedProgram(prog);
    setIsLoadingRecordings(true);
    setProgramRecordings([]);

    fetchProgramRecordings(prog.title)
      .then((files) => {
        setProgramRecordings(files);
      })
      .catch((err) => console.error("Error al cargar emisiones del programa:", err))
      .finally(() => {
        setIsLoadingRecordings(false);
      });
  };

  const handlePlayRecording = (file: DriveFile, programTitle: string) => {
    const streamUrl = getDriveStreamUrl(file.id);
    const isCurrent = currentTrack.streamUrl === streamUrl;

    if (isCurrent) {
      togglePlayPause();
      return;
    }

    playPastBroadcast({
      id: file.id,
      programId: "program_recording",
      title: cleanFileName(file.name),
      date: `Emisión de ${programTitle}`,
      duration: formatFileSize(file.size),
      audioUrl: streamUrl,
    });
  };

  // DJ Postulation Modal States
  const [isDjModalOpen, setDjModalOpen] = useState(false);
  const [djName, setDjName] = useState("");
  const [djEmail, setDjEmail] = useState("");
  const [djDemoUrl, setDjDemoUrl] = useState("");
  const [djBio, setDjBio] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [djSubmitted, setDjSubmitted] = useState(false);

  // Filter stations based on selected style
  const filteredStations = stations.filter((station) => {
    if (selectedStyle === "TODOS") return true;
    const sStyle = station.style.toUpperCase();
    const selStyle = selectedStyle.toUpperCase();
    return sStyle === selStyle || sStyle.includes(selStyle) || selStyle.includes(sStyle);
  });

  const handleShareStation = (stationName: string) => {
    alert(`Enlace de sintonización copiado para: ${stationName} 📻`);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "20px 16px 180px 16px",
        width: "100%",
        maxWidth: "768px",
        margin: "0 auto",
      }}
    >
      {/* 1. LIVE NOW BANNER */}
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <div
          onClick={() => {
            playLiveStream();
            onNavigateToPlayer();
          }}
          className="neo-card store-card-hover"
          style={{
            backgroundColor: "var(--primary-container)",
            padding: "16px",
            transform: "rotate(-1deg)",
            cursor: "pointer",
            boxShadow: "6px 6px 0px var(--primary)",
            maxWidth: "480px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {/* Live Indicator */}
              <div
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-container)",
                  padding: "4px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                <div
                  className="pulse-dot"
                  style={{
                    width: "10px",
                    height: "10px",
                    backgroundColor: "#BA1A1A",
                    borderRadius: "50%",
                  }}
                ></div>
                LIVE NOW
              </div>

              <span style={{ fontSize: "0.7rem", fontWeight: "bold", color: "var(--primary)" }}>
                {liveStatusText}
              </span>
            </div>

            <h3
              style={{
                fontSize: "1.4rem",
                fontWeight: 900,
                textTransform: "uppercase",
                color: "var(--primary)",
                lineHeight: "1.6rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {liveShowName}
            </h3>
            <p style={{ fontSize: "0.8rem", fontWeight: "bold", opacity: 0.8, color: "var(--primary)" }}>
              Sintonizado: {liveTrackTitle}
            </p>
          </div>
        </div>
      </div>

      {/* 2. SPONSOR & PARTNER LOGOS INFINITE SLIDER (SIN CARDS, VELOCIDAD PAUSADA Y FADE SUAVE) */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          margin: "4px 0 12px 0",
        }}
      >
        <h3
          className="sponsors-title"
          style={{
            fontWeight: 900,
            textTransform: "uppercase",
            color: "var(--primary)",
            margin: "0 0 6px 0",
            textAlign: "center",
          }}
        >
          AUSPICIADORES &amp; MARCAS ALIADAS
        </h3>

        <InfiniteSlider gap={75} speed={36} speedOnHover={0} style={{ padding: "8px 0" }}>
          {[
            { id: "1", name: "Radio Doble C", src: "/RADIO.png" },
            { id: "2", name: "Doble C 2026", src: "/RADIO-2026.png" },
            { id: "3", name: "Radio Doble C", src: "/RADIO.png" },
            { id: "4", name: "Doble C 2026", src: "/RADIO-2026.png" },
            { id: "5", name: "Radio Doble C", src: "/RADIO.png" },
            { id: "6", name: "Doble C 2026", src: "/RADIO-2026.png" },
          ].map((sponsor, idx) => (
            <div
              key={`${sponsor.id}-${idx}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                cursor: "pointer",
                padding: "4px 12px",
                transition: "transform 0.2s ease, opacity 0.2s ease",
              }}
              title={sponsor.name}
            >
              <img
                src={sponsor.src}
                alt={sponsor.name}
                className="sponsor-logo-img"
                style={{
                  objectFit: "contain",
                  filter: "drop-shadow(0px 2px 5px rgba(0,0,0,0.12))",
                }}
              />
            </div>
          ))}
        </InfiniteSlider>
      </div>

      {/* 3. PROGRAMAS LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase" }}>
          PROGRAMAS DOBLE C
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {filteredStations.map((station, idx) => {
            const rotations = [-0.5, 0.8, -0.3];
            const rot = rotations[idx % rotations.length];
            const isCurrent = isPlaying && currentTrack.title === station.name;
            return (
              <div
                key={station.id}
                className="neo-card store-card-hover"
                style={{
                  transform: isCurrent ? `translate(5px, 5px) rotate(0deg)` : `rotate(${rot}deg)`,
                  cursor: "pointer",
                  boxShadow: isCurrent ? "1px 1px 0px var(--primary)" : "6px 6px 0px var(--primary)",
                  backgroundColor: isCurrent ? "var(--primary-container)" : "var(--card-bg)",
                }}
                onClick={() => {
                  const matchingProg = programs.find(
                    (p) => p.id === station.id || p.title.toLowerCase() === station.name.toLowerCase()
                  );
                  setSelectedHostProgram(
                    matchingProg || {
                      id: station.id,
                      title: station.name,
                      host: "Locutor Doble C",
                      timeSlot: station.frequency,
                      genre: station.style,
                      imageUrl: station.imageUrl,
                      description: station.description,
                    }
                  );
                }}
              >
                {/* Cover Photo */}
                <div style={{ position: "relative", width: "100%", height: "160px", backgroundColor: "#1A1D10" }}>
                  <img
                    src={station.imageUrl}
                    alt={station.name}
                    loading="lazy"
                    decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                  />

                  {/* Frequency tag */}
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      backgroundColor: "var(--primary-container)",
                      border: "2px solid var(--primary)",
                      padding: "2px 8px",
                      fontSize: "0.7rem",
                      fontWeight: 900,
                      fontFamily: "monospace",
                    }}
                  >
                    {station.frequency}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h4
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      borderBottom: "4px solid var(--primary-container)",
                      paddingBottom: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}
                    title={station.name}
                  >
                    {station.name}
                  </h4>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      opacity: 0.8,
                      lineHeight: "1.1rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {station.description}
                  </p>

                  {/* Action buttons */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "2px solid var(--primary)",
                      paddingTop: "10px",
                      marginTop: "8px",
                    }}
                    onClick={(e) => e.stopPropagation()} // Stop click propagation to parent card play trigger
                  >
                    <button
                      onClick={() => toggleStationLike(station.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                    >
                      <Heart
                        size={24}
                        style={{
                          fill: station.isLiked ? "#BA1A1A" : "none",
                          color: station.isLiked ? "#BA1A1A" : "var(--primary)",
                        }}
                      />
                    </button>

                    <span
                      style={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--primary)",
                        padding: "2px 6px",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                      }}
                    >
                      {station.style}
                    </span>

                    <button
                      onClick={() => handleShareStation(station.name)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                    >
                      <Share2 size={22} style={{ color: "var(--primary)" }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3.5 PROGRAMACIÓN / SHOWS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3
          style={{
            fontSize: "1.2rem",
            fontWeight: 900,
            textTransform: "uppercase",
            borderBottom: "4px solid var(--primary)",
            paddingBottom: "6px",
            width: "max-content",
          }}
        >
          GUIA DE PROGRAMAS
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {programs.map((prog, idx) => {
            const rotations = [0.5, -0.8, 0.3, -0.5];
            const rot = rotations[idx % rotations.length];
            return (
              <div
                key={prog.id}
                className="neo-card store-card-hover"
                style={{
                  transform: `rotate(${rot}deg)`,
                  cursor: "pointer",
                  boxShadow: "5px 5px 0px var(--primary)",
                  backgroundColor: "var(--surface-container)",
                  padding: "12px",
                }}
                onClick={() => {
                  handleOpenProgram(prog);
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <img
                    src={prog.imageUrl}
                    alt={prog.title}
                    loading="lazy"
                    decoding="async"
                    style={{ width: "64px", height: "64px", objectFit: "cover", border: "2px solid var(--primary)" }}
                  />

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px", minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          lineHeight: "1rem",
                          whiteSpace: "normal",
                          flex: 1,
                        }}
                        title={prog.title}
                      >
                        {prog.title}
                      </h4>
                      <span
                        style={{
                          backgroundColor: "var(--primary-container)",
                          border: "1px solid var(--primary)",
                          padding: "1px 6px",
                          fontSize: "0.55rem",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "110px",
                          flexShrink: 0,
                        }}
                        title={prog.genre}
                      >
                        {prog.genre}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.7rem", fontWeight: "bold", opacity: 0.8 }}>
                      LOCUTOR: {prog.host.toUpperCase()}
                    </p>
                    <p style={{ fontSize: "0.65rem", fontWeight: 900, color: "#BA1A1A" }}>
                      {prog.timeSlot}
                    </p>
                    <p
                      style={{
                        fontSize: "0.65rem",
                        opacity: 0.7,
                        lineHeight: "0.9rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {prog.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3.8 SECCIÓN DE VIDEOS, ENTREVISTAS & SESIONES */}
      <RadioVideosSection />

      {/* 4. BOTTOM BANNERS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginTop: "16px",
        }}
      >
        {/* RADAR & SIGNAL STATUS */}
        <div
          className="neo-card store-card-hover"
          onClick={() => {
            playRadar();
            onNavigateToPlayer();
          }}
          style={{
            backgroundColor: "var(--primary)",
            color: "white",
            cursor: "pointer",
            boxShadow: "10px 10px 0px var(--primary-container)",
            transform: "rotate(1.5deg)",
            overflow: "hidden",
            margin: 0,
          }}
        >
          <div className="scanlines" style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            {/* Radar scope */}
            <div
              style={{
                position: "relative",
                width: "120px",
                height: "120px",
                border: "2px solid var(--primary-container)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Spinning Radar Line */}
              <div
                className="radar-sweep"
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  top: 0,
                  left: 0,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div style={{ width: "2px", height: "50%", backgroundColor: "var(--primary-container)" }}></div>
              </div>

              <span
                style={{
                  color: "var(--primary-container)",
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  zIndex: 2,
                }}
              >
                SIGNAL OK
              </span>
            </div>

            <div style={{ textAlign: "center" }}>
              <h4 style={{ color: "var(--primary-container)", fontSize: "1.1rem", fontStyle: "italic", fontWeight: 900 }}>
                EL RADAR EN LÍNEA
              </h4>
              <p style={{ fontSize: "0.65rem", opacity: 0.8, marginTop: "8px", lineHeight: "0.95rem" }}>
                Descubre lo que suena en las alcantarillas de la ciudad. Click para sintonía al azar.
              </p>
            </div>
          </div>
        </div>

        {/* 5. COMIC SPEECH BUBBLE */}
        <div
          className="comic-bubble-wrapper store-card-hover"
          onClick={() => setDjModalOpen(true)}
          style={{ margin: 0, transform: "rotate(-1.5deg)", cursor: "pointer" }}
        >
          <div className="comic-bubble-container" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "80px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "var(--primary)" }}>
              <Megaphone style={{ width: "56px", height: "56px" }} />
              <h4 style={{ fontWeight: 900, fontSize: "1.3rem", letterSpacing: "-0.02em", textAlign: "center" }}>
                ¿QUIERES SER LOCUTOR O DJ?
              </h4>
              <p style={{ fontWeight: "bold", fontSize: "0.75rem", textAlign: "center", color: "#BA1A1A" }}>
                ¡HAZ CLICK AQUÍ PARA POSTULAR! 📡
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. AVISO LEGAL DE DERECHOS DE AUTOR & DIFUSIÓN CULTURAL */}
      <div
        className="neo-card"
        style={{
          marginTop: "32px",
          marginBottom: "16px",
          backgroundColor: "var(--card-bg)",
          border: "2.5px solid var(--primary)",
          boxShadow: "4px 4px 0px var(--primary)",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              padding: "2px 7px",
              fontSize: "0.62rem",
              fontWeight: 900,
              letterSpacing: "1px",
            }}
          >
            ⚖️ AVISO LEGAL &amp; DERECHOS DE AUTOR
          </span>

          <span style={{ fontSize: "0.62rem", fontWeight: 900, opacity: 0.75 }}>
            DIFUSIÓN CULTURAL &amp; COMUNITARIA
          </span>
        </div>

        <p
          style={{
            fontSize: "0.72rem",
            lineHeight: "1.2rem",
            color: "var(--primary)",
            margin: 0,
            opacity: 0.85,
          }}
        >
          <strong>Radio Doble C</strong> es una plataforma de difusión cultural independiente y comunitaria. Todos los derechos de autor, máster y marcas registradas pertenecen a sus respectivos autores, intérpretes y sellos. Si eres titular de derechos y requieres acreditación o retiro de algún contenido, contáctanos a:{" "}
          <a
            href="mailto:radiodoblechseo@gmail.com?subject=Consulta%20de%20Derechos%20-%20Radio%20Doble%20C"
            style={{ color: "var(--primary)", fontWeight: 900, textDecoration: "underline" }}
          >
            radiodoblechseo@gmail.com
          </a>.
        </p>
      </div>

      {/* MODAL 1: ¿QUIERES SER DJ? */}
      <NeoModal
        isOpen={isDjModalOpen}
        onClose={() => {
          setDjModalOpen(false);
          setDjSubmitted(false);
        }}
        title={!djSubmitted ? "¿Quieres ser Locutor o DJ?" : "¡Postulación Enviada!"}
        badgeText="📻 CONVOCATORIA ABIERTA"
        maxWidth="460px"
        backgroundColor="var(--background)"
      >
        {!djSubmitted ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!djName.trim() || !djEmail.trim()) {
                alert("Por favor completa los campos obligatorios.");
                return;
              }
              setIsSendingEmail(true);

              try {
                // 1. Enviar vía Supabase Edge Function (send-email)
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://skkwodwxaeajdaukjsqg.supabase.co";
                const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
                const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                  },
                  body: JSON.stringify({
                    name: djName.trim(),
                    email: djEmail.trim(),
                    demoUrl: djDemoUrl.trim(),
                    bio: djBio.trim(),
                  }),
                });

                if (!res.ok) {
                  const errData = await res.json().catch(() => ({}));
                  console.warn("Supabase send-email Edge Function response:", errData);
                }
              } catch (err) {
                console.error("Error al enviar postulación por API:", err);
              } finally {
                setIsSendingEmail(false);
                setDjSubmitted(true);
              }
            }}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div style={{ textAlign: "center", marginBottom: "2px" }}>
              <p style={{ fontSize: "0.72rem", fontWeight: "bold", opacity: 0.8, margin: 0 }}>
                Envíanos tus datos y tu demo para postular a Radio Doble C.
              </p>
            </div>

            {/* Nombre y Correo */}
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.68rem", fontWeight: "bold", display: "block", marginBottom: "3px" }}>
                  NOMBRE / AKAS *
                </label>
                <input
                  type="text"
                  required
                  disabled={isSendingEmail}
                  value={djName}
                  onChange={(e) => setDjName(e.target.value)}
                  placeholder="Ej. Carlos"
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    border: "2.5px solid var(--primary)",
                    outline: "none",
                    fontSize: "0.78rem",
                    fontFamily: "inherit",
                    backgroundColor: "white",
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.68rem", fontWeight: "bold", display: "block", marginBottom: "3px" }}>
                  TU CORREO *
                </label>
                <input
                  type="email"
                  required
                  disabled={isSendingEmail}
                  value={djEmail}
                  onChange={(e) => setDjEmail(e.target.value)}
                  placeholder="tu_correo@gmail.com"
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    border: "2.5px solid var(--primary)",
                    outline: "none",
                    fontSize: "0.78rem",
                    fontFamily: "inherit",
                    backgroundColor: "white",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.68rem", fontWeight: "bold", display: "block", marginBottom: "3px" }}>
                ENLACE A DEMO (SOUNDCLOUD / MIXCLOUD / DRIVE / YT)
              </label>
              <input
                type="url"
                disabled={isSendingEmail}
                value={djDemoUrl}
                onChange={(e) => setDjDemoUrl(e.target.value)}
                placeholder="https://soundcloud.com/... o enlace Drive"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "2.5px solid var(--primary)",
                  outline: "none",
                  fontSize: "0.78rem",
                  fontFamily: "inherit",
                  backgroundColor: "white",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.68rem", fontWeight: "bold", display: "block", marginBottom: "3px" }}>
                PROPUESTA MUSICAL / MENSAJE
              </label>
              <textarea
                disabled={isSendingEmail}
                value={djBio}
                onChange={(e) => setDjBio(e.target.value)}
                placeholder="Cuéntanos qué estilos tocas y tu idea de programa o audios..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "2.5px solid var(--primary)",
                  outline: "none",
                  fontSize: "0.78rem",
                  fontFamily: "inherit",
                  resize: "none",
                  backgroundColor: "white",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSendingEmail}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: isSendingEmail ? "var(--surface-container)" : "var(--primary-container)",
                width: "100%",
                padding: "10px",
                fontSize: "0.75rem",
                fontWeight: 900,
                marginTop: "4px",
                boxShadow: "3px 3px 0px var(--primary)",
                cursor: isSendingEmail ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              ENVIAR
            </button>
          </form>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "12px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "var(--primary-container)",
                border: "3px solid var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Megaphone size={30} style={{ color: "var(--primary)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
                ¡DEMO ENVIADA! 📻
              </h3>
              <p style={{ fontSize: "0.75rem", fontWeight: "bold", opacity: 0.8, margin: 0 }}>
                Hola <strong>{djName}</strong>, tu postulación ha sido enviada a la bandeja de la radio. Revisaremos tu material y te contactaremos a <strong>{djEmail}</strong>.
              </p>
            </div>

            <button
              onClick={() => {
                setDjModalOpen(false);
                setDjSubmitted(false);
                setDjName("");
                setDjEmail("");
                setDjDemoUrl("");
                setDjBio("");
              }}
              className="neo-button"
              style={{
                backgroundColor: "white",
                padding: "8px 18px",
                fontSize: "0.75rem",
                fontWeight: 900,
                boxShadow: "3px 3px 0px var(--primary)",
              }}
            >
              ENTENDIDO, VOLVER 📡
            </button>
          </div>
        )}
      </NeoModal>

      {/* MODAL 2: DETALLE DEL PROGRAMA Y GRABACIONES DE GOOGLE DRIVE */}
      {selectedProgram && (
        <NeoModal
          isOpen={Boolean(selectedProgram)}
          onClose={() => setSelectedProgram(null)}
          title={selectedProgram.title}
          badgeText="📻 PROGRAMA OFICIAL DOBLE C"
          maxWidth="880px"
          bodyOverflow="auto"
          backgroundColor="var(--background)"
          footer={
            <button
              onClick={() => setSelectedProgram(null)}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: "white",
                padding: "8px 22px",
                fontSize: "0.75rem",
                fontWeight: 900,
                boxShadow: "3px 3px 0px var(--primary)",
                border: "2px solid var(--primary)",
                cursor: "pointer",
              }}
            >
              CERRAR VENTANA
            </button>
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "20px",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* LADO IZQUIERDO: FOTO, GÉNERO Y HORARIO (FIJO) */}
            <div
              style={{
                flex: "0 0 160px",
                maxWidth: "180px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                margin: "0 auto",
                alignItems: "center",
                flexShrink: 0,
                position: "sticky",
                top: 0,
              }}
            >
              <div
                className="neo-card"
                style={{
                  width: "140px",
                  height: "140px",
                  overflow: "hidden",
                  border: "2.5px solid var(--primary)",
                  boxShadow: "3px 3px 0px var(--primary)",
                  backgroundColor: "var(--surface-container)",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <img
                  src={selectedProgram.imageUrl}
                  alt={selectedProgram.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    left: "6px",
                    backgroundColor: "var(--primary)",
                    color: "var(--on-primary)",
                    padding: "1px 5px",
                    fontSize: "0.55rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                  }}
                >
                  {selectedProgram.genre}
                </div>
              </div>

              {/* Horario */}
              <div
                style={{
                  width: "100%",
                  border: "1.5px solid var(--primary)",
                  backgroundColor: "var(--surface-container)",
                  padding: "6px",
                  textAlign: "center",
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <Clock size={12} /> {selectedProgram.timeSlot}
              </div>
            </div>

            {/* LADO DERECHO: LOCUTOR, DESCRIPCIÓN Y GRABACIONES (SCROLEABLE) */}
            <div
              style={{
                flex: "1 1 340px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minWidth: 0,
              }}
            >
              {/* Cuadro del Locutor */}
              <div
                style={{
                  backgroundColor: "var(--primary-container)",
                  border: "2px solid var(--primary)",
                  padding: "10px 12px",
                  boxShadow: "2px 2px 0px var(--primary)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                  <User size={14} style={{ color: "var(--primary)" }} />
                  <span style={{ fontSize: "0.6rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.8 }}>
                    LOCUTOR / HOST
                  </span>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
                  {selectedProgram.host}
                </h4>
              </div>

              {/* Cuadro de Descripción */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.7 }}>
                  DESCRIPCIÓN DEL PROGRAMA
                </span>
                <div
                  style={{
                    border: "2px solid var(--primary)",
                    backgroundColor: "var(--surface-container)",
                    padding: "10px",
                    fontSize: "0.75rem",
                    lineHeight: "1.25rem",
                    color: "var(--primary)",
                    boxShadow: "2px 2px 0px var(--primary)",
                  }}
                >
                  <p style={{ margin: 0 }}>{selectedProgram.description}</p>
                </div>
              </div>

              {/* SECCIÓN DE GRABACIONES Y EMISIONES */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Disc size={13} style={{ color: "var(--primary)" }} /> EMISIONES PASADAS
                  </span>
                  <span
                    style={{
                      backgroundColor: "#FFDE82",
                      border: "1px solid var(--primary)",
                      padding: "1px 6px",
                      fontSize: "0.58rem",
                      fontWeight: 900,
                    }}
                  >
                    {programRecordings.length} {programRecordings.length === 1 ? "GRABACIÓN" : "GRABACIONES"}
                  </span>
                </div>

                {isLoadingRecordings ? (
                  <div
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      backgroundColor: "var(--surface-container)",
                      border: "2px dashed var(--primary)",
                    }}
                  >
                    <Disc size={20} className="animate-spin" style={{ margin: "0 auto 4px auto", color: "var(--primary)" }} />
                    <p style={{ fontSize: "0.72rem", fontWeight: "bold", margin: 0 }}>
                      Cargando emisiones...
                    </p>
                  </div>
                ) : programRecordings.length === 0 ? (
                  <div
                    style={{
                      padding: "14px",
                      textAlign: "center",
                      backgroundColor: "var(--surface-container)",
                      border: "2px dashed var(--primary)",
                    }}
                  >
                    <p style={{ fontSize: "0.72rem", fontWeight: "bold", margin: 0, opacity: 0.8 }}>
                      📁 Aún no hay grabaciones o emisiones subidas para este programa.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      maxHeight: "280px",
                      overflowY: "auto",
                      paddingRight: "6px",
                    }}
                  >
                    {(() => {
                      // Ordenar: orden 1, 2, 3, etc. (nombre natural y cronológico ascendente)
                      const orderedRecordings = [...programRecordings].sort((a, b) => {
                        const nameCmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
                        if (nameCmp !== 0) return nameCmp;
                        const timeA = a.createdTime ? new Date(a.createdTime).getTime() : 0;
                        const timeB = b.createdTime ? new Date(b.createdTime).getTime() : 0;
                        return timeA - timeB;
                      });

                      return orderedRecordings.map((recording, rIdx) => {
                        const streamUrl = getDriveStreamUrl(recording.id);
                        const isPlayingThis = isPlaying && currentTrack.streamUrl === streamUrl;

                        return (
                          <div
                            key={recording.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 10px",
                              backgroundColor: isPlayingThis ? "var(--primary-container)" : "var(--surface-container)",
                              border: "2px solid var(--primary)",
                              boxShadow: isPlayingThis ? "2px 2px 0px var(--primary)" : "none",
                              gap: "8px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                              <span style={{ fontSize: "0.68rem", fontWeight: 900, opacity: 0.6 }}>
                                #{rIdx + 1}
                              </span>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <p
                                  style={{
                                    fontSize: "0.72rem",
                                    fontWeight: 900,
                                    textTransform: "uppercase",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    margin: 0,
                                  }}
                                  title={recording.name}
                                >
                                  {cleanFileName(recording.name)}
                                </p>
                                <span style={{ fontSize: "0.58rem", opacity: 0.7 }}>
                                  {formatDate(recording.createdTime)} • {formatFileSize(recording.size)}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handlePlayRecording(recording, selectedProgram.title)}
                              style={{
                                backgroundColor: isPlayingThis ? "var(--primary)" : "var(--primary-container)",
                                color: isPlayingThis ? "var(--on-primary)" : "var(--primary)",
                                border: "1.5px solid var(--primary)",
                                padding: "5px 8px",
                                cursor: "pointer",
                                fontSize: "0.68rem",
                                fontWeight: 900,
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                flexShrink: 0,
                              }}
                            >
                              {isPlayingThis ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
                              {isPlayingThis ? "PAUSAR" : "REPRODUCIR"}
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </NeoModal>
      )}

      {/* MODAL ESPECIAL: PERFIL DEL LOCUTOR Y SHOW (PROGRAMAS DOBLE C) */}
      {selectedHostProgram && (
        <NeoModal
          isOpen={Boolean(selectedHostProgram)}
          onClose={() => setSelectedHostProgram(null)}
          title={selectedHostProgram.title}
          badgeText="🎙️ PERFIL DEL LOCUTOR"
          maxWidth="880px"
          bodyOverflow="auto"
          backgroundColor="var(--background)"
          footer={
            <button
              onClick={() => setSelectedHostProgram(null)}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: "white",
                padding: "8px 22px",
                fontSize: "0.75rem",
                fontWeight: 900,
                boxShadow: "3px 3px 0px var(--primary)",
                border: "2px solid var(--primary)",
                cursor: "pointer",
              }}
            >
              CERRAR VENTANA
            </button>
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "20px",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* LADO IZQUIERDO: FOTO, GÉNERO Y HORARIO (FIJO - ESTRUCTURA IDÉNTICA A PROGRAMA OFICIAL) */}
            <div
              style={{
                flex: "0 0 160px",
                maxWidth: "180px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                margin: "0 auto",
                alignItems: "center",
                flexShrink: 0,
                position: "sticky",
                top: 0,
              }}
            >
              <div
                className="neo-card"
                style={{
                  width: "140px",
                  height: "140px",
                  overflow: "hidden",
                  border: "2.5px solid var(--primary)",
                  boxShadow: "3px 3px 0px var(--primary)",
                  backgroundColor: "var(--surface-container)",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <img
                  src={selectedHostProgram.imageUrl}
                  alt={selectedHostProgram.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    left: "6px",
                    backgroundColor: "var(--primary)",
                    color: "var(--on-primary)",
                    padding: "1px 5px",
                    fontSize: "0.55rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                  }}
                >
                  {selectedHostProgram.genre}
                </div>
              </div>

              {/* Horario */}
              <div
                style={{
                  width: "100%",
                  border: "1.5px solid var(--primary)",
                  backgroundColor: "var(--surface-container)",
                  padding: "6px",
                  textAlign: "center",
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <Clock size={12} /> {selectedHostProgram.timeSlot}
              </div>
            </div>

            {/* LADO DERECHO: DATOS DEL PERFIL DEL LOCUTOR Y SHOW */}
            <div
              style={{
                flex: "1 1 340px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minWidth: 0,
              }}
            >
              {/* Cuadro del Locutor */}
              <div
                style={{
                  backgroundColor: "var(--primary-container)",
                  border: "2px solid var(--primary)",
                  padding: "10px 12px",
                  boxShadow: "2px 2px 0px var(--primary)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                  <User size={14} style={{ color: "var(--primary)" }} />
                  <span style={{ fontSize: "0.6rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.8 }}>
                    {selectedHostProgram.hostRole || "LOCUTOR / HOST"}
                  </span>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
                  {selectedHostProgram.host}
                </h4>
              </div>

              {/* Quién es / Biografía */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.7, display: "flex", alignItems: "center", gap: "4px" }}>
                  <Sparkles size={12} /> ¿QUIÉN ESTÁ DETRÁS DEL MICRÓFONO?
                </span>
                <div
                  style={{
                    border: "2px solid var(--primary)",
                    backgroundColor: "var(--surface-container)",
                    padding: "10px",
                    fontSize: "0.75rem",
                    lineHeight: "1.25rem",
                    color: "var(--primary)",
                    boxShadow: "2px 2px 0px var(--primary)",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    {selectedHostProgram.hostBio || selectedHostProgram.description}
                  </p>
                </div>
              </div>

              {/* Hobbies e Intereses */}
              {selectedHostProgram.hostHobbies && selectedHostProgram.hostHobbies.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.7, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Heart size={12} /> HOBBIES & PASIONES
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {selectedHostProgram.hostHobbies.map((hobby, hIdx) => (
                      <span
                        key={hIdx}
                        style={{
                          backgroundColor: "#FFDE82",
                          border: "1.5px solid var(--primary)",
                          padding: "3px 8px",
                          fontSize: "0.65rem",
                          fontWeight: 900,
                          boxShadow: "1.5px 1.5px 0px var(--primary)",
                          textTransform: "uppercase",
                        }}
                      >
                        ✦ {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sobre el Programa */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.7 }}>
                  📻 CONCEPTO DEL PROGRAMA
                </span>
                <div
                  style={{
                    border: "2px solid var(--primary)",
                    backgroundColor: "white",
                    padding: "10px",
                    fontSize: "0.74rem",
                    lineHeight: "1.25rem",
                    boxShadow: "2px 2px 0px var(--primary)",
                  }}
                >
                  <p style={{ margin: 0 }}>{selectedHostProgram.description}</p>
                </div>
              </div>
            </div>
          </div>
        </NeoModal>
      )}
    </div>
  );
};
