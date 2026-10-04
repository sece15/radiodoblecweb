"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { EMOJI_CATEGORIES } from "@/lib/mascotEmojis";

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  buttonSize?: number;
  dropDirection?: "up" | "down";
}

export const EmojiPicker = ({ onSelectEmoji, buttonSize = 24, dropDirection = "up" }: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const triggerDimensions = buttonSize <= 20 ? 32 : 36;
  const iconSize = Math.max(19, Math.min(buttonSize, 24));

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        ref={triggerRef}
        type="button"
        className="neo-button"
        title="Emojis de Doble C"
        aria-label="Emojis de Doble C"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        style={{
          width: triggerDimensions,
          height: triggerDimensions,
          minWidth: triggerDimensions,
          padding: 0,
          border: "2px solid var(--primary)",
          boxShadow: "2px 2px 0px var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isOpen ? "var(--primary-container)" : "white",
          cursor: "pointer",
        }}
      >
        <Image
          src="/emojis/msn/c-feliz-48.png"
          alt="Mascota Doble C"
          width={iconSize}
          height={iconSize}
          unoptimized
          style={{ imageRendering: "auto" }}
        />
      </button>

      {isOpen && (
        <div
          className="neo-card"
          role="region"
          aria-label="Emojis de Doble C"
          style={{
            position: "absolute",
            [dropDirection === "up" ? "bottom" : "top"]: triggerDimensions + 8,
            right: 0,
            zIndex: 999,
            width: "min(300px, calc(100vw - 40px))",
            maxHeight: "calc(100dvh - 160px)",
            overflowY: "auto",
            backgroundColor: "var(--background)",
            border: "3px solid var(--primary)",
            boxShadow: "4px 4px 0 var(--primary)",
            padding: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              borderBottom: "2px solid var(--primary)",
              paddingBottom: 6,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>EMOJIS DOBLE C</span>
            <button
              type="button"
              aria-label="Cerrar emojis"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              style={{
                width: 28,
                height: 28,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div
            aria-label="Categorías de emojis"
            style={{
              display: "flex",
              flexWrap: "nowrap",
              gap: 3,
              marginBottom: 8,
              width: "100%",
            }}
          >
            {EMOJI_CATEGORIES.map((category, index) => (
              <button
                key={category.name}
                type="button"
                aria-pressed={index === activeCategory}
                onClick={() => setActiveCategory(index)}
                style={{
                  flex: "1 1 0",
                  minWidth: 0,
                  height: 26,
                  padding: "0 2px",
                  fontSize: "0.62rem",
                  fontWeight: 900,
                  border: "1.5px solid var(--primary)",
                  cursor: "pointer",
                  color: "var(--primary)",
                  backgroundColor: index === activeCategory ? "var(--primary-container)" : "white",
                  boxShadow: index === activeCategory ? "1.5px 1.5px 0 var(--primary)" : "none",
                  transition: "background-color 0.15s ease",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              justifyItems: "center",
              gap: "6px 2px",
              maxHeight: "min(240px, 40dvh)",
              overflowY: "auto",
              padding: "4px 2px",
            }}
          >
            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
              <button
                key={emoji.id}
                type="button"
                title={`${emoji.label} (${emoji.char || emoji.token})`}
                aria-label={emoji.label}
                onClick={() => {
                  onSelectEmoji(emoji.char || emoji.token);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  padding: 0,
                  backgroundColor: "transparent",
                  color: "var(--primary)",
                  border: "1.5px solid transparent",
                  cursor: "pointer",
                  borderRadius: 4,
                  boxShadow: "none",
                  transition: "background-color 0.12s ease, transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-container)";
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.boxShadow = "1.5px 1.5px 0 var(--primary)";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {emoji.isNative || !emoji.src ? (
                  <span
                    style={{
                      fontSize: "1.28rem",
                      lineHeight: 1,
                      userSelect: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {emoji.char || emoji.unicode || emoji.token}
                  </span>
                ) : (
                  <Image
                    src={emoji.src}
                    alt={emoji.label}
                    width={26}
                    height={26}
                    unoptimized
                    style={{ imageRendering: "auto" }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
