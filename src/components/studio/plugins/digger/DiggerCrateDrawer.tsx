"use client";

import { Bookmark, History, Music2, Trash2, X } from "lucide-react";
import type { DiggerTrack, PlayedHistoryItem } from "@/types/studio";
import { CRATE_DATABASE, formatRelativeTime } from "@/lib/studio/diggerStorage";

interface DiggerCrateDrawerProps {
  drawerTab: "history" | "favorites";
  playedHistory: PlayedHistoryItem[];
  favorites: string[];
  tracksPool: DiggerTrack[];
  currentTrack: DiggerTrack;
  onChangeTab: (tab: "history" | "favorites") => void;
  onClose: () => void;
  onClearHistory: () => void;
  onSelectHistoryTrack: (item: PlayedHistoryItem) => void;
  onSelectFavoriteTrack: (fav: DiggerTrack) => void;
}

export function DiggerCrateDrawer({
  drawerTab,
  playedHistory,
  favorites,
  tracksPool,
  currentTrack,
  onChangeTab,
  onClose,
  onClearHistory,
  onSelectHistoryTrack,
  onSelectFavoriteTrack,
}: DiggerCrateDrawerProps) {
  const favoriteTracks = tracksPool
    .filter((t) => favorites.includes(t.id))
    .concat(
      CRATE_DATABASE.filter(
        (t) => favorites.includes(t.id) && !tracksPool.some((p) => p.id === t.id)
      )
    );

  return (
    <div
      style={{
        width: "300px",
        backgroundColor: "#0D1017",
        borderLeft: "2px solid #1E2332",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: "12px",
        gap: "10px",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      {/* Drawer Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
        <div style={{ display: "flex", gap: "4px", flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => onChangeTab("history")}
            style={{
              flex: 1,
              padding: "6px 8px",
              backgroundColor: drawerTab === "history" ? "#CCFF00" : "#161B26",
              color: drawerTab === "history" ? "#000000" : "#94A3B8",
              border: "1px solid #232838",
              borderRadius: "4px",
              fontSize: "0.68rem",
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <History size={12} />
            <span>HISTORIAL ({playedHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab("favorites")}
            style={{
              flex: 1,
              padding: "6px 8px",
              backgroundColor: drawerTab === "favorites" ? "#CCFF00" : "#161B26",
              color: drawerTab === "favorites" ? "#000000" : "#94A3B8",
              border: "1px solid #232838",
              borderRadius: "4px",
              fontSize: "0.68rem",
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <Bookmark size={12} />
            <span>GUARDADOS ({favorites.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#94A3B8",
            cursor: "pointer",
            padding: "4px",
            flexShrink: 0,
          }}
          title="Cerrar panel lateral"
        >
          <X size={14} />
        </button>
      </div>

      {/* TAB 1: HISTORIAL */}
      {drawerTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#94A3B8" }}>
              VINILOS REPRODUCIDOS
            </span>
            {playedHistory.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#EF4444",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  padding: "2px 4px",
                }}
                title="Limpiar registro de historial"
              >
                <Trash2 size={10} />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {playedHistory.length === 0 ? (
            <div
              style={{
                padding: "20px 12px",
                textAlign: "center",
                color: "#94A3B8",
                fontSize: "0.72rem",
                backgroundColor: "#11141C",
                border: "1px dashed #1E2332",
                borderRadius: "4px",
              }}
            >
              <Music2 size={24} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
              <p style={{ margin: 0 }}>Aún no has reproducido vinilos en esta sesión.</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.66rem", color: "#CCFF00" }}>
                ¡Presiona C-RANDOM-SAMPLE 🎲 para comenzar!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
              {playedHistory.map((item, index) => {
                const isCurrent =
                  currentTrack.id === item.id || currentTrack.youtubeId === item.youtubeId;
                return (
                  <button
                    key={`${item.youtubeId || item.id}-${item.playedAt || index}`}
                    type="button"
                    onClick={() => onSelectHistoryTrack(item)}
                    style={{
                      padding: "7px 9px",
                      backgroundColor: isCurrent ? "#161E2E" : "#11141C",
                      border: isCurrent ? "1.5px solid #CCFF00" : "1px solid #1E2332",
                      borderRadius: "4px",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      minWidth: 0,
                      overflow: "hidden",
                      transition: "all 0.12s ease",
                    }}
                    title="Haz clic para volver a escuchar este vinilo"
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px", minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          color: isCurrent ? "#CCFF00" : "#FFFFFF",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {item.title}
                      </span>
                      {isCurrent && (
                        <span style={{ fontSize: "0.58rem", fontWeight: 900, color: "#000000", backgroundColor: "#CCFF00", padding: "1px 4px", borderRadius: "2px", flexShrink: 0 }}>
                          ACTUAL
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px", minWidth: 0 }}>
                      <span style={{ fontSize: "0.64rem", color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                        👤 {item.artist} {item.country ? `· ${item.country}` : ""}
                      </span>
                      <span style={{ fontSize: "0.58rem", color: "#64748B", fontFamily: "monospace", flexShrink: 0 }}>
                        {formatRelativeTime(item.playedAt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FAVORITOS */}
      {drawerTab === "favorites" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#94A3B8" }}>
            VINILOS GUARDADOS EN TU CRATE
          </span>
          {favoriteTracks.length === 0 ? (
            <div
              style={{
                padding: "20px 12px",
                textAlign: "center",
                color: "#94A3B8",
                fontSize: "0.72rem",
                backgroundColor: "#11141C",
                border: "1px dashed #1E2332",
                borderRadius: "4px",
              }}
            >
              <Bookmark size={24} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No tienes vinilos guardados aún.</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.66rem", color: "#CCFF00" }}>
                Guarda tus pistas favoritas con el botón de corazón ❤️
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
              {favoriteTracks.map((fav) => {
                const isCurrent = fav.id === currentTrack.id;
                return (
                  <button
                    key={fav.id}
                    type="button"
                    onClick={() => onSelectFavoriteTrack(fav)}
                    style={{
                      padding: "7px 9px",
                      backgroundColor: isCurrent ? "#161E2E" : "#11141C",
                      border: isCurrent ? "1.5px solid #CCFF00" : "1px solid #1E2332",
                      borderRadius: "4px",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      minWidth: 0,
                      overflow: "hidden",
                    }}
                  >
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                      {fav.title}
                    </span>
                    <span style={{ fontSize: "0.64rem", color: "#CCFF00", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                      {fav.artist} ({fav.country})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
