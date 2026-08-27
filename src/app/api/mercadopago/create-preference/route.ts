import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { COIN_PACKS_LIST } from "@/services/mercadoPagoService";

export async function POST(req: NextRequest) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    const body = await req.json();
    const { packId, userId, userName, userEmail, redirectOrigin } = body;

    const pack = COIN_PACKS_LIST.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: "Paquete de C-Coins no válido" }, { status: 400 });
    }

    if (!accessToken) {
      return NextResponse.json({
        isMock: true,
        message: "MERCADO_PAGO_ACCESS_TOKEN no configurado en .env. Agrega tus credenciales para cobrar en producción.",
        pack,
      });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const origin = redirectOrigin || "https://radiodoblec.com";

    const response = await preference.create({
      body: {
        items: [
          {
            id: pack.id,
            title: `${pack.title} - Radio Doble C`,
            description: pack.description,
            quantity: 1,
            currency_id: "PEN",
            unit_price: pack.pricePen,
          },
        ],
        payer: {
          name: userName || "Oyente Doble C",
          email: userEmail || "oyente@radiodoblec.com",
        },
        back_urls: {
          success: `${origin}/?tab=vip&recharge=success&pack=${pack.id}&coins=${pack.coins}`,
          failure: `${origin}/?tab=vip&recharge=failure`,
          pending: `${origin}/?tab=vip&recharge=pending`,
        },
        auto_return: "approved",
        metadata: {
          user_id: userId,
          pack_id: pack.id,
          coins: pack.coins,
        },
      },
    });

    return NextResponse.json({
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      preference_id: response.id,
      pack,
    });
  } catch (error) {
    console.error("[NEXT.JS MERCADO PAGO API ERROR]:", error);
    return NextResponse.json({ error: "Error al procesar con Mercado Pago", details: String(error) }, { status: 500 });
  }
}
