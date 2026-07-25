"use client";

import React, { useState, useRef, useEffect } from "react";
import { Smile, X } from "lucide-react";

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  buttonSize?: number;
  dropDirection?: "up" | "down";
}

const EMOJI_CATEGORIES = [
  {
    name: "RADIO & MÚSICA",
    emojis: ["📻", "🎙️", "🎧", "🎸", "🎵", "🎶", "💿", "🔊", "🎹", "🎺", "🥁", "🎛️", "🎷", "🎼"],
  },
  {
    name: "FIRE & REACCIÓN",
    emojis: ["🔥", "⚡", "🤘", "😎", "🤩", "💀", "😈", "💯", "🚀", "💣", "💥", "✨", "💥", "🌟"],
  },
  {
    name: "GESTOS & GUSTOS",
    emojis: ["👍", "🙌", "👏", "❤️", "🖤", "😂", "🤣", "🥳", "🤡", "🤖", "👽", "👾", "👀", "👀"],
  },
  {
    name: "FIESTA & VIBE",
    emojis: ["🍻", "🥂", "🍕", "💃", "🕺", "👑", "🎯", "🏆", "🌈", "🔥", "⚡", "🔊"],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onSelectEmoji,
  buttonSize = 16,
  dropDirection = "up",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      {/* BOTÓN EMOJI */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="neo-button"
        title="Insertar Emojis"
        style={{
          height: "32px",
          width: "32px",
          minWidth: "32px",
          padding: 0,
          backgroundColor: isOpen ? "var(--primary-container)" : "var(--card-bg)",
          boxShadow: isOpen ? "1px 1px 0px var(--primary)" : "2px 2px 0px var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Smile size={buttonSize} style={{ color: "var(--primary)" }} />
      </button>

      {/* PANEL POPUP DE EMOJIS */}
      {isOpen && (
        <div
          className="neo-card"
          style={{
            position: "absolute",
            [dropDirection === "up" ? "bottom" : "top"]: "40px",
            right: 0,
            zIndex: 999,
            width: "280px",
            backgroundColor: "var(--background)",
            border: "3px solid var(--primary)",
            boxShadow: "6px 6px 0px var(--primary)",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Header Popup */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "2px solid var(--primary)",
              paddingBottom: "6px",
            }}
          >
            <span style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase" }}>
              EMOJIS DOBLE C
            </span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Categorías (Pestañas) */}
          <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "4px" }}>
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveTab(idx)}
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  padding: "3px 6px",
                  border: "1.5px solid var(--primary)",
                  backgroundColor: activeTab === idx ? "var(--primary-container)" : "var(--card-bg)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {cat.name.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Grid de Emojis */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "6px",
              maxHeight: "160px",
              overflowY: "auto",
              padding: "4px",
            }}
          >
            {EMOJI_CATEGORIES[activeTab].emojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                style={{
                  fontSize: "1.1rem",
                  background: "none",
                  border: "1px solid transparent",
                  borderRadius: "4px",
                  cursor: "pointer",
                  padding: "4px 2px",
                  transition: "transform 0.1s, background-color 0.1s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-container)";
                  e.currentTarget.style.transform = "scale(1.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Barra de Reacción Rápida inferior */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              paddingTop: "6px",
              borderTop: "1.5px dashed var(--primary)",
            }}
          >
            {["🔥", "📻", "🎙️", "⚡", "🤘", "🎧"].map((quickEmoji) => (
              <button
                key={quickEmoji}
                type="button"
                onClick={() => handleEmojiClick(quickEmoji)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1rem",
                  cursor: "pointer",
                  padding: "2px",
                }}
              >
                {quickEmoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
