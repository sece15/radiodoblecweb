"use client";

import { Download, Volume2 } from "lucide-react";

export type MasterStemKey = "raw" | "drums" | "bass" | "melody" | "vocals";

export interface MasterChannelState {
  gain: number;
  muted: boolean;
  solo: boolean;
}

export interface MasterChannelMeta {
  key: MasterStemKey;
  label: string;
  icon: string;
  accent: string;
}

interface MasterStemChannelsProps {
  channelMeta: MasterChannelMeta[];
  channelState: Record<MasterStemKey, MasterChannelState>;
  channels: Record<MasterStemKey, AudioBuffer | null>;
  masterVol: number;
  auditioningKey: MasterStemKey | null;
  isPlaying: boolean;
  onChangeMasterVol: (vol: number) => void;
  onAuditionChannel: (key: MasterStemKey) => void;
  onToggleMute: (key: MasterStemKey) => void;
  onToggleSolo: (key: MasterStemKey) => void;
  onChangeGain: (key: MasterStemKey, gain: number) => void;
  onExportSingleStem: (key: MasterStemKey) => void;
}

export function MasterStemChannels({
  channelMeta,
  channelState,
  channels,
  masterVol,
  auditioningKey,
  isPlaying,
  onChangeMasterVol,
  onAuditionChannel,
  onToggleMute,
  onToggleSolo,
  onChangeGain,
  onExportSingleStem,
}: MasterStemChannelsProps) {
  return (
    <div
      style={{
        backgroundColor: "#0A0B0E",
        border: "1px solid rgba(255,214,0,0.4)",
        borderRadius: "6px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "0.62rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "1.2px" }}>
          1. CANALES SEPARADOS DEL CORTE (EXPORTA O MEZCLA CADA INSTRUMENTO)
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Volume2 size={12} color="#FFD600" />
          <span style={{ fontSize: "0.58rem", color: "#D4D4D8", fontFamily: "monospace" }}>
            MASTER {Math.round(masterVol * 100)}%
          </span>
          <input
            type="range"
            min={0}
            max={120}
            value={Math.round(masterVol * 100)}
            onChange={(e) => onChangeMasterVol(Number(e.target.value) / 100)}
            style={{ width: "80px", accentColor: "#FFD600" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "8px" }}>
        {channelMeta.map((ch) => {
          const st = channelState[ch.key];
          const hasBuf = Boolean(channels[ch.key]);
          const isAuditioning = auditioningKey === ch.key && isPlaying;
          return (
            <div
              key={ch.key}
              style={{
                backgroundColor: "#141519",
                border: st.solo ? "1.5px solid #FFD600" : "1px solid #262830",
                borderRadius: "5px",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                opacity: hasBuf ? 1 : 0.45,
                minWidth: 0,
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px", minWidth: 0 }}>
                <span style={{ fontSize: "0.60rem", fontWeight: 900, color: ch.accent, fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                  {ch.icon} {ch.label}
                </span>
                <button
                  type="button"
                  disabled={!hasBuf}
                  onClick={() => onAuditionChannel(ch.key)}
                  style={{
                    padding: "2px 6px",
                    backgroundColor: isAuditioning ? "#FFD600" : "#E4E4E7",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "3px",
                    fontSize: "0.55rem",
                    fontWeight: 900,
                    cursor: hasBuf ? "pointer" : "not-allowed",
                    boxShadow: isAuditioning ? "0 0 8px rgba(255,214,0,0.75)" : "none",
                    flexShrink: 0,
                  }}
                  title={isAuditioning ? `Pausar / detener ${ch.label}` : `Escuchar solo ${ch.label}`}
                >
                  {isAuditioning ? "⏸" : "▶"}
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  type="button"
                  disabled={!hasBuf}
                  onClick={() => onToggleMute(ch.key)}
                  style={{
                    flex: 1,
                    padding: "2px 0",
                    fontSize: "0.56rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    backgroundColor: st.muted ? "#52525B" : "#E4E4E7",
                    color: st.muted ? "#FFFFFF" : "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "3px",
                    cursor: hasBuf ? "pointer" : "not-allowed",
                  }}
                >
                  M
                </button>
                <button
                  type="button"
                  disabled={!hasBuf}
                  onClick={() => onToggleSolo(ch.key)}
                  style={{
                    flex: 1,
                    padding: "2px 0",
                    fontSize: "0.56rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    backgroundColor: st.solo ? "#FFD600" : "#E4E4E7",
                    color: "#090A0D",
                    border: "1px solid #090A0D",
                    borderRadius: "3px",
                    cursor: hasBuf ? "pointer" : "not-allowed",
                  }}
                >
                  S
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <input
                  type="range"
                  min={0}
                  max={120}
                  disabled={!hasBuf}
                  value={Math.round(st.gain * 100)}
                  onChange={(e) => onChangeGain(ch.key, Number(e.target.value) / 100)}
                  style={{ width: "100%", accentColor: "#FFD600" }}
                />
                <span style={{ fontSize: "0.52rem", color: "#A1A1AA", fontFamily: "monospace", textAlign: "center" }}>
                  {Math.round(st.gain * 100)}%
                </span>
              </div>

              <button
                type="button"
                disabled={!hasBuf}
                onClick={() => onExportSingleStem(ch.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  padding: "3px 6px",
                  backgroundColor: "#E4E4E7",
                  color: "#090A0D",
                  border: "1px solid #090A0D",
                  borderRadius: "3px",
                  boxShadow: "0 2px 0 #07080A",
                  fontSize: "0.55rem",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  cursor: hasBuf ? "pointer" : "not-allowed",
                }}
              >
                <Download size={10} />
                <span>WAV</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
