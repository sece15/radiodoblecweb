// Archivo deprecado: El envío de correos ahora se procesa exclusivamente vía Supabase Edge Function 'send-email' (functions/send-email/index.ts).
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Utilice la Edge Function de Supabase: /functions/v1/send-email" }, { status: 410 });
}
