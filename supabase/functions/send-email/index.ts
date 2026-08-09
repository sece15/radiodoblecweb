// Supabase Edge Function: send-email (Resend API)
// Environment variables:
// - RESEND_API_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, demoUrl, bio } = await req.json();

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Nombre y correo son obligatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY no está configurada en los secrets de Supabase.");
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: "Postulación recibida correctamente (Modo simulación hasta configurar RESEND_API_KEY en Supabase)",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Radio Doble C <onboarding@resend.dev>",
        to: ["andrealvaradocampos@gmail.com"],
        reply_to: email,
        subject: `📻 Nueva Postulación / Audios de ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 3px solid #111; border-radius: 4px; background-color: #ffffff;">
            <h2 style="color: #BA1A1A; text-transform: uppercase; margin-top: 0;">📻 Nueva Postulación / Audios para Radio Doble C</h2>
            <p>Se ha recibido una nueva postulación desde la plataforma web oficial:</p>
            <hr style="border: 1px solid #eee; margin: 15px 0;">
            <p><strong>👤 Nombre / AKA:</strong> ${name}</p>
            <p><strong>✉️ Correo de contacto:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>🎵 Enlace al Demo / Audios:</strong> ${
              demoUrl
                ? `<a href="${demoUrl}" target="_blank" style="color: #0066cc; font-weight: bold;">${demoUrl}</a>`
                : "No especificado"
            }</p>
            <p><strong>📝 Propuesta / Mensaje:</strong></p>
            <div style="background-color: #f4f4f4; padding: 12px; border-left: 4px solid #BA1A1A; font-style: italic; white-space: pre-wrap;">
              ${bio || "Sin mensaje adicional."}
            </div>
            <hr style="border: 1px solid #eee; margin: 20px 0 10px 0;">
            <p style="font-size: 11px; color: #888; text-align: center;">Radio Doble C • Transmisión Online</p>
          </div>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error devuelto por Resend API:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Error al enviar correo con Resend" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
