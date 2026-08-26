"use client";

import { useState, useEffect } from "react";
import { useAudio } from "@/hooks/useAudio";
import { VipJukeboxModal } from "./vip/VipJukeboxModal";
import { supabase } from "@/lib/supabase";
import {
  Crown,
  Zap,
  Flame,
  Volume2,
  Trophy,
  Swords
} from "lucide-react";

interface VipViewProps {
  onNavigateToPlayer?: () => void;
}

export const VipView = ({ onNavigateToPlayer }: VipViewProps) => {
  const { userProfile, puntosC, playLiveStream, isPlaying } = useAudio();
  const [isJukeboxOpen, setIsJukeboxOpen] = useState(false);
  const [selectedBidCoins, setSelectedBidCoins] = useState(2000);
  const [rocolaRequests, setRocolaRequests] = useState<Array<{
    id: string;
    title: string;
    artist: string;
    requester: string;
    dedication?: string;
    status: string;
    coins_paid?: number;
    created_at: string;
  }>>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from("vip_song_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!error && data) {
          // Ordenar: Mayor número de C-Coins siempre se corona en el Puesto #1 absoluto
          const sorted = [...data].sort((a, b) => {
            const coinsA = a.coins_paid || (a.status === "interrupted_live" ? 2000 : 1000);
            const coinsB = b.coins_paid || (b.status === "interrupted_live" ? 2000 : 1000);
            if (coinsB !== coinsA) return coinsB - coinsA;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          setRocolaRequests(sorted);
        }
      } catch (err) {
        console.warn("Error fetching rocola ranking:", err);
      }
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 6000);
    return () => clearInterval(interval);
  }, []);

  const top1 = rocolaRequests.length > 0 ? rocolaRequests[0] : null;
  const top1Coins = top1 ? (top1.coins_paid || 1000) : 1000;
  const outbidTarget = top1Coins + 500;

  const handleOpenJukebox = (suggestedCoins = 2000) => {
    setSelectedBidCoins(suggestedCoins);
    setIsJukeboxOpen(true);
  };

  const handleTuneIn = () => {
    playLiveStream();
    if (onNavigateToPlayer) {
      onNavigateToPlayer();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "20px 16px 180px 16px",
        width: "100%",
        maxWidth: "850px",
        margin: "0 auto",
      }}
    >
      {/* 1. HERO BANNER: ARENA DE LA ROCOLA VIP */}
      <section
        className="neo-card scanlines"
        style={{
          backgroundColor: "#FFFBEA",
          border: "4px solid var(--primary)",
          boxShadow: "8px 8px 0px var(--primary)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          position: "relative",
          transform: "rotate(-0.5deg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                backgroundColor: "#FFB000",
                color: "#111",
                border: "2px solid var(--primary)",
                padding: "4px 10px",
                fontSize: "0.72rem",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "2px 2px 0px var(--primary)",
              }}
            >
              <Crown size={15} style={{ color: "#BA1A1A", fill: "#FFB000" }} />
              ARENA EN VIVO 24/7
            </span>

            <span
              style={{
                backgroundColor: "#BA1A1A",
                color: "white",
                border: "2px solid var(--primary)",
                padding: "4px 10px",
                fontSize: "0.72rem",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "2px 2px 0px var(--primary)",
              }}
            >
              🔴 TRANSMISIÓN AL AIRE
            </span>
          </div>

          <div
            style={{
              backgroundColor: "#161E00",
              color: "#CCFF00",
              border: "2px solid var(--primary)",
              padding: "4px 12px",
              fontSize: "0.78rem",
              fontWeight: 900,
              boxShadow: "2px 2px 0px var(--primary)",
            }}
          >
            👤 @{userProfile?.name || "Oyente"} • ⚡ {(puntosC || 0).toLocaleString()} C-COINS
          </div>
        </div>

        <div>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.5px",
              margin: "0 0 6px 0",
              color: "var(--primary)",
            }}
          >
            👑 LA ROCOLA VIP: EL REY DEL DIAL
          </h1>
          <p
            style={{
              fontSize: "0.82rem",
              lineHeight: "1.3rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--primary)",
              opacity: 0.9,
            }}
          >
            ¡El control de la radio es tuyo! Sube tu canción favorita en formato MP3 o pega un enlace de YouTube. El oyente que aporte más <strong>C-Coins</strong> se corona en <strong>PRIMERA FILA</strong> y suena de inmediato en vivo. ¡Supera a tus rivales y domina el dial de Radio Doble C!
          </p>
        </div>

        {/* Action Buttons Bar */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
          <button
            onClick={() => handleOpenJukebox(2000)}
            className="neo-button fun-hover-wobble"
            style={{
              backgroundColor: "#CCFF00",
              color: "#161E00",
              border: "2.5px solid var(--primary)",
              padding: "12px 20px",
              fontSize: "0.85rem",
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "4px 4px 0px var(--primary)",
            }}
          >
            <Zap size={18} style={{ fill: "#161E00" }} />
            ⚡ SUBIR MI CANCIÓN (ABRIR ROCOLA)
          </button>

          <button
            onClick={() => handleOpenJukebox(outbidTarget)}
            className="neo-button fun-hover-wobble"
            style={{
              backgroundColor: "#FFDE82",
              color: "#111",
              border: "2.5px solid var(--primary)",
              padding: "12px 20px",
              fontSize: "0.85rem",
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "4px 4px 0px var(--primary)",
            }}
          >
            <Swords size={18} style={{ color: "#BA1A1A" }} />
            ⚔️ DESTRONAR AL #1 (+{outbidTarget.toLocaleString()} COINS)
          </button>
        </div>
      </section>

      {/* 2. LIVE LEADERBOARD / EL TRONO DE LA RADIO */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.5px",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--primary)",
            }}
          >
            <Trophy size={20} style={{ color: "#FFB000", fill: "#FFB000" }} />
            RANKING EN VIVO • QUIÉN MANDA EN LA RADIO
          </h2>
          <span style={{ fontSize: "0.68rem", fontWeight: 900, opacity: 0.75 }}>
            ACTUALIZACIÓN AUTOMÁTICA
          </span>
        </div>

        {rocolaRequests.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* #1 SPOT - THE REIGNING KING */}
            {(() => {
              const topKing = rocolaRequests[0];
              const coins = topKing.coins_paid || (topKing.status === "interrupted_live" ? 2000 : 1000);

              return (
                <div
                  className="neo-card"
                  style={{
                    backgroundColor: "#FFDE82",
                    border: "3.5px solid var(--primary)",
                    boxShadow: "6px 6px 0px var(--primary)",
                    padding: "18px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: "1 1 320px" }}>
                    {/* Crown & Disc Icon */}
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        backgroundColor: "#111",
                        color: "#FFDE82",
                        border: "2.5px solid var(--primary)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        position: "relative",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                      }}
                    >
                      <Crown size={28} style={{ color: "#FFB000", fill: "#FFB000" }} />
                      <span
                        style={{
                          position: "absolute",
                          bottom: "-4px",
                          right: "-4px",
                          backgroundColor: "#BA1A1A",
                          color: "white",
                          fontSize: "0.62rem",
                          fontWeight: 900,
                          padding: "1px 5px",
                          borderRadius: "4px",
                          border: "1px solid var(--primary)",
                        }}
                      >
                        #1
                      </span>
                    </div>

                    {/* Details */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", color: "#111" }}>
                          👑 {topKing.requester || "Oyente VIP"}
                        </span>
                        <span
                          style={{
                            backgroundColor: "#BA1A1A",
                            color: "white",
                            fontSize: "0.62rem",
                            fontWeight: 900,
                            padding: "2px 7px",
                            borderRadius: "2px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Volume2 size={12} /> REY DEL DIAL / EN VIVO
                        </span>
                      </div>
                      <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#111" }}>
                        🎵 {topKing.title} — <span style={{ opacity: 0.85 }}>{topKing.artist}</span>
                      </span>
                      {topKing.dedication && (
                        <span style={{ fontSize: "0.72rem", fontStyle: "italic", opacity: 0.85, color: "#333" }}>
                          💬 &ldquo;{topKing.dedication.split("|")[0].trim()}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Coins & Outbid Action */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div
                      style={{
                        backgroundColor: "#161E00",
                        color: "#CCFF00",
                        border: "2px solid var(--primary)",
                        padding: "8px 14px",
                        fontSize: "0.88rem",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "2.5px 2.5px 0px var(--primary)",
                      }}
                    >
                      <Flame size={18} style={{ color: "#FFB000", fill: "#FFB000" }} />
                      {coins.toLocaleString()} C-COINS
                    </div>

                    <button
                      onClick={handleTuneIn}
                      className="neo-button fun-hover-wobble"
                      style={{
                        backgroundColor: isPlaying ? "#CCFF00" : "#111",
                        color: isPlaying ? "#111" : "#CCFF00",
                        border: "2px solid var(--primary)",
                        padding: "8px 12px",
                        fontSize: "0.78rem",
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        boxShadow: "2.5px 2.5px 0px var(--primary)",
                      }}
                      title="Sintonizar Radio en Vivo"
                    >
                      <Volume2 size={15} /> {isPlaying ? "EN VIVO 🔊" : "ESCUCHAR 📻"}
                    </button>

                    <button
                      onClick={() => handleOpenJukebox(coins + 500)}
                      className="neo-button fun-hover-wobble"
                      style={{
                        backgroundColor: "#BA1A1A",
                        color: "white",
                        border: "2px solid var(--primary)",
                        padding: "8px 14px",
                        fontSize: "0.78rem",
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        boxShadow: "2.5px 2.5px 0px var(--primary)",
                      }}
                    >
                      <Swords size={15} /> DESTRONAR AL #1
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* #2, #3, #4, etc. (WAITING LIST QUEUE) */}
            {rocolaRequests.slice(1, 8).map((req, idx) => {
              const pos = idx + 2;
              const coins = req.coins_paid || (req.status === "interrupted_live" ? 2000 : 1000);

              return (
                <div
                  key={req.id || idx}
                  className="neo-card"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    border: "2.5px solid var(--primary)",
                    boxShadow: "3px 3px 0px var(--primary)",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1 1 280px" }}>
                    <span
                      style={{
                        width: "30px",
                        height: "30px",
                        backgroundColor: pos === 2 ? "#E0E0E0" : pos === 3 ? "#CD7F32" : "var(--surface-container)",
                        color: "#111",
                        fontWeight: 900,
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1.5px solid var(--primary)",
                        flexShrink: 0,
                      }}
                    >
                      #{pos}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 900 }}>
                        {req.requester} • <span style={{ opacity: 0.85, fontWeight: 700 }}>{req.title} ({req.artist})</span>
                      </span>
                      <span style={{ fontSize: "0.68rem", opacity: 0.75 }}>
                        En cola de espera de la rocola
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: "var(--surface-container)",
                      border: "1.5px solid var(--primary)",
                      padding: "4px 10px",
                      fontSize: "0.74rem",
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Flame size={14} style={{ color: "#BA1A1A" }} />
                    {coins.toLocaleString()} Coins
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="neo-card"
            style={{
              backgroundColor: "var(--card-bg)",
              border: "3px dashed var(--primary)",
              padding: "30px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Crown size={36} style={{ opacity: 0.4 }} />
            <span style={{ fontSize: "0.95rem", fontWeight: 900 }}>
              ¡El trono de Radio Doble C está disponible!
            </span>
            <span style={{ fontSize: "0.8rem", opacity: 0.85, maxWidth: "480px" }}>
              Sé el primer oyente en subir tu canción con C-Coins y coronarte en el puesto #1 al aire.
            </span>
            <button
              onClick={() => handleOpenJukebox(2000)}
              className="neo-button"
              style={{
                marginTop: "6px",
                backgroundColor: "#CCFF00",
                color: "#111",
                padding: "8px 16px",
                fontSize: "0.8rem",
                fontWeight: 900,
                border: "2px solid var(--primary)",
                cursor: "pointer",
              }}
            >
              ⚡ SER EL PRIMER REY DEL DIAL
            </button>
          </div>
        )}
      </section>

      {/* 3. HOW IT WORKS / GAMIFICATION RULES */}
      <section
        className="neo-card"
        style={{
          backgroundColor: "var(--card-bg)",
          border: "3px solid var(--primary)",
          boxShadow: "4px 4px 0px var(--primary)",
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <span
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--on-primary)",
            padding: "2px 8px",
            fontSize: "0.68rem",
            fontWeight: 900,
            width: "fit-content",
          }}
        >
          📜 REGLAS DEL JUEGO • GUERRA DE C-COINS
        </span>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
          <div style={{ backgroundColor: "#FFF8E1", padding: "10px", border: "1.5px solid var(--primary)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
              📻 1,000 C-Coins (Encolar)
            </span>
            <span style={{ fontSize: "0.68rem", opacity: 0.85 }}>
              Tu tema entra a la cola de la radio y sonará en orden de llegada.
            </span>
          </div>

          <div style={{ backgroundColor: "#E6FFFA", padding: "10px", border: "1.5px solid var(--primary)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
              ⚡ 2,000 C-Coins (Corte en Vivo)
            </span>
            <span style={{ fontSize: "0.68rem", opacity: 0.85 }}>
              Corta la música actual al instante y suena de inmediato al aire.
            </span>
          </div>

          <div style={{ backgroundColor: "#FFDE82", padding: "10px", border: "1.5px solid var(--primary)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, display: "block", marginBottom: "3px" }}>
              👑 3,500+ C-Coins (Rey del Dial)
            </span>
            <span style={{ fontSize: "0.68rem", opacity: 0.85 }}>
              Conquista el puesto #1 en Primera Fila y anuncia tu hazaña a todos en el chat.
            </span>
          </div>
        </div>
      </section>

      {/* 4. MODAL ROCOLA VIP */}
      <VipJukeboxModal
        isOpen={isJukeboxOpen}
        onClose={() => setIsJukeboxOpen(false)}
        defaultCoins={selectedBidCoins}
      />
    </div>
  );
};
