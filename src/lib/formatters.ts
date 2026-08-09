// Módulo centralizado de formateo de datos, fechas y archivos

export function formatFileSize(bytes?: string | number): string {
  if (bytes === undefined || bytes === null || bytes === "") return "N/A";
  const num = typeof bytes === "number" ? bytes : parseInt(bytes, 10);
  if (isNaN(num) || num <= 0) return "N/A";

  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(dateStr?: string, locale = "es-ES"): string {
  if (!dateStr) return "Reciente";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Reciente";
    return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "Reciente";
  }
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function cleanFileName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "").trim();
}
