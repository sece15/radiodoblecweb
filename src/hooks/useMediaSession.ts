"use client";

import { useEffect } from "react";

interface TrackInfo {
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  streamUrl: string;
  isLive: boolean;
}

interface UseMediaSessionProps {
  currentTrack: TrackInfo;
  isPlaying: boolean;
  togglePlayPause: () => void;
}

export const useMediaSession = ({
  currentTrack,
  isPlaying,
  togglePlayPause,
}: UseMediaSessionProps) => {
  useEffect(() => {
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title || "Radio Doble C",
          artist: currentTrack.artist || "Señal en Vivo",
          album: currentTrack.album || "Radio Doble C Online",
          artwork: [
            { src: currentTrack.imageUrl, sizes: "96x96", type: "image/png" },
            { src: currentTrack.imageUrl, sizes: "128x128", type: "image/png" },
            { src: currentTrack.imageUrl, sizes: "192x192", type: "image/png" },
            { src: currentTrack.imageUrl, sizes: "512x512", type: "image/png" },
          ],
        });

        navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

        navigator.mediaSession.setActionHandler("play", () => {
          togglePlayPause();
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          togglePlayPause();
        });
        navigator.mediaSession.setActionHandler("stop", () => {
          togglePlayPause();
        });
      } catch (e) {
        console.warn("MediaSession API init error:", e);
      }
    }
  }, [currentTrack, isPlaying, togglePlayPause]);
};
