import React, { useState } from "react";
import { useAudio, Station, RadioProgram, Song } from "@/context/AudioContext";
import { ArrowLeft, X, Music, Radio, Star, Play } from "lucide-react";

interface SearchOverlayProps {
  onClose: () => void;
  onNavigateToPlayer: () => void;
  onNavigateToExploreWithStyle: (style: string) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  onClose,
  onNavigateToPlayer,
  onNavigateToExploreWithStyle,
}) => {
  const {
    stations,
    programs,
    songs,
    playStation,
    playSong,
  } = useAudio();

  const [query, setQuery] = useState("");

  const recommendationTags = ["HIP HOP UNDERGROUND", "TECHNO CORE", "ELECTRO PUNK", "COSMIC AMBIENT"];

  // Filter lists based on query
  const filteredPrograms = query.trim()
    ? programs.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.host.toLowerCase().includes(query.toLowerCase()) ||
          p.genre.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredStations = query.trim()
    ? stations.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.style.toLowerCase().includes(query.toLowerCase()) ||
          s.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredSongs = query.trim()
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.artist.toLowerCase().includes(query.toLowerCase()) ||
          s.albumName.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const hasResults = filteredPrograms.length > 0 || filteredStations.length > 0 || filteredSongs.length > 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "var(--background)",
        zIndex: 999,
        padding: "20px 16px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={onClose}
            className="neo-button"
            style={{ width: "40px", height: "40px", padding: 0, borderRadius: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ textTransform: "uppercase", fontSize: "1.2rem", fontWeight: 900 }}>
            BUSCADOR RADIO
          </h2>
        </div>
        <div
          style={{
            backgroundColor: "var(--primary-container)",
            border: "2px solid var(--primary)",
            padding: "4px 8px",
            fontSize: "0.7rem",
            fontWeight: "black",
          }}
        >
          DIAL DOBLE C
        </div>
      </div>

      {/* Info Banner */}
      <div
        className="neo-card"
        style={{
          backgroundColor: "var(--primary-container)",
          padding: "12px",
          boxShadow: "4px 4px 0px var(--primary)",
        }}
      >
        <h4 style={{ fontWeight: 900, fontSize: "0.75rem", marginBottom: "4px" }}>
          FANZINE RADIAL DOBLE C
        </h4>
        <p style={{ fontSize: "0.7rem", lineHeight: "1rem", opacity: 0.9 }}>
          Somos una sola radio libre e independiente, pero sintonizamos múltiples programas de autor, locutores piratas, estilos únicos y tracks de archivo.
        </p>
      </div>

      {/* Search Input */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca un programa, locutor, estilo o canción..."
          className="neo-card"
          style={{
            width: "100%",
            padding: "12px 40px 12px 12px",
            fontSize: "0.9rem",
            outline: "none",
            backgroundColor: "var(--secondary-container)",
            color: "var(--primary)",
            boxShadow: "4px 4px 0px var(--primary)",
          }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--primary)",
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Recommended styles */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.7rem", fontWeight: "bold" }}>ESTILOS:</span>
        {recommendationTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setQuery(tag)}
            style={{
              border: "1.5px solid var(--primary)",
              background: query === tag ? "var(--primary-container)" : "transparent",
              color: "var(--primary)",
              padding: "4px 8px",
              fontSize: "0.6rem",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Results area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
        {query.trim() && !hasResults && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <h3 style={{ fontWeight: 900, fontSize: "1rem" }}>ONDAS VACÍAS (SIN RASTRO)</h3>
            <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "8px" }}>
              No se encontraron programas, locutores o frecuencias con "{query}".
            </p>
          </div>
        )}

        {/* 1. Programs */}
        {filteredPrograms.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <SearchCategoryHeader title="Programación de nuestra radio" />
            {filteredPrograms.map((prog, idx) => (
              <div
                key={prog.id}
                className="neo-card"
                style={{
                  padding: "12px",
                  boxShadow: "4px 4px 0px var(--primary)",
                  transform: `rotate(${idx % 2 === 0 ? 0.5 : -0.5}deg)`,
                  display: "flex",
                  gap: "12px",
                }}
              >
                <img
                  src={prog.imageUrl}
                  alt={prog.title}
                  style={{ width: "68px", height: "68px", objectFit: "cover", border: "2px solid var(--primary)" }}
                />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4px" }}>
                    <h4 style={{ fontWeight: 900, fontSize: "0.85rem", textTransform: "uppercase" }}>{prog.title}</h4>
                    <span
                      style={{
                        backgroundColor: "var(--primary-container)",
                        border: "1px solid var(--primary)",
                        padding: "2px 4px",
                        fontSize: "0.55rem",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {prog.genre}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.7rem", fontWeight: "bold", opacity: 0.8 }}>
                    LOCUTOR: {prog.host.toUpperCase()} • {prog.timeSlot}
                  </p>
                  <p style={{ fontSize: "0.65rem", lineHeight: "0.85rem", opacity: 0.7 }}>
                    {prog.description}
                  </p>
                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <button
                      onClick={() => {
                        const s = stations.find((st) => st.style.toLowerCase() === prog.genre.toLowerCase());
                        if (s) playStation(s);
                        onClose();
                        onNavigateToPlayer();
                      }}
                      className="neo-button"
                      style={{ padding: "4px 8px", fontSize: "0.6rem", boxShadow: "2px 2px 0px var(--primary)" }}
                    >
                      <Play size={10} style={{ marginRight: "4px", fill: "var(--primary)" }} /> TUNE SHOW
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Stations */}
        {filteredStations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <SearchCategoryHeader title="Dial y frecuencias Radio Doble C" />
            {filteredStations.map((station, idx) => (
              <div
                key={station.id}
                className="neo-card"
                style={{
                  padding: "10px",
                  boxShadow: "4px 4px 0px var(--primary)",
                  transform: `rotate(${idx % 2 === 0 ? -0.5 : 0.5}deg)`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img
                    src={station.imageUrl}
                    alt={station.name}
                    style={{ width: "44px", height: "44px", objectFit: "cover", border: "1.5px solid var(--primary)" }}
                  />
                  <div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <h4 style={{ fontWeight: 900, fontSize: "0.75rem", textTransform: "uppercase" }}>{station.name}</h4>
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToExploreWithStyle(station.style);
                        }}
                        style={{
                          backgroundColor: "var(--primary-container)",
                          padding: "1px 4px",
                          fontSize: "0.55rem",
                          fontWeight: "bold",
                          border: "1px solid var(--primary)",
                          cursor: "pointer",
                        }}
                      >
                        {station.frequency}
                      </button>
                    </div>
                    <p style={{ fontSize: "0.65rem", fontWeight: "semibold", opacity: 0.7, marginTop: "2px" }}>
                      VIBRA: {station.style.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playStation(station);
                    onClose();
                    onNavigateToPlayer();
                  }}
                  className="neo-button"
                  style={{ padding: "4px 8px", fontSize: "0.6rem", boxShadow: "2px 2px 0px var(--primary)" }}
                >
                  <Radio size={10} style={{ marginRight: "4px" }} /> PLAY
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. Songs */}
        {filteredSongs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <SearchCategoryHeader title="Tracks sintonizados (Archivo)" />
            {filteredSongs.map((song, idx) => (
              <div
                key={song.id}
                className="neo-card"
                style={{
                  padding: "10px",
                  boxShadow: "4px 4px 0px var(--primary)",
                  transform: `rotate(${idx % 2 === 0 ? 0.8 : -0.5}deg)`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img
                    src={song.imageUrl}
                    alt={song.title}
                    style={{ width: "44px", height: "44px", objectFit: "cover", border: "1.5px solid var(--primary)" }}
                  />
                  <div>
                    <h4 style={{ fontWeight: 900, fontSize: "0.75rem", textTransform: "uppercase" }}>{song.title}</h4>
                    <p style={{ fontSize: "0.65rem", opacity: 0.7, marginTop: "2px" }}>
                      {song.artist} • {song.albumName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playSong(song);
                    onClose();
                    onNavigateToPlayer();
                  }}
                  className="neo-button"
                  style={{ padding: "4px 8px", fontSize: "0.6rem", boxShadow: "2px 2px 0px var(--primary)" }}
                >
                  <Music size={10} style={{ marginRight: "4px" }} /> PLAY
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SearchCategoryHeader: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
      <div style={{ width: "8px", height: "18px", backgroundColor: "var(--primary-container)", border: "1px solid var(--primary)" }}></div>
      <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </span>
      <div style={{ flex: 1, height: "2px", backgroundColor: "var(--primary)" }}></div>
    </div>
  );
};
