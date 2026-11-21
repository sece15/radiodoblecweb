import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const UPSTREAM_BASE = "https://resolver.andrealvarado.dev/api/admin";
const ALLOWED_SEGMENTS = new Set(["next", "playlists", "media", "queue", "upload", "voice-note"]);

async function proxyToAdminResolver(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;
  const endpoint = path?.[0] || "";
  const isQueueDelete = req.method === "DELETE" && endpoint === "queue" && path.length === 2 && Boolean(path[1]);
  const isSingleEndpoint = ALLOWED_SEGMENTS.has(endpoint) && path.length === 1;

  if (!isSingleEndpoint && !isQueueDelete) {
    return NextResponse.json({ error: "Endpoint no permitido" }, { status: 404 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json(
      { error: "Falta header Authorization Bearer" },
      { status: 401 }
    );
  }

  const targetPath = path.map((seg) => encodeURIComponent(seg)).join("/");
  const upstreamUrl = new URL(`${UPSTREAM_BASE}/${targetPath}`);
  req.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  const headers = new Headers();
  headers.set("Authorization", authHeader);

  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  try {
    const fetchInit: RequestInit = {
      method: req.method,
      headers,
      cache: "no-store",
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const bodyBuffer = await req.arrayBuffer();
      if (bodyBuffer.byteLength > 0) {
        fetchInit.body = bodyBuffer;
      }
    }

    const upstreamRes = await fetch(upstreamUrl.toString(), fetchInit);
    const resContentType = upstreamRes.headers.get("content-type") || "application/json";
    const resBuffer = await upstreamRes.arrayBuffer();

    return new NextResponse(resBuffer, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": resContentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo conectar con el servidor de la radio.";
    return NextResponse.json(
      { error: `Error de conexión con resolver.andrealvarado.dev: ${message}` },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyToAdminResolver(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyToAdminResolver(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyToAdminResolver(req, context);
}
