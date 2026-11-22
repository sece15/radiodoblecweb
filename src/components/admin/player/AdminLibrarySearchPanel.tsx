"use client";

import { Check, ListMusic, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { useModalDimensions } from "@/hooks/useModalDimensions";
import type { AdminRadioTrack, AdminRadioPlaylist } from "@/types/adminRadio";

interface AdminLibrarySearchPanelProps {
  playlists: AdminRadioPlaylist[];
  selectedFilterPlaylistId: string;
  totalTracks: number;
  allTracksCount: number;
  filteredTracksCount: number;
  visibleTracks: AdminRadioTrack[];
  hasMoreTracks: boolean;
  isLoadingLibrary: boolean;
  isFetchingLibrary: boolean;
  searchQuery: string;
  enqueuingId: string | number | null;
  enqueuedIds: Record<string, boolean>;
  onSelectPlaylist: (id: string) => void;
  onRefreshLibrary: () => void;
  onChangeSearch: (q: string) => void;
  onEnqueueTrack: (track: AdminRadioTrack) => void;
  onLoadMoreTracks: () => void;
}

export function AdminLibrarySearchPanel({
  playlists,
  selectedFilterPlaylistId,
  totalTracks,
  allTracksCount,
  filteredTracksCount,
  visibleTracks,
  hasMoreTracks,
  isLoadingLibrary,
  isFetchingLibrary,
  searchQuery,
  enqueuingId,
  enqueuedIds,
  onSelectPlaylist,
  onRefreshLibrary,
  onChangeSearch,
  onEnqueueTrack,
  onLoadMoreTracks,
}: AdminLibrarySearchPanelProps) {
  const { isMobile } = useModalDimensions();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : "minmax(250px, 310px) minmax(0, 1fr)",
        gap: isMobile ? "10px" : "14px",
        alignItems: "start",
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* PLAYLISTS: Selector compacto en móvil, columna lateral en escritorio */}
      {isMobile ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            width: "100%",
            minWidth: 0,
          }}
        >
          <select
            aria-label="Filtrar por playlist"
            value={selectedFilterPlaylistId}
            onChange={(e) => onSelectPlaylist(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "8px 10px",
              fontSize: "0.72rem",
              fontWeight: 900,
              border: "2px solid var(--primary)",
              backgroundColor: "var(--surface-container)",
              color: "var(--on-background)",
              boxSizing: "border-box",
            }}
          >
            <option value="">PLAYLIST: TODAS ({totalTracks})</option>
            {playlists.map((pl) => (
              <option key={pl.id} value={String(pl.id)}>
                {pl.name} ({pl.num_songs})
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={isFetchingLibrary}
            onClick={onRefreshLibrary}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              backgroundColor: "var(--surface-container)",
              border: "2px solid var(--primary)",
              color: "var(--on-background)",
              cursor: isFetchingLibrary ? "wait" : "pointer",
              flexShrink: 0,
            }}
            title="Sincronizar biblioteca desde el servidor"
          >
            <RefreshCw size={14} className={isFetchingLibrary ? "animate-spin" : ""} />
          </button>
        </div>
      ) : (
        <div
          style={{
            border: "2px solid var(--primary)",
            backgroundColor: "var(--surface-container)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "420px",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: "8px 10px",
              borderBottom: "2px solid var(--primary)",
              fontSize: "0.68rem",
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>PLAYLISTS ({playlists.length})</span>
            <button
              type="button"
              disabled={isFetchingLibrary}
              onClick={onRefreshLibrary}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "transparent",
                border: "none",
                color: "var(--on-background)",
                fontSize: "0.62rem",
                fontWeight: 900,
                cursor: isFetchingLibrary ? "wait" : "pointer",
              }}
              title="Sincronizar biblioteca desde el servidor"
            >
              <RefreshCw size={12} className={isFetchingLibrary ? "animate-spin" : ""} />
            </button>
          </div>

          <div
            style={{
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              padding: "6px",
              gap: "5px",
            }}
          >
            <button
              type="button"
              onClick={() => onSelectPlaylist("")}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 9px",
                fontSize: "0.68rem",
                fontWeight: 900,
                border: "1.5px solid var(--primary)",
                backgroundColor:
                  selectedFilterPlaylistId === "" ? "var(--primary-container)" : "var(--card-bg)",
                color:
                  selectedFilterPlaylistId === ""
                    ? "var(--on-primary-container)"
                    : "var(--on-background)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span>TODAS LAS CANCIONES</span>
              <span>{totalTracks}</span>
            </button>

            {playlists.map((pl) => {
              const isActive = selectedFilterPlaylistId === String(pl.id);
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => onSelectPlaylist(String(pl.id))}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 9px",
                    fontSize: "0.68rem",
                    fontWeight: 900,
                    border: "1.5px solid var(--primary)",
                    backgroundColor: isActive ? "var(--primary-container)" : "var(--card-bg)",
                    color: isActive ? "var(--on-primary-container)" : "var(--on-background)",
                    cursor: "pointer",
                    textAlign: "left",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      minWidth: 0,
                    }}
                  >
                    {pl.name}
                  </span>
                  <span style={{ flexShrink: 0, opacity: 0.85 }}>{pl.num_songs}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* COLUMNA DERECHA: BUSCADOR + LISTA DE CANCIONES */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Buscar al instante por artista, título o archivo..."
            className="neo-input"
            style={{
              width: "100%",
              padding: "8px 10px 8px 32px",
              fontSize: "0.76rem",
              fontWeight: 700,
              border: "2px solid var(--primary)",
              backgroundColor: "var(--card-bg)",
              color: "var(--on-background)",
            }}
          />
          <Search
            size={15}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.7,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.66rem",
            fontWeight: 800,
            color: "var(--on-surface-variant)",
          }}
        >
          <span>
            <ListMusic size={12} style={{ display: "inline", marginRight: "4px" }} />
            {isLoadingLibrary
              ? "Cargando biblioteca completa de la radio..."
              : `Mostrando ${visibleTracks.length} de ${filteredTracksCount} canciones (${totalTracks} en total)`}
          </span>
        </div>

        <div
          onScroll={(e) => {
            if (!hasMoreTracks) return;
            const el = e.currentTarget;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
              onLoadMoreTracks();
            }
          }}
          style={{
            height: isMobile ? "300px" : "352px",
            maxHeight: isMobile ? "45dvh" : "352px",
            overflowY: "auto",
            border: "2px solid var(--primary)",
            backgroundColor: "var(--card-bg)",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {isLoadingLibrary && allTracksCount === 0 ? (
            <div
              style={{
                padding: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "0.76rem",
                fontWeight: 800,
              }}
            >
              <Loader2 size={16} className="animate-spin" />
              <span>Cargando canciones...</span>
            </div>
          ) : visibleTracks.length === 0 ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                fontSize: "0.74rem",
                opacity: 0.75,
                fontWeight: 700,
              }}
            >
              No se encontraron canciones con ese filtro.
            </div>
          ) : (
            <>
              {visibleTracks.map((track) => {
                const displayLabel =
                  track.artist && track.title
                    ? `${track.artist} - ${track.title}`
                    : track.text || track.path;
                const isBusy = enqueuingId === track.id;
                const isDone = Boolean(enqueuedIds[String(track.id)]);

                return (
                  <div
                    key={String(track.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      padding: "8px 10px",
                      borderBottom: "1px solid var(--surface-container)",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={displayLabel}
                      >
                        {displayLabel}
                      </div>
                      <div
                        style={{
                          fontSize: "0.62rem",
                          color: "var(--on-surface-variant)",
                          fontWeight: 700,
                          display: "flex",
                          gap: "8px",
                          minWidth: 0,
                        }}
                      >
                        <span style={{ flexShrink: 0 }}>⏱ {track.length_text || "--:--"}</span>
                        {track.path && (
                          <span
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              minWidth: 0,
                            }}
                          >
                            {track.path}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onEnqueueTrack(track)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: isMobile ? "5px 8px" : "5px 10px",
                        backgroundColor: isDone ? "var(--primary)" : "var(--primary-container)",
                        color: isDone ? "var(--on-primary)" : "var(--on-primary-container)",
                        border: "1.5px solid var(--primary)",
                        fontSize: "0.64rem",
                        fontWeight: 900,
                        cursor: isBusy ? "wait" : "pointer",
                        flexShrink: 0,
                      }}
                      title="Poner como siguiente canción"
                    >
                      {isBusy ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : isDone ? (
                        <Check size={12} />
                      ) : (
                        <Plus size={12} />
                      )}
                      <span>
                        {isBusy
                          ? "..."
                          : isDone
                          ? isMobile
                            ? "LISTO"
                            : "ENCOLADA"
                          : isMobile
                          ? "SIGUIENTE"
                          : "PONER SIGUIENTE"}
                      </span>
                    </button>
                  </div>
                );
              })}
              {hasMoreTracks && (
                <button
                  type="button"
                  onClick={onLoadMoreTracks}
                  style={{
                    padding: "9px 12px",
                    backgroundColor: "var(--surface-container)",
                    color: "var(--on-background)",
                    border: "none",
                    borderTop: "1.5px dashed var(--primary)",
                    fontSize: "0.68rem",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Desplaza o haz clic para cargar 50 canciones más ({filteredTracksCount - visibleTracks.length} restantes)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
