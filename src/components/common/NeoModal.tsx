"use client";

import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";
import { useModalDimensions } from "@/hooks/useModalDimensions";

export interface NeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badgeText?: string;
  maxWidth?: string;
  backgroundColor?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
  bodyOverflow?: "auto" | "hidden" | "visible";
}

export const NeoModal = ({
  isOpen,
  onClose,
  title,
  badgeText,
  maxWidth = "550px",
  backgroundColor = "var(--background)",
  children,
  footer,
  closeOnBackdrop = true,
  bodyOverflow = "auto",
}: NeoModalProps) => {
  const { maxModalHeight, isMobile } = useModalDimensions();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        zIndex: 5000, // Por encima de header (100) y player (1000)
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Márgenes seguros arriba y abajo para que nunca se tape con Header ni con Player
        paddingTop: isMobile ? "82px" : "94px",
        paddingBottom: isMobile ? "102px" : "92px",
        paddingLeft: "16px",
        paddingRight: "16px",
        backdropFilter: "blur(4px)",
        boxSizing: "border-box",
      }}
      onClick={() => closeOnBackdrop && onClose()}
    >
      <div
        className="neo-card"
        style={{
          width: "100%",
          maxWidth,
          backgroundColor: backgroundColor || "var(--background)",
          boxShadow: "6px 6px 0px var(--primary)",
          border: "3px solid var(--primary)",
          display: "flex",
          flexDirection: "column",
          maxHeight: `${maxModalHeight}px`,
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Fijo siempre arriba) */}
        {(title || badgeText) && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              padding: "10px 18px",
              borderBottom: "2px solid var(--primary)",
              backgroundColor: "var(--surface-container)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, flex: 1 }}>
              {badgeText && (
                <span
                  style={{
                    backgroundColor: "var(--primary-container)",
                    border: "1.5px solid var(--primary)",
                    padding: "1px 6px",
                    fontSize: "0.6rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    width: "fit-content",
                  }}
                >
                  {badgeText}
                </span>
              )}
              {title && (
                <h3
                  style={{
                    fontSize: isMobile ? "0.95rem" : "1.05rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    lineHeight: "1.2",
                    fontFamily: "Space Grotesk, sans-serif",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={title}
                >
                  {title}
                </h3>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                background: "var(--primary)",
                color: "var(--on-primary)",
                border: "2px solid var(--primary)",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontWeight: 900,
                boxShadow: "2px 2px 0px black",
                flexShrink: 0,
              }}
              title="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div
          style={{
            flex: "1 1 auto",
            overflowY: bodyOverflow,
            minHeight: 0,
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {children}
        </div>

        {/* Modal Footer (Opcional, Fijo siempre abajo) */}
        {footer && (
          <div
            style={{
              padding: "10px 18px",
              borderTop: "2px solid var(--primary)",
              backgroundColor: "var(--surface-container)",
              flexShrink: 0,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
