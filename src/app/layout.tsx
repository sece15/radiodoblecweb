import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import "./globals.css";
import { AudioProvider } from "@/context/AudioContext";
import { QueryProvider } from "@/providers/QueryProvider";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://radiodoblec.com";

export const viewport: Viewport = {
  themeColor: "#CCFF00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Radio Doble C | Fucking Good Shit • Radio Online Independiente",
    template: "%s | Radio Doble C",
  },
  description:
    "Sintoniza Radio Doble C: Estación de radio online alternativa con música underground, rock, punk, lo-fi, hip-hop, sesiones de DJ en vivo, programas temáticos y tienda oficial.",
  keywords: [
    "Radio Doble C",
    "Radio Doble C online",
    "radiodoblec.com",
    "radio online peru",
    "radio independiente",
    "musica alternativa online",
    "rock subterraneo peru",
    "radio punk",
    "radio streaming en vivo",
    "broadcampus radio",
    "emisora de radio online",
  ],
  authors: [{ name: "Radio Doble C", url: SITE_URL }],
  creator: "Radio Doble C",
  publisher: "Radio Doble C",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: SITE_URL,
    title: "Radio Doble C | Radio Online Independiente & Música Alternativa",
    description:
      "Sintoniza música alternativa, sesiones de DJ, programas en vivo y descubre las alcantarillas de la música independiente en Radio Doble C.",
    siteName: "Radio Doble C",
    images: [
      {
        url: "/RADIO.png",
        width: 1200,
        height: 630,
        alt: "Radio Doble C - Logo Oficial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Radio Doble C | Radio Online Independiente",
    description:
      "Transmisión en vivo 24/7 de música alternativa, rock, punk y programas temáticos oficiales.",
    images: ["/RADIO.png"],
    creator: "@radiodoblec",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/RADIO-2026.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Schema.org Structured Data (JSON-LD) for Search Engines & AI Models
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RadioStation",
        "@id": `${SITE_URL}/#station`,
        name: "Radio Doble C",
        alternateName: ["Doble C", "Radio Doble C Online", "Doble C Radio"],
        url: SITE_URL,
        logo: `${SITE_URL}/RADIO.png`,
        image: `${SITE_URL}/RADIO.png`,
        description:
          "Estación de radio online independiente y comunitaria. Transmite música alternativa, punk, rock, lo-fi, hip-hop, sesiones de DJ en vivo y programas temáticos.",
        genre: ["Alternative Rock", "Punk", "Lo-Fi", "Indie", "Hip Hop", "Latin Alternative"],
        broadcastChannel: {
          "@type": "BroadcastChannel",
          broadcastChannelId: "RADIO-DOBLE-C-WEB",
          broadcastServiceTier: "Online",
          inBroadcastLineup: {
            "@type": "BroadcastService",
            name: "Radio Doble C Live Stream",
            url: SITE_URL,
          },
        },
        potentialAction: {
          "@type": "ListenAction",
          target: [
            {
              "@type": "EntryPoint",
              urlTemplate: SITE_URL,
              actionPlatform: [
                "http://schema.org/DesktopWebPlatform",
                "http://schema.org/MobileWebPlatform",
                "http://schema.org/AndroidPlatform",
                "http://schema.org/IOSPlatform",
              ],
            },
          ],
          expectsAcceptanceOf: {
            "@type": "Offer",
            category: "free",
            price: "0",
            priceCurrency: "USD",
          },
        },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Radio Doble C",
        url: SITE_URL,
        logo: `${SITE_URL}/RADIO.png`,
        sameAs: [
          "https://instagram.com/radiodoblec",
          "https://youtube.com/@radiodoblec",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          email: "radiodoblechseo@gmail.com",
          contactType: "Customer Support",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Radio Doble C",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        inLanguage: "es-PE",
      },
    ],
  };

  return (
    <html lang="es" data-theme="PUNK_NEON" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <QueryProvider>
          <AudioProvider>
            {children}
          </AudioProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
