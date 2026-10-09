"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAudio } from "@/hooks/useAudio";

export function RechargeStatus() {
  const isAuthenticated = useAudio((state) => state.isAuthenticated);
  const refreshProfile = useAudio((state) => state.refreshProfile);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const client = supabase;
    const params = new URLSearchParams(window.location.search);
    const order = params.get("order");
    if (!client || !params.has("recharge") || !order || !/^[0-9a-f-]{36}$/i.test(order)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let busy = false;
    let attempts = 0;
    let terminal = false;
    async function check() {
      if (cancelled || busy || terminal || document.visibilityState === "hidden") return;
      busy = true;
      try {
        if (!isAuthenticated) {
          setMessage("Inicia sesión para consultar tu recarga.");
          return;
        }
        const { data, error } = await client!.from("mp_payment_receipts")
          .select("status,applied_coins").eq("order_id", order!)
          .order("payment_updated_at", { ascending: false }).limit(5);
        if (cancelled) return;
        if (error) {
          setMessage("No se pudo consultar tu recarga. El pago aún no está confirmado aquí.");
        } else {
          const credited = data?.find((receipt) => Number(receipt.applied_coins) > 0 && receipt.status === "approved");
          const reversed = data?.find((receipt) => ["refunded", "charged_back"].includes(receipt.status));
          if (credited || reversed) {
            const balance = await refreshProfile();
            if (cancelled) return;
            terminal = balance !== null;
            setMessage(credited ? "Pago confirmado. Tus C-Coins fueron acreditadas." : "La recarga fue devuelta o revertida. Consulta tu saldo actualizado.");
            if (terminal) {
              const { data: purchase } = await client!.from("mp_checkout_orders").select("user_id,pack_id").eq("id", order!).single();
              if (cancelled) return;
              if (purchase) {
                try { sessionStorage.removeItem(`mp-checkout:${purchase.user_id}:${purchase.pack_id}`); } catch { /* Storage may be disabled. */ }
              }
              const current = new URL(window.location.href);
              for (const key of ["recharge", "order", "payment_id", "status", "collection_id", "collection_status", "preference_id", "merchant_order_id", "external_reference", "payment_type", "processing_mode", "site_id"]) current.searchParams.delete(key);
              window.history.replaceState(window.history.state, "", current);
            }
          } else if (data?.some((receipt) => ["rejected", "cancelled"].includes(receipt.status))) {
            setMessage("El intento de pago fue rechazado o cancelado. No se acreditaron monedas por ese intento.");
          } else {
            setMessage("Estamos esperando la confirmación de Mercado Pago. No repitas el pago si ya lo realizaste.");
          }
        }
      } catch {
        if (!cancelled) setMessage("No se pudo consultar tu recarga. Vuelve a esta pestaña para reintentar.");
      } finally {
        busy = false;
        clearTimeout(timer);
        if (!cancelled && !terminal && isAuthenticated && ++attempts < 20) timer = setTimeout(check, 15000);
      }
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") { attempts = 0; void check(); }
    };
    void check();
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [isAuthenticated, refreshProfile]);

  return message ? <p role="status" style={{ fontSize: "0.85rem", margin: 0 }}>{message}</p> : null;
}
