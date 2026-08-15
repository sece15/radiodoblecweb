"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ZineBackgroundFrame } from "@/components/ZineBackgroundFrame";
import { SpotifyPlayerBar } from "@/components/SpotifyPlayerBar";
import { ChatSidebar } from "@/components/ChatSidebar";
import { PlayerView } from "@/components/PlayerView";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { useWakeLock } from "@/hooks/useWakeLock";
import { RadioLogo } from "@/components/RadioLogo";
import { DAYS_OF_WEEK } from "@/constants";
import { useSchedule } from "@/hooks/useSchedule";
import { MusicScheduleBlock } from "@/types";
import {
  Clock,
  Search,
  Printer,
  Share2,
  ArrowLeft,
  Activity,
  Flame,
  Zap,
  Coffee,
  Moon,
  Bot,
  Music,
  Check,
  Grid,
  List,
  Calendar,
} from "lucide-react";

export default function HorariosPage() {
  useWakeLock(true);
  const { toastMessage, toastType, showToast, setToastMessage } = useToast();
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const {
    selectedDayFilter,
    setSelectedDayFilter,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    currentDayIndex,
    filteredBlocks,
    isBlockActiveNow,
    getSpecialProgramsForSlot,
    getHourlyBreakdown,
  } = useSchedule();

  const [isPlayerExpanded, setPlayerExpanded] = useState(false);
  const [isChatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast("¡Enlace de horarios copiado al portapapeles!", "success");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const renderTimeSlot = (timeSlot: string) => {
    const parts = timeSlot.split(" - ");
    if (parts.length === 2) {
      return (
        <div className="schedule-time-container">
          <span>{parts[0]}</span>
          <span className="schedule-time-dash">-</span>
          <span className="schedule-time-divider">↓</span>
          <span>{parts[1]}</span>
        </div>
      );
    }
    return <span style={{ lineHeight: "0.85rem" }}>{timeSlot}</span>;
  };

  const getEnergyBadge = (level: MusicScheduleBlock["energyLevel"]) => {
    switch (level) {
      case "Muy Alta":
        return { bg: "#FF0D43", color: "#FFF", icon: <Flame size={11} /> };
      case "Alta":
        return { bg: "#FFB000", color: "#111", icon: <Zap size={11} /> };
      case "Media":
        return { bg: "#70D6FF", color: "#111", icon: <Activity size={11} /> };
      case "Media-Baja":
        return { bg: "#FFD6A5", color: "#111", icon: <Coffee size={11} /> };
      case "Baja":
        return { bg: "#D8BBFF", color: "#111", icon: <Moon size={11} /> };
      case "Automatizada":
        return { bg: "#CCFF00", color: "#111", icon: <Bot size={11} /> };
      default:
        return { bg: "#E2E2E2", color: "#111", icon: <Music size={11} /> };
    }
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--background)",
        overflowX: "hidden",
      }}
    >
      {/* 1. TOP NAVBAR */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--background)",
          borderBottom: "4px solid var(--primary)",
          padding: "10px 16px",
          gap: "12px",
        }}
      >
        {/* Back Link */}
        <Link
          href="/"
          className="neo-button fun-hover-wobble"
          style={{
            textDecoration: "none",
            color: "var(--primary)",
            padding: "8px 14px",
            fontSize: "0.75rem",
            fontWeight: 900,
            backgroundColor: "var(--card-bg)",
            boxShadow: "3px 3px 0px var(--primary)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transform: "rotate(-1deg)",
          }}
        >
          <ArrowLeft size={14} />
          VOLVER A LA RADIO
        </Link>

        {/* Center Radio Logo (Identical size & layout to main page header, Desktop Only) */}
        <Link
          href="/"
          className="header-logo-container desktop-only-flex"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            height: "72px",
            width: "72px",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            textDecoration: "none",
          }}
          title="Radio Doble C - Inicio"
        >
          <RadioLogo />
        </Link>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={handleCopyLink}
            className="neo-button fun-hover-wobble"
            style={{
              padding: "8px 12px",
              fontSize: "0.72rem",
              fontWeight: 900,
              backgroundColor: "var(--card-bg)",
              boxShadow: "2.5px 2.5px 0px var(--primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
            title="Copiar enlace de horarios"
          >
            {copiedLink ? <Check size={14} style={{ color: "green" }} /> : <Share2 size={14} />}
            <span className="desktop-only-flex">{copiedLink ? "¡COPIADO!" : "COMPARTIR"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="neo-button fun-hover-wobble"
            style={{
              padding: "8px 12px",
              fontSize: "0.72rem",
              fontWeight: 900,
              backgroundColor: "var(--primary-container)",
              boxShadow: "2.5px 2.5px 0px var(--primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
            title="Imprimir horarios de la semana"
          >
            <Printer size={14} />
            <span className="desktop-only-flex">IMPRIMIR</span>
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <div style={{ flex: 1, paddingBottom: "120px", position: "relative" }}>
        <ZineBackgroundFrame>
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              padding: "20px 12px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              width: "100%",
            }}
          >
            {/* HERO TITLE CONTAINER */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--on-primary)",
                  padding: "4px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 900,
                  letterSpacing: "1.5px",
                  transform: "rotate(-1.5deg)",
                  boxShadow: "3px 3px 0px var(--primary-container)",
                }}
              >
                📡 MÚSICA &amp; CANCIONES DE LA SEMANA 24/7
              </div>

              <h1
                style={{
                  fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "-1px",
                  lineHeight: "1.1",
                  margin: 0,
                  color: "var(--primary)",
                }}
              >
                HORARIOS &amp; CANCIONES DE LA SEMANA
              </h1>

              <p
                style={{
                  fontSize: "0.82rem",
                  fontWeight: "bold",
                  opacity: 0.85,
                  maxWidth: "750px",
                  margin: 0,
                  lineHeight: "1.25rem",
                }}
              >
                Programación y música de la semana (Lunes a Domingo) en Radio Doble C. Revisa qué canciones y géneros suenan las 24 horas y los programas especiales en vivo de los Viernes y Sábados.
              </p>
            </div>

            {/* CONTROLS BAR: SEARCH, DAY SELECTOR & SCROLL BUTTONS */}
            <div
              className="neo-card"
              style={{
                backgroundColor: "var(--card-bg)",
                border: "3px solid var(--primary)",
                boxShadow: "4px 4px 0px var(--primary)",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                {/* Search Bar */}
                <div style={{ position: "relative", flex: "1 1 280px" }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--primary)",
                      opacity: 0.7,
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Filtrar por género o bloque (Rock, Salsa, Pop, Lo-Fi, Reggaetón, Cumbia, EDM...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 36px",
                      backgroundColor: "var(--surface-container)",
                      border: "2px solid var(--primary)",
                      boxShadow: "2px 2px 0px var(--primary)",
                      outline: "none",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* View Switcher */}
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setViewMode("grid")}
                    className="neo-button fun-hover-wobble"
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.7rem",
                      fontWeight: 900,
                      backgroundColor: viewMode === "grid" ? "var(--primary)" : "var(--card-bg)",
                      color: viewMode === "grid" ? "var(--on-primary)" : "var(--primary)",
                      boxShadow: viewMode === "grid" ? "0px 0px 0px var(--primary)" : "2px 2px 0px var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      cursor: "pointer",
                    }}
                  >
                    <Grid size={13} />
                    SEMANAL
                  </button>

                  <button
                    onClick={() => setViewMode("list")}
                    className="neo-button fun-hover-wobble"
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.7rem",
                      fontWeight: 900,
                      backgroundColor: viewMode === "list" ? "var(--primary)" : "var(--card-bg)",
                      color: viewMode === "list" ? "var(--on-primary)" : "var(--primary)",
                      boxShadow: viewMode === "list" ? "0px 0px 0px var(--primary)" : "2px 2px 0px var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      cursor: "pointer",
                    }}
                  >
                    <List size={13} />
                    LISTA
                  </button>
                </div>
              </div>

              {/* Day Filter Pills */}
              <div
                style={{
                  display: "flex",
                  gap: "5px",
                  overflowX: "auto",
                  paddingBottom: "2px",
                  alignItems: "center",
                  scrollbarWidth: "none",
                }}
              >
                <span style={{ fontSize: "0.65rem", fontWeight: 900, opacity: 0.8, marginRight: "2px", flexShrink: 0 }}>
                  VER:
                </span>
                <button
                  onClick={() => setSelectedDayFilter("all")}
                  style={{
                    backgroundColor: selectedDayFilter === "all" ? "var(--primary)" : "var(--card-bg)",
                    color: selectedDayFilter === "all" ? "var(--on-primary)" : "var(--primary)",
                    border: "1.5px solid var(--primary)",
                    padding: "3px 8px",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "1.5px 1.5px 0px var(--primary)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  TODOS (7 DÍAS)
                </button>
                {DAYS_OF_WEEK.map((day) => {
                  const isToday = currentDayIndex === day.dayIndex;
                  const isSelected = selectedDayFilter === day.id;
                  return (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDayFilter(day.id)}
                      style={{
                        backgroundColor: isSelected
                          ? "var(--primary)"
                          : isToday
                            ? "#CCFF00"
                            : "var(--card-bg)",
                        color: isSelected ? "var(--on-primary)" : "var(--primary)",
                        border: "1.5px solid var(--primary)",
                        padding: "3px 8px",
                        fontSize: "0.65rem",
                        fontWeight: 900,
                        cursor: "pointer",
                        boxShadow: "1.5px 1.5px 0px var(--primary)",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {day.label} {isToday ? "• HOY" : ""} {day.id === "dom" ? "☀️" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. TIMETABLE GRID VIEW (ENHANCED RESPONSIVE GRID WITH STICKY TIME COLUMN AND VISIBLE SUNDAY) */}
            {viewMode === "grid" ? (
              <div
                ref={tableScrollRef}
                style={{
                  width: "100%",
                  overflowX: "auto",
                  border: "3.5px solid var(--primary)",
                  boxShadow: "6px 6px 0px var(--primary)",
                  backgroundColor: "var(--card-bg)",
                  position: "relative",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth: "980px",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    tableLayout: "fixed",
                  }}
                >
                  <colgroup>
                    <col className="schedule-time-col-header" style={{ width: "95px" }} />
                    {DAYS_OF_WEEK.filter(
                      (d) => selectedDayFilter === "all" || selectedDayFilter === d.id
                    ).map((day) => (
                      <col key={day.id} style={{ minWidth: "125px" }} />
                    ))}
                  </colgroup>

                  <thead>
                    <tr style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
                      {/* Sticky Header Top-Left */}
                      <th
                        className="schedule-time-col-header"
                        style={{
                          position: "sticky",
                          left: 0,
                          zIndex: 20,
                          padding: "10px 4px",
                          fontSize: "0.72rem",
                          fontWeight: 900,
                          backgroundColor: "var(--primary)",
                          color: "var(--on-primary)",
                          borderRight: "2px solid var(--background)",
                          fontFamily: "monospace",
                          textAlign: "center",
                          width: "95px",
                        }}
                      >
                        HORARIO
                      </th>

                      {/* Day Headers */}
                      {DAYS_OF_WEEK.filter(
                        (d) => selectedDayFilter === "all" || selectedDayFilter === d.id
                      ).map((day) => {
                        const isToday = currentDayIndex === day.dayIndex;
                        const headerBg = isToday ? "#CCFF00" : "var(--primary)";
                        const headerColor = isToday ? "#161E00" : "var(--on-primary)";

                        return (
                          <th
                            key={day.id}
                            style={{
                              padding: "10px 6px",
                              fontSize: "0.72rem",
                              fontWeight: 900,
                              textAlign: "center",
                              borderRight: "2px solid var(--background)",
                              backgroundColor: headerBg,
                              color: headerColor,
                            }}
                          >
                            <div>{day.label}</div>
                            {isToday && (
                              <span
                                style={{
                                  display: "inline-block",
                                  fontSize: "0.55rem",
                                  fontWeight: 900,
                                  backgroundColor: "#161E00",
                                  color: "#CCFF00",
                                  padding: "1px 5px",
                                  borderRadius: "2px",
                                  marginTop: "2px",
                                }}
                              >
                                ● HOY
                              </span>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBlocks.map((block) => {
                      const isNow = isBlockActiveNow(block);
                      const energy = getEnergyBadge(block.energyLevel);

                      return (
                        <tr
                          key={block.id}
                          style={{
                            borderBottom: "2px solid var(--primary)",
                            backgroundColor: isNow ? "rgba(204, 255, 0, 0.05)" : "transparent",
                          }}
                        >
                          {/* Sticky Hour Column with responsive stacked time numbers */}
                          <td
                            className="schedule-time-col-cell"
                            style={{
                              position: "sticky",
                              left: 0,
                              zIndex: 10,
                              padding: "8px 3px",
                              borderRight: "2.5px solid var(--primary)",
                              textAlign: "center",
                              backgroundColor: isNow ? "var(--primary-container)" : "var(--surface-container)",
                              boxShadow: "2px 0px 4px rgba(0,0,0,0.1)",
                              width: "95px",
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                              <Clock size={11} className="desktop-only-flex" />
                              {renderTimeSlot(block.timeSlot)}
                              {isNow && (
                                <span
                                  style={{
                                    backgroundColor: "#BA1A1A",
                                    color: "#FFF",
                                    padding: "1px 3px",
                                    fontSize: "0.48rem",
                                    fontWeight: 900,
                                    borderRadius: "2px",
                                    marginTop: "1px",
                                  }}
                                >
                                  VIVO
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Day Columns */}
                          {DAYS_OF_WEEK.filter(
                            (d) => selectedDayFilter === "all" || selectedDayFilter === d.id
                          ).map((day) => {
                            const isToday = currentDayIndex === day.dayIndex;
                            const isCurrentCell = isNow && isToday;
                            const specialPrograms = getSpecialProgramsForSlot(block.id, day.id);
                            const isSunday = day.id === "dom";

                            return (
                              <td
                                key={`${block.id}-${day.id}`}
                                style={{
                                  padding: "6px 8px",
                                  borderRight: "1.5px solid var(--primary)",
                                  verticalAlign: "top",
                                  backgroundColor: isCurrentCell
                                    ? "var(--primary-container)"
                                    : isToday
                                      ? "rgba(204, 255, 0, 0.08)"
                                      : isSunday
                                        ? "rgba(255, 222, 130, 0.08)"
                                        : "transparent",
                                  transition: "background-color 0.15s ease",
                                }}
                                className="schedule-table-cell"
                              >
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  {specialPrograms && specialPrograms.length > 0 ? (
                                    /* LIVE SHOWS ON FRIDAY / SATURDAY REPLACING DEFAULT CELL */
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#BA1A1A" }}>
                                          🔴 EN VIVO / ONLINE
                                        </span>
                                        <span
                                          style={{
                                            fontSize: "0.5rem",
                                            fontWeight: 900,
                                            backgroundColor: "#BA1A1A",
                                            color: "#FFF",
                                            padding: "1px 4px",
                                            borderRadius: "2px",
                                          }}
                                        >
                                          LIVE SHOW
                                        </span>
                                      </div>

                                      {specialPrograms.map((sp) => (
                                        <div
                                          key={sp.id}
                                          style={{
                                            backgroundColor: sp.isLiveRightNow ? "#BA1A1A" : "#FFDE82",
                                            color: sp.isLiveRightNow ? "#FFFFFF" : "#111111",
                                            border: "1.5px solid var(--primary)",
                                            padding: "4px 6px",
                                            boxShadow: "1.5px 1.5px 0px var(--primary)",
                                          }}
                                        >
                                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2px" }}>
                                            <span style={{ fontSize: "0.66rem", fontWeight: 900 }}>
                                              🎙️ {sp.title}
                                            </span>
                                            {sp.isLiveRightNow && (
                                              <span style={{ fontSize: "0.46rem", fontWeight: 900, backgroundColor: "white", color: "#BA1A1A", padding: "0 3px" }}>
                                                ONLINE
                                              </span>
                                            )}
                                          </div>
                                          <div style={{ fontSize: "0.54rem", fontWeight: "bold", opacity: 0.9 }}>
                                            {sp.timeText} ({sp.host})
                                          </div>
                                          <div style={{ fontSize: "0.5rem", opacity: 0.8, fontStyle: "italic" }}>
                                            {sp.genre}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    /* DEFAULT MUSIC BLOCK WITH PROMINENT GENRES AND SMALLER BLOCK TITLE */
                                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                      {/* Smaller Block Name + Energy Tag */}
                                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "3px" }}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                          <span
                                            className="schedule-block-title"
                                            style={{
                                              fontSize: "0.54rem",
                                              fontWeight: 900,
                                              textTransform: "uppercase",
                                              lineHeight: "0.7rem",
                                            }}
                                          >
                                            {block.name.split("/")[0]}
                                          </span>
                                          {block.name.includes("/") && (
                                            <span
                                              className="schedule-block-title"
                                              style={{
                                                fontSize: "0.46rem",
                                                fontWeight: 700,
                                                opacity: 0.9,
                                              }}
                                            >
                                              {block.name.split("/")[1]}
                                            </span>
                                          )}
                                        </div>

                                        <span
                                          style={{
                                            backgroundColor: energy.bg,
                                            color: energy.color,
                                            border: "1px solid var(--primary)",
                                            fontSize: "0.48rem",
                                            fontWeight: 900,
                                            padding: "1px 3px",
                                            whiteSpace: "nowrap",
                                            flexShrink: 0,
                                          }}
                                        >
                                          {block.energyLevel}
                                        </span>
                                      </div>

                                      {/* Larger, Prominent Genres Badges */}
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                                        {block.genres.slice(0, 2).map((g, gIdx) => (
                                          <span
                                            key={gIdx}
                                            style={{
                                              fontSize: "0.70rem",
                                              fontWeight: 900,
                                              backgroundColor: "var(--surface-container)",
                                              border: "1.5px solid var(--primary)",
                                              padding: "2px 5px",
                                              boxShadow: "1px 1px 0px var(--primary)",
                                              lineHeight: "0.85rem",
                                            }}
                                          >
                                            {g}
                                          </span>
                                        ))}
                                        {block.genres.length > 2 && (
                                          <span style={{ fontSize: "0.58rem", fontWeight: 900, opacity: 0.85, alignSelf: "center" }}>
                                            +{block.genres.length - 2}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* 4. LIST / DETAILED VIEW (EQUAL TO SEMANAL DATA + SPECIAL SHOWS + HOURLY SECTIONS) */
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {filteredBlocks.map((block) => {
                  const isNow = isBlockActiveNow(block);
                  const energy = getEnergyBadge(block.energyLevel);
                  const hourlyItems = getHourlyBreakdown(block.id, selectedDayFilter);

                  const daySpecialPrograms = selectedDayFilter !== "all"
                    ? getSpecialProgramsForSlot(block.id, selectedDayFilter)
                    : null;

                  return (
                    <div
                      key={block.id}
                      className="neo-card"
                      style={{
                        backgroundColor: isNow ? "rgba(204, 255, 0, 0.06)" : "var(--card-bg)",
                        border: "3px solid var(--primary)",
                        boxShadow: isNow ? "5px 5px 0px var(--primary)" : "3px 3px 0px var(--primary)",
                        padding: "16px 18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      {/* Top Header of Block with Days and Hours Badges */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: "10px",
                          borderBottom: "2px solid var(--primary)",
                          paddingBottom: "12px",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {/* Badges: Time + Days */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span
                              style={{
                                backgroundColor: "var(--primary)",
                                color: "var(--on-primary)",
                                fontFamily: "monospace",
                                fontSize: "0.82rem",
                                fontWeight: 900,
                                padding: "4px 9px",
                                letterSpacing: "0.5px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <Clock size={13} /> {block.timeSlot}
                            </span>

                            <span
                              style={{
                                backgroundColor: "#FFDE82",
                                color: "#111111",
                                border: "1.5px solid var(--primary)",
                                padding: "3px 8px",
                                fontSize: "0.68rem",
                                fontWeight: 900,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Calendar size={12} />
                              {selectedDayFilter === "all"
                                ? "LUNES A DOMINGO (7 DÍAS)"
                                : `DÍA: ${DAYS_OF_WEEK.find((d) => d.id === selectedDayFilter)?.label.toUpperCase()}`}
                            </span>

                            {isNow && (
                              <span
                                style={{
                                  backgroundColor: "#BA1A1A",
                                  color: "#FFF",
                                  padding: "3px 8px",
                                  fontSize: "0.65rem",
                                  fontWeight: 900,
                                  border: "1.5px solid var(--primary)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                ● AL AIRE AHORA
                              </span>
                            )}
                          </div>

                          <h3
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: 900,
                              textTransform: "uppercase",
                              margin: "4px 0 0 0",
                              color: "var(--primary)",
                            }}
                          >
                            {block.name}
                          </h3>
                          {block.subtitle && (
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.85 }}>
                              {block.subtitle}
                            </span>
                          )}
                        </div>

                        {/* Energy Level Badge */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span
                            style={{
                              backgroundColor: energy.bg,
                              color: energy.color,
                              border: "1.5px solid var(--primary)",
                              padding: "4px 9px",
                              fontSize: "0.68rem",
                              fontWeight: 900,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            {energy.icon}
                            {block.energyLevel} ({block.bpmInfo})
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: "0.78rem", fontWeight: "bold", opacity: 0.85, margin: 0 }}>
                        {block.energyDescription}
                      </p>

                      {/* HOURLY BREAKDOWN LIST WITH DAYS & HOURS */}
                      {hourlyItems.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            backgroundColor: "var(--surface-container)",
                            border: "2px solid var(--primary)",
                            padding: "12px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                            <span style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", color: "var(--primary)" }}>
                              🎶 SECCIONES MUSICALES &amp; PROGRAMACIÓN HORA POR HORA:
                            </span>
                            <span style={{ fontSize: "0.62rem", fontWeight: 800, opacity: 0.75 }}>
                              HORAS Y DÍAS DETALLADOS
                            </span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "8px" }}>
                            {hourlyItems.map((item, hIdx) => (
                              <div
                                key={hIdx}
                                style={{
                                  backgroundColor: item.isSpecialShow ? "#FFDE82" : "var(--card-bg)",
                                  border: item.isSpecialShow ? "2px solid #BA1A1A" : "1.5px solid var(--primary)",
                                  boxShadow: item.isSpecialShow ? "2.5px 2.5px 0px #BA1A1A" : "1.5px 1.5px 0px var(--primary)",
                                  padding: "8px 10px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                                  {/* Time */}
                                  <span
                                    style={{
                                      backgroundColor: item.isSpecialShow ? "#BA1A1A" : "var(--primary)",
                                      color: "white",
                                      fontFamily: "monospace",
                                      fontSize: "0.68rem",
                                      fontWeight: 900,
                                      padding: "2px 6px",
                                    }}
                                  >
                                    ⏰ {item.timeText}
                                  </span>

                                  {/* Days badge */}
                                  <span
                                    style={{
                                      backgroundColor: item.isSpecialShow ? "#BA1A1A" : "var(--primary-container)",
                                      color: item.isSpecialShow ? "white" : "var(--primary)",
                                      fontSize: "0.6rem",
                                      fontWeight: 900,
                                      padding: "1px 5px",
                                      border: "1px solid var(--primary)",
                                    }}
                                  >
                                    📅 {item.daysText}
                                  </span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                                  <h4 style={{ fontSize: "0.82rem", fontWeight: 900, margin: 0, color: "var(--primary)" }}>
                                    {item.title}
                                  </h4>
                                  {item.badgeText && (
                                    <span
                                      style={{
                                        backgroundColor: item.isSpecialShow ? "#111" : "var(--primary)",
                                        color: "white",
                                        fontSize: "0.52rem",
                                        fontWeight: 900,
                                        padding: "1px 4px",
                                      }}
                                    >
                                      {item.badgeText}
                                    </span>
                                  )}
                                </div>

                                {item.host && (
                                  <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#BA1A1A" }}>
                                    👤 Conducción: {item.host}
                                  </div>
                                )}

                                <p style={{ fontSize: "0.68rem", opacity: 0.85, margin: 0, lineHeight: "0.95rem" }}>
                                  {item.description}
                                </p>

                                <div style={{ fontSize: "0.62rem", fontWeight: 700, opacity: 0.8, fontStyle: "italic", marginTop: "2px" }}>
                                  🎵 Géneros: {item.genres}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Special Programs in this slot (if single day selected) */}
                      {daySpecialPrograms && daySpecialPrograms.length > 0 && (
                        <div
                          style={{
                            borderTop: "2px dashed var(--primary)",
                            paddingTop: "10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <span style={{ fontSize: "0.68rem", fontWeight: 900, color: "#BA1A1A" }}>
                            🎙️ PROGRAMAS EN VIVO EN ESTE HORARIO ({DAYS_OF_WEEK.find((d) => d.id === selectedDayFilter)?.label}):
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "8px" }}>
                            {daySpecialPrograms.map((sp) => (
                              <div
                                key={sp.id}
                                style={{
                                  backgroundColor: sp.isLiveRightNow ? "#BA1A1A" : "#FFDE82",
                                  color: sp.isLiveRightNow ? "#FFFFFF" : "#111111",
                                  border: "2px solid var(--primary)",
                                  padding: "8px 10px",
                                  boxShadow: "2px 2px 0px var(--primary)",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <span style={{ fontSize: "0.78rem", fontWeight: 900 }}>🎙️ {sp.title}</span>
                                  {sp.isLiveRightNow && (
                                    <span style={{ fontSize: "0.5rem", fontWeight: 900, backgroundColor: "#FFF", color: "#BA1A1A", padding: "1px 4px" }}>
                                      ONLINE
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: "0.65rem", fontWeight: "bold", marginTop: "2px" }}>
                                  ⏰ {sp.timeText} • 👤 Conductor: {sp.host}
                                </div>
                                <div style={{ fontSize: "0.6rem", opacity: 0.85, fontStyle: "italic", marginTop: "2px" }}>
                                  Estilo: {sp.genre}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* AVISO LEGAL & DISCLAIMER */}
            <div
              className="neo-card"
              style={{
                marginTop: "20px",
                backgroundColor: "var(--card-bg)",
                border: "2.5px solid var(--primary)",
                boxShadow: "4px 4px 0px var(--primary)",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
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
                <strong>Radio Doble C</strong> es una plataforma de difusión cultural independiente y comunitaria. Todos los derechos de autor, máster y marcas registradas pertenecen a sus respectivos autores, intérpretes y sellos. Si eres titular de derechos y requieres acreditación o retiro de algún contenido, contáctanos a:{" "}
                <a
                  href="mailto:radiodoblechseo@gmail.com?subject=Consulta%20de%20Derechos%20-%20Radio%20Doble%20C"
                  style={{ color: "var(--primary)", fontWeight: 900, textDecoration: "underline" }}
                >
                  radiodoblechseo@gmail.com
                </a>.
              </p>
            </div>
          </div>
        </ZineBackgroundFrame>
      </div>

      {/* PERSISTENT FOOTER PLAYER */}
      <SpotifyPlayerBar
        isChatOpen={isChatSidebarOpen}
        onToggleChat={() => setChatSidebarOpen(!isChatSidebarOpen)}
        onExpand={() => setPlayerExpanded(true)}
      />

      {/* CHAT SIDEBAR DRAWER */}
      {isChatSidebarOpen && (
        <ChatSidebar onClose={() => setChatSidebarOpen(false)} />
      )}

      {/* FULL SCREEN PLAYER MODAL */}
      {isPlayerExpanded && <PlayerView onClose={() => setPlayerExpanded(false)} />}

      {/* TOAST NOTIFICATION */}
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
    </main>
  );
}
