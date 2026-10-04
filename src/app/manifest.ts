import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Radio Doble C | Fucking Good Shit",
    short_name: "Radio Doble C",
    description:
      "Radio Doble C - Radio online, música en vivo y comunidad punk zine.",
    start_url: "/",
    display: "standalone",
    background_color: "#12141C",
    theme_color: "#CCFF00",
    orientation: "portrait",
    categories: ["music", "entertainment"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/RADIO.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/RADIO.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/RADIO-2026.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
