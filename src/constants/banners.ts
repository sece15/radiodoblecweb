export interface RadioBanner {
  id: string;
  title: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

// Ordered catalog shared by both sides. For now, display the first banner.
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
