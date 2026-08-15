import { NextResponse } from "next/server";
import { NewsItem, NewsCategory } from "@/types/news";
import {
  NEWS_CACHE_TTL_MS,
  NEWS_REVALIDATE_SECONDS,
  RSS_FEEDS_CONFIG,
  FALLBACK_NEWS,
} from "@/config/newsConstants";
import {
  cleanHtml,
  sanitizeNewsText,
  isNewsAllowed,
  classifyNewsItem,
  generateContextualSummary,
  formatRelativeTime,
} from "@/utils/newsSanitizer";

// En Next.js App Router, 'revalidate' debe ser un número literal estático para ser analizable en el build
export const revalidate = 180;

interface CacheStore {
  timestamp: number;
  data: NewsItem[];
}

let memoryCache: CacheStore | null = null;

/**
 * Parse Google News XML RSS format
 */
function parseRssXml(
  xml: string,
  defaultCategory: NewsCategory,
  defaultCatLabel: string,
  defaultBadgeColor: string
): NewsItem[] {
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

    if (!rawTitle) continue;

    // Check safety, anti-panic and anti-commercial filters
    if (!isNewsAllowed(rawTitle, rawDesc)) {
      continue;
    }

    // Auto classify subcategories
    const { category, categoryLabel, badgeColor, isUrgent } = classifyNewsItem(
      rawTitle,
      defaultCategory,
      defaultCatLabel,
      defaultBadgeColor
    );

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
      badgeColor,
      isUrgent,
    });

    if (items.length >= 8) break; // Limit per feed
  }

  return items;
}

export async function GET() {
  try {
    // Check in-memory cache
    if (
      memoryCache &&
      Date.now() - memoryCache.timestamp < NEWS_CACHE_TTL_MS &&
      memoryCache.data.length > 0
    ) {
      return NextResponse.json({
        success: true,
        timestamp: new Date(memoryCache.timestamp).toISOString(),
        total: memoryCache.data.length,
        items: memoryCache.data,
        cached: true,
      });
    }

    const fetchedItems: NewsItem[] = [];

    // Fetch all configured Google News RSS feeds in parallel
    const feedPromises = RSS_FEEDS_CONFIG.map(async (feed) => {
      try {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(feed.query)}&hl=es-419&gl=PE&ceid=PE:es-419`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RadioDobleC/1.0" },
          next: { revalidate: NEWS_REVALIDATE_SECONDS },
        });

        if (res.ok) {
          const xml = await res.text();
          return parseRssXml(xml, feed.category, feed.categoryLabel, feed.badgeColor);
        }
      } catch (err) {
        console.warn(`[News API] Error fetching feed ${feed.category}:`, err);
      }
      return [];
    });

    const feedResults = await Promise.all(feedPromises);
    for (const feedItems of feedResults) {
      fetchedItems.push(...feedItems);
    }

    // Deduplicate items by normalized title similarity
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
