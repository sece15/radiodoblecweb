"use client";

import { useEffect, useRef } from "react";
import { audioStore } from "@/store/useAudioStore";
import { DEFAULT_STREAM } from "@/constants";

const CUSTOM_ARTWORK_MAP: Record<string, string> = {};
const itunesArtworkCache = new Map<string, string>();

/**
 * AzuraCastSync: Sincronizador headless autónomo para la metadata y rotación de oyentes de AzuraCast.
 * Escribe directamente en el store de Zustand para evitar re-renderizados innecesarios del AudioProvider.
 */
export const AzuraCastSync = () => {
  const targetListenersRef = useRef(0);

  // Motor de transición orgánica gradual ("sube 1, baja 1, sube 2... hasta converger al objetivo x4")
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const tickOrganicStep = () => {
      // Cadencia natural entre eventos de oyentes (1.8s a 3.4s)
      const delay = Math.floor(1800 + Math.random() * 1600);

      timeoutId = setTimeout(() => {
        const state = audioStore.getState();
        const current = state.listenersCount || 0;
        const rawTarget = targetListenersRef.current;

        // Si el usuario está en la web (chat conectado, reproductor activo o chateando),
        // él mismo es un usuario real activo (1 usuario real = objetivo base de 4 con x4).
        // Si hay más usuarios en el chat o en AzuraCast, se multiplica x4 de forma proporcional.
        const isUserActive = state.isChatConnected || state.isPlaying || (state.onlineChatUsers > 0);
        const realUsers = Math.max(
          isUserActive ? 1 : 0,
          state.onlineChatUsers || 0,
          Math.ceil(rawTarget / 4)
        );

        const target = Math.max(rawTarget, realUsers * 4);

        let nextCount = current;

        if (target === 0) {
          // Si no hay nadie en la radio ni en la web, baja suavemente a 0
          nextCount = Math.max(0, current - 1);
        } else if (current === 0) {
          // Al ingresar el primer usuario, arranca en 1 para iniciar la subida gradual hacia 4
          nextCount = 1;
        } else if (current < target) {
          // Objetivo superior: aumentar gradualmente hacia target (1 -> 2 -> 1 -> 3 -> 4)
          const diff = target - current;
          if (diff >= 3) {
            // Con 80% de probabilidad sube (+1 o +2), con 20% da un paso atrás momentáneo (-1, sale uno)
            if (current > 1 && Math.random() < 0.20) {
              nextCount = current - 1;
            } else {
              nextCount = current + (Math.random() < 0.4 ? 2 : 1);
            }
          } else {
            // Últimos pasos hacia el objetivo
            if (current > 1 && Math.random() < 0.15) {
              nextCount = current - 1;
            } else {
              nextCount = current + 1;
            }
          }
        } else if (current > target) {
          // Objetivo inferior: descender gradualmente hacia target
          const diff = current - target;
          if (diff >= 3) {
            if (Math.random() < 0.20) {
              nextCount = current + 1;
            } else {
              nextCount = Math.max(0, current - (Math.random() < 0.4 ? 2 : 1));
            }
          } else {
            if (Math.random() < 0.15) {
              nextCount = current + 1;
            } else {
              nextCount = Math.max(0, current - 1);
            }
          }
        } else {
          // En equilibrio en el objetivo (ej. 4):
          // Micro-fluctuación viva ("entra uno" +1 / "sale uno" -1 / se mantiene)
          if (target >= 4) {
            const rand = Math.random();
            if (rand < 0.25) {
              nextCount = target + 1; // entra uno (ej. sube a 5)
            } else if (rand < 0.50) {
              nextCount = Math.max(1, target - 1); // sale uno (ej. baja a 3)
            } else {
              nextCount = target; // equilibrio en 4
            }
          } else {
            nextCount = target;
          }
        }

        if (nextCount !== current) {
          audioStore.setState({ listenersCount: nextCount });
        }

        tickOrganicStep();
      }, delay);
    };

    tickOrganicStep();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Sincronización periódica de metadatos y oyentes reales de AzuraCast
  useEffect(() => {
    const pollMetadata = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      try {
        const res = await fetch("/api/radio/nowplaying", { cache: "no-store" });
        if (!res.ok) throw new Error("Radio no disponible");
        
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const np = data[0];
          const isLiveStream = Boolean(np.live?.is_live);
          const streamerName = np.live?.streamer_name || "RADIO DOBLE C ONLINE";
          const title = np.now_playing?.song?.title || "";
          const artist = np.now_playing?.song?.artist || "";
          const liveTrackTitle = title ? `${title} - ${artist}` : "RADIO DOBLE C - SEÑAL EN VIVO";

          const count = np.listeners?.current;
          if (typeof count === "number" && Number.isFinite(count) && count >= 0) {
            targetListenersRef.current = count;
          }

          // Determinar portada del tema
          let artUrl = np.now_playing?.song?.art;
          if (
            artUrl &&
            artUrl.startsWith("http://") &&
            typeof window !== "undefined" &&
            window.location.protocol === "https:"
          ) {
            artUrl = artUrl.replace("http://", "https://");
          }

          const customKey = `${artist} - ${title}`.toLowerCase().trim();
          if (CUSTOM_ARTWORK_MAP[customKey]) {
            artUrl = CUSTOM_ARTWORK_MAP[customKey];
          } else if (itunesArtworkCache.has(customKey)) {
            artUrl = itunesArtworkCache.get(customKey) || artUrl;
          } else {
            const isDefaultOrMissingArt =
              !artUrl || artUrl.includes("default") || artUrl.includes("generic") || artUrl.includes("station");
            if (isLiveStream && artist && title && isDefaultOrMissingArt) {
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const iTunesRes = await fetch(
                  `https://itunes.apple.com/search?term=${encodeURIComponent(artist + " " + title)}&entity=song&limit=1`,
                  { signal: controller.signal }
                );
                clearTimeout(timeoutId);
                if (iTunesRes.ok) {
                  const iTunesData = await iTunesRes.json();
                  if (iTunesData.results && iTunesData.results.length > 0) {
                    artUrl = iTunesData.results[0].artworkUrl100.replace("100x100bb", "500x500bb");
                    itunesArtworkCache.set(customKey, artUrl);
                  } else {
                    itunesArtworkCache.set(customKey, "");
                  }
                } else {
                  itunesArtworkCache.set(customKey, "");
                }
              } catch {
                itunesArtworkCache.set(customKey, "");
              }
            }
          }

          const defaultStationLogo = "/RADIO.png";
          const isMissingOrGenericArt =
            !artUrl ||
            artUrl.includes("default") ||
            artUrl.includes("generic") ||
            artUrl.includes("station") ||
            artUrl.includes("googleusercontent.com");
          const finalArtUrl = !isMissingOrGenericArt && artUrl ? artUrl : defaultStationLogo;

          // Actualizar estado general en Zustand
          audioStore.setState({
            isStreamerLive: isLiveStream,
            liveShowName: streamerName,
            liveTrackTitle,
            liveStatusText: isLiveStream ? "EN VIVO" : "ON AIR",
          });

          // Actualizar pista actual si estamos sintonizando la señal en vivo
          const state = audioStore.getState();
          const currentTrack = state.currentTrack;
          if (currentTrack && (currentTrack.streamUrl.includes(".m3u8") || currentTrack.streamUrl === DEFAULT_STREAM)) {
            const targetTitle = title || currentTrack.title;
            const targetAlbum = np.now_playing?.song?.album || currentTrack.album;
            const targetArtist = artist || currentTrack.artist;

            if (
              currentTrack.title !== targetTitle ||
              currentTrack.album !== targetAlbum ||
              currentTrack.artist !== targetArtist ||
              currentTrack.imageUrl !== finalArtUrl
            ) {
              audioStore.setState({
                currentTrack: {
                  ...currentTrack,
                  title: targetTitle,
                  album: targetAlbum,
                  artist: targetArtist,
                  imageUrl: finalArtUrl,
                },
              });
            }
          }
        }
      } catch {
        audioStore.setState({
          liveTrackTitle: "RADIO DOBLE C - SEÑAL EN VIVO",
          liveShowName: "RADIO DOBLE C ONLINE",
          isStreamerLive: false,
          liveStatusText: "ON AIR",
        });
      }
    };

    pollMetadata();
    // Consultas cada 25 segundos (ligero, eficiente y complementado por visibilitychange)
    const metadataInterval = setInterval(pollMetadata, 25000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pollMetadata();
      }
    };

    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      clearInterval(metadataInterval);
    };
  }, []);

  return null;
};
