import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
  return NextResponse.json(
    { version },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
