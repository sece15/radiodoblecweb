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
  const textLength = Array.from(enteredRecipient.normalize("NFC")).length;
  const messageTooLong = textLength > 140;
  const missing = options && luna.balance !== null ? Math.max(0, options.price - luna.balance) : null;
  const waiting = pending?.phase === "sending";
  const uncertain = pending?.phase === "unknown";
  const disabled = !authenticated || !luna.connected || luna.checking || waiting || uncertain ||
    !options?.accepting || missing === null || missing > 0 || messageTooLong;

  return (
    <div style={{ fontSize: "0.68rem", lineHeight: "1rem", marginTop: "5px" }}>
      {active && (
        <div className="neo-card" style={{ padding: "6px 8px", backgroundColor: "var(--background)", borderColor: CHAT_COMMAND_COLOR }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
            <span style={{ fontWeight: 900, fontSize: "0.72rem" }}>
              <span style={{ color: CHAT_COMMAND_COLOR, backgroundColor: CHAT_COMMAND_BACKGROUND, borderRadius: "3px", padding: "1px 5px", fontSize: "0.65rem" }}>/saludos</span>
              {" "}Luna ✨
            </span>
            {options && (
              <span style={{ fontSize: "0.68rem", fontWeight: 900, color: CHAT_COMMAND_COLOR }}>
                {options.price} {options.currency}
              </span>
            )}
          </div>

          {receptionClosed ? (
            <p role="status" aria-live="polite" style={{ margin: "2px 0 0", color: "#ef4444", fontSize: "0.65rem" }}>
              Fuera de horario de Luna: <strong>{options.hours}</strong>.
            </p>
          ) : (
            <>
              <p style={{ margin: "2px 0 3px", fontSize: "0.66rem", overflowWrap: "anywhere" }}>
                Para: <strong>{recipient || "quien tú quieras"}</strong> · De: <strong>{senderName}</strong>
              </p>
              {messageTooLong && (
                <p role="status" style={{ color: "#ef4444", margin: "2px 0", fontSize: "0.63rem", fontWeight: 700 }}>
                  El saludo es muy largo ({textLength}/140 caracteres).
                </p>
              )}

              {options && (
                <>
                  {options.recentCount && options.recentCount > 0 ? (
                    <div style={{ margin: "3px 0 4px", padding: "3px 6px", backgroundColor: "rgba(255, 79, 203, 0.12)", borderRadius: "3px", border: `1px solid ${CHAT_COMMAND_COLOR}`, fontSize: "0.63rem" }}>
                      <span style={{ fontWeight: 800, color: CHAT_COMMAND_COLOR }}>
                        ⚡ Tarifa x{Math.pow(2, options.recentCount)}
                      </span>
                      {cooldown > 0 && (
                        <span style={{ marginLeft: "6px", color: "#facc15" }}>
                          ⏱️ Base ({options.basePrice || 10}) en {formatCooldown(cooldown)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p style={{ margin: "1px 0 4px", fontSize: "0.62rem", opacity: 0.75 }}>
                      💡 Envíos seguidos (&lt;20m) duplican el costo.
                    </p>
                  )}
                </>
              )}

              {luna.optionsError && <p role="alert" style={{ color: "#ef4444", margin: "2px 0", fontSize: "0.63rem" }}>{luna.optionsError}</p>}
              {options && missing !== null && missing > 0 && (
                <p style={{ color: "#ef4444", fontWeight: 700, margin: "2px 0", fontSize: "0.65rem" }}>
                  Te faltan {missing} {options.currency}.
                </p>
              )}
              {!authenticated && <p style={{ margin: "2px 0", fontSize: "0.65rem" }}>Inicia sesión para enviar un saludo.</p>}
              {!luna.connected && <p style={{ margin: "2px 0", fontSize: "0.65rem" }}>El chat está desconectado.</p>}
              {options && luna.balance === null && !luna.checking && <p style={{ margin: "2px 0", fontSize: "0.65rem" }}>No se pudo comprobar tu saldo.</p>}

              <div style={{ display: "flex", gap: "5px", alignItems: "center", marginTop: "4px" }}>
                <button
                  type="button"
                  className="neo-button"
                  disabled={disabled}
                  onClick={() => void luna.submit(messageText)}
                  style={{
                    flex: 1,
                    padding: "5px 8px",
                    backgroundColor: CHAT_COMMAND_COLOR,
                    color: "#111111",
                    fontWeight: 900,
                    fontSize: "0.7rem",
                    opacity: disabled ? 0.55 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                    boxShadow: "1.5px 1.5px 0px #111111",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {waiting ? "Enviando…" : luna.checking ? "Consultando…" :
                    options && !options.accepting ? "Fuera de horario" :
                    options ? `ENVIAR · ${options.price} ${options.currency}` : "Precio no disponible"}
                </button>
                {!luna.checking && !waiting && !uncertain && authenticated && (
                  <button
                    type="button"
                    className="neo-button"
                    onClick={() => void luna.open()}
                    title="Actualizar saldo y disponibilidad"
                    style={{
                      padding: "5px 7px",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "1.5px 1.5px 0px #111111",
                      flexShrink: 0,
                    }}
                  >
                    🔄
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {pending && pending.phase !== "sending" && (
        <div className="neo-card" style={{ marginTop: "6px", padding: "6px 8px", backgroundColor: "var(--background)", borderColor: uncertain ? "#f59e0b" : "#ef4444" }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.66rem", color: uncertain ? "#f59e0b" : "#ef4444" }}>
            {uncertain ? "⚠️ Envío pendiente de confirmación" : "❌ No se pudo enviar el saludo"}
          </p>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
            <button
              type="button"
              className="neo-button"
              disabled={luna.checking || !luna.connected || !authenticated}
              onClick={() => void luna.submit(pending.messageText, true)}
              style={{ padding: "4px 8px", fontSize: "0.65rem", fontWeight: 800, backgroundColor: CHAT_COMMAND_COLOR, color: "#111111", boxShadow: "1.5px 1.5px 0px #111111" }}
            >
              🔄 Reintentar
            </button>
            <button
              type="button"
              className="neo-button"
              onClick={() => luna.discardPending()}
              style={{ padding: "4px 8px", fontSize: "0.65rem", fontWeight: 800, backgroundColor: "#222222", color: "#ffffff", boxShadow: "1.5px 1.5px 0px #111111" }}
            >
              🗑️ Borrar
            </button>
          </div>
        </div>
      )}
      {luna.notice && (
        <p role="status" aria-live="polite" style={{ margin: "4px 0 0", fontSize: "0.65rem", color: "#facc15", overflowWrap: "anywhere" }}>
          {luna.notice}
        </p>
      )}
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
