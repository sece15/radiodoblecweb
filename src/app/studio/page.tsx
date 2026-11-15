"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { LoadedSampleData } from "@/types/studio";

const CDiggerModal = dynamic(
  () => import("@/components/studio/plugins/CDiggerModal").then((mod) => mod.CDiggerModal),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          backgroundColor: "#080A0F",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          color: "#CCFF00",
          fontFamily: "'Space Grotesk', -apple-system, sans-serif",
        }}
      >
        <Loader2 className="animate-spin" size={36} color="#CCFF00" />
        <span style={{ fontSize: "0.82rem", fontWeight: 900, letterSpacing: "1px" }}>
          SINTONIZANDO C-DIGGER STUDIO...
        </span>
      </div>
    ),
  }
);

const CSamplerPluginModal = dynamic(
  () => import("@/components/studio/plugins/CSamplerPluginModal").then((mod) => mod.CSamplerPluginModal),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          backgroundColor: "#080A0F",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          color: "#CCFF00",
          fontFamily: "'Space Grotesk', -apple-system, sans-serif",
        }}
      >
        <Loader2 className="animate-spin" size={36} color="#CCFF00" />
        <span style={{ fontSize: "0.82rem", fontWeight: 900, letterSpacing: "1px" }}>
          SINTONIZANDO C-SAMPLER LAB...
        </span>
      </div>
    ),
  }
);

export default function StudioPage() {
  const [activeView, setActiveView] = useState<"digger" | "sampler">("digger");
  const [loadedSampleForSampler, setLoadedSampleForSampler] = useState<LoadedSampleData | null>(null);

  // 1. VISTA C-DIGGER (Explorador y Digging de Vinilos de YouTube)
  if (activeView === "digger") {
    return (
      <CDiggerModal
        isStandalone={true}
        isOpen={true}
        onSendToSampler={(sampleData) => {
          setLoadedSampleForSampler(sampleData);
          setActiveView("sampler");
        }}
        onOpenSampler={() => {
          setActiveView("sampler");
        }}
      />
    );
  }

  // 2. VISTA C-SAMPLER (Laboratorio de Cortes, Stems y Muestreo Serato VST)
  return (
    <CSamplerPluginModal
      isStandalone={true}
      isOpen={true}
      onClose={() => {
        setActiveView("digger");
      }}
      externalSample={loadedSampleForSampler}
      onOpenDigger={() => {
        setActiveView("digger");
      }}
    />
  );
}
