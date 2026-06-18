import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import { AudioProvider } from "@/context/AudioContext";

export const metadata: Metadata = {
  title: "RADIO DOBLE C | FUCKING GOOD SHIT",
  description: "Neo-brutalist punk-zine layout radio player featuring curated underground streams, retro styling, and custom station exploration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es" data-theme="PUNK_NEON" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
