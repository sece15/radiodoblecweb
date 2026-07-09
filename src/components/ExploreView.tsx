import { useState, CSSProperties } from "react";
import { useAudio } from "@/context/AudioContext";
import { RadioProgram, PastBroadcast } from "@/types";
import { Heart, Share2, Megaphone, Play, X } from "lucide-react";

interface ExploreViewProps {
  onNavigateToPlayer: () => void;
  filteredStyle?: string | null;
}

export const ExploreView = ({ onNavigateToPlayer, filteredStyle }: ExploreViewProps) => {
  const {
    stations,
    programs,
    pastBroadcasts,
    playLiveStream,
    playStation,
    playPastBroadcast,
    playRadar,
    toggleStationLike,
    liveShowName,
    liveTrackTitle,
    liveStatusText,
    scanState,
    currentTrack,
    isPlaying,
  } = useAudio();

  const [selectedStyle, setSelectedStyle] = useState<string>(filteredStyle || "TODOS");
  const [prevFilteredStyle, setPrevFilteredStyle] = useState<string | null | undefined>(filteredStyle);

  if (filteredStyle !== prevFilteredStyle) {
    setPrevFilteredStyle(filteredStyle);
    setSelectedStyle(filteredStyle || "TODOS");
  }

  const [selectedProgram, setSelectedProgram] = useState<RadioProgram | null>(null);

  // DJ Postulation Modal States
  const [isDjModalOpen, setDjModalOpen] = useState(false);
  const [djName, setDjName] = useState("");
  const [djEmail, setDjEmail] = useState("");
  const [djDemoUrl, setDjDemoUrl] = useState("");
  const [djBio, setDjBio] = useState("");
  const [djSubmitted, setDjSubmitted] = useState(false);

  const categories = ["TODOS", "ROCK N' ROLL / ALTERNATIVO", "PEDIDOS / INVITADOS", "RAP / REGGAE", "TECHNO / DANCE"];

  // Filter stations based on selected style
  const filteredStations = stations.filter((station) => {
    if (selectedStyle === "TODOS") return true;
    return station.style.toUpperCase() === selectedStyle.toUpperCase();
  });

  const getPastBroadcastsForProgram = (programId: string): PastBroadcast[] => {
    return pastBroadcasts.filter((b) => b.programId === programId);
  };

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

      {/* 2. CATEGORIES / ESTILOS */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%" }}>
        <h3
          style={{
            fontSize: "1.2rem",
            fontWeight: 900,
            textTransform: "uppercase",
            borderBottom: "4px solid var(--primary)",
            paddingBottom: "6px",
            width: "max-content",
            textAlign: "center",
          }}
        >
          ESTILOS
        </h3>

        {/* Centered Wrap Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "12px",
            padding: "18px 16px 12px 16px",
            width: "100%",
          }}
        >
          {categories.map((style, idx) => {
            const isSelected = selectedStyle === style;
            const restRotation = idx % 2 === 0 ? -3 : 3;
            return (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className="neo-button fun-hover-wobble"
                style={{
                  backgroundColor: isSelected ? "var(--primary-container)" : "var(--card-bg)",
                  transform: isSelected
                    ? `translate(3px, 3px) rotate(0deg)`
                    : `rotate(${restRotation}deg)`,
                  padding: "8px 12px",
                  fontSize: "0.75rem",
                  boxShadow: isSelected ? "0px 0px 0px var(--primary)" : "3px 3px 0px var(--primary)",
                  whiteSpace: "nowrap",
                  "--rest-rot": isSelected ? "0deg" : `${restRotation}deg`,
                } as CSSProperties}
              >
                {style}
              </button>
            );
          })}
        </div>
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
                  playStation(station);
                  onNavigateToPlayer();
                }}
              >
                {/* Cover Photo */}
                <div style={{ position: "relative", width: "100%", height: "160px", backgroundColor: "#1A1D10" }}>
                  <img
                    src={station.imageUrl}
                    alt={station.name}
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
                onClick={() => setSelectedProgram(prog)}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <img
                    src={prog.imageUrl}
                    alt={prog.title}
                    style={{ width: "64px", height: "64px", objectFit: "cover", border: "2px solid var(--primary)" }}
                  />

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "4px", minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          lineHeight: "1rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
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
                          padding: "1px 4px",
                          fontSize: "0.55rem",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "100px",
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

      {/* 4. BOTTOM BANNERS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginTop: "32px",
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
                {scanState}
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
                ¿QUIERES SER DJ?
              </h4>
              <p style={{ fontWeight: "bold", fontSize: "0.75rem", textAlign: "center", color: "#BA1A1A" }}>
                ¡HAZ CLICK AQUÍ PARA POSTULAR! 📡
              </p>
              <p style={{ fontSize: "0.6rem", opacity: 0.8, textAlign: "center", fontWeight: "bold" }}>
                O ENVÍA TU DEMO A PIRATA@DOBLEC.COM
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Bottom Sheet modal for past broadcasts */}
      {selectedProgram && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-end",
          }}
          onClick={() => setSelectedProgram(null)}
        >
          {/* Sheet container */}
          <div
            className="neo-card"
            style={{
              width: "100%",
              maxHeight: "450px",
              borderWidth: "4px 4px 0px 4px",
              boxShadow: "none",
              backgroundColor: "var(--background)",
              padding: "24px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.65rem", fontWeight: 900, color: "#BA1A1A", display: "block" }}>
                  EMISIONES PASADAS
                </span>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase" }}>
                  {selectedProgram.title}
                </h4>
              </div>

              <button
                onClick={() => setSelectedProgram(null)}
                style={{
                  border: "2px solid var(--primary)",
                  backgroundColor: "white",
                  padding: "6px 10px",
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                CERRAR
              </button>
            </div>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {getPastBroadcastsForProgram(selectedProgram.id).length === 0 ? (
                <div
                  style={{
                    border: "2px solid var(--primary)",
                    backgroundColor: "var(--surface-container)",
                    padding: "20px",
                    textAlign: "center",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    opacity: 0.7,
                  }}
                >
                  No hay grabaciones de la última semana para este programa.
                </div>
              ) : (
                getPastBroadcastsForProgram(selectedProgram.id).map((broadcast) => (
                  <div
                    key={broadcast.id}
                    className="neo-card"
                    style={{
                      padding: "12px",
                      boxShadow: "3px 3px 0px var(--primary)",
                      backgroundColor: "white",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      playPastBroadcast(broadcast);
                      setSelectedProgram(null);
                      onNavigateToPlayer();
                    }}
                  >
                    <div>
                      <h5 style={{ fontWeight: 900, fontSize: "0.75rem", textTransform: "uppercase" }}>
                        {broadcast.title}
                      </h5>
                      <p style={{ fontSize: "0.6rem", opacity: 0.7, marginTop: "2px", fontWeight: "bold" }}>
                        Transmitido: {broadcast.date} • Duración: {broadcast.duration}
                      </p>
                    </div>

                    <button
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary-container)",
                        border: "2px solid var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Play size={16} style={{ fill: "var(--primary)", color: "var(--primary)", marginLeft: "2px" }} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. DJ APPLY MODAL */}
      {isDjModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            paddingBottom: "100px", // Pushes the modal up to clear the bottom player area
          }}
          onClick={() => {
            setDjModalOpen(false);
            setDjSubmitted(false);
          }}
        >
          <div
            className="neo-card"
            style={{
              width: "100%",
              maxWidth: "400px",
              maxHeight: "calc(100vh - 140px)",
              overflowY: "auto",
              backgroundColor: "var(--background)",
              padding: "20px",
              boxShadow: "8px 8px 0px var(--primary)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setDjModalOpen(false);
                setDjSubmitted(false);
              }}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--primary)",
              }}
            >
              <X size={24} />
            </button>

            {!djSubmitted ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!djName || !djEmail) {
                    alert("Por favor completa los campos obligatorios.");
                    return;
                  }
                  setDjSubmitted(true);
                }}
                style={{ display: "flex", flexDirection: "column", gap: "10px" }}
              >
                <div style={{ textAlign: "center", marginBottom: "4px" }}>
                  <div
                    style={{
                      backgroundColor: "var(--primary-container)",
                      color: "var(--on-primary-container)",
                      border: "2px solid var(--primary)",
                      padding: "3px 8px",
                      fontSize: "0.7rem",
                      fontWeight: 900,
                      width: "max-content",
                      margin: "0 auto 6px auto",
                    }}
                  >
                    📻 CONVOCATORIA ABIERTA
                  </div>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: 900, textTransform: "uppercase" }}>
                    ¿QUIERES SER DJ?
                  </h3>
                  <p style={{ fontSize: "0.68rem", fontWeight: "bold", opacity: 0.8 }}>
                    Envíanos tus datos y tu set/demo para postular a la parrilla de Doble C.
                  </p>
                </div>

                {/* Nombre y Correo en la misma fila */}
                <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                      NOMBRE / AKAS *
                    </label>
                    <input
                      type="text"
                      required
                      value={djName}
                      onChange={(e) => setDjName(e.target.value)}
                      placeholder="Ej. Carlos"
                      style={{
                        width: "100%",
                        padding: "6px",
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
                      CORREO ELECTRÓNICO *
                    </label>
                    <input
                      type="email"
                      required
                      value={djEmail}
                      onChange={(e) => setDjEmail(e.target.value)}
                      placeholder="pirata@doblec.com"
                      style={{
                        width: "100%",
                        padding: "6px",
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
                    ENLACE A TU DEMO (SOUNDCLOUD / MIXCLOUD / YT)
                  </label>
                  <input
                    type="url"
                    value={djDemoUrl}
                    onChange={(e) => setDjDemoUrl(e.target.value)}
                    placeholder="https://soundcloud.com/..."
                    style={{
                      width: "100%",
                      padding: "6px",
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
                    PROPUESTA MUSICAL / MENSAJE
                  </label>
                  <textarea
                    value={djBio}
                    onChange={(e) => setDjBio(e.target.value)}
                    placeholder="Cuéntanos qué estilos tocas y tu idea de programa..."
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "6px",
                      border: "3px solid var(--primary)",
                      outline: "none",
                      fontSize: "0.8rem",
                      fontFamily: "inherit",
                      resize: "none",
                      boxShadow: "3px 3px 0px var(--primary)",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="neo-button"
                  style={{
                    backgroundColor: "var(--primary-container)",
                    width: "100%",
                    padding: "10px",
                    fontSize: "0.75rem",
                    marginTop: "4px",
                  }}
                >
                  ENVIAR CANDIDATURA ⚡
                </button>
              </form>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "16px 0",
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
                    ¡DEMO EN COLA! 📻
                  </h3>
                  <p style={{ fontSize: "0.75rem", fontWeight: "bold", opacity: 0.8 }}>
                    Hola <strong>{djName}</strong>, tu postulación ha sido enviada al equipo pirata. Revisaremos tu material en el búnker y te contactaremos a <strong>{djEmail}</strong> si encajas en la grilla.
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
                    padding: "10px 16px",
                    fontSize: "0.75rem",
                    marginTop: "8px",
                  }}
                >
                  ENTENDIDO, VOLVER 📡
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
