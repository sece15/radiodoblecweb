"use client";

import {
  AlertTriangle,
  Check,
  ListMusic,
  Loader2,
  Mic,
  Radio,
  Search,
  SkipForward,
  Upload,
} from "lucide-react";
import { useModalDimensions } from "@/hooks/useModalDimensions";
import type { AdminPlayerTab } from "@/store/useAdminRadioStore";

interface AdminPlayerTopSectionProps {
  liveShowName: string;
  liveTrackTitle: string;
  isSkipping: boolean;
  activeBanner: { type: "success" | "error"; text: string } | null;
  activeTab: AdminPlayerTab;
  queueCount: number;
  onSkipNext: () => void;
  onChangeTab: (tab: AdminPlayerTab) => void;
}

export function AdminPlayerTopSection({
  liveShowName,
  liveTrackTitle,
  isSkipping,
  activeBanner,
  activeTab,
  queueCount,
  onSkipNext,
  onChangeTab,
}: AdminPlayerTopSectionProps) {
  const { isMobile } = useModalDimensions();

  const tabs: { id: AdminPlayerTab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: "search", label: "BUSCAR Y ENCOLAR", shortLabel: "BUSCAR", icon: <Search size={14} /> },
    { id: "upload", label: "SUBIR MP3", shortLabel: "SUBIR MP3", icon: <Upload size={14} /> },
    { id: "voice", label: "VOZ / PODCAST", shortLabel: "VOZ / POD", icon: <Mic size={14} /> },
    {
      id: "queue",
      label: `COLA EN VIVO (${queueCount})`,
      shortLabel: `COLA (${queueCount})`,
      icon: <ListMusic size={14} />,
    },
  ];

  return (
    <>
      {/* NOW PLAYING + NEXT BUTTON */}
      <div
        style={{
          backgroundColor: "var(--surface-container)",
          border: "2.5px solid var(--primary)",
          boxShadow: "4px 4px 0px var(--primary)",
          padding: isMobile ? "10px" : "10px 12px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "space-between",
          gap: isMobile ? "10px" : "12px",
          minWidth: 0,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: 0,
            flex: isMobile ? "0 0 auto" : "1 1 220px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Radio size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--on-surface-variant)",
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={`AL AIRE AHORA · ${liveShowName || "RADIO DOBLE C"}`}
            >
              AL AIRE AHORA · {liveShowName || "RADIO DOBLE C"}
            </span>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 900,
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={liveTrackTitle}
            >
              {liveTrackTitle || "RADIO DOBLE C - SEÑAL EN VIVO"}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isSkipping}
          onClick={onSkipNext}
          className="neo-button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: isMobile ? "8px 12px" : "8px 14px",
            width: isMobile ? "100%" : "auto",
            backgroundColor: "var(--primary-container)",
            color: "var(--on-primary-container)",
            border: "2px solid var(--primary)",
            boxShadow: "3px 3px 0px var(--primary)",
            fontSize: "0.74rem",
            fontWeight: 900,
            cursor: isSkipping ? "wait" : "pointer",
            flexShrink: 0,
            boxSizing: "border-box",
          }}
        >
          {isSkipping ? <Loader2 size={15} className="animate-spin" /> : <SkipForward size={15} />}
          <span>{isSkipping ? "SALTANDO..." : "NEXT / PASAR CANCIÓN"}</span>
        </button>
      </div>

      {/* STATUS / ERROR FEEDBACK BANNER */}
      {activeBanner && (
        <div
          role="status"
          style={{
            padding: "8px 12px",
            border: "2px solid var(--primary)",
            backgroundColor: activeBanner.type === "error" ? "#FEE2E2" : "var(--primary-container)",
            color: activeBanner.type === "error" ? "#991B1B" : "var(--on-primary-container)",
            fontSize: "0.74rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
          }}
        >
          {activeBanner.type === "error" ? (
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          ) : (
            <Check size={16} style={{ flexShrink: 0 }} />
          )}
          <span style={{ minWidth: 0, wordBreak: "break-word" }}>{activeBanner.text}</span>
        </div>
      )}

      {/* TAB SWITCHER (4 SECCIONES) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
          gap: isMobile ? "6px" : "8px",
          width: "100%",
          minWidth: 0,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              title={tab.label}
              style={{
                padding: isMobile ? "8px 6px" : "9px 10px",
                backgroundColor: isActive ? "var(--primary-container)" : "var(--card-bg)",
                color: isActive ? "var(--on-primary-container)" : "var(--on-background)",
                border: "2px solid var(--primary)",
                boxShadow: isActive ? "3px 3px 0px var(--primary)" : "none",
                fontSize: isMobile ? "0.66rem" : "0.72rem",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                cursor: "pointer",
                minWidth: 0,
                width: "100%",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              <span style={{ flexShrink: 0, display: "inline-flex" }}>{tab.icon}</span>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  minWidth: 0,
                }}
              >
                {isMobile ? tab.shortLabel : tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
