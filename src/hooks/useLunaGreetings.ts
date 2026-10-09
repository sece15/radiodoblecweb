"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  greetingRecipient, isActiveGreeting, parseLunaGreetingOptions,
  type LunaGreetingOptions, type LunaGreetingRequest, type LunaGreetingResult, type PendingLunaGreeting,
} from "@/lib/lunaGreetings";

interface Props {
  userId?: string;
  senderName: string;
  refreshProfile: () => Promise<number | null>;
  send: (messageText: string, requestId: string) => boolean;
}

export function useLunaGreetings({ userId, senderName, refreshProfile, send }: Props) {
  const [options, setOptions] = useState<LunaGreetingOptions | null>(null);
  const [optionsError, setOptionsError] = useState("");
  const [checking, setChecking] = useState(false);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingLunaGreeting | null>(null);
  const [notice, setNotice] = useState("");
  const [completed, setCompleted] = useState<{ requestId: string; messageText: string } | null>(null);
  const [requests, setRequests] = useState<LunaGreetingRequest[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [stateOwner, setStateOwner] = useState(userId);
  const pendingRef = useRef<PendingLunaGreeting | null>(null);
  const busyRef = useRef<string | null>(null);
  const userRef = useRef(userId);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusesRef = useRef(new Map<string, string>());
  const historyBusyRef = useRef<string | null>(null);
  const optionsVersionRef = useRef(0);
  const optionsFailedRef = useRef(false);

  const savePending = useCallback((value: PendingLunaGreeting | null) => {
    pendingRef.current = value;
    setPending(value);
    if (!userRef.current) return;
    try {
      const key = `luna-greeting:${userRef.current}`;
      if (value) sessionStorage.setItem(key, JSON.stringify(value));
      else sessionStorage.removeItem(key);
    } catch { /* In-memory retries still retain the request ID when storage is unavailable. */ }
  }, []);

  const refreshBalance = useCallback(async () => {
    const owner = userRef.current;
    const coins = await refreshProfile();
    if (owner === userRef.current) setBalance(coins);
    return coins;
  }, [refreshProfile]);

  const refreshOptions = useCallback(async () => {
    const version = ++optionsVersionRef.current;
    try {
      if (!supabase) throw new Error("Supabase no está disponible.");
      const { data, error } = await supabase.rpc("luna_greeting_options");
      const next = !error && parseLunaGreetingOptions(data);
      if (!next) throw new Error("No se pudo consultar el precio y la disponibilidad. Vuelve a intentar.");
      if (version === optionsVersionRef.current) {
        setOptions(next);
        setOptionsError("");
        optionsFailedRef.current = false;
      }
      return next;
    } catch {
      if (version === optionsVersionRef.current) {
        setOptions(null);
        setOptionsError("No se pudo consultar el precio y la disponibilidad. Vuelve a intentar.");
        optionsFailedRef.current = true;
      }
      return null;
    }
  }, []);

  const receiveConfig = useCallback((value: unknown) => {
    const config = parseLunaGreetingOptions(value);
    if (config && !optionsFailedRef.current) setOptions(config);
    // A connection snapshot never substitutes the RPC required before a purchase.
  }, []);

  const refreshRequests = useCallback(async () => {
    const owner = userRef.current;
    if (!owner || !supabase || historyBusyRef.current === owner) return;
    historyBusyRef.current = owner;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.id !== owner || userRef.current !== owner) return;
      const { data, error } = await supabase.from("luna_greeting_requests")
        .select("id,status,created_at").order("created_at", { ascending: false });
      if (owner !== userRef.current) return;
      if (error) throw error;
      const rows = (data ?? []) as LunaGreetingRequest[];
      const refunded = rows.some(row => row.status === "refunded" && statusesRef.current.get(row.id) !== "refunded");
      statusesRef.current = new Map(rows.map(row => [row.id, row.status]));
      setRequests(rows);
      setHistoryError("");
      if (refunded) await refreshBalance();
    } catch {
      if (owner === userRef.current) setHistoryError("No se pudieron actualizar tus saludos.");
    } finally { if (historyBusyRef.current === owner) historyBusyRef.current = null; }
  }, [refreshBalance]);

  const markUnknown = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    if (pendingRef.current?.phase === "sending") {
      savePending({ ...pendingRef.current, phase: "unknown" });
      setNotice("No se pudo confirmar el resultado. Puede haberse realizado el cobro. Reintenta la misma solicitud para comprobarlo.");
    }
  }, [savePending]);

  const receiveResult = useCallback((result: LunaGreetingResult) => {
    if (!result || typeof result.message !== "string") return;
    if (result.informational) {
      setNotice(result.message);
      return;
    }
    const current = pendingRef.current;
    if (!current || result.requestId !== current.requestId) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setNotice(result.message);
    if (result.status === "unknown") {
      savePending({ ...current, phase: "unknown" });
    } else if (result.success === true) {
      setCompleted({ requestId: current.requestId, messageText: current.messageText });
      savePending(null);
      void refreshBalance();
      void refreshRequests();
    } else {
      savePending({ ...current, phase: "failed" });
      // Never mutate the balance from an error or informational result.
    }
  }, [savePending, refreshBalance, refreshRequests]);

  const open = useCallback(async () => {
    setChecking(true);
    await Promise.all([refreshOptions(), refreshBalance()]);
    setChecking(false);
  }, [refreshOptions, refreshBalance]);

  const submit = useCallback(async (messageText: string, retry = false) => {
    if (busyRef.current === userId || pendingRef.current?.phase === "sending") return;
    if (!userId) { setNotice("Inicia sesión para enviar un saludo."); return; }
    const current = pendingRef.current;
    if (current?.phase === "unknown" && !retry) {
      setNotice("Primero comprueba la solicitud pendiente con el botón Reintentar.");
      return;
    }
    const text = retry && current ? current.messageText : messageText;
    const recipient = greetingRecipient(text, senderName);
    if (recipient.error) { setNotice(recipient.error); return; }
    busyRef.current = userId;
    setChecking(true);
    const owner = userId;
    try {
      const fresh = await refreshOptions();
      if (!fresh || owner !== userRef.current) return;
      // An unknown request may already be paid: allow resolving its ID even if the window
      // closed or its purchase reduced the balance. The server resolves duplicates.
      const resolving = retry && current?.phase === "unknown";
      if (!resolving) {
        if (!fresh.accepting) { setNotice(`La recepción está cerrada. ${fresh.hours} (${fresh.timezone}).`); return; }
        if (!options || fresh.price !== options.price || fresh.currency !== options.currency) {
          setNotice("Se actualizó el precio. Revisa el costo y vuelve a confirmar el envío."); return;
        }
        const coins = await refreshBalance();
        if (owner !== userRef.current) return;
        if (coins === null) { setNotice("No se pudo comprobar tu saldo. Vuelve a intentar."); return; }
        if (coins < fresh.price) { setNotice(`Te faltan ${fresh.price - coins} ${fresh.currency}.`); return; }
      }
      const request: PendingLunaGreeting = current && current.messageText === text
        ? { ...current, phase: "sending" }
        : { requestId: crypto.randomUUID(), messageText: text, phase: "sending" };
      savePending(request);
      if (!send(text, request.requestId)) {
        savePending({ ...request, phase: current?.phase === "unknown" ? "unknown" : "failed" });
        setNotice("El chat está desconectado. Reconecta y reintenta la misma solicitud.");
        return;
      }
      setNotice("Esperando confirmación del servidor…");
      timeoutRef.current = setTimeout(markUnknown, 15000);
    } catch {
      setNotice("No se pudo enviar el saludo. Conservamos la solicitud para reintentar.");
      markUnknown();
    } finally {
      if (busyRef.current === owner) busyRef.current = null;
      if (userRef.current === owner) setChecking(false);
    }
  }, [userId, senderName, refreshOptions, refreshBalance, options, savePending, send, markUnknown]);

  const connectionChanged = useCallback((value: boolean) => {
    setConnected(value);
    if (!value) markUnknown();
  }, [markUnknown]);

  useEffect(() => {
    userRef.current = userId;
    pendingRef.current = null;
    busyRef.current = null;
    statusesRef.current.clear();
    // Hydrate the user-scoped draft from external session storage after authentication.
    const hydrate = setTimeout(() => {
      setStateOwner(userId);
      setRequests([]);
      setHistoryError("");
      setBalance(null);
      setNotice("");
      setCompleted(null);
      setChecking(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      let restored: PendingLunaGreeting | null = null;
      try {
        const raw = userId && sessionStorage.getItem(`luna-greeting:${userId}`);
        const value = raw ? JSON.parse(raw) : null;
        if (value && typeof value.requestId === "string" && typeof value.messageText === "string") {
          restored = { ...value, phase: value.phase === "failed" ? "failed" : "unknown" };
        }
      } catch { /* Ignore unavailable storage or a malformed saved draft. */ }
      savePending(restored);
      if (restored?.phase === "unknown") setNotice("Hay un saludo sin confirmar. Reintenta la misma solicitud; puede haberse cobrado.");
      if (userId) { void refreshBalance(); void refreshRequests(); }
    }, 0);
    return () => {
      clearTimeout(hydrate);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [userId, savePending, refreshBalance, refreshRequests]);

  const hasActiveRequests = requests.some(row => isActiveGreeting(row.status));
  useEffect(() => {
    if (!userId) return;
    const refreshVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshRequests();
        void refreshBalance();
      }
    };
    document.addEventListener("visibilitychange", refreshVisible);
    const interval = hasActiveRequests ? setInterval(() => {
      if (document.visibilityState === "visible") void refreshRequests();
    }, 45000) : null;
    return () => {
      document.removeEventListener("visibilitychange", refreshVisible);
      if (interval) clearInterval(interval);
    };
  }, [userId, hasActiveRequests, refreshRequests, refreshBalance]);

  const sameOwner = stateOwner === userId;
  return { options, optionsError, checking, connected,
    balance: sameOwner ? balance : null,
    pending: sameOwner ? pending : null,
    notice: sameOwner ? notice : "",
    completed: sameOwner ? completed : null,
    requests: sameOwner ? requests : [],
    historyError: sameOwner ? historyError : "",
    open, submit, refreshRequests, receiveConfig, receiveResult, connectionChanged };
}

export type LunaGreetingsController = ReturnType<typeof useLunaGreetings>;
