"use client";

import { useState } from "react";
import { useAudio } from "@/hooks/useAudio";
import { RadioProgram } from "@/types";
import { RadioVideosSection } from "./RadioVideosSection";
import { LiveNowBanner } from "./explore/LiveNowBanner";
import { SponsorsSlider } from "./explore/SponsorsSlider";
import { ProgramsListSection } from "./explore/ProgramsListSection";
import { ProgramGuideSection } from "./explore/ProgramGuideSection";
import { BottomBannersSection } from "./explore/BottomBannersSection";
import { CopyrightDisclaimer } from "./explore/CopyrightDisclaimer";
import { DjApplicationModal } from "./explore/DjApplicationModal";
import { ProgramRecordingsModal } from "./explore/ProgramRecordingsModal";
import { HostProfileModal } from "./explore/HostProfileModal";
import { getDriveStreamUrl, DriveFile } from "@/services/driveService";
import { formatFileSize, cleanFileName } from "@/lib/formatters";

interface ExploreViewProps {
  onNavigateToPlayer: () => void;
  filteredStyle?: string | null;
}

export const ExploreView = ({ onNavigateToPlayer, filteredStyle }: ExploreViewProps) => {
  const {
    stations,
    programs,
    playLiveStream,
    playPastBroadcast,
    playRadar,
    toggleStationLike,
    liveShowName,
    liveTrackTitle,
    liveStatusText,
    currentTrack,
    isPlaying,
    togglePlayPause,
  } = useAudio();

  const [selectedStyle, setSelectedStyle] = useState<string>(filteredStyle || "TODOS");
  const [prevFilteredStyle, setPrevFilteredStyle] = useState<string | null | undefined>(filteredStyle);

  if (filteredStyle !== prevFilteredStyle) {
    setPrevFilteredStyle(filteredStyle);
    setSelectedStyle(filteredStyle || "TODOS");
  }

  // Modals state
  const [selectedHostProgram, setSelectedHostProgram] = useState<RadioProgram | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<RadioProgram | null>(null);
  const [isDjModalOpen, setDjModalOpen] = useState(false);

  // Play past broadcast from Drive
  const handlePlayRecording = (file: DriveFile, programTitle: string) => {
    const streamUrl = getDriveStreamUrl(file.id);
    const isCurrent = currentTrack.streamUrl === streamUrl;

    if (isCurrent) {
      togglePlayPause();
      return;
    }

    playPastBroadcast({
      id: file.id,
      programId: "program_recording",
      title: cleanFileName(file.name),
      date: `Emisión de ${programTitle}`,
      duration: formatFileSize(file.size),
      audioUrl: streamUrl,
    });
  };

  // Filter stations based on selected style
  const filteredStations = stations.filter((station) => {
    if (selectedStyle === "TODOS") return true;
    const sStyle = station.style.toUpperCase();
    const selStyle = selectedStyle.toUpperCase();
    return sStyle === selStyle || sStyle.includes(selStyle) || selStyle.includes(sStyle);
  });

  const handleShareStation = (stationName: string) => {
    alert(`Enlace de sintonización copiado para: ${stationName} 📻`);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "20px 16px 180px 16px",
        width: "100%",
        maxWidth: "768px",
        margin: "0 auto",
      }}
    >
      {/* 1. LIVE NOW BANNER */}
      <LiveNowBanner
        liveShowName={liveShowName}
        liveTrackTitle={liveTrackTitle}
        liveStatusText={liveStatusText}
        onPlayLive={playLiveStream}
        onNavigateToPlayer={onNavigateToPlayer}
      />

      {/* 2. SPONSOR & PARTNER LOGOS */}
      <SponsorsSlider />

      {/* 3. PROGRAMAS DOBLE C */}
      <ProgramsListSection
        stations={filteredStations}
        programs={programs}
        isPlaying={isPlaying}
        currentTrackTitle={currentTrack.title}
        onSelectHostProgram={setSelectedHostProgram}
        onToggleLike={toggleStationLike}
        onShare={handleShareStation}
      />

      {/* 4. GUIA DE PROGRAMAS */}
      <ProgramGuideSection
        programs={programs}
        onOpenProgram={setSelectedProgram}
      />

      {/* 5. VIDEOS, ENTREVISTAS & SESIONES */}
      <RadioVideosSection />

      {/* 6. BOTTOM BANNERS (RADAR & DJ RECRUITMENT) */}
      <BottomBannersSection
        onPlayRadar={playRadar}
        onNavigateToPlayer={onNavigateToPlayer}
        onOpenDjModal={() => setDjModalOpen(true)}
      />

      {/* 7. AVISO LEGAL */}
      <CopyrightDisclaimer />

      {/* MODAL 1: DJ POSTULATION */}
      <DjApplicationModal
        isOpen={isDjModalOpen}
        onClose={() => setDjModalOpen(false)}
      />

      {/* MODAL 2: PROGRAM RECORDINGS (DRIVE) */}
      <ProgramRecordingsModal
        program={selectedProgram}
        isPlaying={isPlaying}
        currentTrackStreamUrl={currentTrack.streamUrl}
        onClose={() => setSelectedProgram(null)}
        onPlayRecording={handlePlayRecording}
      />

      {/* MODAL 3: HOST & SHOW PROFILE */}
      <HostProfileModal
        program={selectedHostProgram}
        onClose={() => setSelectedHostProgram(null)}
      />
    </div>
  );
};
