"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Loader2, Lock } from "lucide-react";
import type { LoadedSampleData } from "@/types/studio";
import { useAudio } from "@/hooks/useAudio";
import { canAccessStudio } from "@/lib/permissions";

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
  const userProfile = useAudio((s) => s.userProfile);
  const hasStudioAccess = canAccessStudio(userProfile.role);
  const [activeView, setActiveView] = useState<"digger" | "sampler">("digger");
  const [loadedSampleForSampler, setLoadedSampleForSampler] = useState<LoadedSampleData | null>(null);

  if (!hasStudioAccess) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          backgroundColor: "#080A0F",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          padding: "24px",
          textAlign: "center",
          fontFamily: "'Space Grotesk', -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "12px",
            backgroundColor: "#141519",
            border: "2px solid #CCFF00",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#CCFF00",
          }}
        >
          <Lock size={24} />
        </div>
        <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, color: "#CCFF00", letterSpacing: "1px" }}>
          🎛️ C-STATION STUDIO
        </h1>
        <p style={{ margin: 0, maxWidth: "380px", fontSize: "0.84rem", color: "#A1A1AA", lineHeight: 1.5 }}>
          Por ahora el acceso a C-Station Studio está habilitado únicamente para cuentas con rol{" "}
          <strong style={{ color: "#FFFFFF" }}>STREAMER</strong> o <strong style={{ color: "#FFFFFF" }}>ADMIN</strong>.
        </p>
        <Link
          href="/"
          style={{
            marginTop: "6px",
            padding: "8px 16px",
            backgroundColor: "#CCFF00",
            color: "#090A0D",
            fontWeight: 900,
            fontSize: "0.78rem",
            borderRadius: "6px",
            textDecoration: "none",
            border: "2px solid #000000",
          }}
        >
          VOLVER A LA RADIO
        </Link>
      </div>
    );
  }

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
