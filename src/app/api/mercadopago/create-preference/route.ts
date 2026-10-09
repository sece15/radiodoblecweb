import { NextResponse } from "next/server";

// Authentication, pricing and settlement belong to the single Edge Function.
export async function POST() {
  return NextResponse.json(
    { error: "Actualiza la página y utiliza el centro de recarga." },
    { status: 410 },
  );
}
