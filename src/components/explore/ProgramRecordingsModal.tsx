"use client";

import { useEffect, useState } from "react";
import { Clock, User, Disc, ScrollText, Play, Pause } from "lucide-react";
import { RadioProgram } from "@/types";
import { NeoModal } from "../common/NeoModal";
import { fetchProgramRecordings, getDriveStreamUrl, DriveFile } from "@/services/driveService";
import { formatFileSize, formatDate, cleanFileName } from "@/lib/formatters";

interface ProgramRecordingsModalProps {
  program: RadioProgram | null;
  isPlaying: boolean;
  currentTrackStreamUrl: string;
  onClose: () => void;
  onPlayRecording: (file: DriveFile, programTitle: string) => void;
}

interface ProgramRecordingsContentProps {
  program: RadioProgram;
  isPlaying: boolean;
  currentTrackStreamUrl: string;
  onPlayRecording: (file: DriveFile, programTitle: string) => void;
}

const ProgramRecordingsContent = ({
  program,
  isPlaying,
  currentTrackStreamUrl,
  onPlayRecording,
}: ProgramRecordingsContentProps) => {
  const [recordings, setRecordings] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    fetchProgramRecordings(program.title)
      .then((files) => {
        if (!isCancelled) {
          setRecordings(files);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error al cargar emisiones del programa:", err);
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [program.title]);

  const orderedRecordings = [...recordings].sort((a, b) => {
    const nameCmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    if (nameCmp !== 0) return nameCmp;
    const timeA = a.createdTime ? new Date(a.createdTime).getTime() : 0;
    const timeB = b.createdTime ? new Date(b.createdTime).getTime() : 0;
    return timeA - timeB;
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "20px",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {/* LADO IZQUIERDO: FOTO, GÉNERO Y HORARIO */}
      <div
        style={{
          flex: "0 0 160px",
          maxWidth: "180px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          margin: "0 auto",
          alignItems: "center",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <div
          className="neo-card"
          style={{
            width: "140px",
            height: "140px",
            overflow: "hidden",
            border: "2.5px solid var(--primary)",
            boxShadow: "3px 3px 0px var(--primary)",
            backgroundColor: "var(--surface-container)",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <img
            src={program.imageUrl}
            alt={program.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "6px",
              left: "6px",
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              padding: "1px 5px",
              fontSize: "0.55rem",
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            {program.genre}
          </div>
        </div>

        {/* Horario */}
        <div
          style={{
            width: "100%",
            border: "1.5px solid var(--primary)",
            backgroundColor: "var(--surface-container)",
            padding: "6px",
            textAlign: "center",
            fontSize: "0.65rem",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <Clock size={12} /> {program.timeSlot}
        </div>
      </div>

      {/* LADO DERECHO: LOCUTOR, DESCRIPCIÓN Y GRABACIONES */}
      <div
        style={{
          flex: "1 1 340px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: 0,
        }}
      >
        {/* Cuadro del Locutor */}
        <div
          style={{
            backgroundColor: "var(--primary-container)",
            border: "2px solid var(--primary)",
            padding: "10px 12px",
            boxShadow: "2px 2px 0px var(--primary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
            <User size={14} style={{ color: "var(--primary)" }} />
            <span style={{ fontSize: "0.6rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.8 }}>
              LOCUTOR / HOST
            </span>
          </div>
          <h4 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
            {program.host}
          </h4>
        </div>

        {/* Cuadro de Descripción */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.7 }}>
              DESCRIPCIÓN DEL PROGRAMA
            </span>
            {program.slogan && (
              <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#BA1A1A" }}>
                ✨ “{program.slogan}”
              </span>
            )}
          </div>
          <div
            style={{
              border: "2px solid var(--primary)",
              backgroundColor: "var(--surface-container)",
              padding: "10px",
              fontSize: "0.75rem",
              lineHeight: "1.25rem",
              color: "var(--primary)",
              boxShadow: "2px 2px 0px var(--primary)",
            }}
          >
            <p style={{ margin: 0 }}>{program.description}</p>
          </div>
        </div>

        {/* ESTRUCTURA DEL SHOW */}
        {program.showStructure && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
              <ScrollText size={14} style={{ color: "var(--primary)" }} /> 🎙️ ESTRUCTURA DEL SHOW
            </span>
            <div
              style={{
                border: "2px solid var(--primary)",
                backgroundColor: "white",
                padding: "10px 12px",
                fontSize: "0.73rem",
                lineHeight: "1.3rem",
                boxShadow: "2px 2px 0px var(--primary)",
                whiteSpace: "pre-line",
              }}
            >
              {program.showStructure}
            </div>
          </div>
        )}

        {/* ESCALETA / GUION */}
        {program.segments && program.segments.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
                <ScrollText size={14} style={{ color: "var(--primary)" }} /> ESCALETA &amp; GUION (CONTROLES Y LOCUCIÓN)
              </span>
              <span
                style={{
                  backgroundColor: "#CCFF00",
                  border: "1px solid var(--primary)",
                  padding: "1px 6px",
                  fontSize: "0.58rem",
                  fontWeight: 900,
                }}
              >
                {program.segments.length} BLOQUES
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "280px",
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {program.segments.map((seg, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    backgroundColor: "white",
                    border: "2px solid var(--primary)",
                    padding: "8px 10px",
                    boxShadow: "2px 2px 0px var(--primary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", borderBottom: "1px dashed #ccc", paddingBottom: "3px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "#111" }}>
                      {seg.icon || "📻"} {seg.control}
                    </span>
                    <span style={{ fontSize: "0.58rem", fontWeight: 900, backgroundColor: "var(--primary-container)", padding: "1px 5px", border: "1px solid var(--primary)" }}>
                      BLOQUE #{sIdx + 1}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.7rem", lineHeight: "1.15rem", margin: 0, opacity: 0.9, whiteSpace: "pre-line" }}>
                    {seg.locution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN DE GRABACIONES Y EMISIONES */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
              <Disc size={13} style={{ color: "var(--primary)" }} /> EMISIONES PASADAS
            </span>
            <span
              style={{
                backgroundColor: "#FFDE82",
                border: "1px solid var(--primary)",
                padding: "1px 6px",
                fontSize: "0.58rem",
                fontWeight: 900,
              }}
            >
              {recordings.length} {recordings.length === 1 ? "GRABACIÓN" : "GRABACIONES"}
            </span>
          </div>

          {isLoading ? (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                backgroundColor: "var(--surface-container)",
                border: "2px dashed var(--primary)",
              }}
            >
              <Disc size={20} className="animate-spin" style={{ margin: "0 auto 4px auto", color: "var(--primary)" }} />
              <p style={{ fontSize: "0.72rem", fontWeight: "bold", margin: 0 }}>
                Cargando emisiones...
              </p>
            </div>
          ) : recordings.length === 0 ? (
            <div
              style={{
                padding: "14px",
                textAlign: "center",
                backgroundColor: "var(--surface-container)",
                border: "2px dashed var(--primary)",
              }}
            >
              <p style={{ fontSize: "0.72rem", fontWeight: "bold", margin: 0, opacity: 0.8 }}>
                📁 Aún no hay grabaciones o emisiones subidas para este programa.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "280px",
                overflowY: "auto",
                paddingRight: "6px",
              }}
            >
              {orderedRecordings.map((recording, rIdx) => {
                const streamUrl = getDriveStreamUrl(recording.id);
                const isPlayingThis = isPlaying && currentTrackStreamUrl === streamUrl;

                return (
                  <div
                    key={recording.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      backgroundColor: isPlayingThis ? "var(--primary-container)" : "var(--surface-container)",
                      border: "2px solid var(--primary)",
                      boxShadow: isPlayingThis ? "2px 2px 0px var(--primary)" : "none",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 900, opacity: 0.6 }}>
                        #{rIdx + 1}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 900,
                            textTransform: "uppercase",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            margin: 0,
                          }}
                          title={recording.name}
                        >
                          {cleanFileName(recording.name)}
                        </p>
                        <span style={{ fontSize: "0.58rem", opacity: 0.7 }}>
                          {formatDate(recording.createdTime)} • {formatFileSize(recording.size)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onPlayRecording(recording, program.title)}
                      style={{
                        backgroundColor: isPlayingThis ? "var(--primary)" : "var(--primary-container)",
                        color: isPlayingThis ? "var(--on-primary)" : "var(--primary)",
                        border: "1.5px solid var(--primary)",
                        padding: "5px 8px",
                        cursor: "pointer",
                        fontSize: "0.68rem",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0,
                      }}
                    >
                      {isPlayingThis ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
                      {isPlayingThis ? "PAUSAR" : "REPRODUCIR"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProgramRecordingsModal = ({
  program,
  isPlaying,
  currentTrackStreamUrl,
  onClose,
  onPlayRecording,
}: ProgramRecordingsModalProps) => {
  if (!program) return null;

  return (
    <NeoModal
      isOpen={Boolean(program)}
      onClose={onClose}
      title={program.title}
      badgeText="📻 PROGRAMA OFICIAL DOBLE C"
      maxWidth="880px"
      bodyOverflow="auto"
      backgroundColor="var(--background)"
      footer={
        <button
          onClick={onClose}
          className="neo-button fun-hover-wobble"
          style={{
            backgroundColor: "white",
            padding: "8px 22px",
            fontSize: "0.75rem",
            fontWeight: 900,
            boxShadow: "3px 3px 0px var(--primary)",
            border: "2px solid var(--primary)",
            cursor: "pointer",
          }}
        >
          CERRAR VENTANA
        </button>
      }
    >
      <ProgramRecordingsContent
        key={program.id || program.title}
        program={program}
        isPlaying={isPlaying}
        currentTrackStreamUrl={currentTrackStreamUrl}
        onPlayRecording={onPlayRecording}
      />
    </NeoModal>
  );
};
