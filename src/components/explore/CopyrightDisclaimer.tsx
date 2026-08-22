"use client";

export const CopyrightDisclaimer = () => {
  return (
    <div
      className="neo-card"
      style={{
        marginTop: "32px",
        marginBottom: "16px",
        backgroundColor: "var(--card-bg)",
        border: "2.5px solid var(--primary)",
        boxShadow: "4px 4px 0px var(--primary)",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--on-primary)",
            padding: "2px 7px",
            fontSize: "0.62rem",
            fontWeight: 900,
            letterSpacing: "1px",
          }}
        >
          ⚖️ AVISO LEGAL &amp; DERECHOS DE AUTOR
        </span>

        <span style={{ fontSize: "0.62rem", fontWeight: 900, opacity: 0.75 }}>
          DIFUSIÓN CULTURAL &amp; COMUNITARIA
        </span>
      </div>

      <p
        style={{
          fontSize: "0.72rem",
          lineHeight: "1.2rem",
          color: "var(--primary)",
          margin: 0,
          opacity: 0.85,
        }}
      >
        <strong>Radio Doble C</strong> es una plataforma de difusión cultural independiente y
        comunitaria. Todos los derechos de autor, máster y marcas registradas pertenecen a sus
        respectivos autores, intérpretes y sellos. Si eres titular de derechos y requieres
        acreditación o retiro de algún contenido, contáctanos a:{" "}
        <a
          href="mailto:radiodoblechseo@gmail.com?subject=Consulta%20de%20Derechos%20-%20Radio%20Doble%20C"
          style={{ color: "var(--primary)", fontWeight: 900, textDecoration: "underline" }}
        >
          radiodoblechseo@gmail.com
        </a>
        .
      </p>
    </div>
  );
};
