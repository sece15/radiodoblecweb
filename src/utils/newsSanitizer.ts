import { NewsCategory } from "@/types/news";
import {
  COMMERCIAL_KEYWORDS,
  PANIC_MORBID_KEYWORDS,
  CULTURE_KEYWORDS,
  ALERT_KEYWORDS,
  TECH_KEYWORDS,
  COMMUNITY_POSITIVE_KEYWORDS,
  KNOWN_SOURCES_REGEX,
} from "@/config/newsConstants";

/**
 * Strip HTML tags and decode HTML entities safely
 */
export function cleanHtml(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. Strip CDATA blocks
  text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");

  // 2. Decode HTML entities
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

  // 3. Strip all HTML tags
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

/**
 * Sanitizes news headline/summary: strips URLs, publisher tags, and media branding
 */
export function sanitizeNewsText(text: string): string {
  if (!text) return "";
  let clean = cleanHtml(text);

  // 1. Remove all URLs, domains, social handles
  clean = clean.replace(/https?:\/\/\S+/gi, "");
  clean = clean.replace(/\bwww\.\S+/gi, "");
  clean = clean.replace(/\b[a-z0-9-]+\.(com|pe|org|net|gob\.pe|edu\.pe)\S*/gi, "");
  clean = clean.replace(/\b(facebook|instagram|twitter|tiktok|youtube|t\.co|fb)\.com\S*/gi, "");

  // 2. Remove common phrase preambles / references
  clean = clean.replace(
    /\b(más información en|mas informacion en|más info en|mas info en|lea más en|lea mas en|lee más en|lee mas en|lee la nota completa en|ver más en|ver mas en|visite|fuente|foto|vía|via|redacción|redaccion)\s*:?.*$/gi,
    ""
  );
  clean = clean.replace(/\b(seguir leyendo|continúa leyendo|entérate más|enterate mas)\b.*$/gi, "");
  clean = clean.replace(/\([^)]*(foto|fuente|vía|via|créditos|creditos|imagen)[^)]*\)/gi, "");
  clean = clean.replace(/\[[^\]]*(foto|fuente|vía|via|créditos|creditos|imagen)[^\]]*\]/gi, "");

  // 3. Remove trailing publisher mentions after dash or pipe
  while (KNOWN_SOURCES_REGEX.test(clean)) {
    clean = clean.replace(KNOWN_SOURCES_REGEX, "");
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
  clean = clean.replace(
    /\b(BBC News Mundo|BBC Mundo|CNN en Español|CNN|El País|DW Español|EFE|Infobae América|Infobae|RPP Noticias|RPP|La República|El Comercio|Clarín|El Universal|El Tiempo|Telesur|France 24|Reuters)\b/gi,
    ""
  );

  // 6. Clean trailing punctuation/dashes left over
  clean = clean.replace(/[\s\-–—|•:,;]+$/, "");
  clean = clean.replace(/\s+/g, " ").trim();

  return clean;
}

/**
 * Checks if news item passes safety, anti-morbid, and anti-commercial filters
 */
export function isNewsAllowed(title: string, desc: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerDesc = desc.toLowerCase();

  // Commercial / ecommerce filter
  const isCommercial = COMMERCIAL_KEYWORDS.some(
    (kw) => lowerTitle.includes(kw) || lowerDesc.includes(kw)
  );
  if (isCommercial) return false;

  // Morbid / violent / alarmist filter
  const isPanicOrMorbid = PANIC_MORBID_KEYWORDS.some(
    (kw) => lowerTitle.includes(kw) || lowerDesc.includes(kw)
  );
  if (isPanicOrMorbid) return false;

  return true;
}

/**
 * Intelligent categorization of news into the proper thematic category
 */
export function classifyNewsItem(
  title: string,
  defaultCategory: NewsCategory,
  defaultCatLabel: string,
  defaultBadgeColor: string
): { category: NewsCategory; categoryLabel: string; badgeColor: string; isUrgent: boolean } {
  const lower = title.toLowerCase();

  const isCulture = CULTURE_KEYWORDS.some((kw) => lower.includes(kw));
  const isActualAlert = !isCulture && ALERT_KEYWORDS.some((kw) => lower.includes(kw));
  const isTech = TECH_KEYWORDS.some((kw) => lower.includes(kw));
  const isCommunityGood = COMMUNITY_POSITIVE_KEYWORDS.some((kw) => lower.includes(kw));

  const isLatam =
    lower.includes("latinoamérica") ||
    lower.includes("américa latina") ||
    lower.includes("hispanoamérica") ||
    lower.includes("méxico") ||
    lower.includes("colombia") ||
    lower.includes("argentina") ||
    lower.includes("chile") ||
    lower.includes("perú") ||
    lower.includes("españa") ||
    lower.includes("uruguay") ||
    lower.includes("ecuador") ||
    lower.includes("bolivia") ||
    lower.includes("paraguay") ||
    lower.includes("venezuela") ||
    lower.includes("costa rica") ||
    lower.includes("panamá") ||
    lower.includes("guatemala") ||
    lower.includes("iberoamérica");

  if (isActualAlert) {
    return {
      category: "alerts",
      categoryLabel: "ALERTA & VÍAS",
      badgeColor: "#BA1A1A",
      isUrgent: true,
    };
  }

  if (isCulture) {
    return {
      category: "music_culture",
      categoryLabel: "MÚSICA & CULTURA",
      badgeColor: "#FFDE82",
      isUrgent: false,
    };
  }

  if (isTech) {
    return {
      category: "tech_ai",
      categoryLabel: "TECNOLOGÍA & IA",
      badgeColor: "#70D6FF",
      isUrgent: false,
    };
  }

  if (isCommunityGood) {
    return {
      category: "community_good",
      categoryLabel: "BUENAS NOTICIAS & PLANETA",
      badgeColor: "#A7F3D0",
      isUrgent: false,
    };
  }

  if (isLatam) {
    return {
      category: "latam",
      categoryLabel: "LATINOAMÉRICA",
      badgeColor: "#CCFF00",
      isUrgent: false,
    };
  }

  return {
    category: defaultCategory,
    categoryLabel: defaultCatLabel,
    badgeColor: defaultBadgeColor,
    isUrgent: false,
  };
}

/**
 * Generates rich contextual radio briefing instead of repeating the headline verbatim
 */
export function generateContextualSummary(title: string, category: NewsCategory): string {
  const lower = title.toLowerCase();

  if (category === "tech_ai" || TECH_KEYWORDS.some((kw) => lower.includes(kw))) {
    return `Reporte de avances en tecnología, ciencia e inteligencia artificial que transforman el mundo. Información compartida en la señal de Radio Doble C.`;
  }

  if (category === "music_culture" || CULTURE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return `Panorama cultural, lanzamientos y festivales en la escena musical iberoamericana y global. Cobertura en la sintonía de Radio Doble C.`;
  }

  if (category === "community_good" || COMMUNITY_POSITIVE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return `Iniciativa positiva, sostenibilidad y acción comunitaria que generan impacto en nuestra sociedad y el planeta.`;
  }

  if (category === "alerts" || ALERT_KEYWORDS.some((kw) => lower.includes(kw))) {
    return `Aviso meteorológico y de conectividad vial para la comunidad de oyentes. Manténgase informado y tome las previsiones necesarias.`;
  }

  if (category === "latam" || lower.includes("latinoamérica") || lower.includes("américa latina") || lower.includes("hispanoamérica")) {
    return `Seguimiento de la actualidad y tendencias en los países de habla hispana y Latinoamérica. Reporte emitido para los oyentes de Radio Doble C.`;
  }

  return `Noticia de actualidad y panorama internacional en español. Manténgase en sintonía con la programación informativa de Radio Doble C.`;
}

/**
 * Format timestamp relatively (e.g. "Hace 15 min", "Hace 2 h")
 */
export function formatRelativeTime(dateStr: string): string {
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
