import { useEffect } from "react";
import { X } from "lucide-react";

export interface NeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badgeText?: string;
  maxWidth?: string;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
}

export const NeoModal = ({
  isOpen,
  onClose,
  title,
  badgeText,
  maxWidth = "550px",
  children,
  closeOnBackdrop = true,
}: NeoModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        zIndex: 2500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backdropFilter: "blur(4px)",
      }}
      onClick={() => closeOnBackdrop && onClose()}
    >
      <div
        className="neo-card"
        style={{
          width: "100%",
          maxWidth,
          backgroundColor: "white",
          padding: "24px",
          boxShadow: "8px 8px 0px var(--primary)",
          border: "3.5px solid var(--primary)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {(title || badgeText) && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {badgeText && (
                <span
                  style={{
                    backgroundColor: "var(--primary-container)",
                    border: "1.5px solid var(--primary)",
                    padding: "2px 8px",
                    fontSize: "0.65rem",
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
                    fontSize: "1.25rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    lineHeight: "1.2",
                    fontFamily: "Space Grotesk, sans-serif",
                    margin: 0,
                  }}
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
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontWeight: 900,
                boxShadow: "2px 2px 0px black",
              }}
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Modal Body */}
        {children}
      </div>
    </div>
  );
};
