// Service to interact with the mercadopago-checkout Supabase Edge Function

import { supabase } from "@/lib/supabase";

export interface CoinPackInfo {
  id: string;
  title: string;
  coins: number;
  pricePen: number;
  priceUsd: number;
  description: string;
  badge?: string;
  popular?: boolean;
}

export const COIN_PACKS_LIST: CoinPackInfo[] = [
  {
    id: "pack_casual",
    title: "Pack Casual",
    coins: 1500,
    pricePen: 10.0,
    priceUsd: 2.99,
    description: "1 Canción en cola de Rocola VIP",
  },
  {
    id: "pack_dj",
    title: "Pack DJ de Radio",
    coins: 4500,
    pricePen: 25.0,
    priceUsd: 6.99,
    description: "2 Cortes en vivo instantáneos al aire",
  },
  {
    id: "pack_trono",
    title: "Pack Trono VIP",
    coins: 10000,
    pricePen: 50.0,
    priceUsd: 14.99,
    description: "Corona #1 Rey del Dial (+1,000 Coins de Regalo)",
    badge: "MÁS POPULAR 🔥",
    popular: true,
  },
  {
    id: "pack_supremo",
    title: "Pack Rey Supremo",
    coins: 25000,
    pricePen: 100.0,
    priceUsd: 29.99,
    description: "Dominio total del dial (+5,000 Coins de Regalo)",
    badge: "MEJOR VALOR 👑",
  },
  {
    id: "pack_dueno",
    title: "Pack Dueño del Dial",
    coins: 70000,
    pricePen: 250.0,
    priceUsd: 69.99,
    description: "Exclusivo para Bandas, DJs y Patrocinadores",
    badge: "PRO / WHALE 💎",
  },
];

export interface CreatePreferenceParams {
  packId: string;
  requestId: string;
}

export interface CreatePreferenceResult {
  init_point?: string;
  sandbox_init_point?: string;
  preference_id?: string;
  isMock?: boolean;
  message?: string;
  error?: string;
}

export async function createMercadoPagoPreference(params: CreatePreferenceParams): Promise<CreatePreferenceResult> {
  if (!supabase) {
    throw new Error("El cliente de Supabase no está inicializado.");
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://radiodoblec.com";

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session || session.user.is_anonymous) {
    throw new Error("Inicia sesión para comprar C-Coins.");
  }

  const { data, error } = await supabase.functions.invoke("mercadopago-checkout", {
    body: {
      packId: params.packId,
      requestId: params.requestId,
      redirectOrigin: origin,
    },
  });

  if (error) {
    const response = error.context;
    const details = response instanceof Response ? await response.json().catch(() => null) : null;
    throw new Error(details?.error || "No se pudo iniciar el pago. Puedes reintentar.");
  }

  if (typeof data?.init_point !== "string") throw new Error("No se pudo generar el enlace de pago.");
  const checkoutUrl = new URL(data.init_point);
  if (checkoutUrl.protocol !== "https:" || !["www.mercadopago.com.pe", "www.mercadopago.com", "sandbox.mercadopago.com.pe", "sandbox.mercadopago.com"].includes(checkoutUrl.hostname)) {
    throw new Error("El enlace de pago recibido no es válido.");
  }
  return data as CreatePreferenceResult;
}
