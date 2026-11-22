"use client";

import { useRef, ReactNode } from "react";
import { X } from "lucide-react";
import { useModalDimensions } from "@/hooks/useModalDimensions";
import { useModalIsolation } from "@/hooks/useModalIsolation";

export interface NeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleSize?: string;
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
  titleSize,
  badgeText,
  maxWidth = "550px",
  backgroundColor = "var(--background)",
  children,
  footer,
  closeOnBackdrop = true,
  bodyOverflow = "auto",
}: NeoModalProps) => {
  const { maxModalHeight, isMobile } = useModalDimensions();
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  useModalIsolation(isOpen, modalContainerRef, {
    onEscape: onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      ref={modalContainerRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100dvh",
        maxHeight: "100dvh",
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        zIndex: 6000, // Por encima de header (100) y player (1000)
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile
          ? "calc(12px + env(safe-area-inset-top, 0px)) 12px calc(24px + env(safe-area-inset-bottom, 0px)) 12px"
          : "20px 16px",
        backdropFilter: "blur(5px)",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
      onClick={() => closeOnBackdrop && onClose()}
    >
      <div
        className="neo-card"
        style={{
          width: "100%",
          maxWidth,
          backgroundColor: backgroundColor || "var(--background)",
          boxShadow: isMobile ? "5px 5px 0px var(--primary)" : "8px 8px 0px var(--primary)",
          border: "3px solid var(--primary)",
          display: "flex",
          flexDirection: "column",
          maxHeight: isMobile ? "100%" : `min(${maxModalHeight}px, 100%)`,
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden",
          margin: "auto",
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
                    fontSize: titleSize || (isMobile ? "0.95rem" : "1.05rem"),
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
            overflowX: "hidden",
            minHeight: 0,
            padding: isMobile ? "12px 14px 20px 14px" : "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
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
