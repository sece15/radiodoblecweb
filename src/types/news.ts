export type NewsCategory = "huanuco" | "alerts" | "music_culture" | "tech_ai" | "community_good" | "world";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  link: string;
  source: string;
  category: NewsCategory;
  categoryLabel: string;
  pubDate: string;
  relativeTime?: string;
  badgeColor?: string;
  isUrgent?: boolean;
}

export interface NewsApiResponse {
  success: boolean;
  timestamp: string;
  total: number;
  items: NewsItem[];
  cached?: boolean;
}
