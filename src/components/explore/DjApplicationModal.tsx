"use client";

import { useState, FormEvent } from "react";
import { Megaphone } from "lucide-react";
import { NeoModal } from "../common/NeoModal";

interface DjApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DjApplicationModal = ({
  isOpen,
  onClose,
}: DjApplicationModalProps) => {
  const [djName, setDjName] = useState("");
  const [djEmail, setDjEmail] = useState("");
  const [djDemoUrl, setDjDemoUrl] = useState("");
  const [djBio, setDjBio] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [djSubmitted, setDjSubmitted] = useState(false);

  const resetForm = () => {
    setDjSubmitted(false);
    setDjName("");
    setDjEmail("");
    setDjDemoUrl("");
    setDjBio("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!djName.trim() || !djEmail.trim()) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }
    setIsSendingEmail(true);

    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://skkwodwxaeajdaukjsqg.supabase.co";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          name: djName.trim(),
          email: djEmail.trim(),
          demoUrl: djDemoUrl.trim(),
          bio: djBio.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn("Supabase send-email response:", errData);
      }
    } catch (err) {
      console.error("Error al enviar postulación por API:", err);
    } finally {
      setIsSendingEmail(false);
      setDjSubmitted(true);
    }
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={!djSubmitted ? "¿Quieres ser Locutor o DJ?" : "¡Postulación Enviada!"}
      badgeText="📻 CONVOCATORIA ABIERTA"
      maxWidth="460px"
      backgroundColor="var(--background)"
    >
      {!djSubmitted ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ textAlign: "center", marginBottom: "2px" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: "bold", opacity: 0.8, margin: 0 }}>
              Envíanos tus datos y tu demo para postular a Radio Doble C.
            </p>
          </div>

          {/* Nombre y Correo */}
          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "0.68rem",
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "3px",
                }}
              >
                NOMBRE / AKAS *
              </label>
              <input
                type="text"
                required
                disabled={isSendingEmail}
                value={djName}
                onChange={(e) => setDjName(e.target.value)}
                placeholder="Ej. Carlos"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "2.5px solid var(--primary)",
                  outline: "none",
                  fontSize: "0.78rem",
                  fontFamily: "inherit",
                  backgroundColor: "white",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "0.68rem",
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "3px",
                }}
              >
                TU CORREO *
              </label>
              <input
                type="email"
                required
                disabled={isSendingEmail}
                value={djEmail}
                onChange={(e) => setDjEmail(e.target.value)}
                placeholder="tu_correo@gmail.com"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "2.5px solid var(--primary)",
                  outline: "none",
                  fontSize: "0.78rem",
                  fontFamily: "inherit",
                  backgroundColor: "white",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: "0.68rem",
                fontWeight: "bold",
                display: "block",
                marginBottom: "3px",
              }}
            >
              ENLACE A DEMO (SOUNDCLOUD / MIXCLOUD / DRIVE / YT)
            </label>
            <input
              type="url"
              disabled={isSendingEmail}
              value={djDemoUrl}
              onChange={(e) => setDjDemoUrl(e.target.value)}
              placeholder="https://soundcloud.com/... o enlace Drive"
              style={{
                width: "100%",
                padding: "6px 8px",
                border: "2.5px solid var(--primary)",
                outline: "none",
                fontSize: "0.78rem",
                fontFamily: "inherit",
                backgroundColor: "white",
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: "0.68rem",
                fontWeight: "bold",
                display: "block",
                marginBottom: "3px",
              }}
            >
              PROPUESTA MUSICAL / MENSAJE
            </label>
            <textarea
              disabled={isSendingEmail}
              value={djBio}
              onChange={(e) => setDjBio(e.target.value)}
              placeholder="Cuéntanos qué estilos tocas y tu idea de programa o audios..."
              rows={2}
              style={{
                width: "100%",
                padding: "6px 8px",
                border: "2.5px solid var(--primary)",
                outline: "none",
                fontSize: "0.78rem",
                fontFamily: "inherit",
                resize: "none",
                backgroundColor: "white",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSendingEmail}
            className="neo-button fun-hover-wobble"
            style={{
              backgroundColor: isSendingEmail
                ? "var(--surface-container)"
                : "var(--primary-container)",
              width: "100%",
              padding: "10px",
              fontSize: "0.75rem",
              fontWeight: 900,
              marginTop: "4px",
              boxShadow: "3px 3px 0px var(--primary)",
              cursor: isSendingEmail ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            ENVIAR
          </button>
        </form>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "12px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-container)",
              border: "3px solid var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Megaphone size={30} style={{ color: "var(--primary)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
              ¡DEMO ENVIADA! 📻
            </h3>
            <p style={{ fontSize: "0.75rem", fontWeight: "bold", opacity: 0.8, margin: 0 }}>
              Hola <strong>{djName}</strong>, tu postulación ha sido enviada a la bandeja de la radio. Revisaremos tu material y te contactaremos a <strong>{djEmail}</strong>.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="neo-button"
            style={{
              backgroundColor: "white",
              padding: "8px 18px",
              fontSize: "0.75rem",
              fontWeight: 900,
              boxShadow: "3px 3px 0px var(--primary)",
            }}
          >
            ENTENDIDO, VOLVER 📡
          </button>
        </div>
      )}
    </NeoModal>
  );
};
