"use client";

import { useEffect, useState } from "react";
import type { LunaGreetingsController } from "@/hooks/useLunaGreetings";
import { greetingRecipient, LUNA_GREETING_STATUSES } from "@/lib/lunaGreetings";
import { CHAT_COMMAND_BACKGROUND, CHAT_COMMAND_COLOR } from "@/lib/chatCommands";

interface Props {
  luna: LunaGreetingsController | null;
  messageText: string;
  senderName: string;
  active: boolean;
  authenticated: boolean;
}

function formatCooldown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s} min`;
}

export function LunaGreetingPanel({ luna, messageText, senderName, active, authenticated }: Props) {
  const open = luna?.open;
  const connected = luna?.connected;
  const pendingPhase = luna?.pending?.phase;
  const options = luna?.options;
  const pending = luna?.pending;

  const [cooldown, setCooldown] = useState<number>(0);
  const [prevCooldown, setPrevCooldown] = useState<number | undefined>(undefined);

  if (options?.cooldownSeconds !== prevCooldown) {
    setPrevCooldown(options?.cooldownSeconds);
    setCooldown(options?.cooldownSeconds && options.cooldownSeconds > 0 ? options.cooldownSeconds : 0);
  }

  useEffect(() => {
    if (!active || !authenticated || !open || pendingPhase === "sending" || pendingPhase === "unknown") return;
    let refreshing = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible" || refreshing) return;
      refreshing = true;
      try { await open(); } finally { refreshing = false; }
    };
    void refresh();
    const onVisibilityChange = () => { void refresh(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    // Availability and credits can change while the greeting editor stays open.
    const interval = setInterval(() => { void refresh(); }, 30000);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active, authenticated, connected, open, pendingPhase]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          void open?.();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown, open]);

  if (!luna) return null;

  const receptionClosed = options?.accepting === false;
  const recipient = greetingRecipient(messageText, senderName);
  const enteredRecipient = greetingRecipient(messageText, "");
  const nameTooLong = Array.from(enteredRecipient.normalize("NFC")).length > 40 ||
    enteredRecipient.split(/\s+/u).length > 5;
  const missing = options && luna.balance !== null ? Math.max(0, options.price - luna.balance) : null;
  const waiting = pending?.phase === "sending";
  const uncertain = pending?.phase === "unknown";
  const disabled = !authenticated || !luna.connected || luna.checking || waiting || uncertain ||
    !options?.accepting || missing === null || missing > 0;

  return (
    <div style={{ fontSize: "0.7rem", lineHeight: "1.1rem", marginTop: "8px" }}>
      {active && (
        <div className="neo-card" style={{ padding: "8px", backgroundColor: "var(--background)", borderColor: CHAT_COMMAND_COLOR }}>
          <p style={{ margin: "0 0 6px", fontWeight: 900 }}>
            <span style={{ color: CHAT_COMMAND_COLOR, backgroundColor: CHAT_COMMAND_BACKGROUND, borderRadius: "3px", padding: "2px 5px" }}>/saludos</span>
            {" "}{receptionClosed ? "Horario de saludos con Luna" : "Tu saludo al aire con Luna ✨"}
          </p>
          {receptionClosed ? (
            <p role="status" aria-live="polite" style={{ margin: 0 }}>
              Los saludos por este comando están programados para el horario de Luna: <strong>{options.hours}</strong>.
            </p>
          ) : (
            <>
              <p style={{ margin: "0 0 6px" }}>
                ¡Luna enviará un saludo a {recipient || "quien tú quieras"} de parte de {senderName}! 💖
              </p>
              {nameTooLong && <p role="status" style={{ color: "#ef4444" }}>El nombre es muy largo (máximo 40 letras y 5 palabras).</p>}
              {options && (
                <>
                  {options.recentCount && options.recentCount > 0 ? (
                    <div style={{ margin: "6px 0", padding: "6px 8px", backgroundColor: "rgba(255, 79, 203, 0.12)", borderRadius: "4px", border: `1px solid ${CHAT_COMMAND_COLOR}` }}>
                      <p style={{ margin: 0, fontWeight: 800, color: CHAT_COMMAND_COLOR }}>
                        ⚡ Tarifa por envío consecutivo: {options.price} {options.currency} (x{Math.pow(2, options.recentCount)})
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "0.66rem", opacity: 0.9 }}>
                        Cada saludo consecutivo antes de 20 min duplica su costo.
                      </p>
                      {cooldown > 0 && (
                        <p style={{ margin: "3px 0 0", fontSize: "0.66rem", color: "#facc15" }}>
                          ⏱️ Vuelve a precio base ({options.basePrice || 10} {options.currency}) en <strong>{formatCooldown(cooldown)}</strong>.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ margin: "4px 0" }}>
                      <p style={{ margin: "2px 0", fontWeight: 700 }}>Costo: {options.price} {options.currency} por saludo.</p>
                      <p style={{ margin: "2px 0 4px", fontSize: "0.65rem", opacity: 0.75 }}>
                        💡 Si envías otro saludo antes de 20 min, el siguiente costará el doble ({options.price * 2} {options.currency}).
                      </p>
                    </div>
                  )}
                  <p style={{ margin: "4px 0" }}>{options.hours} · {options.timezone}. Luna termina a las 12.</p>
                  <p style={{ margin: "4px 0" }}>
                    {options.accepting ? "Recibiendo saludos" : "Recepción cerrada"}
                    {luna.balance !== null && ` · Saldo: ${luna.balance} ${options.currency}`}
                  </p>
                </>
              )}
              {luna.optionsError && <p role="alert">{luna.optionsError}</p>}
              {options && missing !== null && missing > 0 && <p style={{ color: "#ef4444", fontWeight: 700 }}>Te faltan {missing} {options.currency}.</p>}
              {!authenticated && <p>Inicia sesión para enviar un saludo.</p>}
              {!luna.connected && <p>El chat está desconectado.</p>}
              {options && luna.balance === null && !luna.checking && <p>No se pudo comprobar tu saldo.</p>}
              <button type="button" className="neo-button" disabled={disabled}
                onClick={() => void luna.submit(messageText)}
                style={{ padding: "7px 10px", backgroundColor: CHAT_COMMAND_COLOR, color: "#111111", opacity: disabled ? 0.55 : 1 }}>
                {waiting ? "Esperando confirmación…" : luna.checking ? "Consultando…" :
                  options && !options.accepting ? "Fuera de horario" :
                  options ? `Enviar saludo · ${options.price} ${options.currency}` : "Precio no disponible"}
              </button>
              {!luna.checking && !waiting && !uncertain && authenticated && (
                <button type="button" className="neo-button" onClick={() => void luna.open()} style={{ marginLeft: "6px", padding: "7px" }}>
                  Actualizar saldo y disponibilidad
                </button>
              )}
            </>
          )}
        </div>
      )}
      {pending && pending.phase !== "sending" && (
        <div className="neo-card" style={{ marginTop: "8px", padding: "8px", backgroundColor: "var(--background)", borderColor: uncertain ? "#f59e0b" : "#ef4444" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: uncertain ? "#f59e0b" : "#ef4444" }}>
            {uncertain ? "⚠️ Envío pendiente de confirmación" : "❌ No se pudo enviar el saludo"}
          </p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
            <button
              type="button"
              className="neo-button"
              disabled={luna.checking || !luna.connected || !authenticated}
              onClick={() => void luna.submit(pending.messageText, true)}
              style={{ padding: "6px 10px", backgroundColor: CHAT_COMMAND_COLOR, color: "#111111" }}
            >
              🔄 Reintentar
            </button>
            <button
              type="button"
              className="neo-button"
              onClick={() => luna.discardPending()}
              style={{ padding: "6px 10px", backgroundColor: "#222222", color: "#ffffff" }}
            >
              🗑️ Borrar mensaje
            </button>
          </div>
        </div>
      )}
      {luna.notice && <p role="status" aria-live="polite" style={{ margin: "6px 0 0", overflowWrap: "anywhere" }}>{luna.notice}</p>}
    </div>
  );
}

export function MyLunaGreetings({ luna, authenticated }: Pick<Props, "luna" | "authenticated">) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ padding: "0 12px 8px", fontSize: "0.7rem", lineHeight: "1.1rem" }}>
      <button type="button" className="neo-button" aria-expanded={expanded}
        onClick={() => { setExpanded(!expanded); if (!expanded) void luna?.refreshRequests(); }}
        style={{ padding: "5px 8px" }}>Mis saludos {expanded ? "▴" : "▾"}</button>
      {expanded && (
        <div style={{ maxHeight: "160px", overflowY: "auto", paddingTop: "6px" }}>
          {!authenticated ? <p>Inicia sesión para consultar tus saludos.</p> : (
            <>
              {luna?.historyError && <p role="alert">{luna.historyError}</p>}
              {!luna?.requests.length && !luna?.historyError && <p>Aún no hay saludos para mostrar.</p>}
              <ul style={{ paddingLeft: "18px", margin: "4px 0" }}>
                {luna?.requests.map(request => (
                  <li key={request.id}>
                    {new Intl.DateTimeFormat("es-PE", {
                      dateStyle: "short", timeStyle: "short", timeZone: luna.options?.timezone || "America/Lima",
                    }).format(new Date(request.created_at))} — {LUNA_GREETING_STATUSES[request.status] || request.status}
                  </li>
                ))}
              </ul>
              <p>Los saludos pendientes de emisión no tienen una hora exacta. Solo «Emitido» confirma su reproducción.</p>
              <button type="button" onClick={() => void luna?.refreshRequests()} className="neo-button" style={{ padding: "4px 6px" }}>Actualizar</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
