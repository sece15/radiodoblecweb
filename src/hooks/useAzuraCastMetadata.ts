"use client";

import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { DEFAULT_STREAM } from "@/constants";

const CUSTOM_ARTWORK_MAP: Record<string, string> = {};
const itunesArtworkCache = new Map<string, string>();

interface TrackInfo {
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  streamUrl: string;
  isLive: boolean;
}

interface UseAzuraCastMetadataProps {
  currentTrack: TrackInfo;
  setCurrentTrack: Dispatch<SetStateAction<TrackInfo>>;
}

export const useAzuraCastMetadata = ({
  currentTrack,
  setCurrentTrack,
}: UseAzuraCastMetadataProps) => {
  const [isStreamerLive, setIsStreamerLive] = useState(false);
  const [liveShowName, setLiveShowName] = useState("RADIO DOBLE C ONLINE");
  const [liveTrackTitle, setLiveTrackTitle] = useState("RADIO DOBLE C - SEÑAL EN VIVO");
  const [liveStatusText, setLiveStatusText] = useState("ON AIR");
  const [listenersCount, setListenersCount] = useState(14);
  const targetListenersRef = useRef(14);

  // Motor orgánico de rotación continua en vivo ("entra 1, salen 2, entra 1...")
  // Bucle autónomo resiliente que no se congela al cambiar de pestaña, página o chat
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleNextTick = (immediate = false) => {
      // Retraso natural y dinámico entre micro-eventos humanos (2.0s a 4.2s), o inmediato (300ms a 600ms) al retomar foco
      const delay = immediate
        ? Math.floor(300 + Math.random() * 300)
        : Math.floor(2000 + Math.random() * 2200);

      timeoutId = setTimeout(() => {
        setListenersCount((prev) => {
          const currentTarget = targetListenersRef.current || 14;
          const diff = currentTarget - prev;
          const absDiff = Math.abs(diff);

          let delta = 0;
          if (absDiff >= 6) {
            // Desplazamiento ágil hacia la nueva ola o bajón grupal
            delta = Math.sign(diff) * (Math.random() < 0.8 ? 2 : 1);
          } else if (absDiff >= 3) {
            // Acercándose con pequeña resistencia orgánica
            if (Math.random() < 0.75) {
              delta = Math.sign(diff) * (Math.random() < 0.3 ? 2 : 1);
            } else {
              delta = -Math.sign(diff) * 1;
            }
          } else {
            // Micro-rotación en vivo continua ("sale uno, entra uno, entran dos...")
            let upProb = 0.50;
            if (diff > 0) upProb = 0.65;
            else if (diff < 0) upProb = 0.35;

            if (Math.random() < upProb) {
              delta = Math.random() < 0.25 ? 2 : 1;
            } else {
              delta = -(Math.random() < 0.25 ? 2 : 1);
            }
          }

          // Garantizar que delta nunca sea 0 para que la cifra siempre esté viva
          if (delta === 0) {
            delta = Math.random() < 0.5 ? 1 : -1;
          }

          return Math.max(3, prev + delta);
        });

        // Continuar el ciclo infinitamente
        scheduleNextTick();
      }, delay);
    };

    scheduleNextTick();

    // Al volver a la pestaña o enfocar ventana, reactivar de inmediato
    const handleReactivation = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        clearTimeout(timeoutId);
        scheduleNextTick(true);
      }
    };

    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", handleReactivation);
      window.addEventListener("focus", handleReactivation);
    }

    return () => {
      clearTimeout(timeoutId);
      if (typeof window !== "undefined") {
        document.removeEventListener("visibilitychange", handleReactivation);
        window.removeEventListener("focus", handleReactivation);
      }
    };
  }, []);

  useEffect(() => {
    const pollMetadata = async () => {
      // Omitir peticiones si la pestaña del navegador está oculta / segundo plano
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      try {
        const res = await fetch("/api/radio/nowplaying", { cache: "no-store" });
        if (!res.ok) throw new Error("Radio no disponible");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const np = data[0];
            const isLiveStream = Boolean(np.live?.is_live);
            setIsStreamerLive(isLiveStream);
            const count = np.listeners?.current;
            if (typeof count === "number" && Number.isFinite(count) && count >= 0) {
              targetListenersRef.current = count;
              setListenersCount((prev) => (prev === 0 ? count : prev));
            }
            if (np.live?.streamer_name) setLiveShowName(np.live.streamer_name);

            const title = np.now_playing?.song?.title || "";
            const artist = np.now_playing?.song?.artist || "";

            if (title) {
              setLiveTrackTitle(`${title} - ${artist}`);
            }

            // Determine cover art URL
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
              // Consultar a iTunes únicamente si hay transmisión en vivo activa
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

            if (currentTrack.streamUrl.includes(".m3u8") || currentTrack.streamUrl === DEFAULT_STREAM) {
              setCurrentTrack((prev) => {
                const targetTitle = title || prev.title;
                const targetAlbum = np.now_playing?.song?.album || prev.album;
                const targetArtist = artist || prev.artist;
                if (
                  prev.title === targetTitle &&
                  prev.album === targetAlbum &&
                  prev.artist === targetArtist &&
                  prev.imageUrl === finalArtUrl
                ) {
                  return prev;
                }
                return {
                  ...prev,
                  title: targetTitle,
                  album: targetAlbum,
                  artist: targetArtist,
                  imageUrl: finalArtUrl,
                };
              });
            }
          }
        }
      } catch {
        setLiveTrackTitle("RADIO DOBLE C - SEÑAL EN VIVO");
        setLiveShowName("RADIO DOBLE C ONLINE");
        setIsStreamerLive(false);
        setLiveStatusText("ON AIR");
      }
    };

    pollMetadata();
    const metadataInterval = setInterval(pollMetadata, 7000);

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
  }, [currentTrack.streamUrl, setCurrentTrack]);

  return {
    isStreamerLive,
    liveShowName,
    liveTrackTitle,
    liveStatusText,
    listenersCount,
  };
};
