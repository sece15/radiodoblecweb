import { useState, CSSProperties } from "react";
import { useAudio } from "@/context/AudioContext";
import { Check, Edit, Share2, LogOut, Clock, Users, Star, PlayCircle, X } from "lucide-react";

interface ProfileViewProps {
  onNavigateToPlayer: () => void;
}

export const ProfileView = ({ onNavigateToPlayer }: ProfileViewProps) => {
  const {
    userProfile,
    saveProfile,
    isAuthenticated,
    signOut,
    signInWithGoogle,
    stations,
    songs,
    albums,
    toggleSongFavorite,
    playSong,
    skipNext,
    activeTheme,
    selectTheme,
  } = useAudio();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editRole, setEditRole] = useState(userProfile.role);
  const [editHours, setEditHours] = useState(userProfile.stashHours);

  const savedStations = stations.filter((s) => s.isLiked);

  const handleSave = () => {
    saveProfile(editName, editRole, userProfile.avatarUrl, editHours, userProfile.followersCount);
    setShowEditModal(false);
  };

  const handleShareProfile = () => {
    alert(`Enlace de perfil para @${userProfile.name} copiado 📡`);
  };

  const availableThemes = [
    { id: "PUNK_NEON", name: "Fanzine Brutal", colors: ["#CCFF00", "#F9FBE5"] },
    { id: "COSMIC_DARK", name: "Cosmic Slate", colors: ["#00FFCC", "#12141C"] },
    { id: "CYBER_RED", name: "Cyberpunk Red", colors: ["#FF0D43", "#FAE000"] },
    { id: "RETRO_AMBER", name: "Amber CRT", colors: ["#FF8000", "#150F05"] },
    { id: "TROPICAL", name: "Isla Tropical", colors: ["#EC008C", "#FFB6D9"] },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        padding: "20px 16px 180px 16px",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* PROFILE HEADER BLOCK */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          width: "100%",
          maxWidth: "480px",
          textAlign: "center",
        }}
      >
        {/* GUEST MODE NOTICE */}
        {!isAuthenticated && (
          <div
            style={{
              width: "100%",
              backgroundColor: "#BA1A1A",
              border: "2px solid var(--primary)",
              padding: "8px",
              textAlign: "center",
              color: "white",
              fontWeight: "black",
              fontSize: "0.7rem",
            }}
          >
            MODO INVITADO: MOSTRANDO DATOS DE PRUEBA
          </div>
        )}

        {/* 1. MAIN AVATAR BLOCK */}
        <div style={{ position: "relative", width: "200px", height: "200px", padding: "8px" }}>
          <div
            className="neo-card"
            style={{
              width: "100%",
              height: "100%",
              boxShadow: "6px 6px 0px var(--primary)",
              overflow: "hidden",
              backgroundColor: "white",
            }}
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Verification Check Badge */}
          <div
            style={{
              position: "absolute",
              bottom: "-6px",
              right: "-6px",
              backgroundColor: "var(--primary-container)",
              border: "2px solid var(--primary)",
              padding: "6px",
              transform: "rotate(12deg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <Check size={20} style={{ color: "var(--primary)" }} />
          </div>
        </div>

        {/* 2. NAME & ROLE DISPLAY */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <h2
            style={{
              fontSize: "2rem",
              lineHeight: "2.2rem",
              textAlign: "center",
              fontWeight: 900,
              textTransform: "uppercase",
              fontFamily: "Space Grotesk, sans-serif",
              whiteSpace: "pre-line",
            }}
          >
            {userProfile.name}
          </h2>

          {/* Dynamic Badge Role */}
          <div
            style={{
              transform: "rotate(-2deg)",
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              padding: "6px 14px",
              fontSize: "0.75rem",
              fontWeight: 900,
            }}
          >
            {userProfile.role.toUpperCase()}
          </div>
        </div>

        {/* 3. EDIT & SHARE BUTTONS */}
        <div style={{ display: "flex", width: "100%", maxWidth: "340px", gap: "16px", justifyContent: "center" }}>
          <button
            onClick={() => {
              if (isAuthenticated) {
                setEditName(userProfile.name);
                setEditRole(userProfile.role);
                setEditHours(userProfile.stashHours);
                setShowEditModal(true);
              } else {
                signInWithGoogle();
              }
            }}
            className="neo-button fun-hover-wobble"
            style={{
              flex: 1,
              backgroundColor: "var(--primary-container)",
              fontSize: "0.75rem",
              "--rest-rot": "0deg",
            } as CSSProperties}
          >
            <Edit size={16} style={{ marginRight: "8px" }} />
            {isAuthenticated ? "EDITAR" : "ACCEDER CON GOOGLE"}
          </button>

          <button
            onClick={handleShareProfile}
            className="neo-button fun-hover-wobble"
            style={{
              flex: 1,
              backgroundColor: "white",
              fontSize: "0.75rem",
              "--rest-rot": "0deg",
            } as CSSProperties}
          >
            <Share2 size={16} style={{ marginRight: "8px" }} />
            SHARE
          </button>
        </div>

        {isAuthenticated && (
          <button
            onClick={signOut}
            className="neo-button fun-hover-wobble"
            style={{
              width: "100%",
              maxWidth: "340px",
              backgroundColor: "#BA1A1A",
              color: "white",
              fontSize: "0.75rem",
              boxShadow: "4px 4px 0px var(--primary)",
              "--rest-rot": "0deg",
            } as CSSProperties}
          >
            <LogOut size={16} style={{ marginRight: "8px" }} />
            CERRAR SESIÓN
          </button>
        )}
      </div>

      {/* 4. STATS METERS */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          width: "100%",
          maxWidth: "768px",
          gap: "16px",
          justifyContent: "center",
          marginTop: "8px",
        }}
      >
        {/* Hours card */}
        <div
          className="neo-card fun-hover-wobble"
          style={{
            flex: "1 1 300px",
            padding: "16px",
            transform: "rotate(1deg)",
            boxShadow: "6px 6px 0px var(--primary)",
            "--rest-rot": "1deg",
          } as CSSProperties}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 900 }}>HORAS SINTONIZADAS</span>
            <Clock size={20} />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "4px", margin: "10px 0" }}>
            <span style={{ fontSize: "2.2rem", fontWeight: 900 }}>{userProfile.stashHours}</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 900 }}>HRS</span>
          </div>

          {/* Slider line decoration */}
          <div
            style={{
              width: "100%",
              height: "18px",
              border: "2px solid var(--primary)",
              backgroundColor: "var(--surface-container)",
              padding: "2px",
            }}
          >
            <div
              style={{
                width: "75%",
                height: "100%",
                backgroundColor: "var(--primary-container)",
                borderRight: "1px solid var(--primary)",
              }}
            ></div>
          </div>
        </div>

        {/* Reputation card */}
        <div
          className="neo-card fun-hover-wobble"
          style={{
            flex: "1 1 300px",
            padding: "16px",
            transform: "rotate(-1deg)",
            boxShadow: "6px 6px 0px var(--primary)",
            "--rest-rot": "-1deg",
          } as CSSProperties}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 900 }}>REPUTACIÓN</span>
            <Users size={20} />
          </div>

          <h3 style={{ fontSize: "2.2rem", fontWeight: 900, margin: "10px 0" }}>
            {userProfile.followersCount}
          </h3>

          <div
            style={{
              backgroundColor: "var(--primary-container)",
              border: "1px solid var(--primary)",
              padding: "2px 6px",
              width: "max-content",
              fontSize: "0.7rem",
              fontWeight: "bold",
              fontFamily: "monospace",
            }}
          >
            +124 ESTA SEMANA
          </div>
        </div>
      </div>

      {/* 5. SAVED STATIONS */}
      {savedStations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "768px", gap: "16px", marginTop: "16px" }}>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 900,
              textTransform: "uppercase",
              borderBottom: "4px solid var(--primary)",
              paddingBottom: "6px",
              width: "max-content",
            }}
          >
            RADIOS GUARDADAS
          </h3>

          <div style={{ display: "flex", gap: "16px", overflowX: "auto", padding: "8px 0" }}>
            {savedStations.map((station) => (
              <div
                key={station.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  width: "120px",
                  flexShrink: 0,
                }}
              >
                <div
                  className="neo-card"
                  style={{
                    width: "100%",
                    aspectRatio: "1/1",
                    boxShadow: "4px 4px 0px var(--primary)",
                    transform: `rotate(${station.name.length % 2 === 0 ? -3 : 3}deg)`,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={station.imageUrl}
                    alt={station.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                  />
                </div>
                <span
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--on-primary)",
                    fontSize: "0.6rem",
                    fontWeight: "bold",
                    padding: "2px 6px",
                    transform: `rotate(${station.name.length % 2 === 0 ? 1 : -2}deg)`,
                    whiteSpace: "nowrap",
                    textTransform: "uppercase",
                  }}
                >
                  {station.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. RECENTLY LISTENED */}
      <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "768px", gap: "16px", marginTop: "16px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase" }}>
          RECIENTEMENTE ESCUCHADA
        </h3>

        <div
          className="neo-card"
          style={{
            backgroundColor: "var(--primary)",
            color: "white",
            boxShadow: "8px 8px 0px var(--primary-container)",
          }}
        >
          <div className="scanlines" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  backgroundColor: "#BA1A1A",
                  border: "1px solid white",
                  transform: "rotate(2deg)",
                  padding: "2px 6px",
                  fontSize: "0.6rem",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                LIVE_FEED
              </div>
              <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>1H 45MIN • Hace 2h</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ fontWeight: 900, fontSize: "0.8rem", letterSpacing: "0.02em" }}>
                  SESS-089: UNDERGROUND ANTISYSTEM
                </h4>
              </div>

              <button
                onClick={() => {
                  skipNext();
                  onNavigateToPlayer();
                }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <PlayCircle size={44} style={{ color: "var(--primary-container)" }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 8. VISUAL THEMES */}
      <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "768px", gap: "16px", marginTop: "16px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase" }}>
          TEMAS VISUALES
        </h3>

        <div style={{ display: "flex", gap: "12px", overflowX: "auto", padding: "20px 16px 12px 16px" }}>
          {availableThemes.map((theme, idx) => {
            const isSelected = activeTheme === theme.id;
            const restRotation = idx % 2 === 0 ? -2.5 : 2.5;
            return (
              <div
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                className="neo-card fun-hover-wobble"
                style={{
                  width: "130px",
                  flexShrink: 0,
                  backgroundColor: theme.colors[1],
                  borderWidth: "3px",
                  borderColor: "var(--primary)",
                  boxShadow: isSelected ? "0px 0px 0px var(--primary)" : "6px 6px 0px var(--primary)",
                  transform: isSelected 
                    ? `translate(6px, 6px) rotate(0deg)` 
                    : `rotate(${restRotation}deg)`,
                  padding: "12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  "--rest-rot": `${restRotation}deg`,
                } as CSSProperties}
              >
                {/* Previews */}
                <div style={{ display: "flex", gap: "4px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: theme.colors[0], border: "1px solid black" }}></div>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: theme.colors[1], border: "1px solid black" }}></div>
                </div>

                <h4
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    color: theme.id === "COSMIC_DARK" || theme.id === "RETRO_AMBER" ? "white" : "black",
                  }}
                >
                  {theme.name}
                </h4>

                <div
                  style={{
                    backgroundColor: isSelected ? theme.colors[0] : "lightgrey",
                    color: "black",
                    fontSize: "0.55rem",
                    fontWeight: "bold",
                    padding: "2px 4px",
                    width: "max-content",
                  }}
                >
                  {isSelected ? "ACTIVO" : "ELEGIR"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 9. DEVICE MUSIC SYNC (ALBUMS & SONGS) ROW */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          width: "100%",
          maxWidth: "768px",
          gap: "24px",
          marginTop: "16px",
        }}
      >
        {/* Column 1: Álbumes en Dispositivo */}
        <div style={{ flex: "1 1 450px", display: "flex", flexDirection: "column", gap: "16px", minWidth: "300px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase" }}>
            ÁLBUMES EN DISPOSITIVO
          </h3>

          <div style={{ display: "flex", gap: "12px", overflowX: "auto", padding: "18px 16px 12px 16px" }}>
            {albums.map((album) => (
              <div
                key={album.id}
                className="neo-card fun-hover-wobble"
                style={{
                  width: "160px",
                  flexShrink: 0,
                  backgroundColor: "var(--surface-container)",
                  padding: "8px",
                  boxShadow: "6px 6px 0px var(--primary)",
                  "--rest-rot": "0deg",
                } as CSSProperties}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <img
                    src={album.imageUrl}
                    alt={album.name}
                    style={{ width: "100%", height: "100px", objectFit: "cover", border: "2px solid var(--primary)" }}
                  />
                  <h4 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {album.name}
                  </h4>
                  <p style={{ fontSize: "0.6rem", fontWeight: 600, opacity: 0.8 }}>
                    {album.artist} • {album.releaseYear}
                  </p>
                  <div
                    style={{
                      backgroundColor: "var(--primary-container)",
                      padding: "1px 4px",
                      fontSize: "0.55rem",
                      fontWeight: "bold",
                      width: "max-content",
                    }}
                  >
                    {album.genre}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Canciones Sintonizadas */}
        <div style={{ flex: "1 1 450px", display: "flex", flexDirection: "column", gap: "16px", minWidth: "300px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase" }}>
            CANCIONES SINTONIZADAS
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {songs.map((song) => (
              <div
                key={song.id}
                className="neo-card fun-hover-wobble"
                style={{
                  padding: "10px",
                  backgroundColor: "var(--surface-container)",
                  boxShadow: "4px 4px 0px var(--primary)",
                  "--rest-rot": "0deg",
                } as CSSProperties}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                    <img
                      src={song.imageUrl}
                      alt={song.title}
                      style={{ width: "48px", height: "48px", objectFit: "cover", border: "2px solid var(--primary)", flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {song.title}
                      </h4>
                      <p style={{ fontSize: "0.6rem", opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {song.artist} • {song.albumName}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      onClick={() => toggleSongFavorite(song.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "6px" }}
                    >
                      <Star
                        size={20}
                        style={{
                          fill: song.isFavorite ? "#FFCC00" : "none",
                          color: song.isFavorite ? "#FFCC00" : "var(--primary)",
                        }}
                      />
                    </button>

                    <button
                      onClick={() => {
                        playSong(song);
                        onNavigateToPlayer();
                      }}
                      className="neo-button"
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.6rem",
                        boxShadow: "2px 2px 0px var(--primary)",
                        backgroundColor: "var(--primary-container)",
                      }}
                    >
                      PLAY
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Editing Modal Overlay */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            className="neo-card"
            style={{
              width: "100%",
              maxWidth: "340px",
              backgroundColor: "white",
              padding: "20px",
              boxShadow: "6px 6px 0px var(--primary)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase" }}>EDITAR PERFIL</h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>NOMBRE:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "2px solid var(--primary)", outline: "none", fontSize: "0.85rem" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>ROL / DESCRIPCIÓN:</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "2px solid var(--primary)", outline: "none", fontSize: "0.85rem" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>HORAS SINTONIZADAS:</label>
                <input
                  type="number"
                  value={editHours}
                  onChange={(e) => setEditHours(parseInt(e.target.value) || 0)}
                  style={{ width: "100%", padding: "8px", border: "2px solid var(--primary)", outline: "none", fontSize: "0.85rem" }}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="neo-button"
              style={{
                backgroundColor: "var(--primary-container)",
                width: "100%",
                padding: "10px",
                fontSize: "0.8rem",
              }}
            >
              GUARDAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
