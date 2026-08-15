"use client";

import React, { useState } from "react";
import { NewsItem } from "@/types/news";
import { Radio, Newspaper, ChevronRight } from "lucide-react";

interface HeaderNewsTickerProps {
  news: NewsItem[];
  onOpenNews: (item?: NewsItem) => void;
  isLoading?: boolean;
}

export const HeaderNewsTicker: React.FC<HeaderNewsTickerProps> = ({
  news,
  onOpenNews,
  isLoading,
}) => {
  const [isPaused, setIsPaused] = useState(false);

  if (!news || news.length === 0) {
    if (isLoading) {
      return (
        <div
          style={{
            backgroundColor: "#111111",
            color: "#CCFF00",
            borderBottom: "2px solid var(--primary)",
            padding: "4px 10px",
            fontSize: "0.68rem",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <Radio size={12} className="animate-spin" />
          <span>Sincronizando noticias de Huánuco y música en vivo...</span>
        </div>
      );
    }
    return null;
  }

  // Duplicate news array to create a seamless infinite loop in the marquee
  const marqueeItems = [...news, ...news];

  return (
    <div
      className="news-ticker-bar"
      style={{
        backgroundColor: "var(--primary)",
        color: "var(--on-primary)",
        borderBottom: "2px solid var(--primary-container)",
        height: "30px",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        position: "relative",
        zIndex: 50,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* 1. Left Label Badge (Fixed on Desktop, Hidden on Mobile/Tablets) */}
      <button
        onClick={() => onOpenNews()}
        className="news-ticker-badge-btn"
        style={{
          backgroundColor: "#BA1A1A",
          color: "#FFFFFF",
          border: "none",
          borderRight: "2px solid var(--primary-container)",
          height: "100%",
          padding: "0 10px",
          fontSize: "0.62rem",
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          gap: "5px",
          cursor: "pointer",
          flexShrink: 0,
          zIndex: 2,
          letterSpacing: "0.5px",
        }}
        title="Abrir panel de noticias completas"
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "#CCFF00",
            display: "inline-block",
            animation: "pulse 1.5s infinite",
          }}
        />
        <span>FLASH HCO Y EL MUNDO</span>
        <Newspaper size={11} />
      </button>

      {/* 2. Scrolling Marquee Container */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className={`news-ticker-track ${isPaused ? "news-ticker-paused" : ""}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            whiteSpace: "nowrap",
            width: "max-content",
            animationDuration: `${Math.max(140, news.length * 16)}s`,
          }}
        >
          {marqueeItems.map((item, idx) => (
            <div
              key={`${item.id}_${idx}`}
              onClick={() => onOpenNews(item)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "0.72rem",
                fontWeight: 800,
              }}
              title="Click para ver noticia completa"
            >
              {/* Category Pill */}
              <span
                style={{
                  backgroundColor: item.category === "alerts" ? "#BA1A1A" : "#111111",
                  color: item.category === "alerts" ? "#FFFFFF" : "#CCFF00",
                  padding: "1px 5px",
                  fontSize: "0.55rem",
                  fontWeight: 900,
                  border: "1px solid rgba(255,255,255,0.2)",
                  textTransform: "uppercase",
                }}
              >
                {item.categoryLabel}
              </span>

              {/* Title */}
              <span
                style={{
                  color: "var(--on-primary)",
                  textDecoration: "none",
                }}
                className="hover-underline"
              >
                {item.title}
              </span>

              {/* Relative Time */}
              <span
                style={{
                  opacity: 0.8,
                  fontSize: "0.6rem",
                  fontFamily: "monospace",
                }}
              >
                ({item.relativeTime || "Hoy"})
              </span>

              {/* Separator icon */}
              <span style={{ color: "#CCFF00", opacity: 0.6, fontSize: "0.8rem", marginLeft: "10px" }}>
                ⚡
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Right View All Button */}
      <button
        onClick={() => onOpenNews()}
        className="desktop-only-flex"
        style={{
          backgroundColor: "#CCFF00",
          color: "#111111",
          border: "none",
          borderLeft: "2px solid var(--primary-container)",
          height: "100%",
          padding: "0 10px",
          fontSize: "0.62rem",
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          flexShrink: 0,
          zIndex: 2,
        }}
        title="Ver todas las noticias de Huánuco"
      >
        <span>VER TODAS</span>
        <ChevronRight size={12} />
      </button>
    </div>
  );
};
