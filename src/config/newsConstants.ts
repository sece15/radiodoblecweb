import { NewsItem } from "@/types/news";

export const NEWS_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache
export const NEWS_REVALIDATE_SECONDS = 180; // 3 minutes Next.js revalidation

// Commercial / shop listings filter keywords
export const COMMERCIAL_KEYWORDS = [
  "guante",
  "guantes",
  "lentejuela",
  "lentejuelas",
  "disfraz",
  "disfraces",
  "brillantina",
  "vestido",
  "vestidos",
  "ropa",
  "zapatilla",
  "zapatillas",
  "zapato",
  "zapatos",
  "camisetas",
  "camiseta",
  "pantalón",
  "pantalon",
  "comprar",
  "precio",
  "oferta",
  "aliexpress",
  "amazon",
  "mercado libre",
  "tienda online",
  "envío gratis",
  "envio gratis",
  "para adultos",
];

// Sensationalist, violent, crime, and panic-inducing keywords to exclude
export const PANIC_MORBID_KEYWORDS = [
  "asesinato",
  "asesinan",
  "sicariato",
  "sicarios",
  "acuchillan",
  "acuchillado",
  "balean",
  "baleado",
  "balacera",
  "cadáver",
  "cadaver",
  "cadáveres",
  "cadaveres",
  "degollado",
  "descuartizado",
  "muertes",
  "fallece",
  "fallecen",
  "fallecido",
  "fallecida",
  "hallan sin vida",
  "tragedia",
  "sangriento",
  "sangrienta",
  "violación",
  "violacion",
  "ultraje",
  "suicidio",
  "suicida",
  "pánico",
  "panico",
  "terror",
  "secuestro",
  "extorsión",
  "extorsion",
  "no creerás",
  "no creeras",
  "impactante video",
  "quedó en shock",
  "quedo en shock",
  "alerta máxima inminente",
  "apocalipsis",
];

// Public management / investigations keywords
export const INVESTIGATION_KEYWORDS = [
  "investigan",
  "investigación",
  "investigacion",
  "fiscalía",
  "fiscalia",
  "denuncia",
  "irregularidad",
  "sobrecosto",
  "contraloría",
  "contraloria",
  "presupuesto",
  "malversación",
  "corrupción",
  "corrupcion",
  "detienen",
  "detenido",
  "delito",
];

// Cultural, festivities, anniversaries, and artistic events
export const CULTURE_KEYWORDS = [
  "fiesta",
  "aniversario",
  "cumple",
  "tradición",
  "tradicion",
  "concierto",
  "feria",
  "festival",
  "música",
  "musica",
  "rock",
  "danza",
  "folklore",
  "faica",
  "banda",
  "álbum",
  "album",
  "turismo",
  "gastronomía",
  "gastronomia",
];

// Actual emergency/meteorological/infrastructure alert keywords
export const ALERT_KEYWORDS = [
  "alerta vial",
  "bloqueo de vía",
  "bloqueo de carretera",
  "carretera central bloqueada",
  "corte de agua",
  "corte de luz",
  "aviso meteorológico",
  "aviso meteorologico",
  "alerta meteorológica",
  "alerta coer",
  "coer huánuco",
  "coer huanuco",
  "lluvias intensas",
  "huaico",
  "desborde de río",
];

// Tech & Artificial Intelligence keywords
export const TECH_KEYWORDS = [
  "inteligencia artificial",
  "ia ",
  "chatgpt",
  "openai",
  "gemini",
  "robot",
  "tecnología",
  "tecnologia",
  "ciberseguridad",
  "innovación digital",
];

// Positive community keywords
export const COMMUNITY_POSITIVE_KEYWORDS = [
  "buenas noticias",
  "solidaridad",
  "voluntariado",
  "beca",
  "premio internacional",
  "emprendimiento social",
  "donación",
  "ayuda social",
];

// Sources to strip from headlines and text
export const KNOWN_SOURCES_REGEX =
  /\s*[-–—|•]\s*(Diario Correo|Correo|Infobae|Infobae Perú|Ahora Huánuco|Diario Ahora|Tu Diario|Tu Diario Huánuco|Página3|Pagina3|RPP Noticias|RPP|La República|La Republica|El Comercio|Agencia Andina|Andina|Caretas|Expreso|Exitosa|Ojo|Trome|Perú21|Peru21|Panamericana|América Noticias|America Noticias|Facebook|Twitter|Instagram|TikTok|YouTube|Google Noticias|Google News)\s*$/i;

// RSS Feeds configuration
export const RSS_FEEDS_CONFIG = [
  {
    category: "huanuco" as const,
    categoryLabel: "HUÁNUCO & REGIÓN",
    badgeColor: "#CCFF00",
    query: '(Huánuco OR "Pillco Marca" OR Amarilis OR "Carretera Central Huánuco" OR "Tingo María") when:2d -guantes -comprar -tienda -ropa -amazon -aliexpress -asesinato -sicariato -muerte -cadaver -fallece -sangriento -balacera -tragedia -suicidio',
  },
  {
    category: "tech_ai" as const,
    categoryLabel: "TECNOLOGÍA & IA",
    badgeColor: "#70D6FF",
    query: '("Inteligencia Artificial" OR "Tecnología e innovación" OR "Avances IA" OR "OpenAI" OR "Robótica") when:2d -guantes -comprar -tienda -curso -oferta -amazon -aliexpress -asesinato -muerte',
  },
  {
    category: "community_good" as const,
    categoryLabel: "BUENAS NOTICIAS",
    badgeColor: "#A7F3D0",
    query: '("Buenas noticias Perú" OR "Acción solidaria Perú" OR "Voluntariado Perú" OR "Emprendimiento social Perú" OR "Becas Perú") when:3d -guantes -comprar -tienda -oferta -amazon -asesinato -muerte -tragedia',
  },
  {
    category: "music_culture" as const,
    categoryLabel: "MÚSICA & CULTURA",
    badgeColor: "#FFDE82",
    query: '("Rock Peruano" OR "Conciertos Perú" OR "Bandas peruanas" OR "Festival de Música" OR "Escena Rock" OR "Música Huanuqueña") when:3d -guantes -comprar -tienda -ropa -disfraz -amazon -aliexpress -oferta -asesinato -muerte',
  },
];

// Fallback curated news when offline or network fails
export const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "fb_hco_1",
    title: "Tránsito fluido en la Carretera Central tramo Huánuco - Pasco y desvíos en Amarilis",
    summary: "Reporte de monitoreo vial matutino para transportistas y conductores locales.",
    link: "https://radiodoblec.com",
    source: "Radio Doble C",
    category: "alerts",
    categoryLabel: "SERVICIO AL VECINO",
    pubDate: new Date().toISOString(),
    relativeTime: "Hace 15 min",
    badgeColor: "#BA1A1A",
    isUrgent: true,
  },
  {
    id: "fb_tech_1",
    title: "Nuevos modelos de Inteligencia Artificial transforman la creación y producción musical en radio",
    summary: "Reporte de avances en tecnología e inteligencia artificial. Tendencias de innovación que transforman la era digital compartidas por Radio Doble C.",
    link: "https://radiodoblec.com",
    source: "Radio Doble C",
    category: "tech_ai",
    categoryLabel: "TECNOLOGÍA & IA",
    pubDate: new Date().toISOString(),
    relativeTime: "Hace 25 min",
    badgeColor: "#70D6FF",
  },
  {
    id: "fb_comm_1",
    title: "Jóvenes voluntarios impulsan jornada de reforestación y limpieza en riberas del Río Huallaga",
    summary: "Iniciativa positiva y acción comunitaria. Buenas noticias que inspiran y fortalecen el bienestar de nuestra gente en la región.",
    link: "https://radiodoblec.com",
    source: "Radio Doble C",
    category: "community_good",
    categoryLabel: "BUENAS NOTICIAS",
    pubDate: new Date().toISOString(),
    relativeTime: "Hace 45 min",
    badgeColor: "#A7F3D0",
  },
  {
    id: "fb_hco_2",
    title: "Municipalidad de Pillco Marca coordina operativos de seguridad y mantenimiento en Av. Universitaria",
    summary: "Trabajos de bacheo y reforzamiento del patrullaje integrado vecinal en los accesos universitarios.",
    link: "https://radiodoblec.com",
    source: "Radio Doble C",
    category: "huanuco",
    categoryLabel: "HUÁNUCO & COMUNIDAD",
    pubDate: new Date().toISOString(),
    relativeTime: "Hace 50 min",
    badgeColor: "#CCFF00",
  },
  {
    id: "fb_hco_3",
    title: "Anuncian feria cultural y presentaciones de bandas locales en el Malecón Daniel Alomía Robles",
    summary: "Espacio gastronómico y conciertos acústicos este fin de semana para incentivar el arte huanuqueño.",
    link: "https://radiodoblec.com",
    source: "Radio Doble C",
    category: "music_culture",
    categoryLabel: "CULTURA & MÚSICA",
    pubDate: new Date().toISOString(),
    relativeTime: "Hace 1 h",
    badgeColor: "#FFDE82",
  },
];
