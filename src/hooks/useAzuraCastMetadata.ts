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
  const [listenersCount, setListenersCount] = useState(0);
  const targetListenersRef = useRef(0);

  // Motor orgánico de rotación continua en vivo ("entra 1, salen 2, entra 1...")
  useEffect(() => {
    // Inicialización inmediata al recibir el primer conteo
    if (listenersCount === 0 && targetListenersRef.current > 0) {
      setListenersCount(targetListenersRef.current);
      return;
    }
    if (targetListenersRef.current === 0) return;

    // Pausar si la pestaña está oculta para no consumir recursos innecesarios
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    const diff = targetListenersRef.current - listenersCount;
    const absDiff = Math.abs(diff);

    // Retraso natural entre eventos humanos:
    // Saltos grandes (oleada o bajón en curso): eventos más seguidos (900ms a 2100ms)
    // Cerca de la meseta (rotación habitual): pausas humanas de 3.2s a 6.8s
    let delay: number;
    if (absDiff >= 8) {
      delay = Math.floor(900 + Math.random() * 1200);
    } else if (absDiff >= 4) {
      delay = Math.floor(1800 + Math.random() * 1600);
    } else {
      delay = Math.floor(3200 + Math.random() * 3600);
    }

    const timer = setTimeout(() => {
      setListenersCount((prev) => {
        const target = targetListenersRef.current;
        if (target === 0) return prev;
        const currentDiff = target - prev;
        const currentAbsDiff = Math.abs(currentDiff);

        let delta = 0;
        if (currentAbsDiff >= 8) {
          // Desplazamiento ágil hacia la nueva ola o bajón grupal
          const sign = Math.sign(currentDiff);
          delta = sign * (Math.random() < 0.75 ? 2 : 1);
        } else if (currentAbsDiff >= 4) {
          // Acercándose con pequeña resistencia orgánica
          if (Math.random() < 0.75) {
            delta = Math.sign(currentDiff) * (Math.random() < 0.35 ? 2 : 1);
          } else {
            delta = -Math.sign(currentDiff) * 1;
          }
        } else {
          // Micro-rotación en vivo continua ("sale uno, entra uno, salen dos, entra uno...")
          let upProb = 0.48;
          if (currentDiff > 0) upProb = 0.60;
          else if (currentDiff < 0) upProb = 0.36;

          if (Math.random() < upProb) {
            delta = Math.random() < 0.28 ? 2 : 1; // "entra 1 o entran 2"
          } else {
            delta = -(Math.random() < 0.28 ? 2 : 1); // "sale 1 o salen 2"
          }
        }

        return Math.max(2, prev + delta);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [listenersCount]);

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

            if (currentTrack.streamUrl.includes("/live.m3u8") || currentTrack.streamUrl === DEFAULT_STREAM) {
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
