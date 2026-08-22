"use client";

import React from "react";
import { NeoModal } from "@/components/common/NeoModal";
import { NewsItem, NewsCategory } from "@/types/news";
import { RefreshCw, AlertTriangle, Radio, MapPin, Music, Globe, Clock, ExternalLink, Bot, Sparkles } from "lucide-react";

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  news: NewsItem[];
  selectedCategory: NewsCategory | "all";
  setSelectedCategory: (cat: NewsCategory | "all") => void;
  selectedNewsItem: NewsItem | null;
  setSelectedNewsItem: (item: NewsItem | null) => void;
  isLoading: boolean;
  refreshNews: () => void;
  lastUpdated: string;
}

export const NewsModal: React.FC<NewsModalProps> = ({
  isOpen,
  onClose,
  news,
  selectedCategory,
  setSelectedCategory,
  selectedNewsItem,
  setSelectedNewsItem,
  isLoading,
  refreshNews,
  lastUpdated,
}) => {
  const filtered = selectedCategory === "all" ? news : news.filter((n) => n.category === selectedCategory);

  const categories: { id: NewsCategory | "all"; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "TODAS", icon: <Globe size={12} /> },
    { id: "latam", label: "LATINOAMÉRICA", icon: <MapPin size={12} /> },
    { id: "world", label: "MUNDO", icon: <Globe size={12} /> },
    { id: "community_good", label: "BUENAS NOTICIAS & PLANETA", icon: <Sparkles size={12} /> },
    { id: "tech_ai", label: "TECNOLOGÍA & IA", icon: <Bot size={12} /> },
    { id: "music_culture", label: "MÚSICA & CULTURA", icon: <Music size={12} /> },
    { id: "alerts", label: "ALERTAS & VÍAS", icon: <AlertTriangle size={12} /> },
  ];

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedNewsItem ? selectedNewsItem.title : "FLASH DEL MUNDO"}
      badgeText={selectedNewsItem ? "🎙️ RADIO DOBLE C INFORMA" : "⚡ NOTICIAS EN VIVO"}
      maxWidth="780px"
      backgroundColor="var(--background)"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", opacity: 0.8 }}>
            <Clock size={12} />
            <span>Última sincronización: <strong>{lastUpdated || "En vivo"}</strong></span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {selectedNewsItem && (
              <button
                onClick={() => setSelectedNewsItem(null)}
                className="neo-button"
                style={{
                  backgroundColor: "var(--surface-container)",
                  padding: "6px 14px",
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                ← VOLVER A LA LISTA
              </button>
            )}

            <button
              onClick={refreshNews}
              disabled={isLoading}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: "#FFDE82",
                color: "#111",
                padding: "6px 14px",
                fontSize: "0.72rem",
                fontWeight: 900,
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              <span>{isLoading ? "ACTUALIZANDO..." : "ACTUALIZAR NOTICIAS"}</span>
            </button>
          </div>
        </div>
      }
    >
      {/* 1. VISTA DE DETALLE DE NOTICIA INDIVIDUAL (MODO NOTICIA LIMPIA) */}
      {selectedNewsItem ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Header pill with category & time */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span
                style={{
                  backgroundColor: selectedNewsItem.badgeColor || "var(--primary)",
                  color: selectedNewsItem.category === "alerts" ? "#FFF" : "#111",
                  border: "1.5px solid var(--primary)",
                  padding: "2px 8px",
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                {selectedNewsItem.categoryLabel}
              </span>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, opacity: 0.8 }}>
                {selectedNewsItem.relativeTime}
              </span>
            </div>

            {selectedNewsItem.isUrgent && (
              <span
                style={{
                  backgroundColor: "#BA1A1A",
                  color: "#FFF",
                  padding: "2px 7px",
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  border: "1.5px solid var(--primary)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <AlertTriangle size={11} />
                URGENTE / AL SERVICIO VECINAL
              </span>
            )}
          </div>

          {/* Large Headline */}
          <h3
            style={{
              fontSize: "1.2rem",
              fontWeight: 900,
              color: "var(--primary)",
              margin: 0,
              lineHeight: 1.3,
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            {selectedNewsItem.title}
          </h3>

          {/* News Content Box */}
          <div
            style={{
              backgroundColor: "var(--surface-container)",
              border: "2.5px solid var(--primary)",
              padding: "14px 16px",
              boxShadow: "3px 3px 0px var(--primary)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "0.62rem", fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Radio size={12} /> INFORME DE LA NOTICIA:
            </span>
            <p style={{ fontSize: "0.86rem", lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
              {selectedNewsItem.summary}
            </p>
          </div>

          {/* External Source Link to Read Full Article */}
          {selectedNewsItem.link && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--primary-container)",
                color: "var(--on-primary-container)",
                padding: "10px 14px",
                border: "2px solid var(--primary)",
                boxShadow: "3px 3px 0px var(--primary)",
                marginTop: "6px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", fontWeight: 900 }}>
                <Radio size={14} />
                <span>¿DESEAS LEER EL ARTÍCULO COMPLETO?</span>
              </div>
              <a
                href={selectedNewsItem.link}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-button fun-hover-wobble"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--on-primary)",
                  padding: "6px 14px",
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "2px 2px 0px var(--primary-container)",
                  cursor: "pointer",
                }}
              >
                <span>LEER NOTICIA COMPLETA</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>
      ) : (
        /* 2. VISTA DE LISTA DE TODAS LAS NOTICIAS */
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Category Filter Tabs */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              paddingBottom: "4px",
              borderBottom: "2px dashed var(--primary)",
            }}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    backgroundColor: isSelected ? "var(--primary)" : "var(--card-bg)",
                    color: isSelected ? "var(--on-primary)" : "var(--primary)",
                    border: "1.5px solid var(--primary)",
                    padding: "4px 9px",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: isSelected ? "1.5px 1.5px 0px var(--primary)" : "none",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    flexShrink: 0,
                  }}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* News List */}
          {isLoading && news.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center" }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 8px auto", color: "var(--primary)" }} />
              <p style={{ fontSize: "0.78rem", fontWeight: 800, margin: 0 }}>Cargando noticias de Latinoamérica y el mundo...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", opacity: 0.8 }}>
              <p style={{ fontSize: "0.8rem", fontWeight: 800, margin: 0 }}>No hay noticias en esta categoría en este momento.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedNewsItem(item)}
                  className="neo-card store-card-hover"
                  style={{
                    backgroundColor: item.isUrgent ? "rgba(186, 26, 26, 0.05)" : "var(--card-bg)",
                    border: item.isUrgent ? "2px solid #BA1A1A" : "2px solid var(--primary)",
                    padding: "10px 12px",
                    cursor: "pointer",
                    boxShadow: "2px 2px 0px var(--primary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                    <span
                      style={{
                        backgroundColor: item.badgeColor || "var(--primary-container)",
                        color: item.category === "alerts" ? "#FFF" : "#111",
                        padding: "1px 6px",
                        fontSize: "0.58rem",
                        fontWeight: 900,
                        border: "1px solid var(--primary)",
                      }}
                    >
                      {item.categoryLabel}
                    </span>

                    <span style={{ fontSize: "0.6rem", fontWeight: 900, fontFamily: "monospace", opacity: 0.8 }}>
                      ⏰ {item.relativeTime}
                    </span>
                  </div>

                  <h4
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 900,
                      color: "var(--primary)",
                      margin: 0,
                      lineHeight: 1.25,
                    }}
                  >
                    {item.title}
                  </h4>

                  {item.summary && item.summary !== item.title && (
                    <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0, lineHeight: 1.2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {item.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </NeoModal>
  );
};
