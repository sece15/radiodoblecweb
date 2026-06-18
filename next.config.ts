import type { NextConfig } from "next";

// Construye la Content-Security-Policy como string desde un objeto legible
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
  media-src 'self' blob: https:;
  connect-src 'self'
    https://*.supabase.co
    wss://*.supabase.co
    ${process.env.NEXT_PUBLIC_CHAT_URL || ""}
    ${process.env.NEXT_PUBLIC_CHAT_URL ? process.env.NEXT_PUBLIC_CHAT_URL.replace("https://", "wss://").replace("http://", "ws://") : ""}
    ${process.env.NEXT_PUBLIC_AZURACAST_URL || ""}
    ${process.env.NEXT_PUBLIC_AZURACAST_URL ? process.env.NEXT_PUBLIC_AZURACAST_URL.replace("https://", "wss://").replace("http://", "ws://") : ""};
  frame-ancestors 'none';
`
  .replace(/\n/g, " ")
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  // Previene que la página sea embebida en un iframe (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Previene que el navegador interprete archivos con MIME type incorrecto
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controla la información del Referer enviada en las solicitudes
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deshabilita acceso a hardware sensible no utilizado por la app
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Política de seguridad de contenido (XSS, inyección de scripts externos)
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        // Aplica las cabeceras de seguridad a todas las rutas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
