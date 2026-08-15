"use client";

import { useState, useEffect } from "react";

export interface ModalDimensions {
  windowWidth: number;
  windowHeight: number;
  availableHeight: number;
  maxModalHeight: number;
  maxTracklistHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isLandscape: boolean;
}

/**
 * Hook para detectar las medidas exactas de la pantalla
 * Descuenta el Header superior (88px) y el Reproductor inferior (85px)
 * para que el modal NUNCA sea tapado ni por arriba ni por abajo.
 */
export function useModalDimensions(): ModalDimensions {
  const [dimensions, setDimensions] = useState<ModalDimensions>(() => {
    if (typeof window === "undefined") {
      return {
        windowWidth: 1200,
        windowHeight: 800,
        availableHeight: 740,
        maxModalHeight: 680,
        maxTracklistHeight: 320,
        isMobile: false,
        isTablet: false,
        isLandscape: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const availableHeight = Math.max(280, height - (isMobile ? 32 : 50));
    const maxModalHeight = Math.min(availableHeight, isMobile ? height - 32 : 720);
    const maxTracklistHeight = Math.max(160, maxModalHeight - 200);

    return {
      windowWidth: width,
      windowHeight: height,
      availableHeight,
      maxModalHeight,
      maxTracklistHeight,
      isMobile,
      isTablet,
      isLandscape: width > height && height < 600,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;

      const availableHeight = Math.max(280, height - (isMobile ? 32 : 50));
      const maxModalHeight = Math.min(availableHeight, isMobile ? height - 32 : 720);
      const maxTracklistHeight = Math.max(160, maxModalHeight - 200);

      setDimensions({
        windowWidth: width,
        windowHeight: height,
        availableHeight,
        maxModalHeight,
        maxTracklistHeight,
        isMobile,
        isTablet,
        isLandscape: width > height && height < 600,
      });
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, { passive: true });

    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return dimensions;
}
