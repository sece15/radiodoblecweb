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

const HEADER_HEIGHT_DESKTOP = 88;
const HEADER_HEIGHT_MOBILE = 76;
const PLAYER_HEIGHT_DESKTOP = 85;
const PLAYER_HEIGHT_MOBILE = 95;
const SAFE_VERTICAL_MARGIN = 24;

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
        availableHeight: 580,
        maxModalHeight: 560,
        maxTracklistHeight: 240,
        isMobile: false,
        isTablet: false,
        isLandscape: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const headerHeight = isMobile ? HEADER_HEIGHT_MOBILE : HEADER_HEIGHT_DESKTOP;
    const playerHeight = isMobile ? PLAYER_HEIGHT_MOBILE : PLAYER_HEIGHT_DESKTOP;

    const availableHeight = Math.max(260, height - headerHeight - playerHeight - SAFE_VERTICAL_MARGIN);
    const maxModalHeight = Math.min(availableHeight, isMobile ? availableHeight : 580);
    const maxTracklistHeight = Math.max(140, maxModalHeight - 220);

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
      const headerHeight = isMobile ? HEADER_HEIGHT_MOBILE : HEADER_HEIGHT_DESKTOP;
      const playerHeight = isMobile ? PLAYER_HEIGHT_MOBILE : PLAYER_HEIGHT_DESKTOP;

      const availableHeight = Math.max(260, height - headerHeight - playerHeight - SAFE_VERTICAL_MARGIN);
      const maxModalHeight = Math.min(availableHeight, isMobile ? availableHeight : 580);
      const maxTracklistHeight = Math.max(140, maxModalHeight - 220);

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
