"use client";

import { Download, Loader2, Mic, Play, Scissors, Sparkles, Square } from "lucide-react";
import { formatSeconds } from "@/lib/studio/samplerConstants";

export type CutPadStemKey = "raw" | "melody" | "bass" | "vocals" | "drums";

interface CutPadWaveformCenterProps {
  padLabel: string;
  peaks: number[];
  sliceStartSec: number;
  sliceEndSec: number;
  trimStartPct: number;
  trimEndPct: number;
  isPlaying: boolean;
  playheadPct: number;
  isRecordingPad: boolean;
  isSeparating: boolean;
  sepProgress: { pct: number; stage: string } | null;
  separatedStems: Record<CutPadStemKey, AudioBuffer | null> | null;
  selectedStem: CutPadStemKey;
  hasApplyCut: boolean;
  onChangeTrimStart: (val: number) => void;
  onChangeTrimEnd: (val: number) => void;
  onRestoreOriginalCut: () => void;
  onTogglePlay: () => void;
  onToggleRecordPad: () => void;
  onDownloadWav: () => void;
  onApplyCut: () => void;
  onSeparateInstruments: () => void;
  onSelectStem: (key: CutPadStemKey) => void;
}

export function CutPadWaveformCenter({
  padLabel,
  peaks,
  sliceStartSec,
  sliceEndSec,
  trimStartPct,
  trimEndPct,
  isPlaying,
  playheadPct,
  isRecordingPad,
  isSeparating,
  sepProgress,
  separatedStems,
  selectedStem,
  hasApplyCut,
  onChangeTrimStart,
  onChangeTrimEnd,
  onRestoreOriginalCut,
  onTogglePlay,
  onToggleRecordPad,
  onDownloadWav,
  onApplyCut,
  onSeparateInstruments,
  onSelectStem,
}: CutPadWaveformCenterProps) {
  const span = Math.max(0.1, sliceEndSec - sliceStartSec);

  return (
    <div
      style={{
        backgroundColor: "#0A0B0E",
        border: "1px solid rgba(255,214,0,0.4)",
        borderRadius: "6px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "10px",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      {/* Visualizador de Onda del Pad */}
      <div
        style={{
          position: "relative",
          height: "92px",
          backgroundColor: "#06070A",
          border: "1px solid #22242C",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          gap: "2px",
          padding: "8px 6px",
          overflow: "hidden",
        }}
      >
        {peaks.map((pk, idx) => {
          const pct = (idx / peaks.length) * 100;
          const inside = pct >= trimStartPct && pct <= trimEndPct;
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                height: `${Math.max(10, Math.min(100, pk * 100))}%`,
                backgroundColor: inside ? "#FFD600" : "#3F3F46",
                opacity: inside ? 0.95 : 0.4,
                borderRadius: "1px",
              }}
            />
          );
        })}
        {isPlaying && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${playheadPct}%`,
              width: "2px",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 0 8px #FFFFFF",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* Recorte fino Start / End + Revertir */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) auto", gap: "10px", alignItems: "end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.56rem", color: "#D4D4D8", fontFamily: "monospace", minWidth: 0 }}>
          <span>
            INICIO: {formatSeconds(sliceStartSec + (trimStartPct / 100) * span)} ({Math.round(trimStartPct)}%)
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={trimStartPct}
            onChange={(e) => onChangeTrimStart(Math.max(0, Math.min(Number(e.target.value), trimEndPct - 2)))}
            style={{ accentColor: "#FFD600" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.56rem", color: "#D4D4D8", fontFamily: "monospace", minWidth: 0 }}>
          <span>
            FIN: {formatSeconds(sliceStartSec + (trimEndPct / 100) * span)} ({Math.round(trimEndPct)}%)
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={trimEndPct}
            onChange={(e) => onChangeTrimEnd(Math.min(100, Math.max(Number(e.target.value), trimStartPct + 2)))}
            style={{ accentColor: "#FFD600" }}
          />
        </label>
        <button
          type="button"
          onClick={onRestoreOriginalCut}
          style={{
            padding: "5px 8px",
            backgroundColor: "#1F222A",
            color: "#FFD600",
            border: "1px solid #FFD600",
            borderRadius: "4px",
            fontSize: "0.54rem",
            fontWeight: 900,
            fontFamily: "monospace",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          title="Revertir el recorte al rango original completo (0% - 100%)"
        >
          ↺ REVERTIR
        </button>
      </div>

      {/* Botones de Acción */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onTogglePlay}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 12px",
              backgroundColor: isPlaying ? "#D4D4D8" : "#FFD600",
              color: "#090A0D",
              border: isPlaying ? "1px solid #FFFFFF" : "1px solid #FFE866",
              borderRadius: "4px",
              boxShadow: "0 0 14px rgba(255,214,0,0.7)",
              fontSize: "0.64rem",
              fontWeight: 900,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
          >
            {isPlaying ? <Square size={11} fill="#090A0D" /> : <Play size={11} fill="#090A0D" />}
            <span>{isPlaying ? "DETENER" : "ESCUCHAR"}</span>
          </button>

          <button
            type="button"
            onClick={onToggleRecordPad}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 10px",
              backgroundColor: isRecordingPad ? "#FFD600" : "#E4E4E7",
              color: "#090A0D",
              border: "1px solid #090A0D",
              borderRadius: "4px",
              boxShadow: isRecordingPad ? "0 0 14px rgba(255,214,0,0.85)" : "0 2px 0 #07080A",
              fontSize: "0.60rem",
              fontWeight: 900,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
            title="Graba en vivo el audio del pad mientras mueves las perillas de Pitch y Efectos (Resample)"
          >
            <Mic size={11} />
            <span>{isRecordingPad ? "■ PARAR PAD" : "● GRABAR PAD"}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadWav}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 10px",
              backgroundColor: "#E4E4E7",
              color: "#090A0D",
              border: "1px solid #090A0D",
              borderRadius: "4px",
              boxShadow: "0 2px 0 #07080A",
              fontSize: "0.60rem",
              fontWeight: 900,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
          >
            <Download size={11} />
            <span>WAV</span>
          </button>

          {hasApplyCut && (
            <button
              type="button"
              onClick={onApplyCut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                backgroundColor: separatedStems ? "var(--primary-container)" : "#E4E4E7",
                color: separatedStems ? "var(--on-primary-container)" : "#090A0D",
                border: "1.5px solid #090A0D",
                borderRadius: "4px",
                boxShadow: "0 2px 0 #07080A",
                fontSize: "0.62rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: "pointer",
              }}
              title="Guarda el instrumento seleccionado (con pitch, reversa y efectos) directamente en este pad del C-Sampler"
            >
              <Scissors size={11} />
              <span>{separatedStems ? "GUARDAR STEM EN PAD" : "GUARDAR EN PAD"}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={isSeparating}
          onClick={onSeparateInstruments}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            background: "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)",
            color: "#090A0D",
            border: "1px solid #FFE866",
            borderRadius: "4px",
            boxShadow: "0 0 16px rgba(255,214,0,0.8), 0 3px 0 #07080A",
            fontSize: "0.64rem",
            fontWeight: 900,
            fontFamily: "monospace",
            cursor: isSeparating ? "wait" : "pointer",
          }}
        >
          {isSeparating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          <span>
            {isSeparating
              ? `SEPARANDO ${sepProgress?.pct ?? 0}%`
              : separatedStems
              ? "RE-SEPARAR 4 STEMS"
              : "SEPARAR 4 INSTRUMENTOS"}
          </span>
        </button>
      </div>

      {/* Selector de los 4 Stems separados */}
      {separatedStems && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            padding: "8px 10px",
            backgroundColor: "#14161B",
            border: "1.5px solid #FFD600",
            borderRadius: "5px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
            <span style={{ fontSize: "0.56rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "1px" }}>
              ELIGE EL INSTRUMENTO PARA INSERTAR EN {padLabel}:
            </span>
            <span style={{ fontSize: "0.52rem", color: "#A1A1AA", fontFamily: "monospace" }}>
              Escucha y pulsa GUARDAR STEM EN PAD
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "5px" }}>
            {(
              [
                { key: "melody", label: "MELODÍA" },
                { key: "bass", label: "BAJO" },
                { key: "vocals", label: "VOZ" },
                { key: "drums", label: "BATERÍA" },
                { key: "raw", label: "ORIGINAL" },
              ] as const
            ).map((item) => {
              const isActive = selectedStem === item.key;
              const available = Boolean(separatedStems[item.key]);
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={!available}
                  onClick={() => onSelectStem(item.key)}
                  style={{
                    padding: "6px 4px",
                    backgroundColor: isActive ? "#FFD600" : "#1F222A",
                    color: isActive ? "#090A0D" : available ? "#F4F4F5" : "#52525B",
                    border: isActive ? "1.5px solid #FFFFFF" : "1px solid #3F3F46",
                    borderRadius: "4px",
                    fontSize: "0.58rem",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    cursor: available ? "pointer" : "not-allowed",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sepProgress && (
        <div style={{ fontSize: "0.56rem", color: "#FFD600", fontFamily: "monospace", textAlign: "center" }}>
          {sepProgress.stage}
        </div>
      )}
    </div>
  );
}
