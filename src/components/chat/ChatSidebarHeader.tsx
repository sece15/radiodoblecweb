"use client";

import { User } from "lucide-react";

interface ChatSidebarHeaderProps {
  isStreamerLive: boolean;
  isChatConnected: boolean;
  activeChatUsers: number;
  hasModPrivileges: boolean;
  isModPanelVisible: boolean;
  onToggleModPanel: () => void;
  onClose: () => void;
}

export function ChatSidebarHeader({
  isStreamerLive,
  isChatConnected,
  activeChatUsers,
  hasModPrivileges,
  isModPanelVisible,
  onToggleModPanel,
  onClose,
}: ChatSidebarHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "4px solid var(--primary)",
        backgroundColor: "var(--background)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
        <div
          style={{
            width: "8px",
            height: "8px",
            backgroundColor: "#BA1A1A",
            borderRadius: "50%",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: "0.8rem", fontWeight: 900, textTransform: "uppercase" }}>
          CHAT EN VIVO
        </span>
        {isStreamerLive && (
          <div
            title={
              isChatConnected
                ? `${activeChatUsers} usuario${activeChatUsers === 1 ? "" : "s"} en línea`
                : "Chat desconectado"
            }
            style={{
              backgroundColor: "var(--primary)",
              padding: "2px 7px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.62rem",
              color: "var(--on-primary)",
              fontWeight: 900,
              borderRadius: "2px",
              transition: "transform 0.2s ease",
              flexShrink: 0,
            }}
          >
            <User size={10} style={{ color: "var(--on-primary)", fill: "var(--on-primary)" }} />
            <span>{activeChatUsers}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
        {hasModPrivileges && (
          <button
            onClick={onToggleModPanel}
            style={{
              backgroundColor: "var(--primary-container)",
              color: "var(--on-primary-container)",
              border: "1.5px solid var(--primary)",
              padding: "4px 8px",
              fontSize: "0.6rem",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            🛡️ {isModPanelVisible ? "OCULTAR MOD" : "MOD"}
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--on-primary)",
            border: "1.5px solid var(--primary)",
            padding: "4px 8px",
            fontSize: "0.6rem",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
