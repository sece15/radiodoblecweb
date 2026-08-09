"use client";

import { useState, useEffect, CSSProperties } from "react";
import { useAudio } from "@/hooks/useAudio";
import { Check, Edit, Share2, LogOut, Clock, Star, PlayCircle, Mic, Upload, Disc } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isAdmin, getRoleBadgeInfo } from "@/lib/permissions";
import { INITIAL_PROGRAMS } from "@/constants";
import { uploadProgramRecording } from "@/services/driveService";
import { NeoModal } from "@/components/common/NeoModal";

interface ProfileViewProps {
  onNavigateToPlayer: () => void;
}

export const ProfileView = ({ onNavigateToPlayer }: ProfileViewProps) => {
  const {
    userProfile,
    saveProfile,
    isAuthenticated,
    signOut,
    signInWithGoogle,
    stations,
    songs,
    toggleSongFavorite,
    playSong,
    playStation,
    activeTheme,
    selectTheme,
    currentTrack,
    isPlaying,
    togglePlayPause,
    liveStatusText,
    listenedSeconds,
  } = useAudio();

  // Profile Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editBio, setEditBio] = useState(userProfile.bio || "");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Streamer Upload Recording Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProgramTitle, setSelectedProgramTitle] = useState(INITIAL_PROGRAMS[0]?.title || "NOCHE DE CUMBIA");
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Permissions: Solo STREAMER y ADMIN tienen acceso al panel de subir programas
  const normRole = (userProfile.role || "").trim().toUpperCase();
  const userIsAdmin = isAdmin(userProfile.role);
  const canUploadPrograms = normRole === "STREAMER" || normRole === "ADMIN";

  // Real Database Favorites
  const savedStations = stations.filter((s) => s.isLiked);
  const favoriteSongs = songs.filter((s) => s.isFavorite);

  // Admin User List for Role Management
  const [usersList, setUsersList] = useState<{ id: string; username: string | null; full_name: string | null; avatar_url: string | null; role: string }[]>([]);

  useEffect(() => {
    if (userIsAdmin && supabase) {
      supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, role")
        .order("full_name", { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            setUsersList(data as typeof usersList);
          }
        });
    }
  }, [userIsAdmin]);

  const handleUpdateUserRole = (userId: string, newRole: string) => {
    if (!userIsAdmin) {
      alert("Acceso denegado: Solo los administradores pueden gestionar roles 🛡️");
      return;
    }
    if (supabase) {
      supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId)
        .then(({ error }) => {
          if (error) {
            alert("Error al actualizar el rol: " + error.message);
          } else {
            setUsersList((prev) =>
              prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
            );
          }
        });
    }
  };

  // Real Listening Time Formatter
  const totalSeconds = listenedSeconds || 0;
  const hoursListened = Math.floor(totalSeconds / 3600);
  const minutesListened = Math.floor((totalSeconds % 3600) / 60);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await saveProfile(editName, editBio, userProfile.avatarUrl, hoursListened, "1.2K");
      setShowEditModal(false);
    } catch (e) {
      console.error("Error al guardar perfil:", e);
      alert("Hubo un error al guardar los cambios en el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  // Real Native & Clipboard Share
  const handleShareProfile = async () => {
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?user=${encodeURIComponent(userProfile.name)}` : "https://radiodoblec.com";
    const shareData = {
      title: `Perfil de ${userProfile.name} en Radio Doble C`,
      text: `¡Sintoniza la música independiente y programas en vivo de Radio Doble C con ${userProfile.name}! 📻⚡`,
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard if user cancels or share fails
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    } else {
      alert(`Enlace copiado al portapapeles: ${shareUrl}`);
    }
  };

  // Streamer Upload Recording Submission
  const handleUploadRecordingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingFile) {
      alert("Por favor selecciona un archivo de audio MP3 para subir.");
      return;
    }

    setIsUploadingRecording(true);
    setUploadSuccessMsg(null);

    try {
      const cleanCustomName = recordingTitle.trim() ? `${recordingTitle.trim()}.mp3` : recordingFile.name;
      await uploadProgramRecording(recordingFile, selectedProgramTitle, cleanCustomName);

      setUploadSuccessMsg(`¡Emisión "${recordingTitle || recordingFile.name}" subida con éxito a la carpeta de ${selectedProgramTitle} en Google Drive! 📻☁️`);
      setRecordingTitle("");
      setRecordingFile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido al subir emisión";
      console.error("Error al subir emisión:", err);
      alert(`No se pudo subir la grabación del programa: ${msg}`);
    } finally {
      setIsUploadingRecording(false);
    }
  };

  const availableThemes = [
    { id: "PUNK_NEON", name: "Fanzine Brutal", colors: ["#CCFF00", "#F9FBE5"] },
    { id: "COSMIC_DARK", name: "Cosmic Slate", colors: ["#00FFCC", "#12141C"] },
    { id: "CYBER_RED", name: "Cyberpunk Red", colors: ["#FF0D43", "#FAE000"] },
    { id: "RETRO_AMBER", name: "Amber CRT", colors: ["#FF8000", "#150F05"] },
    { id: "TROPICAL", name: "Isla Tropical", colors: ["#EC008C", "#FFB6D9"] },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        padding: "20px 16px 180px 16px",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* 1. PROFILE HEADER BLOCK */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          width: "100%",
          maxWidth: "480px",
          textAlign: "center",
        }}
      >
        {!isAuthenticated && (
          <div
            style={{
              width: "100%",
              backgroundColor: "var(--primary-container)",
              border: "2px solid var(--primary)",
              padding: "6px 10px",
              textAlign: "center",
              color: "var(--primary)",
              fontWeight: 900,
              fontSize: "0.72rem",
              boxShadow: "3px 3px 0px var(--primary)",
            }}
          >
            📻 MODO INVITADO: INICIA SESIÓN CON GOOGLE PARA GUARDAR TU PROGRESO
          </div>
        )}

        {/* Avatar */}
        <div style={{ position: "relative", width: "160px", height: "160px", padding: "6px" }}>
          <div
            className="neo-card"
            style={{
              width: "100%",
              height: "100%",
              boxShadow: "6px 6px 0px var(--primary)",
              overflow: "hidden",
              backgroundColor: "white",
              border: "3px solid var(--primary)",
            }}
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "-4px",
              right: "-4px",
              backgroundColor: "var(--primary-container)",
              border: "2px solid var(--primary)",
              padding: "4px",
              transform: "rotate(10deg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <Check size={18} style={{ color: "var(--primary)" }} />
          </div>
        </div>

        {/* Name & Role */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <h2
            style={{
              fontSize: "1.8rem",
              lineHeight: "2rem",
              textAlign: "center",
              fontWeight: 900,
              textTransform: "uppercase",
              fontFamily: "Space Grotesk, sans-serif",
              margin: 0,
            }}
          >
            {userProfile.name}
          </h2>

          {/* Dynamic Role Badge */}
          {(() => {
            const badge = getRoleBadgeInfo(userProfile.role);
            return (
              <div
                style={{
                  transform: "rotate(-1.5deg)",
                  backgroundColor: badge.bg,
                  color: badge.color,
                  border: `2px solid ${badge.border}`,
                  padding: "4px 12px",
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  boxShadow: "2px 2px 0px var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {badge.badge}
              </div>
            );
          })()}
        </div>

        {/* Buttons: Edit & Share */}
        <div style={{ display: "flex", width: "100%", maxWidth: "340px", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={() => {
              if (isAuthenticated) {
                setEditName(userProfile.name);
                setEditBio(userProfile.bio || "");
                setShowEditModal(true);
              } else {
                signInWithGoogle();
              }
            }}
            className="neo-button fun-hover-wobble"
            style={{
              flex: 1,
              backgroundColor: "var(--primary-container)",
              fontSize: "0.75rem",
              fontWeight: 900,
            } as CSSProperties}
          >
            <Edit size={15} style={{ marginRight: "6px" }} />
            {isAuthenticated ? "EDITAR PERFIL" : "ACCEDER CON GOOGLE"}
          </button>

          <button
            onClick={handleShareProfile}
            className="neo-button fun-hover-wobble"
            style={{
              flex: 1,
              backgroundColor: copiedShare ? "#CCFF00" : "white",
              fontSize: "0.75rem",
              fontWeight: 900,
              border: "2.5px solid var(--primary)",
            } as CSSProperties}
          >
            <Share2 size={15} style={{ marginRight: "6px" }} />
            {copiedShare ? "¡COPIADO!" : "COMPARTIR"}
          </button>
        </div>

        {isAuthenticated && (
          <button
            onClick={signOut}
            className="neo-button fun-hover-wobble"
            style={{
              width: "100%",
              maxWidth: "340px",
              backgroundColor: "#BA1A1A",
              color: "white",
              fontSize: "0.72rem",
              fontWeight: 900,
              boxShadow: "3px 3px 0px var(--primary)",
            } as CSSProperties}
          >
            <LogOut size={15} style={{ marginRight: "6px" }} />
            CERRAR SESIÓN
          </button>
        )}
      </div>

      {/* 2. REAL STATS METERS (DATOS REALES) */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          width: "100%",
          maxWidth: "800px",
          gap: "16px",
          justifyContent: "center",
        }}
      >
        {/* Real Listening Time Card */}
        <div
          className="neo-card fun-hover-wobble"
          style={{
            flex: "1 1 240px",
            padding: "16px",
            transform: "rotate(1deg)",
            boxShadow: "5px 5px 0px var(--primary)",
            backgroundColor: "var(--surface-container)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
              TIEMPO EN SINTONÍA REAL
            </span>
            <Clock size={18} style={{ color: "var(--primary)" }} />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "10px 0" }}>
            <span style={{ fontSize: "2rem", fontWeight: 900, fontFamily: "Space Grotesk, sans-serif" }}>
              {hoursListened > 0 ? `${hoursListened}h ${minutesListened}m` : `${minutesListened} MIN`}
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: "12px",
              border: "2px solid var(--primary)",
              backgroundColor: "white",
              padding: "1px",
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(5, (totalSeconds / 36000) * 100))}%`,
                height: "100%",
                backgroundColor: "var(--primary-container)",
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <span style={{ fontSize: "0.58rem", opacity: 0.7, marginTop: "4px", display: "block" }}>
            ⏱️ Calculado automáticamente mientras escuchas la radio.
          </span>
        </div>

        {/* Real Favorites Stats Card */}
        <div
          className="neo-card fun-hover-wobble"
          style={{
            flex: "1 1 240px",
            padding: "16px",
            transform: "rotate(-1deg)",
            boxShadow: "5px 5px 0px var(--primary)",
            backgroundColor: "var(--surface-container)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
              COLECCIÓN DE FAVORITOS
            </span>
            <Star size={18} style={{ color: "#FFCC00", fill: "#FFCC00" }} />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "10px 0" }}>
            <span style={{ fontSize: "2rem", fontWeight: 900, fontFamily: "Space Grotesk, sans-serif" }}>
              {favoriteSongs.length + savedStations.length}
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, opacity: 0.8 }}>
              GUARDADOS
            </span>
          </div>

          <div
            style={{
              backgroundColor: "var(--primary-container)",
              border: "1.5px solid var(--primary)",
              padding: "3px 8px",
              fontSize: "0.65rem",
              fontWeight: 900,
              width: "fit-content",
            }}
          >
            {favoriteSongs.length} TEMAS • {savedStations.length} RADIOS
          </div>
        </div>
      </div>

      {/* 3. STREAMERS & ADMINS SECTION: SUBIR EMISIONES DE PROGRAMAS */}
      {canUploadPrograms && (
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
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
                🎙️ Subir Grabación de Programa Emitido
              </span>
              <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0, lineHeight: "1.3" }}>
                Sube el archivo de audio (.mp3) de tu programa emitido para que aparezca automáticamente en la <strong>Guía Oficial de Programas</strong> para que todos los oyentes puedan escucharlo.
              </p>
            </div>

            <button
              onClick={() => {
                setShowUploadModal(true);
                setUploadSuccessMsg(null);
              }}
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
              }}
            >
              <Upload size={16} /> SUBIR A LA RADIO
            </button>
          </div>
        </div>
      )}

      {/* 4. CURRENTLY PLAYING / RECENT STREAM */}
      <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "800px", gap: "12px", marginTop: "12px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
          SINTONIZANDO EN ESTE MOMENTO
        </h3>

        <div
          className="neo-card"
          style={{
            backgroundColor: "var(--primary)",
            color: "white",
            boxShadow: "6px 6px 0px var(--primary-container)",
            border: "3px solid var(--primary)",
          }}
        >
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  backgroundColor: currentTrack?.isLive ? "#BA1A1A" : "var(--primary-container)",
                  color: currentTrack?.isLive ? "white" : "var(--primary)",
                  border: "1px solid currentColor",
                  padding: "2px 8px",
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                {currentTrack?.isLive ? "🔴 EN VIVO" : "DISCO A LA CARTA"}
              </div>
              <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>
                {liveStatusText}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <img
                  src={currentTrack?.imageUrl || "/hitsandbeats.jpg"}
                  alt={currentTrack?.title}
                  className={isPlaying ? "spinning-vinyl" : ""}
                  style={{
                    width: "46px",
                    height: "46px",
                    objectFit: "cover",
                    border: "2px solid var(--primary-container)",
                    flexShrink: 0,
                    borderRadius: "50%",
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontWeight: 900, fontSize: "0.85rem", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                    {currentTrack?.title || "RADIO DOBLE C"}
                  </h4>
                  <p style={{ fontSize: "0.68rem", opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "2px 0 0 0" }}>
                    {currentTrack?.artist || currentTrack?.album || "SELECCIÓN OFICIAL"}
                  </p>
                </div>
              </div>

              <button
                onClick={togglePlayPause}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? (
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary-container)",
                      border: "2px solid var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "2px 2px 0px var(--primary)",
                    }}
                  >
                    <span style={{ display: "flex", gap: "3px" }}>
                      <span style={{ width: "3.5px", height: "13px", backgroundColor: "var(--primary)" }}></span>
                      <span style={{ width: "3.5px", height: "13px", backgroundColor: "var(--primary)" }}></span>
                    </span>
                  </div>
                ) : (
                  <PlayCircle size={40} style={{ color: "var(--primary-container)" }} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. REAL FAVORITE SONGS (CANCIONES FAVORITAS REALES) */}
      <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "800px", gap: "12px", marginTop: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
            ⭐ TUS CANCIONES FAVORITAS ({favoriteSongs.length})
          </h3>
        </div>

        {favoriteSongs.length === 0 ? (
          <div
            className="neo-card"
            style={{
              padding: "20px",
              backgroundColor: "var(--surface-container)",
              border: "2px dashed var(--primary)",
              textAlign: "center",
            }}
          >
            <Star size={26} style={{ color: "var(--primary)", opacity: 0.5, margin: "0 auto 6px auto" }} />
            <p style={{ fontSize: "0.75rem", fontWeight: 900, margin: 0 }}>
              AÚN NO TIENES CANCIONES MARCADAS COMO FAVORITAS
            </p>
            <p style={{ fontSize: "0.68rem", opacity: 0.7, margin: "4px 0 0 0" }}>
              Haz clic en la estrella ⭐ del reproductor de música mientras escuchas tus canciones preferidas para guardarlas en tu lista.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {favoriteSongs.map((song) => (
              <div
                key={song.id}
                className="neo-card fun-hover-wobble"
                style={{
                  padding: "10px 14px",
                  backgroundColor: "var(--surface-container)",
                  boxShadow: "3px 3px 0px var(--primary)",
                  border: "2px solid var(--primary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                  <img
                    src={song.imageUrl}
                    alt={song.title}
                    style={{ width: "42px", height: "42px", objectFit: "cover", border: "2px solid var(--primary)", flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                      {song.title}
                    </h4>
                    <p style={{ fontSize: "0.62rem", opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "2px 0 0 0" }}>
                      {song.artist} • {song.albumName}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    onClick={() => toggleSongFavorite(song.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                    aria-label="Quitar de favoritos"
                    title="Quitar de favoritos"
                  >
                    <Star size={18} style={{ fill: "#FFCC00", color: "#FFCC00" }} />
                  </button>

                  <button
                    onClick={() => {
                      playSong(song);
                      onNavigateToPlayer();
                    }}
                    className="neo-button"
                    style={{
                      padding: "5px 10px",
                      fontSize: "0.65rem",
                      fontWeight: 900,
                      backgroundColor: "var(--primary-container)",
                      boxShadow: "2px 2px 0px var(--primary)",
                    }}
                  >
                    REPRODUCIR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. REAL SAVED STATIONS (RADIOS GUARDADAS) */}
      {savedStations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "800px", gap: "12px", marginTop: "12px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
            📻 RADIOS Y FRECUENCIAS GUARDADAS ({savedStations.length})
          </h3>

          <div style={{ display: "flex", gap: "12px", overflowX: "auto", padding: "6px 0" }}>
            {savedStations.map((station) => (
              <div
                key={station.id}
                onClick={() => {
                  playStation(station);
                  onNavigateToPlayer();
                }}
                className="neo-card fun-hover-wobble"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  width: "110px",
                  flexShrink: 0,
                  cursor: "pointer",
                  padding: "6px",
                  backgroundColor: "var(--surface-container)",
                  boxShadow: "3px 3px 0px var(--primary)",
                  border: "2px solid var(--primary)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1/1",
                    overflow: "hidden",
                    border: "1.5px solid var(--primary)",
                  }}
                >
                  <img
                    src={station.imageUrl}
                    alt={station.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  {station.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. VISUAL THEMES */}
      <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "800px", gap: "12px", marginTop: "12px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
          🎨 TEMAS VISUALES
        </h3>

        <div style={{ display: "flex", gap: "12px", overflowX: "auto", padding: "10px 4px" }}>
          {availableThemes.map((theme, idx) => {
            const isSelected = activeTheme === theme.id;
            const restRotation = idx % 2 === 0 ? -1.5 : 1.5;
            return (
              <div
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                className="neo-card fun-hover-wobble"
                style={{
                  width: "120px",
                  flexShrink: 0,
                  backgroundColor: theme.colors[1],
                  borderWidth: "2.5px",
                  borderColor: "var(--primary)",
                  boxShadow: isSelected ? "0px 0px 0px var(--primary)" : "4px 4px 0px var(--primary)",
                  transform: isSelected
                    ? `translate(3px, 3px) rotate(0deg)`
                    : `rotate(${restRotation}deg)`,
                  padding: "10px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", gap: "4px" }}>
                  <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: theme.colors[0], border: "1px solid black" }}></div>
                  <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: theme.colors[1], border: "1px solid black" }}></div>
                </div>

                <h4
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    color: theme.id === "COSMIC_DARK" || theme.id === "RETRO_AMBER" ? "white" : "black",
                    margin: 0,
                  }}
                >
                  {theme.name}
                </h4>

                <div
                  style={{
                    backgroundColor: isSelected ? theme.colors[0] : "lightgrey",
                    color: "black",
                    fontSize: "0.55rem",
                    fontWeight: "bold",
                    padding: "1px 4px",
                    width: "max-content",
                  }}
                >
                  {isSelected ? "ACTIVO" : "ELEGIR"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. ADMIN USER MANAGEMENT PANEL */}
      {userIsAdmin && (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "800px", gap: "12px", marginTop: "16px" }}>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 900,
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              margin: 0,
            }}
          >
            🛡️ GESTIÓN DE ROLES Y USUARIOS
          </h3>

          <div
            className="neo-card"
            style={{
              backgroundColor: "white",
              padding: "14px",
              boxShadow: "5px 5px 0px var(--primary)",
              border: "3px solid var(--primary)",
              maxHeight: "320px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {usersList.length === 0 ? (
              <p style={{ fontSize: "0.75rem", opacity: 0.7, margin: 0 }}>Cargando lista de usuarios de Supabase...</p>
            ) : (
              usersList.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    border: "2px solid var(--primary)",
                    backgroundColor: "var(--surface-container)",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "180px" }}>
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/png?seed=${user.username}`}
                      alt={user.username || "Usuario"}
                      style={{
                        width: "32px",
                        height: "32px",
                        objectFit: "cover",
                        border: "2px solid var(--primary)",
                        borderRadius: "50%",
                        backgroundColor: "white",
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          margin: 0,
                        }}
                      >
                        {user.full_name || user.username || "Usuario"}
                      </h4>
                      <p style={{ fontSize: "0.58rem", opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                        ID: {user.id}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <label style={{ fontSize: "0.62rem", fontWeight: "bold" }}>ROL:</label>
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                      style={{
                        padding: "3px 6px",
                        fontSize: "0.68rem",
                        fontWeight: 900,
                        border: "2px solid var(--primary)",
                        outline: "none",
                        backgroundColor: "white",
                        cursor: "pointer",
                      }}
                    >
                      {["OYENTE", "VIP", "MODERADOR", "STREAMER", "ADMIN"].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: EDITAR PERFIL */}
      {showEditModal && (
        <NeoModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="EDITAR PERFIL"
          badgeText="RADIO DOBLE C 📻"
          maxWidth="380px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Solo Badge de Rol */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}>
              {(() => {
                const badge = getRoleBadgeInfo(userProfile.role);
                return (
                  <span
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `2px solid ${badge.border}`,
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      boxShadow: "2px 2px 0px var(--primary)",
                    }}
                  >
                    {badge.badge}
                  </span>
                );
              })()}
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                NOMBRE / ALIAS:
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: "2.5px solid var(--primary)",
                  outline: "none",
                  fontSize: "0.8rem",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                ESTADO PERSONAL / BIOGRAFÍA:
              </label>
              <input
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Ej: Amante del vinilo, rock 90s y cumbia clásica"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: "2.5px solid var(--primary)",
                  outline: "none",
                  fontSize: "0.8rem",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: isSaving ? "var(--surface-container)" : "var(--primary-container)",
                width: "100%",
                padding: "10px",
                fontSize: "0.75rem",
                fontWeight: 900,
                marginTop: "6px",
                cursor: isSaving ? "not-allowed" : "pointer",
                boxShadow: "3px 3px 0px var(--primary)",
              }}
            >
              {isSaving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
            </button>
          </div>
        </NeoModal>
      )}

      {/* MODAL 2: SUBIR GRABACIÓN DE PROGRAMA (STREAMERS & LOCUTORES) */}
      {showUploadModal && (
        <NeoModal
          isOpen={showUploadModal}
          onClose={() => {
            if (!isUploadingRecording) setShowUploadModal(false);
          }}
          title="SUBIR EMISIÓN DE PROGRAMA"
          badgeText="RADIO DOBLE C 📻"
          maxWidth="460px"
        >
          <form onSubmit={handleUploadRecordingSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                SELECCIONA EL PROGRAMA OFICIAL:
              </label>
              <select
                value={selectedProgramTitle}
                onChange={(e) => setSelectedProgramTitle(e.target.value)}
                disabled={isUploadingRecording}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "2.5px solid var(--primary)",
                  outline: "none",
                  fontSize: "0.78rem",
                  fontWeight: 900,
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                {INITIAL_PROGRAMS.map((prog) => (
                  <option key={prog.id} value={prog.title}>
                    📻 {prog.title} ({prog.host})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                TÍTULO O EPISODIO DE LA EMISIÓN (OPCIONAL):
              </label>
              <input
                type="text"
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
                disabled={isUploadingRecording}
                placeholder="Ej: Emisión #42 - Especial de Cumbia Psicodélica"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: "2.5px solid var(--primary)",
                  outline: "none",
                  fontSize: "0.78rem",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                ARCHIVO DE AUDIO MP3 *:
              </label>
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.aac"
                required
                disabled={isUploadingRecording}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setRecordingFile(e.target.files[0]);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "2px dashed var(--primary)",
                  backgroundColor: "var(--surface-container)",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                }}
              />
            </div>

            {uploadSuccessMsg && (
              <div
                style={{
                  backgroundColor: "var(--primary-container)",
                  border: "2px solid var(--primary)",
                  padding: "8px 10px",
                  fontSize: "0.72rem",
                  fontWeight: 900,
                }}
              >
                {uploadSuccessMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isUploadingRecording || !recordingFile}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: isUploadingRecording ? "var(--surface-container)" : "var(--primary-container)",
                width: "100%",
                padding: "10px",
                fontSize: "0.75rem",
                fontWeight: 900,
                marginTop: "4px",
                cursor: isUploadingRecording || !recordingFile ? "not-allowed" : "pointer",
                boxShadow: "3px 3px 0px var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              {isUploadingRecording ? (
                <>
                  <Disc size={16} className="animate-spin" /> SUBIENDO A LA RADIO...
                </>
              ) : (
                <>
                  <Upload size={16} /> SUBIR A LA RADIO 📻
                </>
              )}
            </button>
          </form>
        </NeoModal>
      )}
    </div>
  );
};
