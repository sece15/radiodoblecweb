"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";
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
  const [listenersCount, setListenersCount] = useState(12);

  useEffect(() => {
    const pollMetadata = async () => {
      // Omitir peticiones si la pestaña del navegador está oculta / segundo plano
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      try {
        const azuraUrl = process.env.NEXT_PUBLIC_AZURACAST_URL;
        if (!azuraUrl) return;
        const res = await fetch(`${azuraUrl}/api/nowplaying`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const np = data[0];
            const isLiveStream = Boolean(np.live?.is_live);
            setIsStreamerLive(isLiveStream);
            setListenersCount(np.listeners?.current || 0);
            if (np.live?.streamer_name) setLiveShowName(np.live.streamer_name);

            const title = np.now_playing?.song?.title || "";
            const artist = np.now_playing?.song?.artist || "";

            if (title) {
              setLiveTrackTitle(`${title} - ${artist}`);
            }

            // Determine cover art URL
            let artUrl = np.now_playing?.song?.art;

            if (artUrl && artUrl.startsWith("/")) {
              artUrl = `${azuraUrl}${artUrl}`;
            }

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

            const defaultStationLogo =
              "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR";
            const finalArtUrl = artUrl || defaultStationLogo;

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
    const metadataInterval = setInterval(pollMetadata, 15000);

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
