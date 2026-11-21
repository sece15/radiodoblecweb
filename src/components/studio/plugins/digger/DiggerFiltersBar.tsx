"use client";

import {
  DIGGER_COUNTRIES,
  DIGGER_DECADES,
  DIGGER_GENRES,
  DIGGER_OBSCURITIES,
} from "@/lib/studio/diggerStorage";

interface DiggerFiltersBarProps {
  selectedGenre: string;
  selectedCountry: string;
  selectedDecade: string;
  selectedObscurity: string;
  searchQuery: string;
  onChangeGenre: (val: string) => void;
  onChangeCountry: (val: string) => void;
  onChangeDecade: (val: string) => void;
  onChangeObscurity: (val: string) => void;
  onClearFilters: () => void;
}

const selectStyle: React.CSSProperties = {
  backgroundColor: "#161B26",
  color: "#FFFFFF",
  border: "1px solid #232838",
  borderRadius: "3px",
  padding: "5px 6px",
  fontSize: "0.68rem",
  fontWeight: 700,
  outline: "none",
  width: "100%",
  cursor: "pointer",
};

export function DiggerFiltersBar({
  selectedGenre,
  selectedCountry,
  selectedDecade,
  selectedObscurity,
  searchQuery,
  onChangeGenre,
  onChangeCountry,
  onChangeDecade,
  onChangeObscurity,
  onClearFilters,
}: DiggerFiltersBarProps) {
  const hasActiveFilter =
    selectedGenre !== "Todos" ||
    selectedDecade !== "Todas" ||
    selectedCountry !== "Todos" ||
    selectedObscurity !== "all" ||
    searchQuery !== "";

  return (
    <div
      style={{
        backgroundColor: "#11141C",
        border: "2px solid #1E2332",
        borderRadius: "6px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "9px",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #1E2332",
          paddingBottom: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#CCFF00",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: "0.68rem", fontWeight: 900, color: "#CCFF00", letterSpacing: "0.5px" }}>
            FILTROS
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <label style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94A3B8" }}>GÉNERO</label>
        <select value={selectedGenre} onChange={(e) => onChangeGenre(e.target.value)} style={selectStyle}>
          {DIGGER_GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <label style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94A3B8" }}>PAÍS</label>
        <select value={selectedCountry} onChange={(e) => onChangeCountry(e.target.value)} style={selectStyle}>
          {DIGGER_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <label style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94A3B8" }}>ÉPOCA</label>
        <select value={selectedDecade} onChange={(e) => onChangeDecade(e.target.value)} style={selectStyle}>
          {DIGGER_DECADES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <label style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94A3B8" }}>VISITAS</label>
        <select value={selectedObscurity} onChange={(e) => onChangeObscurity(e.target.value)} style={selectStyle}>
          {DIGGER_OBSCURITIES.map((obs) => (
            <option key={obs.id} value={obs.id}>
              {obs.label}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={onClearFilters}
          style={{
            backgroundColor: "transparent",
            color: "#FFFFFF",
            border: "1px dashed #CCFF00",
            borderRadius: "3px",
            padding: "4px 8px",
            fontSize: "0.65rem",
            fontWeight: 700,
            cursor: "pointer",
            marginTop: "auto",
          }}
        >
          ✕ Limpiar filtros
        </button>
      )}
    </div>
  );
}
