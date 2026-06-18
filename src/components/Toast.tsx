import { ToastType } from "@/hooks/useToast";

interface ToastProps {
  message: string | null;
  type: ToastType;
  onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: type === "error" ? "#BA1A1A" : type === "success" ? "#1B6B2F" : "var(--primary-container)",
        color: type === "error" ? "white" : "var(--primary)",
        border: "4px solid var(--primary)",
        padding: "12px 20px",
        fontWeight: 900,
        fontSize: "0.75rem",
        boxShadow: "4px 4px 0px var(--primary)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        textTransform: "uppercase",
        fontFamily: "monospace",
        maxWidth: "90%",
        textAlign: "center",
      }}
    >
      <span>{type === "error" ? "⚠️" : "⚡"}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          fontWeight: 900,
          fontSize: "1rem",
          marginLeft: "8px",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ×
      </button>
    </div>
  );
};
