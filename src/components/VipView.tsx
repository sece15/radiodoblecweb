import { useState } from "react";
import { useAudio } from "@/context/AudioContext";
import { Play, Download, Music, Plus, Sparkles, FolderLock } from "lucide-react";
import { Song } from "@/types";

interface VipViewProps {
  onNavigateToPlayer: () => void;
}

export const VipView = ({ onNavigateToPlayer }: VipViewProps) => {
  const { albums, addAlbum, playSong, userProfile } = useAudio();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumArtist, setNewAlbumArtist] = useState("");
  const [newAlbumYear, setNewAlbumYear] = useState("2026");
  const [newAlbumGenre, setNewAlbumGenre] = useState("ROCK");
  const [newAlbumImageUrl, setNewAlbumImageUrl] = useState("");

  const isAdmin = userProfile.role.toUpperCase() === "ADMIN";

  // Mapped mock tracks for VIP albums
  const getTracksForAlbum = (albumId: string): { title: string; duration: string; url: string }[] => {
    if (albumId === "berlin_set") {
      return [
        { title: "Bunker Rave 2025", duration: "3:45", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
        { title: "Industrial Pulse", duration: "4:12", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
        { title: "Schatten Echo", duration: "3:20", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      ];
    }
    if (albumId === "fanzine_4") {
      return [
        { title: "Pogo Libre", duration: "2:55", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
        { title: "Grito Anárquico", duration: "3:10", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
        { title: "Cero Censura", duration: "3:40", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
      ];
    }
    // Fallback for custom uploaded albums
    return [
      { title: "Tema A1 (Premium Mix)", duration: "4:00", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { title: "Tema B2 (Direct Feed)", duration: "3:45", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
    ];
  };

  const handleDownload = async (url: string, trackTitle: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${trackTitle.toLowerCase().replace(/\s+/g, "_")}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Popup download failed, redirecting:", err);
      window.open(url, "_blank");
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim() || !newAlbumArtist.trim()) {
      alert("Por favor completa el título y artista del álbum 📻");
      return;
    }
    addAlbum(newAlbumName, newAlbumArtist, newAlbumYear, newAlbumGenre, newAlbumImageUrl);
    setNewAlbumName("");
    setNewAlbumArtist("");
    setNewAlbumYear("2026");
    setNewAlbumGenre("ROCK");
    setNewAlbumImageUrl("");
    setShowAddModal(false);
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
      {/* 1. VIP WELCOME BANNER */}
      <div
        className="neo-card scanlines"
        style={{
          backgroundColor: "var(--primary-container)",
          border: "4px solid var(--primary)",
          boxShadow: "8px 8px 0px var(--primary)",
          padding: "20px",
          position: "relative",
          transform: "rotate(-0.8deg)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles style={{ color: "var(--primary)", fill: "var(--primary)" }} size={24} />
          <h2 style={{ fontSize: "1.4rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
            ZONA EXCLUSIVA VIP
          </h2>
        </div>
        <p style={{ fontSize: "0.75rem", lineHeight: "1.1rem", opacity: 0.9 }}>
          Sintonizas el fanzine sonoro en alta definición. Como miembro **VIP** de la Radio Doble C, tienes acceso exclusivo a nuestra discografía, streaming a la carta sin publicidad y descargas directas en formato MP3 de alta fidelidad. ¡Gracias por apoyar la radio libre! ⚡
        </p>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="neo-button fun-hover-wobble"
            style={{
              marginTop: "8px",
              padding: "6px 12px",
              backgroundColor: "white",
              fontSize: "0.7rem",
              fontWeight: 900,
              width: "max-content",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "3px 3px 0px var(--primary)",
              cursor: "pointer",
            }}
          >
            <Plus size={14} />
            AÑADIR ÁLBUM VIP
          </button>
        )}
      </div>

      {/* 2. ALBUMS LIST CONTAINER */}
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 900,
            textTransform: "uppercase",
            borderBottom: "4px solid var(--primary)",
            paddingBottom: "6px",
            width: "max-content",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <FolderLock size={18} />
          ÁLBUMES DISPONIBLES
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {albums.map((album, idx) => {
            const rot = idx % 2 === 0 ? 0.5 : -0.5;
            const tracks = getTracksForAlbum(album.id);

            return (
              <div
                key={album.id}
                className="neo-card"
                style={{
                  backgroundColor: "var(--surface-container)",
                  border: "3px solid var(--primary)",
                  boxShadow: "6px 6px 0px var(--primary)",
                  padding: "16px",
                  transform: `rotate(${rot}deg)`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Album Info Row */}
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <img
                    src={album.imageUrl}
                    alt={album.name}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      border: "3px solid var(--primary)",
                      boxShadow: "3px 3px 0px var(--primary)",
                      backgroundColor: "white",
                    }}
                  />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", minWidth: "160px" }}>
                    <span
                      style={{
                        backgroundColor: "var(--primary-container)",
                        border: "1px solid var(--primary)",
                        padding: "1px 6px",
                        fontSize: "0.55rem",
                        fontWeight: 900,
                        width: "max-content",
                        textTransform: "uppercase",
                      }}
                    >
                      {album.genre}
                    </span>
                    <h4
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        lineHeight: "1.3rem",
                        color: "var(--primary)",
                      }}
                    >
                      {album.name}
                    </h4>
                    <p style={{ fontSize: "0.75rem", fontWeight: "bold", opacity: 0.8 }}>
                      Artista: {album.artist.toUpperCase()} • {album.releaseYear}
                    </p>
                  </div>
                </div>

                {/* Tracks Header */}
                <div style={{ borderTop: "1.5px dashed var(--primary)", paddingTop: "8px" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 900, color: "#BA1A1A", display: "block", marginBottom: "6px" }}>
                    PISTAS EXCLUSIVAS DE DESCARGA:
                  </span>

                  {/* Tracks list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {tracks.map((track, trackIdx) => {
                      const songObj: Song = {
                        id: `vip-${album.id}-${trackIdx}`,
                        title: track.title,
                        artist: album.artist,
                        albumName: album.name,
                        imageUrl: album.imageUrl,
                        streamUrl: track.url,
                        durationSeconds: 220,
                        isFavorite: false,
                      };

                      return (
                        <div
                          key={trackIdx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: "white",
                            border: "2px solid var(--primary)",
                            padding: "6px 12px",
                            boxShadow: "2px 2px 0px var(--primary)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                            <Music size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {trackIdx + 1}. {track.title}
                            </span>
                            <span style={{ fontSize: "0.6rem", opacity: 0.6 }}>({track.duration})</span>
                          </div>

                          <div style={{ display: "flex", gap: "6px" }}>
                            {/* Play Button */}
                            <button
                              onClick={() => {
                                playSong(songObj);
                                onNavigateToPlayer();
                              }}
                              style={{
                                width: "24px",
                                height: "24px",
                                padding: 0,
                                backgroundColor: "var(--primary-container)",
                                border: "1.5px solid var(--primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                              title="Reproducir pista"
                            >
                              <Play size={10} style={{ fill: "var(--primary)", color: "var(--primary)" }} />
                            </button>

                            {/* Download Button */}
                            <button
                              onClick={() => handleDownload(track.url, track.title)}
                              style={{
                                width: "24px",
                                height: "24px",
                                padding: 0,
                                backgroundColor: "white",
                                border: "1.5px solid var(--primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                              title="Descargar MP3"
                            >
                              <Download size={10} style={{ color: "var(--primary)" }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ADD ALBUM MODAL FOR ADMINS */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 3500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="neo-card"
            style={{
              width: "100%",
              maxWidth: "400px",
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
            <h4 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", textAlign: "center" }}>
              ⚡ NUEVO ÁLBUM VIP
            </h4>

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.65rem", fontWeight: 900 }}>TÍTULO DEL ÁLBUM *</label>
                <input
                  type="text"
                  required
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="Ej. Brutal Berlin Set"
                  style={{ padding: "6px", border: "2px solid var(--primary)", fontSize: "0.75rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.65rem", fontWeight: 900 }}>ARTISTA / BANDA *</label>
                <input
                  type="text"
                  required
                  value={newAlbumArtist}
                  onChange={(e) => setNewAlbumArtist(e.target.value)}
                  placeholder="Ej. Eva Schatten"
                  style={{ padding: "6px", border: "2px solid var(--primary)", fontSize: "0.75rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.65rem", fontWeight: 900 }}>AÑO DE LANZAMIENTO</label>
                  <input
                    type="number"
                    value={newAlbumYear}
                    onChange={(e) => setNewAlbumYear(e.target.value)}
                    style={{ padding: "6px", border: "2px solid var(--primary)", fontSize: "0.75rem", outline: "none" }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.65rem", fontWeight: 900 }}>GÉNERO PRINCIPAL</label>
                  <input
                    type="text"
                    value={newAlbumGenre}
                    onChange={(e) => setNewAlbumGenre(e.target.value.toUpperCase())}
                    style={{ padding: "6px", border: "2px solid var(--primary)", fontSize: "0.75rem", outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.65rem", fontWeight: 900 }}>URL DE LA IMAGEN DE PORTADA</label>
                <input
                  type="url"
                  value={newAlbumImageUrl}
                  onChange={(e) => setNewAlbumImageUrl(e.target.value)}
                  placeholder="Dejar vacío para portada por defecto"
                  style={{ padding: "6px", border: "2px solid var(--primary)", fontSize: "0.75rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: "6px",
                    border: "2px solid var(--primary)",
                    backgroundColor: "white",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                  }}
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "6px",
                    border: "2px solid var(--primary)",
                    backgroundColor: "var(--primary-container)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    boxShadow: "2px 2px 0px var(--primary)",
                  }}
                >
                  GUARDAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
