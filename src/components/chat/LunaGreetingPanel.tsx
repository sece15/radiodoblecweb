"use client";

import { useEffect, useState } from "react";
import type { LunaGreetingsController } from "@/hooks/useLunaGreetings";
import { greetingRecipient, LUNA_GREETING_STATUSES } from "@/lib/lunaGreetings";

interface Props {
  luna: LunaGreetingsController | null;
  messageText: string;
  senderName: string;
  active: boolean;
  authenticated: boolean;
}

export function LunaGreetingPanel({ luna, messageText, senderName, active, authenticated }: Props) {
  const open = luna?.open;
  useEffect(() => { if (active && open) void open(); }, [active, open]);
  if (!luna) return null;
  const { options, pending } = luna;
  const recipient = greetingRecipient(messageText, senderName);
  const missing = options && luna.balance !== null ? Math.max(0, options.price - luna.balance) : null;
  const waiting = pending?.phase === "sending";
  const uncertain = pending?.phase === "unknown";
  const disabled = !authenticated || !luna.connected || luna.checking || waiting || uncertain ||
    !options?.accepting || missing === null || missing > 0 || !!recipient.error;

  return (
    <div style={{ fontSize: "0.7rem", lineHeight: "1.1rem", marginTop: "8px" }}>
      {active && (
        <div className="neo-card" style={{ padding: "8px", backgroundColor: "var(--background)" }}>
          <p style={{ margin: "0 0 6px" }}>
            Luna saludará a {recipient.name || "[destinatario]"} de parte de {senderName}.
            {" "}Si caduca antes de entrar al AutoDJ, se devolverán las monedas.
          </p>
          {recipient.error && <p role="alert">{recipient.error}</p>}
          {options && (
            <>
              <p style={{ margin: "4px 0" }}>{options.hours} · {options.timezone}. Luna termina a las 12.</p>
              <p style={{ margin: "4px 0" }}>
                {options.accepting ? "Recibiendo saludos" : "Recepción cerrada"}
                {luna.balance !== null && ` · Saldo: ${luna.balance} ${options.currency}`}
              </p>
            </>
          )}
          {luna.optionsError && <p role="alert">{luna.optionsError}</p>}
          {options && missing !== null && missing > 0 && <p>Te faltan {missing} {options.currency}.</p>}
          {!authenticated && <p>Inicia sesión para enviar un saludo.</p>}
          {!luna.connected && <p>El chat está desconectado.</p>}
          {options && luna.balance === null && !luna.checking && <p>No se pudo comprobar tu saldo.</p>}
          <button type="button" className="neo-button" disabled={disabled}
            onClick={() => void luna.submit(messageText)}
            style={{ padding: "7px 10px", backgroundColor: "var(--primary-container)", color: "#111111", opacity: disabled ? 0.55 : 1 }}>
            {waiting ? "Esperando confirmación…" : luna.checking ? "Consultando…" :
              options ? `Enviar saludo · ${options.price} ${options.currency}` : "Precio no disponible"}
          </button>
          {(!options || luna.balance === null) && !luna.checking && (
            <button type="button" className="neo-button" onClick={() => void luna.open()} style={{ marginLeft: "6px", padding: "7px" }}>
              Volver a consultar
            </button>
          )}
        </div>
      )}
      {pending && pending.phase !== "sending" && (
        <div style={{ marginTop: "6px" }}>
          <p style={{ margin: "4px 0", overflowWrap: "anywhere" }}>Solicitud guardada: {pending.messageText}</p>
          {uncertain && <p>El resultado es incierto; el cobro puede haberse realizado.</p>}
          <button type="button" className="neo-button" disabled={luna.checking || !luna.connected || !authenticated}
            onClick={() => void luna.submit(pending.messageText, true)} style={{ padding: "6px" }}>
            Reintentar la misma solicitud
          </button>
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
