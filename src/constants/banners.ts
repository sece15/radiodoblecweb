export interface RadioBanner {
  id: string;
  title: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * Control de visualización de banners laterales (izquierdo y derecho en los costados de la web).
 * Cambiar a true para reactivar los banners laterales cuando se requiera.
 */
export const SHOW_SIDE_BANNERS = false;

// Catálogo ordenado de banners para los costados.
// Sirve como referencia y plantilla para incorporar nuevos banners en el futuro.
export const RADIO_BANNERS = [
  {
    id: "expo-anime-2026",
    title: "Expo Anime 2026",
    src: "/banners/expo-anime-2026.png",
    alt: "Expo Anime 2026: cosplay, bandas en vivo, cover dance K-pop, stands de venta y karaoke anime.",
    width: 1080,
    height: 1350,
  },
] as const satisfies readonly RadioBanner[];

