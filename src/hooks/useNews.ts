"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { NewsItem, NewsCategory } from "@/types/news";

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | "all">("all");
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [isNewsModalOpen, setNewsModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchNews = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Error al consultar noticias");
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        setNews(data.items);
        setError(null);
        setLastUpdated(new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudieron cargar las noticias";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialNews() {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error("Error al consultar noticias");
        const data = await res.json();
        if (!isCancelled && data.items && Array.isArray(data.items)) {
          setNews(data.items);
          setLastUpdated(new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }));
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : "No se pudieron cargar las noticias";
          setError(msg);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadInitialNews();

    // Auto-refresh every 3 minutes for maximum freshness
    const interval = setInterval(() => {
      fetchNews(false);
    }, 3 * 60 * 1000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [fetchNews]);

  const filteredNews = useMemo(() => {
    if (selectedCategory === "all") return news;
    return news.filter((n) => n.category === selectedCategory);
  }, [news, selectedCategory]);

  const urgentNews = useMemo(() => {
    return news.filter((n) => n.isUrgent);
  }, [news]);

  const openNewsDetail = (item: NewsItem) => {
    setSelectedNewsItem(item);
    setNewsModalOpen(true);
  };

  const handleManualRefresh = () => {
    fetchNews(true);
  };

  return {
    news,
    filteredNews,
    urgentNews,
    isLoading,
    error,
    selectedCategory,
    setSelectedCategory,
    selectedNewsItem,
    setSelectedNewsItem,
    isNewsModalOpen,
    setNewsModalOpen,
    openNewsDetail,
    refreshNews: handleManualRefresh,
    lastUpdated,
  };
}
