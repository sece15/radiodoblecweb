"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RADIO_BANNERS } from "@/constants/banners";
import styles from "./ExploreView.module.css";
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
  onNavigateToPlayer: (tab?: "player" | "chat") => void;
  filteredStyle?: string | null;
  isChatOpen?: boolean;
}

export const ExploreView = ({ onNavigateToPlayer, filteredStyle, isChatOpen = false }: ExploreViewProps) => {
  const featuredBanner = RADIO_BANNERS[0];
  const bannerRef = useRef<HTMLElement>(null);
  const leftBannerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const banner = bannerRef.current;
    const leftBanner = leftBannerRef.current;
    const content = contentRef.current;
    const viewport = content?.closest<HTMLElement>("[data-radio-content]");
    const player = document.querySelector<HTMLElement>(".spotify-player-bar");
    if (!banner || !leftBanner || !content || !viewport) return;
    const update = () => {
      const bounds = viewport.getBoundingClientRect();
      const contentBounds = content.getBoundingClientRect();
      let bottom = Math.min(bounds.bottom, player?.getBoundingClientRect().top ?? window.innerHeight);
      const sponsorTitle = content.querySelector<HTMLElement>(".sponsors-title");
      if (isChatOpen && sponsorTitle) bottom = Math.min(bottom, sponsorTitle.getBoundingClientRect().bottom + viewport.scrollTop + 24);
      const centerWidth = isChatOpen ? 520 : content.getBoundingClientRect().width;
      for (const element of [banner, leftBanner]) {
        element.style.setProperty("--banner-top", `${bounds.top}px`);
        element.style.setProperty("--banner-static-top", `${bounds.top - contentBounds.top - viewport.scrollTop}px`);
        element.style.setProperty("--banner-static-left", `${bounds.left - contentBounds.left}px`);
        element.style.setProperty("--banner-static-right", `${contentBounds.right - bounds.right}px`);
        element.style.setProperty("--banner-right", `${window.innerWidth - bounds.right}px`);
        element.style.setProperty("--banner-left", `${bounds.left}px`);
        element.style.setProperty("--banner-width", `${Math.max(0, (bounds.width - centerWidth) / 2)}px`);
        element.style.setProperty("--banner-height", `${Math.max(0, bottom - bounds.top)}px`);
      }
    };
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    observer.observe(content);
    if (player) observer.observe(player);
    window.addEventListener("resize", update);
    update();
    return () => { observer.disconnect(); window.removeEventListener("resize", update); };
  }, [isChatOpen]);
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
    <div className={`${styles.frame} ${isChatOpen ? styles.chatOpen : ""}`}>
    <div
      ref={contentRef}
      className={styles.explore}
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
      <div className={styles.heroLayout}>
        <div className={styles.radioColumn}>
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
        </div>
        {(["left", "right"] as const).map((side) => (
        <aside
          key={side}
          ref={side === "left" ? leftBannerRef : bannerRef}
          className={`${styles.eventBanner} ${side === "left" ? styles.leftBanner : ""}`}
          aria-label={`Evento destacado ${side === "left" ? "izquierdo" : "derecho"}`}
        >
          <a
            href={featuredBanner.src}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ampliar afiche de ${featuredBanner.title} (abre en otra pestaña)`}
          >
            <Image
              src={featuredBanner.src}
              alt={featuredBanner.alt}
              width={featuredBanner.width}
              height={featuredBanner.height}
              sizes="(max-width: 768px) calc(90vw - 29px), (min-width: 1232px) calc((100vw - 768px) / 2), 663px"
              className={styles.eventImage}
            />
          </a>
        </aside>
        ))}
      </div>

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
    </div>
  );
};
