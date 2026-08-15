import { NextResponse } from "next/server";
import { NewsItem, NewsCategory } from "@/types/news";

export const revalidate = 180; // 3 minutes cache on Next.js Edge / Node

interface CacheStore {
  timestamp: number;
  data: NewsItem[];
}

let memoryCache: CacheStore | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes fresh cache

// Helper to strip HTML tags and decode basic HTML entities
function cleanHtml(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. Strip CDATA blocks
  text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");

  // 2. Decode HTML entities (handles escaped &lt;a ... &gt;)
  for (let i = 0; i < 2; i++) {
    text = text
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
  }

  // 3. Strip all HTML tags completely
  while (/<[^>]*>/g.test(text)) {
    text = text.replace(/<[^>]*>/g, " ");
  }

  // 4. Clean stray tag fragments & brackets
  text = text
    .replace(/<font[^>]*>/gi, " ")
    .replace(/<\/font>/gi, " ")
    .replace(/<a[^>]*>/gi, " ")
    .replace(/<\/a>/gi, " ")
    .replace(/[<>]/g, "");

  return text.replace(/\s+/g, " ").trim();
}

// Thorough sanitization to remove URLs, publisher branding, and source references
function sanitizeNewsText(text: string): string {
  if (!text) return "";
  let clean = cleanHtml(text);

  // 1. Remove all URLs, domains, social handles
  clean = clean.replace(/https?:\/\/\S+/gi, "");
  clean = clean.replace(/\bwww\.\S+/gi, "");
  clean = clean.replace(/\b[a-z0-9-]+\.(com|pe|org|net|gob\.pe|edu\.pe)\S*/gi, "");
  clean = clean.replace(/\b(facebook|instagram|twitter|tiktok|youtube|t\.co|fb)\.com\S*/gi, "");

  // 2. Remove common phrase preambles / references
  clean = clean.replace(/\b(más información en|mas informacion en|más info en|mas info en|lea más en|lea mas en|lee más en|lee mas en|lee la nota completa en|ver más en|ver mas en|visite|fuente|foto|vía|via|redacción|redaccion)\s*:?.*$/gi, "");
  clean = clean.replace(/\b(seguir leyendo|continúa leyendo|entérate más|enterate mas)\b.*$/gi, "");
  clean = clean.replace(/\([^)]*(foto|fuente|vía|via|créditos|creditos|imagen)[^)]*\)/gi, "");
  clean = clean.replace(/\[[^\]]*(foto|fuente|vía|via|créditos|creditos|imagen)[^\]]*\]/gi, "");

  // 3. Remove trailing publisher mentions after dash or pipe
  const knownSourcesRegex = /\s*[-–—|•]\s*(Diario Correo|Correo|Infobae|Infobae Perú|Ahora Huánuco|Diario Ahora|Tu Diario|Tu Diario Huánuco|Página3|Pagina3|RPP Noticias|RPP|La República|La Republica|El Comercio|Agencia Andina|Andina|Caretas|Expreso|Exitosa|Ojo|Trome|Perú21|Peru21|Panamericana|América Noticias|America Noticias|Facebook|Twitter|Instagram|TikTok|YouTube|Google Noticias|Google News)\s*$/i;

  while (knownSourcesRegex.test(clean)) {
    clean = clean.replace(knownSourcesRegex, "");
  }

  // 4. Strip generic trailing publisher tag after " - "
  if (clean.includes(" - ")) {
    const parts = clean.split(" - ");
    const last = parts[parts.length - 1].trim();
    if (last.length > 0 && last.length <= 32 && !last.includes(".") && !last.includes(",")) {
      parts.pop();
      clean = parts.join(" - ");
    }
  }

  // 5. Remove standalone media names that might linger at the end
  clean = clean.replace(/\b(Infobae Perú|Infobae|Diario Correo|Correo Perú|Ahora Huánuco|Diario Ahora|Tu Diario Huánuco|Tu Diario|Página3|Pagina3|RPP Noticias|RPP|La República|El Comercio|Andina)\b/gi, "");

  // 6. Clean trailing punctuation/dashes left over
  clean = clean.replace(/[\s\-–—|•:,;]+$/, "");
  clean = clean.replace(/\s+/g, " ").trim();

  return clean;
}

// Generate contextual radio summary when RSS feed only provides the headline
function generateContextualSummary(title: string, category: NewsCategory): string {
  const lower = title.toLowerCase();

  if (
    lower.includes("investigan") ||
    lower.includes("investigación") ||
    lower.includes("investigacion") ||
    lower.includes("fiscalía") ||
    lower.includes("fiscalia") ||
    lower.includes("contraloría") ||
    lower.includes("contraloria") ||
    lower.includes("presupuesto") ||
    lower.includes("irregularidad") ||
    lower.includes("corrupción") ||
    lower.includes("corrupcion") ||
    lower.includes("denuncia")
  ) {
    return `Reporte de fiscalización y seguimiento a la gestión de recursos y obras públicas en la región Huánuco. Información en desarrollo emitida para los oyentes de Radio Doble C.`;
  }

  if (category === "tech_ai" || lower.includes("inteligencia artificial") || lower.includes("ia ") || lower.includes("chatgpt") || lower.includes("robot") || lower.includes("gemini") || lower.includes("tecnología")) {
    return `Reporte de avances en tecnología e inteligencia artificial. Tendencias de innovación que transforman la era digital compartidas por Radio Doble C.`;
  }
  if (category === "community_good" || lower.includes("solidaridad") || lower.includes("voluntariado") || lower.includes("beca") || lower.includes("premio") || lower.includes("apoyo social")) {
    return `Iniciativa positiva y acción comunitaria. Buenas noticias que inspiran y fortalecen el bienestar de nuestra gente en la región.`;
  }
  if (category === "alerts" || lower.includes("vía") || lower.includes("tránsito") || lower.includes("carretera") || lower.includes("coer") || lower.includes("clima")) {
    return `Reporte de monitoreo vial y servicio público para la ciudadanía de Huánuco, Amarilis y Pillco Marca. Mantenga precauciones en los tramos afectados.`;
  }
  if (lower.includes("jne") || lower.includes("elecciones") || lower.includes("gore") || lower.includes("municipal") || lower.includes("alcalde") || lower.includes("gobernador") || lower.includes("carrera") || lower.includes("política")) {
    return `Seguimiento de la coyuntura política y pronunciamientos institucionales en la región Huánuco. Información en desarrollo emitida para los oyentes de Radio Doble C.`;
  }
  if (category === "music_culture" || lower.includes("concierto") || lower.includes("música") || lower.includes("rock") || lower.includes("feria") || lower.includes("festival")) {
    return `Novedades del panorama cultural, lanzamientos y actividades artísticas destacadas para la comunidad de Radio Doble C.`;
  }
  if (lower.includes("policía") || lower.includes("operativo") || lower.includes("seguridad") || lower.includes("detienen") || lower.includes("accidente")) {
    return `Actualización de seguridad y sucesos policiales en el departamento de Huánuco. Cobertura comunitaria para el servicio del vecino.`;
  }
  return `Noticia de actualidad regional y nacional. Manténgase en sintonía con la programación informativa de Radio Doble C.`;
}

// Helper to format date relatively (e.g. "Hace 20 min", "Hace 2 h")
function formatRelativeTime(dateStr: string): string {
  try {
    const pub = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - pub.getTime()) / (1000 * 60));

    if (isNaN(diffMin) || diffMin < 0) return "Reciente";
    if (diffMin < 60) return `Hace ${Math.max(1, diffMin)} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
  } catch {
    return "Hoy";
  }
}

// Parse Google News XML RSS format
function parseRssXml(xml: string, defaultCategory: NewsCategory, defaultCatLabel: string, badgeColor: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemBlock = match[1];

    const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(itemBlock);
    const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemBlock);
    const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemBlock);
    const descMatch = /<description>([\s\S]*?)<\/description>/i.exec(itemBlock);

    const rawTitle = titleMatch ? sanitizeNewsText(titleMatch[1]) : "";
    const rawLink = linkMatch ? cleanHtml(linkMatch[1]) : "";
    const rawPubDate = pubDateMatch ? cleanHtml(pubDateMatch[1]) : new Date().toISOString();
    let rawDesc = descMatch ? sanitizeNewsText(descMatch[1]) : "";

    // Auto classify subcategories
    let category = defaultCategory;
    let categoryLabel = defaultCatLabel;
    let itemBadgeColor = badgeColor;
    let isUrgent = false;

    const lowerTitle = rawTitle.toLowerCase();
    const lowerDesc = rawDesc.toLowerCase();

    // Skip any commercial items, product listings, clothes, costumes, Amazon items
    const commercialKeywords = [
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

    const isCommercial = commercialKeywords.some(
      (kw) => lowerTitle.includes(kw) || lowerDesc.includes(kw)
    );

    if (isCommercial) {
      continue; // Skip product listings completely!
    }

    // Filter out sensationalist, morbid, violent, or panic-inducing news
    const panicAndMorbidKeywords = [
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

    const isPanicOrMorbid = panicAndMorbidKeywords.some(
      (kw) => lowerTitle.includes(kw) || lowerDesc.includes(kw)
    );

    if (isPanicOrMorbid) {
      continue; // Skip alarmist/morbid/violent news to protect community trust!
    }

    const isInvestigationOrJudicial =
      lowerTitle.includes("investigan") ||
      lowerTitle.includes("investigación") ||
      lowerTitle.includes("investigacion") ||
      lowerTitle.includes("fiscalía") ||
      lowerTitle.includes("fiscalia") ||
      lowerTitle.includes("denuncia") ||
      lowerTitle.includes("irregularidad") ||
      lowerTitle.includes("sobrecosto") ||
      lowerTitle.includes("contraloría") ||
      lowerTitle.includes("contraloria") ||
      lowerTitle.includes("presupuesto") ||
      lowerTitle.includes("malversación") ||
      lowerTitle.includes("corrupción") ||
      lowerTitle.includes("corrupcion") ||
      lowerTitle.includes("detienen") ||
      lowerTitle.includes("detenido") ||
      lowerTitle.includes("delito");

    if (
      lowerTitle.includes("alerta") ||
      lowerTitle.includes("bloqueo") ||
      lowerTitle.includes("tránsito") ||
      lowerTitle.includes("carretera central") ||
      lowerTitle.includes("corte de agua") ||
      lowerTitle.includes("corte de luz") ||
      lowerTitle.includes("coer") ||
      lowerTitle.includes("emergencia") ||
      lowerTitle.includes("clima")
    ) {
      category = "alerts";
      categoryLabel = "ALERTA VIAL / COER";
      itemBadgeColor = "#BA1A1A";
      isUrgent = true;
    } else if (isInvestigationOrJudicial) {
      category = "huanuco";
      categoryLabel = "HUÁNUCO & REGIÓN";
      itemBadgeColor = "#CCFF00";
    } else if (
      lowerTitle.includes("inteligencia artificial") ||
      lowerTitle.includes("ia ") ||
      lowerTitle.includes("chatgpt") ||
      lowerTitle.includes("openai") ||
      lowerTitle.includes("gemini") ||
      lowerTitle.includes("robot") ||
      lowerTitle.includes("tecnología") ||
      lowerTitle.includes("tecnologia") ||
      lowerTitle.includes("ciberseguridad") ||
      lowerTitle.includes("innovación digital")
    ) {
      category = "tech_ai";
      categoryLabel = "TECNOLOGÍA & IA";
      itemBadgeColor = "#70D6FF";
    } else if (
      !isInvestigationOrJudicial &&
      (lowerTitle.includes("buenas noticias") ||
        lowerTitle.includes("solidaridad") ||
        lowerTitle.includes("voluntariado") ||
        lowerTitle.includes("beca") ||
        lowerTitle.includes("premio internacional") ||
        lowerTitle.includes("emprendimiento social") ||
        lowerTitle.includes("donación") ||
        lowerTitle.includes("ayuda social"))
    ) {
      category = "community_good";
      categoryLabel = "BUENAS NOTICIAS";
      itemBadgeColor = "#A7F3D0";
    } else if (
      lowerTitle.includes("concierto") ||
      lowerTitle.includes("feria") ||
      lowerTitle.includes("festival") ||
      lowerTitle.includes("música") ||
      lowerTitle.includes("musica") ||
      lowerTitle.includes("faica") ||
      lowerTitle.includes("banda") ||
      lowerTitle.includes("álbum") ||
      lowerTitle.includes("album") ||
      lowerTitle.includes("rock")
    ) {
      category = "music_culture";
      categoryLabel = "CULTURA & EVENTOS";
      itemBadgeColor = "#FFDE82";
    }

    // If description is empty or identical/repetitive with title, generate a contextual radio summary
    const cleanDescWithoutSpaces = rawDesc.replace(/\s+/g, "").toLowerCase();
    const cleanTitleWithoutSpaces = rawTitle.replace(/\s+/g, "").toLowerCase();

    if (
      !rawDesc ||
      rawDesc.length < 15 ||
      cleanDescWithoutSpaces === cleanTitleWithoutSpaces ||
      cleanDescWithoutSpaces.includes(cleanTitleWithoutSpaces)
    ) {
      rawDesc = generateContextualSummary(rawTitle, category);
    }

    if (rawTitle) {
      items.push({
        id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title: rawTitle,
        summary: rawDesc,
        link: rawLink || "https://radiodoblec.com",
        source: "Radio Doble C",
        category,
        categoryLabel,
        pubDate: rawPubDate,
        relativeTime: formatRelativeTime(rawPubDate),
        badgeColor: itemBadgeColor,
        isUrgent,
      });
    }

    if (items.length >= 8) break; // Limit per feed
  }

  return items;
}

// Fallback curated news
const FALLBACK_NEWS: NewsItem[] = [
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

export async function GET() {
  try {
    // Check in-memory cache
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS && memoryCache.data.length > 0) {
      return NextResponse.json({
        success: true,
        timestamp: new Date(memoryCache.timestamp).toISOString(),
        total: memoryCache.data.length,
        items: memoryCache.data,
        cached: true,
      });
    }

    const fetchedItems: NewsItem[] = [];

    // 1. Google News RSS - Huánuco Local News (Diario Ahora, Tu Diario, Página3, Correo)
    try {
      const hcoQuery = encodeURIComponent('(Huánuco OR "Pillco Marca" OR Amarilis OR "Carretera Central Huánuco" OR "Tingo María") when:2d -guantes -comprar -tienda -ropa -amazon -aliexpress -asesinato -sicariato -muerte -cadaver -fallece -sangriento -balacera -tragedia -suicidio');
      const hcoUrl = `https://news.google.com/rss/search?q=${hcoQuery}&hl=es-419&gl=PE&ceid=PE:es-419`;

      const resHco = await fetch(hcoUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RadioDobleC/1.0" },
        next: { revalidate: 180 },
      });

      if (resHco.ok) {
        const xmlHco = await resHco.text();
        const parsedHco = parseRssXml(xmlHco, "huanuco", "HUÁNUCO & REGIÓN", "#CCFF00");
        fetchedItems.push(...parsedHco);
      }
    } catch (err) {
      console.warn("[News API] Error fetching Huánuco RSS:", err);
    }

    // 2. Google News RSS - Tecnología & Inteligencia Artificial
    try {
      const techQuery = encodeURIComponent('("Inteligencia Artificial" OR "Tecnología e innovación" OR "Avances IA" OR "OpenAI" OR "Robótica") when:2d -guantes -comprar -tienda -curso -oferta -amazon -aliexpress -asesinato -muerte');
      const techUrl = `https://news.google.com/rss/search?q=${techQuery}&hl=es-419&gl=PE&ceid=PE:es-419`;

      const resTech = await fetch(techUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RadioDobleC/1.0" },
        next: { revalidate: 180 },
      });

      if (resTech.ok) {
        const xmlTech = await resTech.text();
        const parsedTech = parseRssXml(xmlTech, "tech_ai", "TECNOLOGÍA & IA", "#70D6FF");
        fetchedItems.push(...parsedTech);
      }
    } catch (err) {
      console.warn("[News API] Error fetching Tech RSS:", err);
    }

    // 3. Google News RSS - Buenas Noticias & Impacto Positivo Comunidad
    try {
      const communityQuery = encodeURIComponent('("Buenas noticias Perú" OR "Acción solidaria Perú" OR "Voluntariado Perú" OR "Emprendimiento social Perú" OR "Becas Perú") when:3d -guantes -comprar -tienda -oferta -amazon -asesinato -muerte -tragedia');
      const communityUrl = `https://news.google.com/rss/search?q=${communityQuery}&hl=es-419&gl=PE&ceid=PE:es-419`;

      const resCommunity = await fetch(communityUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RadioDobleC/1.0" },
        next: { revalidate: 180 },
      });

      if (resCommunity.ok) {
        const xmlCommunity = await resCommunity.text();
        const parsedCommunity = parseRssXml(xmlCommunity, "community_good", "BUENAS NOTICIAS", "#A7F3D0");
        fetchedItems.push(...parsedCommunity);
      }
    } catch (err) {
      console.warn("[News API] Error fetching Community RSS:", err);
    }

    // 4. Google News RSS - Música, Rock & Cultura Pop Perú
    try {
      const musicQuery = encodeURIComponent('("Rock Peruano" OR "Conciertos Perú" OR "Bandas peruanas" OR "Festival de Música" OR "Escena Rock" OR "Música Huanuqueña") when:3d -guantes -comprar -tienda -ropa -disfraz -amazon -aliexpress -oferta -asesinato -muerte');
      const musicUrl = `https://news.google.com/rss/search?q=${musicQuery}&hl=es-419&gl=PE&ceid=PE:es-419`;

      const resMusic = await fetch(musicUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RadioDobleC/1.0" },
        next: { revalidate: 180 },
      });

      if (resMusic.ok) {
        const xmlMusic = await resMusic.text();
        const parsedMusic = parseRssXml(xmlMusic, "music_culture", "MÚSICA & CULTURA", "#FFDE82");
        fetchedItems.push(...parsedMusic);
      }
    } catch (err) {
      console.warn("[News API] Error fetching Music RSS:", err);
    }

    // Deduplicate items by title similarity
    const seenTitles = new Set<string>();
    const uniqueItems: NewsItem[] = [];

    for (const item of fetchedItems) {
      const normalizedTitle = item.title.toLowerCase().slice(0, 40);
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueItems.push(item);
      }
    }

    // Combine with fallbacks if empty
    const finalItems = uniqueItems.length >= 4 ? uniqueItems : [...uniqueItems, ...FALLBACK_NEWS];

    // Sort chronologically descending: newest breaking news always first
    finalItems.sort((a, b) => {
      const timeA = new Date(a.pubDate).getTime();
      const timeB = new Date(b.pubDate).getTime();
      if (isNaN(timeA) || isNaN(timeB)) return 0;
      return timeB - timeA;
    });

    // Update memory cache
    memoryCache = {
      timestamp: Date.now(),
      data: finalItems,
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total: finalItems.length,
      items: finalItems,
      cached: false,
    });
  } catch (error) {
    console.error("[News API] Fatal error:", error);
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total: FALLBACK_NEWS.length,
      items: FALLBACK_NEWS,
      cached: false,
      fallback: true,
    });
  }
}
