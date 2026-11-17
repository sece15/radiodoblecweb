import type { NextConfig } from "next";

// Construye la Content-Security-Policy como string desde un objeto legible
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://www.youtube.com https://s.ytimg.com;
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
  media-src 'self' blob: https:;
  frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;
  child-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;
  connect-src 'self'
    https://huggingface.co
    https://*.hf.co
    https://*.r2.dev
    https://*.r2.cloudflarestorage.com
    https://cdn.jsdelivr.net
    https://*.supabase.co
    wss://*.supabase.co
    https://itunes.apple.com
    https://*.andrealvarado.dev
    wss://*.andrealvarado.dev
    https://radio.andrealvarado.dev
    wss://radio.andrealvarado.dev
    https://chat.andrealvarado.dev
    wss://chat.andrealvarado.dev
    https://stream.andrealvarado.dev
    https://www.youtube.com
    https://*.googlevideo.com;
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

const APP_BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.RENDER_GIT_COMMIT ||
  Date.now().toString();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_BUILD_ID,
  },
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
      {
        // Caché rápida en imágenes de la mascota con renovación periódica (1h + SWR 24h)
        // y ruptura inmediata por ?v=BUILD_ID en cada deploy nuevo
        source: "/mascot/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Nunca cachear el endpoint de versión del build
        source: "/api/version",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
