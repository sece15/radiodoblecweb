"use client";

import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

import { HLS_URL, FALLBACK_URL } from "@/constants";

export interface RadioPlayerProps {
  className?: string;
  autoPlay?: boolean;
}

export const RadioPlayer: React.FC<RadioPlayerProps> = ({ className, autoPlay = false }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let hlsInstance: Hls | null = null;

    if (Hls.isSupported()) {
      // Para Chrome, Android, Firefox, Edge (con worker y baja latencia)
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hlsInstance = hls;
      hls.loadSource(HLS_URL);
      hls.attachMedia(audio);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          audio.play().catch((err) => console.warn("[RadioPlayer] Autoplay prevented:", err));
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              audio.src = FALLBACK_URL;
              if (autoPlay) audio.play().catch((e) => console.warn("[RadioPlayer] Fallback error:", e));
              break;
          }
        }
      });
    } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
      // Para Safari en iPhone / Mac (soporte nativo de Apple)
      audio.src = HLS_URL;
      if (autoPlay) {
        audio.play().catch((err) => console.warn("[RadioPlayer] Safari autoplay error:", err));
      }
    } else {
      // Fallback tradicional en navegadores antiguos
      audio.src = FALLBACK_URL;
      if (autoPlay) {
        audio.play().catch((err) => console.warn("[RadioPlayer] Legacy fallback error:", err));
      }
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [autoPlay]);

  return <audio ref={audioRef} controls preload="none" className={className} />;
};
