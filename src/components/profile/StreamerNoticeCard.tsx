"use client";

import { Mic, ExternalLink } from "lucide-react";

interface StreamerNoticeCardProps {
  canUploadPrograms: boolean;
}

export const StreamerNoticeCard = ({ canUploadPrograms }: StreamerNoticeCardProps) => {
  if (!canUploadPrograms) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "800px",
        gap: "12px",
        marginTop: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 900,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: 0,
          }}
        >
          <Mic size={20} style={{ color: "var(--primary)" }} /> PANEL DE STREAMERS Y LOCUTORES
        </h3>
      </div>

      <div
        className="neo-card"
        style={{
          backgroundColor: "var(--surface-container)",
          padding: "18px",
          boxShadow: "6px 6px 0px var(--primary)",
          border: "3px solid var(--primary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 320px" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 900, textTransform: "uppercase" }}>
            🎙️ Emisiones y Grabaciones de Programas
          </span>
          <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0, lineHeight: "1.3" }}>
            Para publicar un nuevo capítulo, arrastra el archivo de audio (.mp3) dentro de la carpeta
            compartida de tu programa en Google Drive (<strong>Programas</strong>). La web lo
            sincronizará y publicará automáticamente en <strong>Emisiones Pasadas</strong>.
          </p>
        </div>

        <a
          href="https://drive.google.com/drive/my-drive"
          target="_blank"
          rel="noopener noreferrer"
          className="neo-button fun-hover-wobble"
          style={{
            backgroundColor: "var(--primary-container)",
            padding: "10px 18px",
            fontSize: "0.75rem",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "3px 3px 0px var(--primary)",
            textDecoration: "none",
            color: "var(--primary)",
          }}
        >
          <ExternalLink size={16} /> ABRIR GOOGLE DRIVE
        </a>
      </div>
    </div>
  );
};
