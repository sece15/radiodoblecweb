import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Radio Doble C | Fucking Good Shit",
    short_name: "Radio Doble C",
    description:
      "Estación de radio online independiente y cultural con música alternativa, punk, rock, lo-fi, transmisiones en vivo y programas temáticos.",
    start_url: "/",
    display: "standalone",
    background_color: "#12141C",
    theme_color: "#CCFF00",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/RADIO-2026.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/RADIO.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
