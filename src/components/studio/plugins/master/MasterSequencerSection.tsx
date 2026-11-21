"use client";

import type { MutableRefObject } from "react";
import { FolderOpen, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import type { DrumRowKey, SavedDrumKit } from "@/lib/studio/drumKitStorage";
import {
  BASS_NOTES,
  DRUM_ROWS,
  PRESET_PATTERNS,
  type CustomDrumSampleMap,
  type DrumAssetOption,
} from "@/lib/studio/masterSynth";

interface MasterSequencerSectionProps {
  beatEnabled: boolean;
  sidechainPump: boolean;
  selectedKitId: string;
  savedKits: SavedDrumKit[];
  isSavingKit: boolean;
  kitNameInput: string;
  bassFreq: number;
  pattern: Record<DrumRowKey, boolean[]>;
  currentStep: number;
  customDrumSamples: CustomDrumSampleMap;
  factoryDrumAssets: Partial<Record<DrumRowKey, DrumAssetOption[]>>;
  drumMuted: Record<DrumRowKey, boolean>;
  drumVolumes: Record<DrumRowKey, number>;
  dragOverRow: DrumRowKey | null;
  fileInputRefs: MutableRefObject<Partial<Record<DrumRowKey, HTMLInputElement | null>>>;
  onToggleBeatEnabled: () => void;
  onToggleSidechainPump: () => void;
  onLoadDefaultFactoryKit: () => void;
  onSelectSavedKit: (kitId: string) => void;
  onDeleteSavedKit: () => void;
  onChangeSavingKit: (v: boolean) => void;
  onChangeKitNameInput: (v: string) => void;
  onSaveCurrentKit: () => void;
  onChangeBassFreq: (freq: number) => void;
  onApplyPatternPreset: (presetId: "boombap" | "trap" | "house" | "empty") => void;
  onChangeDragOverRow: (row: DrumRowKey | null) => void;
  onUploadDrumSample: (row: DrumRowKey, file: File) => void;
  onPreviewDrumRow: (row: DrumRowKey) => void;
  onToggleDrumMute: (row: DrumRowKey) => void;
  onChangeDrumVolume: (row: DrumRowKey, vol: number) => void;
  onLoadFactoryAsset: (row: DrumRowKey, asset: DrumAssetOption) => void;
  onClearDrumSample: (row: DrumRowKey) => void;
  onToggleStep: (row: DrumRowKey, stepIdx: number) => void;
}

export function MasterSequencerSection({
  beatEnabled,
  sidechainPump,
  selectedKitId,
  savedKits,
  isSavingKit,
  kitNameInput,
  bassFreq,
  pattern,
  currentStep,
  customDrumSamples,
  factoryDrumAssets,
  drumMuted,
  drumVolumes,
  dragOverRow,
  fileInputRefs,
  onToggleBeatEnabled,
  onToggleSidechainPump,
  onLoadDefaultFactoryKit,
  onSelectSavedKit,
  onDeleteSavedKit,
  onChangeSavingKit,
  onChangeKitNameInput,
  onSaveCurrentKit,
  onChangeBassFreq,
  onApplyPatternPreset,
  onChangeDragOverRow,
  onUploadDrumSample,
  onPreviewDrumRow,
  onToggleDrumMute,
  onChangeDrumVolume,
  onLoadFactoryAsset,
  onClearDrumSample,
  onToggleStep,
}: MasterSequencerSectionProps) {
  void PRESET_PATTERNS;

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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.62rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", letterSpacing: "1.2px" }}>
            2. FL BEAT RACK (BATERÍA Y BAJO SOBRE TU SAMPLE)
          </span>
          <button
            type="button"
            onClick={onToggleBeatEnabled}
            style={{
              padding: "2px 7px",
              backgroundColor: beatEnabled ? "#FFD600" : "#262830",
              color: beatEnabled ? "#090A0D" : "#D4D4D8",
              border: "1px solid #090A0D",
              borderRadius: "3px",
              fontSize: "0.55rem",
              fontWeight: 900,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
          >
            BEAT {beatEnabled ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={onToggleSidechainPump}
            style={{
              padding: "2px 7px",
              backgroundColor: sidechainPump ? "#FFD600" : "#262830",
              color: sidechainPump ? "#090A0D" : "#D4D4D8",
              border: "1px solid #090A0D",
              borderRadius: "3px",
              fontSize: "0.55rem",
              fontWeight: 900,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
            title="Sidechain Ducking: baja suavemente el sample cada vez que golpea el Kick"
          >
            PUMP {sidechainPump ? "ON" : "OFF"}
          </button>
        </div>

        {/* Barra MIS KITS */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onLoadDefaultFactoryKit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              padding: "2px 7px",
              backgroundColor: "#262830",
              color: "#86EFAC",
              border: "1px solid rgba(134,239,172,0.45)",
              borderRadius: "3px",
              fontSize: "0.54rem",
              fontWeight: 900,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
            title="Cargar el kit predeterminado desde /assets/drumkits/"
          >
            <Sparkles size={10} />
            <span>KIT ASSETS</span>
          </button>
          <select
            value={selectedKitId}
            onChange={(e) => onSelectSavedKit(e.target.value)}
            style={{
              backgroundColor: "#141519",
              color: "#E4E4E7",
              border: "1px solid #3A3D48",
              borderRadius: "3px",
              padding: "2px 6px",
              fontSize: "0.55rem",
              fontWeight: 700,
              fontFamily: "monospace",
              maxWidth: "150px",
            }}
            title="Cargar un Kit guardado en esta sesión"
          >
            <option value="">MIS KITS ({savedKits.length})</option>
            {savedKits.map((kit) => (
              <option key={kit.id} value={kit.id}>
                {kit.name}
              </option>
            ))}
          </select>

          {selectedKitId && (
            <button
              type="button"
              onClick={onDeleteSavedKit}
              style={{
                padding: "2px 5px",
                backgroundColor: "#262830",
                color: "#F87171",
                border: "1px solid #3A3D48",
                borderRadius: "3px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title="Eliminar este kit guardado"
            >
              <Trash2 size={10} />
            </button>
          )}

          {isSavingKit ? (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <input
                type="text"
                value={kitNameInput}
                onChange={(e) => onChangeKitNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveCurrentKit();
                  if (e.key === "Escape") onChangeSavingKit(false);
                }}
                placeholder="Nombre del kit..."
                autoFocus
                style={{
                  width: "120px",
                  backgroundColor: "#141519",
                  color: "#FFFFFF",
                  border: "1px solid #FFD600",
                  borderRadius: "3px",
                  padding: "2px 6px",
                  fontSize: "0.55rem",
                  fontFamily: "monospace",
                }}
              />
              <button
                type="button"
                onClick={onSaveCurrentKit}
                style={{
                  padding: "2px 7px",
                  backgroundColor: "#FFD600",
                  color: "#090A0D",
                  border: "1px solid #090A0D",
                  borderRadius: "3px",
                  fontSize: "0.54rem",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => onChangeSavingKit(false)}
                style={{
                  padding: "2px 5px",
                  backgroundColor: "#262830",
                  color: "#D4D4D8",
                  border: "1px solid #3A3D48",
                  borderRadius: "3px",
                  fontSize: "0.54rem",
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onChangeSavingKit(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 7px",
                backgroundColor: "#262830",
                color: "#FFD600",
                border: "1px solid rgba(255,214,0,0.5)",
                borderRadius: "3px",
                fontSize: "0.54rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: "pointer",
              }}
              title="Guardar tus sonidos cargados y patrón actual como un Kit en tu sesión"
            >
              <Save size={10} />
              <span>GUARDAR KIT</span>
            </button>
          )}
        </div>

        {/* Nota 808 + Presets */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.54rem", color: "#A1A1AA", fontFamily: "monospace" }}>NOTA 808:</span>
          <select
            value={bassFreq}
            onChange={(e) => onChangeBassFreq(Number(e.target.value))}
            style={{
              backgroundColor: "#141519",
              color: "#FFD600",
              border: "1px solid #3A3D48",
              borderRadius: "3px",
              padding: "2px 4px",
              fontSize: "0.58rem",
              fontWeight: 900,
              fontFamily: "monospace",
            }}
          >
            {BASS_NOTES.map((n) => (
              <option key={n.label} value={n.freq}>
                {n.label}
              </option>
            ))}
          </select>

          {(
            [
              { id: "boombap", label: "BOOM BAP" },
              { id: "trap", label: "TRAP 808" },
              { id: "house", label: "4x4" },
              { id: "empty", label: "LIMPIAR" },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPatternPreset(preset.id)}
              style={{
                padding: "2px 7px",
                backgroundColor: "#E4E4E7",
                color: "#090A0D",
                border: "1px solid #090A0D",
                borderRadius: "3px",
                boxShadow: "0 2px 0 #07080A",
                fontSize: "0.54rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              {preset.id === "empty" ? <RotateCcw size={9} /> : <Sparkles size={9} />}
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5 Filas de 16 Pasos */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {DRUM_ROWS.map((row) => {
          const customSample = customDrumSamples[row.key];
          const isDragOver = dragOverRow === row.key;
          const rowAssets = factoryDrumAssets[row.key] || [];
          const matchedAsset = customSample
            ? rowAssets.find((a) => a.name === customSample.name)?.name || ""
            : "";

          return (
            <div
              key={row.key}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverRow !== row.key) onChangeDragOverRow(row.key);
              }}
              onDragLeave={() => {
                if (dragOverRow === row.key) onChangeDragOverRow(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                onChangeDragOverRow(null);
                const file = e.dataTransfer.files?.[0];
                if (file) onUploadDrumSample(row.key, file);
              }}
              style={{
                display: "grid",
                gridTemplateColumns: "250px minmax(0, 1fr)",
                alignItems: "center",
                gap: "8px",
                backgroundColor: isDragOver ? "#1F2117" : "#141519",
                border: isDragOver ? "1px dashed #FFD600" : "1px solid #22242C",
                borderRadius: "4px",
                padding: "4px 8px",
                transition: "border-color 0.12s, background-color 0.12s",
              }}
            >
              <input
                ref={(el) => {
                  fileInputRefs.current[row.key] = el;
                }}
                type="file"
                accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadDrumSample(row.key, file);
                  e.target.value = "";
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
                    <button
                      type="button"
                      onClick={() => onPreviewDrumRow(row.key)}
                      style={{
                        padding: "1px 4px",
                        backgroundColor: "#262830",
                        color: "#FFD600",
                        border: "1px solid #3A3D48",
                        borderRadius: "2px",
                        fontSize: "0.50rem",
                        cursor: "pointer",
                      }}
                      title={`Escuchar ${row.label}`}
                    >
                      ▶
                    </button>
                    <span style={{ fontSize: "0.56rem", fontWeight: 900, color: "#FFD600", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                      {row.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[row.key]?.click()}
                      style={{
                        padding: "1px 5px",
                        fontSize: "0.50rem",
                        fontWeight: 900,
                        backgroundColor: customSample ? "#FFD600" : "#262830",
                        color: customSample ? "#090A0D" : "#E4E4E7",
                        border: "1px solid #3A3D48",
                        borderRadius: "2px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                      }}
                      title={`Cargar o arrastrar WAV/MP3 propio para ${row.label}`}
                    >
                      <FolderOpen size={9} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleDrumMute(row.key)}
                      style={{
                        padding: "1px 4px",
                        fontSize: "0.50rem",
                        fontWeight: 900,
                        backgroundColor: drumMuted[row.key] ? "#52525B" : "#E4E4E7",
                        color: drumMuted[row.key] ? "#FFFFFF" : "#090A0D",
                        border: "1px solid #090A0D",
                        borderRadius: "2px",
                        cursor: "pointer",
                      }}
                    >
                      M
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(drumVolumes[row.key] * 100)}
                      onChange={(e) => onChangeDrumVolume(row.key, Number(e.target.value) / 100)}
                      style={{ width: "42px", accentColor: "#FFD600" }}
                    />
                  </div>
                </div>

                {(customSample || rowAssets.length > 0) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
                    {rowAssets.length > 0 && (
                      <select
                        value={matchedAsset}
                        onChange={(e) => {
                          const selected = rowAssets.find((a) => a.name === e.target.value);
                          if (selected) onLoadFactoryAsset(row.key, selected);
                        }}
                        style={{
                          flex: customSample ? "0 0 92px" : 1,
                          backgroundColor: "#0D0E12",
                          color: matchedAsset ? "#86EFAC" : "#D4D4D8",
                          border: "1px solid #2F323D",
                          borderRadius: "2px",
                          padding: "1px 3px",
                          fontSize: "0.49rem",
                          fontFamily: "monospace",
                          maxWidth: customSample ? "92px" : "100%",
                        }}
                        title={`Sonidos predeterminados en /assets/drumkits/${row.key}/`}
                      >
                        <option value="">Assets ({rowAssets.length})</option>
                        {rowAssets.map((asset) => (
                          <option key={asset.name} value={asset.name}>
                            {asset.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {customSample && (
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "4px",
                          backgroundColor: "rgba(34,197,94,0.12)",
                          border: "1px solid rgba(34,197,94,0.35)",
                          borderRadius: "2px",
                          padding: "1px 5px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.49rem",
                            color: "#86EFAC",
                            fontFamily: "monospace",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            minWidth: 0,
                          }}
                          title={customSample.name}
                        >
                          {customSample.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => onClearDrumSample(row.key)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#FCA5A5",
                            fontSize: "0.52rem",
                            fontWeight: 900,
                            cursor: "pointer",
                            padding: 0,
                            lineHeight: 1,
                            flexShrink: 0,
                          }}
                          title="Quitar sample y volver al sonido sintetizado"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(16, minmax(0, 1fr))", gap: "4px" }}>
                {pattern[row.key].map((active, stepIdx) => {
                  const isBeatGroup = Math.floor(stepIdx / 4) % 2 === 1;
                  const isCurrent = currentStep === stepIdx;
                  return (
                    <button
                      key={stepIdx}
                      type="button"
                      onClick={() => onToggleStep(row.key, stepIdx)}
                      style={{
                        height: "22px",
                        borderRadius: "3px",
                        border: isCurrent ? "1.5px solid #FFFFFF" : "1px solid #090A0D",
                        backgroundColor: active
                          ? "#FFD600"
                          : isBeatGroup
                          ? "#262830"
                          : "#1B1D24",
                        boxShadow: active
                          ? isCurrent
                            ? "0 0 10px #FFD600"
                            : "inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 0 #07080A"
                          : "inset 0 1px 2px rgba(0,0,0,0.6)",
                        cursor: "pointer",
                      }}
                      title={`${row.label} · Paso ${stepIdx + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
