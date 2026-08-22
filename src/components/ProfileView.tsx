"use client";

import { useState, useEffect } from "react";
import { useAudio } from "@/hooks/useAudio";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/permissions";
import { ProfileHeaderBlock } from "./profile/ProfileHeaderBlock";
import { ProfileStatsCards } from "./profile/ProfileStatsCards";
import { StreamerNoticeCard } from "./profile/StreamerNoticeCard";
import { CurrentlyPlayingCard } from "./profile/CurrentlyPlayingCard";
import { FavoriteSongsSection } from "./profile/FavoriteSongsSection";
import { SavedStationsSection } from "./profile/SavedStationsSection";
import { VisualThemesSection } from "./profile/VisualThemesSection";
import { AdminRoleManager } from "./profile/AdminRoleManager";
import { EditProfileModal } from "./profile/EditProfileModal";

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

  const [showEditModal, setShowEditModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Role permissions
  const normRole = (userProfile.role || "").trim().toUpperCase();
  const userIsAdmin = isAdmin(userProfile.role);
  const canUploadPrograms = normRole === "STREAMER" || normRole === "ADMIN";

  // Real Database Favorites
  const savedStations = stations.filter((s) => s.isLiked);
  const favoriteSongs = songs.filter((s) => s.isFavorite);

  // Admin User List
  const [usersList, setUsersList] = useState<
    { id: string; username: string | null; full_name: string | null; avatar_url: string | null; role: string }[]
  >([]);

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

  const handleSaveProfile = async (name: string, bio: string) => {
    const totalSeconds = listenedSeconds || 0;
    const hoursListened = Math.floor(totalSeconds / 3600);
    try {
      await saveProfile(name, bio, userProfile.avatarUrl, hoursListened, "1.2K");
      setShowEditModal(false);
    } catch (e) {
      console.error("Error al guardar perfil:", e);
      alert("Hubo un error al guardar los cambios en el perfil.");
    }
  };

  const handleShareProfile = async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/?user=${encodeURIComponent(userProfile.name)}`
        : "https://radiodoblec.com";
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
        // Fallback
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
      {/* 1. PROFILE HEADER */}
      <ProfileHeaderBlock
        userProfile={userProfile}
        isAuthenticated={isAuthenticated}
        copiedShare={copiedShare}
        onEditClick={() => {
          if (isAuthenticated) {
            setShowEditModal(true);
          } else {
            signInWithGoogle();
          }
        }}
        onShareClick={handleShareProfile}
        onSignOut={signOut}
      />

      {/* 2. STATS METERS */}
      <ProfileStatsCards
        listenedSeconds={listenedSeconds}
        totalFavoritesCount={favoriteSongs.length + savedStations.length}
        favoriteSongsCount={favoriteSongs.length}
        savedStationsCount={savedStations.length}
      />

      {/* 3. STREAMER / ADMIN NOTICE */}
      <StreamerNoticeCard canUploadPrograms={canUploadPrograms} />

      {/* 4. CURRENTLY PLAYING */}
      <CurrentlyPlayingCard
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        liveStatusText={liveStatusText}
        onTogglePlayPause={togglePlayPause}
      />

      {/* 5. FAVORITE SONGS */}
      <FavoriteSongsSection
        favoriteSongs={favoriteSongs}
        onToggleFavorite={toggleSongFavorite}
        onPlaySong={playSong}
        onNavigateToPlayer={onNavigateToPlayer}
      />

      {/* 6. SAVED STATIONS */}
      <SavedStationsSection
        savedStations={savedStations}
        onPlayStation={playStation}
        onNavigateToPlayer={onNavigateToPlayer}
      />

      {/* 7. THEMES */}
      <VisualThemesSection
        activeTheme={activeTheme}
        onSelectTheme={selectTheme}
      />

      {/* 8. ADMIN ROLE MANAGEMENT */}
      <AdminRoleManager
        userIsAdmin={userIsAdmin}
        usersList={usersList}
        onUpdateUserRole={handleUpdateUserRole}
      />

      {/* MODAL: EDIT PROFILE */}
      <EditProfileModal
        isOpen={showEditModal}
        userProfile={userProfile}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProfile}
      />
    </div>
  );
};
