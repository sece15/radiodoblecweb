// Utilidad centralizada para descarga segura de archivos blob/audio

export async function downloadFileFromUrl(url: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Fallo al descargar archivo directamente, abriendo en pestaña:", err);
    window.open(url, "_blank");
  }
}
