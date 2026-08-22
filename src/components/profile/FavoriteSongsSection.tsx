"use client";

import { Star } from "lucide-react";
import { Song } from "@/types";

interface FavoriteSongsSectionProps {
  favoriteSongs: Song[];
  onToggleFavorite: (songId: string) => void;
  onPlaySong: (song: Song) => void;
  onNavigateToPlayer: () => void;
}

export const FavoriteSongsSection = ({
  favoriteSongs,
  onToggleFavorite,
  onPlaySong,
  onNavigateToPlayer,
}: FavoriteSongsSectionProps) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "800px",
        gap: "12px",
        marginTop: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
          ⭐ TUS CANCIONES FAVORITAS ({favoriteSongs.length})
        </h3>
      </div>

      {favoriteSongs.length === 0 ? (
        <div
          className="neo-card"
          style={{
            padding: "20px",
            backgroundColor: "var(--surface-container)",
            border: "2px dashed var(--primary)",
            textAlign: "center",
          }}
        >
          <Star size={26} style={{ color: "var(--primary)", opacity: 0.5, margin: "0 auto 6px auto" }} />
          <p style={{ fontSize: "0.75rem", fontWeight: 900, margin: 0 }}>
            AÚN NO TIENES CANCIONES MARCADAS COMO FAVORITAS
          </p>
          <p style={{ fontSize: "0.68rem", opacity: 0.7, margin: "4px 0 0 0" }}>
            Haz clic en la estrella ⭐ del reproductor de música mientras escuchas tus canciones
            preferidas para guardarlas en tu lista.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {favoriteSongs.map((song) => (
            <div
              key={song.id}
              className="neo-card fun-hover-wobble"
              style={{
                padding: "10px 14px",
                backgroundColor: "var(--surface-container)",
                boxShadow: "3px 3px 0px var(--primary)",
                border: "2px solid var(--primary)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  style={{
                    width: "42px",
                    height: "42px",
                    objectFit: "cover",
                    border: "2px solid var(--primary)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <h4
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      margin: 0,
                    }}
                  >
                    {song.title}
                  </h4>
                  <p
                    style={{
                      fontSize: "0.62rem",
                      opacity: 0.8,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      margin: "2px 0 0 0",
                    }}
                  >
                    {song.artist} • {song.albumName}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => onToggleFavorite(song.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                  aria-label="Quitar de favoritos"
                  title="Quitar de favoritos"
                >
                  <Star size={18} style={{ fill: "#FFCC00", color: "#FFCC00" }} />
                </button>

                <button
                  onClick={() => {
                    onPlaySong(song);
                    onNavigateToPlayer();
                  }}
                  className="neo-button"
                  style={{
                    padding: "5px 10px",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    backgroundColor: "var(--primary-container)",
                    boxShadow: "2px 2px 0px var(--primary)",
                  }}
                >
                  REPRODUCIR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
