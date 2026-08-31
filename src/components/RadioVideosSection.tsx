"use client";

import { useState } from "react";
import { Play, Sparkles, User, Bell, Check, Tv } from "lucide-react";
import { NeoModal } from "./common/NeoModal";
import { useToast } from "@/hooks/useToast";

export interface RadioVideoItem {
  id: string;
  title: string;
  host: string;
  category: "ENTREVISTA" | "SESIÓN EN VIVO" | "DOCUMENTAL" | "PODCAST";
  durationText: string;
  imageUrl: string;
  description: string;
  tags: string[];
  status: "PRÓXIMAMENTE" | "ESTRENO" | "EN PRODUCCIÓN";
  releaseEstimate: string;
  youtubeUrl?: string;
}

const UPCOMING_VIDEOS: RadioVideoItem[] = [
  {
    id: "video_conversa_1",
    title: "Conversa Time en Cabina: Detrás de micrófonos con la escena local",
    host: "Nicoll",
    category: "ENTREVISTA",
    durationText: "24:15",
    imageUrl: "/conversatime.jpeg",
    description: "Entrevista exclusiva en cabina con bandas y artistas emergentes del underground limeño. Hablamos sobre producción autogestionada, lanzamientos y anécdotas de la movida nocturna.",
    tags: ["Entrevistas", "Escena Local", "Bohemia"],
    status: "PRÓXIMAMENTE",
    releaseEstimate: "Próximo Viernes",
  },
  {
    id: "video_l_mental_1",
    title: "L-Mental: Misterio, Análisis Psicológico & La Xona Esotérica",
    host: "Gerardo “La Seka” B. Gallardo",
    category: "PODCAST",
    durationText: "42:15",
    imageUrl: "/lmental.jpg",
    description: "Enigmas oscuros, psicología, personajes controversiales y la Xona Esotérica con Gerardo “La Seka” B. Gallardo al ritmo de Rock, Reggae y Ska.",
    tags: ["Misterio", "Psicología", "Xona Esotérica", "Rock & Ska"],
    status: "PRÓXIMAMENTE",
    releaseEstimate: "Próximo Viernes",
  },
  {
    id: "video_beats_1",
    title: "Hits and Beats: Documental Sonoro de Bateristas Legendarios",
    host: "JS",
    category: "DOCUMENTAL",
    durationText: "35:20",
    imageUrl: "/hitsandbeats.jpg",
    description: "Mini-documental en video sobre los ritmos, grooves y baterías que cambiaron la historia de la música. Técnicas de grabación de cassette a digital.",
    tags: ["Documental", "Baterías", "Grooves"],
    status: "PRÓXIMAMENTE",
    releaseEstimate: "Próximamente",
  },
  {
    id: "video_ladoc_1",
    title: "Lado C: Batalla de Álbumes & Unboxing de Joyas en Vinilo",
    host: "Marx y Anthony",
    category: "PODCAST",
    durationText: "40:10",
    imageUrl: "/ladoc.jpeg",
    description: "Puntuación de discografías completas, trivias melómanas y unboxing de joyas del coleccionismo de vinilo en un formato dinámico y divertido.",
    tags: ["Vinilos", "Coleccionismo", "Debate"],
    status: "PRÓXIMAMENTE",
    releaseEstimate: "Sábado de Estreno",
  },
];

export const RadioVideosSection = () => {
  const [selectedVideo, setSelectedVideo] = useState<RadioVideoItem | null>(null);
  const [notifiedVideos, setNotifiedVideos] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  const handleNotifyMe = (video: RadioVideoItem) => {
    setNotifiedVideos((prev) => ({ ...prev, [video.id]: true }));
    showToast(`🔔 ¡Te avisaremos cuando "${video.title}" esté disponible en video!`, "success");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", width: "100%" }}>
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "10px",
          borderBottom: "4px solid var(--primary)",
          paddingBottom: "10px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                backgroundColor: "var(--primary-container)",
                border: "2px solid var(--primary)",
                padding: "2px 8px",
                fontSize: "0.65rem",
                fontWeight: 900,
                letterSpacing: "0.5px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transform: "rotate(-1deg)",
                boxShadow: "2px 2px 0px var(--primary)",
              }}
            >
              <Tv size={13} /> DOBLE C TV • VIDEOS
            </span>
            <span
              style={{
                backgroundColor: "#BA1A1A",
                color: "white",
                border: "1.5px solid var(--primary)",
                padding: "2px 6px",
                fontSize: "0.62rem",
                fontWeight: 900,
              }}
            >
              🔴 PRÓXIMAMENTE
            </span>
          </div>

          <h3 style={{ fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", margin: "4px 0 0 0" }}>
            VIDEOS, ENTREVISTAS &amp; SESIONES EN VIVO
          </h3>
          <p style={{ fontSize: "0.76rem", opacity: 0.85, margin: 0 }}>
            Entrevistas exclusivas a bandas, transmisiones en cabina, acústicos en vivo y coberturas que se subirán próximamente a Radio Doble C.
          </p>
        </div>
      </div>

      {/* Videos Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {UPCOMING_VIDEOS.map((video, idx) => {
          const rotations = [-0.8, 0.6, -0.4, 0.7];
          const rot = rotations[idx % rotations.length];
          const isNotified = Boolean(notifiedVideos[video.id]);

          return (
            <div
              key={video.id}
              className="neo-card store-card-hover"
              style={{
                transform: `rotate(${rot}deg)`,
                backgroundColor: "var(--card-bg)",
                border: "3px solid var(--primary)",
                boxShadow: "5px 5px 0px var(--primary)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={() => setSelectedVideo(video)}
            >
              {/* Video Thumbnail with Play Badge */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "150px",
                  backgroundColor: "#111",
                  overflow: "hidden",
                }}
              >
                <img
                  src={video.imageUrl}
                  alt={video.title}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.88,
                    transition: "transform 0.3s ease",
                  }}
                />

                {/* Category & Status Overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    backgroundColor: "var(--primary-container)",
                    border: "1.5px solid var(--primary)",
                    padding: "2px 6px",
                    fontSize: "0.58rem",
                    fontWeight: 900,
                    boxShadow: "1.5px 1.5px 0px var(--primary)",
                  }}
                >
                  {video.category}
                </div>

                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    backgroundColor: video.status === "PRÓXIMAMENTE" ? "#FF0D43" : "#FFDE82",
                    color: video.status === "PRÓXIMAMENTE" ? "white" : "black",
                    border: "1.5px solid var(--primary)",
                    padding: "2px 6px",
                    fontSize: "0.55rem",
                    fontWeight: 900,
                    boxShadow: "1.5px 1.5px 0px var(--primary)",
                  }}
                >
                  {video.status}
                </div>

                {/* Play Button Overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <div
                    className="fun-hover-wobble"
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary-container)",
                      border: "2.5px solid var(--primary)",
                      boxShadow: "3px 3px 0px var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary)",
                    }}
                  >
                    <Play size={20} fill="currentColor" style={{ marginLeft: "2px" }} />
                  </div>
                </div>

                {/* Duration chip */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    right: "6px",
                    backgroundColor: "rgba(0,0,0,0.8)",
                    color: "white",
                    padding: "1px 5px",
                    fontSize: "0.6rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    border: "1px solid var(--primary)",
                  }}
                >
                  ⏱️ {video.durationText}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "8px", flex: 1, justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <h4
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      lineHeight: "1.15rem",
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                    title={video.title}
                  >
                    {video.title}
                  </h4>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", fontWeight: "bold", opacity: 0.85 }}>
                    <User size={12} />
                    <span>Conducción: {video.host}</span>
                  </div>

                  <p
                    style={{
                      fontSize: "0.7rem",
                      opacity: 0.8,
                      lineHeight: "1rem",
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {video.description}
                  </p>
                </div>

                {/* Tags & Action Button */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1.5px dashed var(--primary)", paddingTop: "8px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {video.tags.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          fontSize: "0.58rem",
                          fontWeight: 800,
                          backgroundColor: "var(--surface-container)",
                          border: "1px solid var(--primary)",
                          padding: "1px 4px",
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotifyMe(video);
                    }}
                    className="neo-button fun-hover-wobble"
                    style={{
                      padding: "6px 10px",
                      fontSize: "0.68rem",
                      fontWeight: 900,
                      backgroundColor: isNotified ? "#CCFF00" : "var(--primary-container)",
                      color: "#111111",
                      border: "2px solid var(--primary)",
                      boxShadow: "2px 2px 0px var(--primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                    }}
                  >
                    {isNotified ? <Check size={12} /> : <Bell size={12} />}
                    {isNotified ? "¡TE AVISAREMOS!" : "NOTIFICARME ESTRENO"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VIDEO PREVIEW MODAL */}
      {selectedVideo && (
        <NeoModal
          isOpen={Boolean(selectedVideo)}
          onClose={() => setSelectedVideo(null)}
          title={selectedVideo.title}
          badgeText="🎬 DETALLES DEL VIDEO"
          maxWidth="640px"
          backgroundColor="var(--background)"
          footer={
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
              <button
                onClick={() => handleNotifyMe(selectedVideo)}
                className="neo-button fun-hover-wobble"
                style={{
                  backgroundColor: "var(--primary-container)",
                  padding: "8px 16px",
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  boxShadow: "2.5px 2.5px 0px var(--primary)",
                  border: "2px solid var(--primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Bell size={14} /> NOTIFICARME ESTRENO
              </button>
              <button
                onClick={() => setSelectedVideo(null)}
                className="neo-button"
                style={{
                  backgroundColor: "white",
                  padding: "8px 16px",
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  boxShadow: "2px 2px 0px var(--primary)",
                  border: "2px solid var(--primary)",
                  cursor: "pointer",
                }}
              >
                CERRAR
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Mock Screen Player */}
            <div
              className="scanlines"
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16/9",
                backgroundColor: "#0A0A0A",
                border: "3px solid var(--primary)",
                boxShadow: "4px 4px 0px var(--primary)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                textAlign: "center",
                padding: "20px",
              }}
            >
              <img
                src={selectedVideo.imageUrl}
                alt={selectedVideo.title}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.35,
                  filter: "blur(2px)",
                }}
              />

              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "var(--primary-container)",
                    color: "var(--primary)",
                    padding: "4px 10px",
                    fontWeight: 900,
                    fontSize: "0.75rem",
                    border: "2px solid var(--primary)",
                    boxShadow: "2px 2px 0px var(--primary)",
                  }}
                >
                  ⏳ ESTRENO PRÓXIMAMENTE EN DOBLE C
                </div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 900, maxWidth: "460px", textShadow: "2px 2px 0px black" }}>
                  {selectedVideo.title}
                </h4>
                <span style={{ fontSize: "0.72rem", opacity: 0.85, fontFamily: "monospace" }}>
                  Duración estimada: {selectedVideo.durationText} • Estreno: {selectedVideo.releaseEstimate}
                </span>
              </div>
            </div>

            {/* Video Description & Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--primary)" }}>
                  🎙️ CONDUCCIÓN: {selectedVideo.host.toUpperCase()}
                </span>
                <span
                  style={{
                    backgroundColor: "#FFDE82",
                    border: "1.5px solid var(--primary)",
                    padding: "2px 8px",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                  }}
                >
                  FORMATO: {selectedVideo.category}
                </span>
              </div>

              <p style={{ fontSize: "0.8rem", lineHeight: "1.3rem", color: "var(--primary)", margin: 0 }}>
                {selectedVideo.description}
              </p>

              <div
                style={{
                  backgroundColor: "var(--surface-container)",
                  border: "2px solid var(--primary)",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", fontWeight: 900 }}>
                  <Sparkles size={14} style={{ color: "#BA1A1A" }} />
                  <span>¿QUÉ VERÁS EN ESTA ENTREVISTA / VIDEO?</span>
                </div>
                <ul style={{ fontSize: "0.72rem", paddingLeft: "20px", lineHeight: "1.2rem", margin: 0 }}>
                  <li>Tomas inéditas y acústicos en directo desde la cabina de transmisión.</li>
                  <li>Conversaciones y anécdotas sin censura con artistas de la escena.</li>
                  <li>Documentación y archivo cultural de la radio comunitaria.</li>
                </ul>
              </div>
            </div>
          </div>
        </NeoModal>
      )}
    </div>
  );
};
