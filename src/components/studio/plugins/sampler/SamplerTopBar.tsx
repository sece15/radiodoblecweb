"use client";

import { Download, Plus, Scissors, Upload } from "lucide-react";
import { RotaryKnob } from "./RotaryKnob";

interface SamplerTopBarProps {
  cuesCount: number;
  isCuttingPad: boolean;
  is16Levels: boolean;
  fxFilterSweep: number;
  fxCrunch: number;
  fxMasterVol: number;
  hasCustomAudio: boolean;
  metronomeOn: boolean;
  quantizeOn: boolean;
  isRecordingPads: boolean;
  recordBars: 1 | 2 | 4;
  recordedEventsCount: number;
  isPlayingRecording: boolean;
  isRenderingRecording: boolean;
  hasSequencerTarget: boolean;
  onAddCue: () => void;
  onCutPad: () => void;
  onToggle16Levels: () => void;
  onDspKnobChange: (id: "filter" | "crunch" | "volume", v: number) => void;
  onDspKnobReset: (id: "filter" | "crunch" | "volume") => void;
  onClickUpload: () => void;
  onDownloadWav: () => void;
  onToggleMetronome: () => void;
  onToggleQuantize: () => void;
  onToggleRecordPads: () => void;
  onSelectRecordBars: (bars: 1 | 2 | 4) => void;
  onPlayRecordedMelody: () => void;
  onSendRecordedMelody: () => void;
}

export function SamplerTopBar({
  cuesCount,
  isCuttingPad,
  is16Levels,
  fxFilterSweep,
  fxCrunch,
  fxMasterVol,
  hasCustomAudio,
  metronomeOn,
  quantizeOn,
  isRecordingPads,
  recordBars,
  recordedEventsCount,
  isPlayingRecording,
  isRenderingRecording,
  hasSequencerTarget,
  onAddCue,
  onCutPad,
  onToggle16Levels,
  onDspKnobChange,
  onDspKnobReset,
  onClickUpload,
  onDownloadWav,
  onToggleMetronome,
  onToggleQuantize,
  onToggleRecordPads,
  onSelectRecordBars,
  onPlayRecordedMelody,
  onSendRecordedMelody,
}: SamplerTopBarProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: "10px", flexWrap: "wrap" }}>
        {/* Caja EFECTOS */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            backgroundColor: "#111215",
            border: "1px solid rgba(255,214,0,0.45)",
            borderRadius: "5px",
            padding: "6px 10px",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid rgba(255,214,0,0.35)",
              paddingBottom: "3px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.54rem",
                fontWeight: 900,
                color: "#FFD600",
                letterSpacing: "1.6px",
                fontFamily: "monospace",
              }}
            >
              EFECTOS
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onAddCue}
              disabled={cuesCount >= 16}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 9px",
                background: "linear-gradient(180deg, #F0F0F2 0%, #D4D4D8 100%)",
                color: "#090A0D",
                border: "1px solid #090A0D",
                borderRadius: "4px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 3px 0 #07080A",
                fontSize: "0.64rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: cuesCount >= 16 ? "not-allowed" : "pointer",
                opacity: cuesCount >= 16 ? 0.5 : 1,
              }}
              title="Agregar un nuevo Cue Point (hasta 16)"
            >
              <Plus size={11} />
              <span>CUE</span>
            </button>

            <button
              type="button"
              disabled={isCuttingPad}
              onClick={onCutPad}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 9px",
                background: "linear-gradient(180deg, #F0F0F2 0%, #D4D4D8 100%)",
                color: "#090A0D",
                border: "1px solid #090A0D",
                borderRadius: "4px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 3px 0 #07080A",
                fontSize: "0.64rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: isCuttingPad ? "wait" : "pointer",
                opacity: isCuttingPad ? 0.65 : 1,
              }}
              title="Abre el editor de corte con el tramo exacto del pad seleccionado para ajustar pitch, efectos y separar instrumentos"
            >
              <Scissors size={11} />
              <span>{isCuttingPad ? "CORTANDO..." : "CORTAR PAD"}</span>
            </button>

            <button
              type="button"
              onClick={onToggle16Levels}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 9px",
                background: is16Levels
                  ? "linear-gradient(180deg, #FFE135 0%, #FFD600 100%)"
                  : "linear-gradient(180deg, #F0F0F2 0%, #D4D4D8 100%)",
                color: "#090A0D",
                border: "1px solid #090A0D",
                borderRadius: "4px",
                fontSize: "0.64rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: "pointer",
                boxShadow: is16Levels
                  ? "inset 0 1px 0 rgba(255,255,255,0.7), 0 0 12px rgba(255, 214, 0, 0.55), 0 3px 0 #07080A"
                  : "inset 0 1px 0 rgba(255,255,255,0.9), 0 3px 0 #07080A",
                transition: "all 0.12s ease",
              }}
              title="Efecto Akai MPC 16 Levels: Mapea el chop seleccionado cromáticamente en 16 semitonos (-7st a +8st) para tocar melodías con el teclado"
            >
              <span>🎹</span>
              <span>16 LEVELS</span>
              {is16Levels && (
                <span
                  style={{
                    fontSize: "0.52rem",
                    backgroundColor: "#090A0D",
                    color: "#FFD600",
                    padding: "1px 4px",
                    borderRadius: "2px",
                    fontWeight: 900,
                  }}
                >
                  ON
                </span>
              )}
            </button>
          </div>
        </div>

        {/* DSP / MASTER (FILTER · CRUNCH · VOLUME) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "6px",
            backgroundColor: "#111215",
            border: "1px solid rgba(255,214,0,0.45)",
            borderRadius: "5px",
            padding: "6px 10px",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid rgba(255,214,0,0.35)",
              paddingBottom: "3px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.54rem",
                fontWeight: 900,
                color: "#FFD600",
                letterSpacing: "1.6px",
                fontFamily: "monospace",
              }}
            >
              DSP / MASTER
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <RotaryKnob
              label="FILTER"
              valText={fxFilterSweep === 0 ? "FLAT" : fxFilterSweep < 0 ? `LP ${fxFilterSweep}` : `HP +${fxFilterSweep}`}
              deg={(fxFilterSweep / 100) * 135}
              min={-100}
              max={100}
              value={fxFilterSweep}
              size={30}
              layout="horizontal"
              enableWheel={false}
              title="Filtro DJ Sweep (-100 LowPass / 0 Flat / +100 HighPass). Arrastra verticalmente o doble clic para resetear."
              onChange={(v) => onDspKnobChange("filter", v)}
              onReset={() => onDspKnobReset("filter")}
            />
            <RotaryKnob
              label="CRUNCH"
              valText={`${fxCrunch}%`}
              deg={(fxCrunch / 100) * 270 - 135}
              min={0}
              max={100}
              value={fxCrunch}
              size={30}
              layout="horizontal"
              enableWheel={false}
              title="Saturación 12-Bit / SP-404 Crunch (0% a 100%). Arrastra verticalmente o doble clic para resetear."
              onChange={(v) => onDspKnobChange("crunch", v)}
              onReset={() => onDspKnobReset("crunch")}
            />
            <RotaryKnob
              label="VOLUME"
              valText={`${fxMasterVol}%`}
              deg={(fxMasterVol / 120) * 270 - 135}
              min={0}
              max={120}
              value={fxMasterVol}
              size={30}
              layout="horizontal"
              enableWheel={false}
              title="Volumen Maestro del Sampler (0% a 120%). Arrastra verticalmente o doble clic para resetear."
              onChange={(v) => onDspKnobChange("volume", v)}
              onReset={() => onDspKnobReset("volume")}
            />
          </div>
        </div>
      </div>

      {/* CARGAR AUDIO, GUARDAR WAV y GRABAR alineados a la derecha */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginLeft: "auto" }}>
        <button
          type="button"
          onClick={onClickUpload}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "5px 10px",
            background: "linear-gradient(180deg, #3A3C42 0%, #23252A 100%)",
            color: "#FFD600",
            border: "1px solid #4B4E57",
            borderRadius: "4px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 3px 0 #07080A",
            fontSize: "0.62rem",
            fontWeight: 900,
            fontFamily: "monospace",
            cursor: "pointer",
          }}
        >
          <Upload size={11} />
          <span>CARGAR AUDIO</span>
        </button>

        {hasCustomAudio && (
          <button
            type="button"
            onClick={onDownloadWav}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 10px",
              background: "linear-gradient(180deg, #FFE135 0%, #FFD600 100%)",
              color: "#090A0D",
              border: "1px solid #090A0D",
              borderRadius: "4px",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 0 #07080A",
              fontSize: "0.62rem",
              fontWeight: 900,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
            title="Descarga el audio en memoria como .WAV a tu PC para reutilizarlo cuando quieras"
          >
            <Download size={11} />
            <span>GUARDAR WAV</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleMetronome}
          style={{
            padding: "5px 7px",
            background: metronomeOn
              ? "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)"
              : "linear-gradient(180deg, #2B2D33 0%, #191A1E 100%)",
            color: metronomeOn ? "#090A0D" : "#D4D4D8",
            border: "1px solid #4B4E57",
            borderRadius: "4px",
            fontSize: "0.56rem",
            fontWeight: 900,
            fontFamily: "monospace",
            cursor: "pointer",
          }}
          title="Activa o desactiva el clic del metrónomo al grabar tu melodía de pads"
        >
          METRO {metronomeOn ? "ON" : "OFF"}
        </button>

        <button
          type="button"
          onClick={onToggleQuantize}
          style={{
            padding: "5px 7px",
            background: quantizeOn
              ? "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)"
              : "linear-gradient(180deg, #2B2D33 0%, #191A1E 100%)",
            color: quantizeOn ? "#090A0D" : "#D4D4D8",
            border: "1px solid #4B4E57",
            borderRadius: "4px",
            fontSize: "0.56rem",
            fontWeight: 900,
            fontFamily: "monospace",
            cursor: "pointer",
          }}
          title="Cuantiza automáticamente tus golpes de pad a semicorcheas (1/16) según el BPM"
        >
          Q 1/16 {quantizeOn ? "ON" : "OFF"}
        </button>

        <button
          type="button"
          onClick={onToggleRecordPads}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "5px 10px",
            background: isRecordingPads
              ? "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)"
              : "linear-gradient(180deg, #F0F0F2 0%, #D4D4D8 100%)",
            color: "#090A0D",
            border: "1px solid #090A0D",
            borderRadius: "4px",
            boxShadow: isRecordingPads
              ? "0 0 14px rgba(255,214,0,0.85), 0 3px 0 #07080A"
              : "inset 0 1px 0 rgba(255,255,255,0.9), 0 3px 0 #07080A",
            fontSize: "0.62rem",
            fontWeight: 900,
            fontFamily: "monospace",
            cursor: "pointer",
          }}
          title="Graba tu melodía tocando los pads en vivo con el teclado o mouse"
        >
          <span>{isRecordingPads ? "■" : "●"}</span>
          <span>{isRecordingPads ? `PARAR (${recordedEventsCount})` : `GRABAR ${recordBars}B`}</span>
        </button>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
          {([1, 2, 4] as const).map((bars) => (
            <button
              key={bars}
              type="button"
              disabled={isRecordingPads}
              onClick={() => onSelectRecordBars(bars)}
              style={{
                padding: "4px 6px",
                backgroundColor: recordBars === bars ? "#FFD600" : "#1F222A",
                color: recordBars === bars ? "#090A0D" : "#D4D4D8",
                border: "1px solid #090A0D",
                borderRadius: "3px",
                fontSize: "0.56rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: isRecordingPads ? "not-allowed" : "pointer",
              }}
              title={`Grabar melodía de ${bars} ${bars === 1 ? "compás" : "compases"}`}
            >
              {bars}B
            </button>
          ))}
        </div>

        {recordedEventsCount > 0 && !isRecordingPads && (
          <>
            <button
              type="button"
              onClick={onPlayRecordedMelody}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 9px",
                background: isPlayingRecording
                  ? "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)"
                  : "linear-gradient(180deg, #F0F0F2 0%, #D4D4D8 100%)",
                color: "#090A0D",
                border: "1px solid #090A0D",
                borderRadius: "4px",
                boxShadow: "0 3px 0 #07080A",
                fontSize: "0.60rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: "pointer",
              }}
              title="Escucha la melodía grabada con tus pads"
            >
              <span>{isPlayingRecording ? "■" : "▶"}</span>
              <span>MELODÍA</span>
            </button>

            <button
              type="button"
              disabled={isRenderingRecording}
              onClick={onSendRecordedMelody}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 10px",
                background: "linear-gradient(180deg, #FFE855 0%, #FFD600 100%)",
                color: "#090A0D",
                border: "1px solid #FFE866",
                borderRadius: "4px",
                boxShadow: "0 0 12px rgba(255,214,0,0.7), 0 3px 0 #07080A",
                fontSize: "0.60rem",
                fontWeight: 900,
                fontFamily: "monospace",
                cursor: isRenderingRecording ? "wait" : "pointer",
              }}
              title="Lleva tu melodía grabada de 1, 2 o 4 compases al Beat Breakdown Sequencer"
            >
              <span>
                {isRenderingRecording
                  ? "RENDERIZANDO..."
                  : hasSequencerTarget
                  ? "A SECUENCIADOR →"
                  : "A C-MASTER"}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
