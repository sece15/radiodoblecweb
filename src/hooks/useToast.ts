import { useState, useCallback } from "react";

export type ToastType = "info" | "error" | "success";

export function useToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>("info");

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 4000);
  }, []);

  return {
    toastMessage,
    toastType,
    showToast,
    setToastMessage,
  };
}
