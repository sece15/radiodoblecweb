import { supabase } from "@/lib/supabase";

export interface SponsorMenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
  is_popular?: boolean;
}

export interface SponsorBusiness {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  about?: string;
  category: "comida" | "bebidas" | "servicios" | "diseño" | "radio" | "otro";
  whatsapp_number: string;
  address?: string;
  discount_code: string;
  discount_percent: number;
  logo_url?: string;
  play_store_url?: string;
  has_delivery?: boolean; // Define si tiene habilitado el flujo de pedidos/delivery
  is_active: boolean;
  menu_items: SponsorMenuItem[];
}

export interface SponsorOrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateSponsorOrderInput {
  sponsorId: string;
  customerName: string;
  customerPhone: string;
  deliveryType: "delivery" | "pickup" | "reservation";
  address?: string;
  items: SponsorOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
}

export const INITIAL_SPONSORS: SponsorBusiness[] = [
  {
    id: "doble-c-matriz",
    name: "Radio Doble C • Radio Online",
    slug: "doble-c",
    tagline: "La radio online alternativa e independiente de Huánuco 📻⚡",
    about: "Emisora de radio online y plataforma de streaming digital 24/7 en alta fidelidad. Transmisión continua de rock, hip-hop, cultura alternativa y espacios abiertos para la comunidad.",
    category: "radio",
    has_delivery: false,
    logo_url: "/RADIO.png",
    whatsapp_number: "51962900000",
    address: "Huánuco, Perú - Transmisión Online 24/7",
    discount_code: "DOBLECOFICIAL",
    discount_percent: 10,
    is_active: true,
    menu_items: [
      {
        id: "dc1",
        name: "Pase VIP Radio Doble C (Mensual)",
        price: 15.0,
        description: "Acceso a peticiones prioritarias en cabina, audios exclusivos y badge VIP.",
        icon: "👑",
        is_popular: true,
      },
      {
        id: "dc2",
        name: "Pack Stickers Neobrutalistas Doble C (Set 5 uds)",
        price: 12.0,
        description: "Vinilo laminado mate resistente al agua y sol.",
        icon: "⚡",
        is_popular: true,
      },
    ],
  },
  {
    id: "mikaja-oficial",
    name: "Mikaja • Control de Inventario con IA",
    slug: "mikaja",
    tagline: "El primer control de inventario y stock con Inteligencia Artificial 📸🤖📦",
    about: "¿Cansado de perder dinero porque no sabes cuánta mercancía tienes? Mikaja es el primer Control de Inventario y Stock con IA. Olvida escribir nombres largos: toma una foto a tus productos y nuestro agente inteligente se encarga de llenar el inventario, ordenar el stock en tiempo real y calcular tus ganancias diarias sin errores. Ideal para tiendas de ropa, abarrotes, bodegas y emprendimientos.",
    category: "diseño",
    has_delivery: false,
    logo_url: "/sponsors/mikaja.png",
    play_store_url: "https://play.google.com/store/apps/details?id=com.sece.inventarioapp&hl=es_NI",
    whatsapp_number: "51962900002",
    address: "Huánuco - Descarga en Google Play Store",
    discount_code: "DOBLECMIKAJA",
    discount_percent: 20,
    is_active: true,
    menu_items: [
      {
        id: "mk1",
        name: "Registro con Fotos (IA) & Asistente Inteligente",
        price: 0.0,
        description: "Toma fotos a tus productos y la IA llena el inventario automáticamente. ¡Descárgala gratis en Google Play!",
        icon: "📸",
        is_popular: true,
      },
      {
        id: "mk2",
        name: "Suscripción Mikaja Pro (IA Ilimitada + Reportes)",
        price: 19.90,
        description: "Agente IA 24/7 que gestiona entradas/salidas de stock y balance de ganancias.",
        icon: "🤖",
        is_popular: true,
      },
      {
        id: "mk3",
        name: "Implementación & Carga Inicial Asistida para tu Negocio",
        price: 49.00,
        description: "Capacitación y configuración personalizada del inventario para tu tienda o bodega.",
        icon: "📦",
        is_popular: false,
      },
    ],
  },
  {
    id: "koyote-studios",
    name: "Koyote Studios • Sala de Ensayos en Huánuco",
    slug: "koyote",
    tagline: "Sala de ensayos acústica para bandas y músicos en Huánuco 🎸🥁🤘",
    about: "Sala de ensayos profesional ubicada en Huánuco. Equipada con batería acústica completa, amplificadores de guitarra y bajo, micrófonos para voces y tratamiento acústico para que tu banda ensaye con el mejor sonido.",
    category: "servicios",
    has_delivery: false,
    logo_url: "/sponsors/koyote.jpg",
    whatsapp_number: "51946576566",
    address: "Huánuco - Sala de Ensayos para Bandas",
    discount_code: "DOBLECKOYOTE",
    discount_percent: 15,
    is_active: true,
    menu_items: [
      {
        id: "ky1",
        name: "Hora de Ensayo de Banda (Sala Equipada)",
        price: 25.0,
        description: "Batería completa, amplificadores de guitarra y bajo, microfonía y retorno.",
        icon: "🎸",
        is_popular: true,
      },
      {
        id: "ky2",
        name: "Pack Mensual 4 Horas de Ensayo",
        price: 90.0,
        description: "Reserva tu horario semanal fijo con descuento especial para bandas.",
        icon: "🎟️",
        is_popular: true,
      },
      {
        id: "ky3",
        name: "Práctica Individual de Batería o Instrumento (Por Hora)",
        price: 15.0,
        description: "Espacio acústico privado para práctica solista o clases particulares.",
        icon: "🥁",
        is_popular: false,
      },
    ],
  },
  {
    id: "ponches-huanuco",
    name: "Ponchería Tradición & Energía Huánuco",
    slug: "ponches",
    tagline: "Los ponches calientes más energéticos y tradicionales de la ciudad 🍵⚡",
    category: "bebidas",
    has_delivery: true,
    whatsapp_number: "51962900000",
    address: "Jr. Huánuco #540 (A 2 cuadras de la Plaza)",
    discount_code: "DOBLECPONCHE",
    discount_percent: 10,
    is_active: true,
    menu_items: [
      {
        id: "p1",
        name: "Ponche Especial Energético de Maca & Quinua",
        price: 8.5,
        description: "Elaborado con maca negra, quinua tostada, canela, clavo y leche fresca.",
        icon: "🍵",
        is_popular: true,
      },
      {
        id: "p2",
        name: "Pan Artesanal Huaneño con Queso Caliente",
        price: 4.5,
        description: "Pan de piso tradicional recién salido del horno con queso andino derretido.",
        icon: "🧀",
        is_popular: true,
      },
      {
        id: "p3",
        name: "Ponche Clásico de Leche & Especias",
        price: 7.0,
        description: "Cremoso y aromático con toque de nuez moscada.",
        icon: "🥛",
        is_popular: false,
      },
    ],
  },
  {
    id: "pizzeria-rock",
    name: "Pizzería Rock & Roll Doble C",
    slug: "pizzas",
    tagline: "Masa artesanal a la piedra y salsa secreta 🍕🤘",
    category: "comida",
    has_delivery: true,
    whatsapp_number: "51962900001",
    address: "Av. Los Próceres #120",
    discount_code: "DOBLECPIZZA",
    discount_percent: 15,
    is_active: true,
    menu_items: [
      {
        id: "pz1",
        name: "Pizza Punk Pepperoni (Grande)",
        price: 38.0,
        description: "Doble queso mozzarella, pepperoni crocante y orégano huaneño.",
        icon: "🍕",
        is_popular: true,
      },
      {
        id: "pz2",
        name: "Pizza Underground Hawaiana Especial",
        price: 36.0,
        description: "Jamón artesanal, piña caramelizada y queso fundido.",
        icon: "🍍",
        is_popular: false,
      },
      {
        id: "pz3",
        name: "Pan al Ajo Gratinado con Mozzarella (6 unidades)",
        price: 14.0,
        description: "Doraditos con mantequilla de finas hierbas.",
        icon: "🥖",
        is_popular: false,
      },
    ],
  },
];

export async function fetchSponsorBusinesses(): Promise<SponsorBusiness[]> {
  if (!supabase) return INITIAL_SPONSORS;

  try {
    const { data, error } = await supabase
      .from("sponsor_businesses")
      .select("*")
      .eq("is_active", true);

    if (error || !data || data.length === 0) {
      return INITIAL_SPONSORS.map((sp) => {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(`sponsor_delivery_override_${sp.id}`);
          if (stored !== null) return { ...sp, has_delivery: stored === "true" };
        }
        return sp;
      });
    }

    const dbList: SponsorBusiness[] = data.map((item) => {
      let localOverride: boolean | undefined = undefined;
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(`sponsor_delivery_override_${item.id}`);
        if (stored !== null) localOverride = stored === "true";
      }
      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        tagline: item.tagline || "",
        about: item.about,
        logo_url: item.logo_url,
        category: item.category || "comida",
        has_delivery: localOverride !== undefined ? localOverride : (item.has_delivery !== undefined ? Boolean(item.has_delivery) : (item.category === "comida" || item.category === "bebidas")),
        whatsapp_number: item.whatsapp_number,
        address: item.address,
        discount_code: item.discount_code || "RADIODOBLEC",
        discount_percent: item.discount_percent || 10,
        menu_items: Array.isArray(item.menu_items) ? item.menu_items : [],
        is_active: item.is_active ?? true,
      };
    });

    // Asegurar que marcas iniciales (MIKAJA, Koyote, Doble C) siempre estén presentes
    const combined = [...dbList];
    INITIAL_SPONSORS.forEach((init) => {
      const existsIndex = combined.findIndex((s) => s.slug === init.slug || s.id === init.id);
      if (existsIndex === -1) {
        combined.push(init);
      } else {
        // Enriquecer con campos locales si faltan en BD (como logo_url o about)
        combined[existsIndex] = {
          ...init,
          ...combined[existsIndex],
          about: combined[existsIndex].about || init.about,
          logo_url: combined[existsIndex].logo_url || init.logo_url,
          has_delivery: combined[existsIndex].has_delivery !== undefined ? combined[existsIndex].has_delivery : init.has_delivery,
        };
      }
    });

    // Aplicar overrides locales si existen
    if (typeof window !== "undefined") {
      combined.forEach((sp, idx) => {
        const stored = localStorage.getItem(`sponsor_delivery_override_${sp.id}`);
        if (stored !== null) {
          combined[idx].has_delivery = stored === "true";
        }
      });
    }

    return combined;
  } catch (err) {
    console.error("Error al cargar auspiciadores:", err);
    return INITIAL_SPONSORS;
  }
}

export async function submitSponsorOrder(input: CreateSponsorOrderInput): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!supabase) {
    return { success: true, id: `local_${Date.now()}` };
  }

  try {
    const { data, error } = await supabase
      .from("sponsor_orders")
      .insert([
        {
          sponsor_id: input.sponsorId,
          customer_name: input.customerName,
          customer_phone: input.customerPhone,
          delivery_type: input.deliveryType,
          address: input.address || null,
          order_items: input.items,
          subtotal: input.subtotal,
          discount: input.discount,
          total: input.total,
          notes: input.notes || null,
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.warn("Aviso al registrar pedido de auspicio:", error.message);
      return { success: true, id: `order_${Date.now()}` };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("Error al enviar orden a la base de datos:", err);
    return { success: true, id: `order_${Date.now()}` };
  }
}

export async function updateSponsorWhatsApp(sponsorId: string, newNumber: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("sponsor_businesses")
      .update({ whatsapp_number: newNumber.trim() })
      .eq("id", sponsorId);
    return !error;
  } catch (err) {
    console.error("Error al actualizar número de auspiciador:", err);
    return false;
  }
}

export async function updateSponsorDeliveryMode(sponsorId: string, hasDelivery: boolean): Promise<boolean> {
  if (typeof window !== "undefined") {
    localStorage.setItem(`sponsor_delivery_override_${sponsorId}`, String(hasDelivery));
  }

  if (!supabase) return true;

  try {
    const { error } = await supabase
      .from("sponsor_businesses")
      .update({ has_delivery: hasDelivery })
      .eq("id", sponsorId);
    return !error;
  } catch (err) {
    console.error("Error al actualizar modo delivery del auspiciador:", err);
    return false;
  }
}

export function buildSponsorWhatsAppUrl(
  sponsor: SponsorBusiness,
  input: CreateSponsorOrderInput,
  overridePhone?: string
): string {
  const itemsText = input.items
    .map((item) => `• ${item.quantity}x ${item.name} (S/ ${(item.price * item.quantity).toFixed(2)})`)
    .join("\n");

  const deliveryLabel =
    input.deliveryType === "delivery"
      ? `🛵 Delivery a: ${input.address || "Por coordinar"}`
      : input.deliveryType === "pickup"
        ? `🏪 Recojo en local (${sponsor.address || "Local principal"})`
        : `🪑 Reserva de Mesa`;

  const message = `📻 *¡HOLA ${sponsor.name.toUpperCase()}!*
Vengo escuchando *Radio Doble C* y deseo realizar este pedido con mi beneficio de oyente:

📋 *DETALLE DEL PEDIDO:*
${itemsText}

${deliveryLabel}
👤 *Cliente:* ${input.customerName}
📞 *Teléfono:* ${input.customerPhone}
${input.notes ? `📝 *Nota especial:* ${input.notes}\n` : ""}
💵 *Subtotal:* S/ ${input.subtotal.toFixed(2)}
🎁 *Descuento Radio Doble C (-${sponsor.discount_percent}%):* -S/ ${input.discount.toFixed(2)}
⚡ *TOTAL A PAGAR:* S/ ${input.total.toFixed(2)}

_Por favor confirmar disponibilidad y tiempo de entrega. ¡Gracias! 📻✨_`;

  const targetNumber = (overridePhone && overridePhone.trim()) ? overridePhone.trim() : sponsor.whatsapp_number;
  const cleanNumber = targetNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
