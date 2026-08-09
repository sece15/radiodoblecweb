// Supabase Edge Function: Secure Google Drive API (Albums, Folders & Audio Streaming)
// Environment variables:
// - GOOGLE_SERVICE_ACCOUNT_EMAIL
// - GOOGLE_PRIVATE_KEY
// - DRIVE_FOLDER_ID (1OhBEPm-sb3L5ITUXi_5YkOVbRe42Acmk)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const cleanPem = pem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\\n/g, "")
    .replace(/\s+/g, "");

  const binaryDerString = atob(cleanPem);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

async function getGoogleAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  let privateKeyPem = Deno.env.get("GOOGLE_PRIVATE_KEY");

  if (!clientEmail || !privateKeyPem) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY in Supabase secrets.");
  }

  privateKeyPem = privateKeyPem.replace(/\\n/g, "\n");
  const key = await importPrivateKey(privateKeyPem);

  const jwtPayload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: getNumericDate(3600),
    iat: getNumericDate(0),
  };

  const jwt = await create({ alg: "RS256", typ: "JWT" }, jwtPayload, key);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    throw new Error(`Failed to obtain Google access token: ${errText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rootFolderId = Deno.env.get("DRIVE_FOLDER_ID") || "1OhBEPm-sb3L5ITUXi_5YkOVbRe42Acmk";
    const accessToken = await getGoogleAccessToken();
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";
    const targetFolderId = url.searchParams.get("folderId") || rootFolderId;

    // 1. LIST ALBUMS (Subfolders inside DISCOS folder or inside root)
    if (req.method === "GET" && action === "albums") {
      const findDiscosQ = encodeURIComponent(`'${rootFolderId}' in parents and name = 'DISCOS' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
      const discosRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${findDiscosQ}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const discosData = await discosRes.json();
      let discosFolderId = discosData.files?.[0]?.id;

      if (!discosFolderId) {
        discosFolderId = rootFolderId;
      }

      const albumsQ = encodeURIComponent(`'${discosFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
      const albumsRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${albumsQ}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,createdTime,modifiedTime,webViewLink)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const albumsData = await albumsRes.json();
      const albums = albumsData.files || [];

      // For each album folder, get song count and cover image if present
      const albumsWithDetails = await Promise.all(
        albums.map(async (alb: { id: string; name: string; createdTime: string; modifiedTime: string; webViewLink: string }) => {
          const filesQ = encodeURIComponent(`'${alb.id}' in parents and trashed = false`);
          const fRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${filesQ}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType,size)`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const fData = await fRes.json();
          const items = fData.files || [];

          // Sort priority: filename containing portada > cover > folder > front > any image
          const coverFile = items.find((f: { name: string; mimeType: string }) => {
            const n = f.name.toLowerCase();
            return (
              n.includes("portada") ||
              n.includes("cover") ||
              n.includes("folder") ||
              n.includes("front") ||
              f.mimeType.startsWith("image/") ||
              Boolean(n.match(/\.(jpg|jpeg|png|webp)$/i))
            );
          });

          const trackCount = items.filter((f: { name: string; mimeType: string }) => {
            const n = f.name.toLowerCase();
            const isImg = f.mimeType.startsWith("image/") || Boolean(n.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i));
            return !isImg;
          }).length;

          return {
            ...alb,
            trackCount,
            coverFileId: coverFile ? coverFile.id : null,
            coverUrl: coverFile ? `https://skkwodwxaeajdaukjsqg.supabase.co/functions/v1/google-drive-api?action=download&fileId=${coverFile.id}` : null,
          };
        })
      );

      return new Response(JSON.stringify({ discosFolderId, albums: albumsWithDetails }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. GET ALBUM TRACKS (All songs and media inside an album folder)
    if (req.method === "GET" && action === "album_tracks") {
      const albumId = url.searchParams.get("albumId");
      if (!albumId) {
        return new Response(JSON.stringify({ error: "albumId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const q = encodeURIComponent(`'${albumId}' in parents and trashed = false`);
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await driveRes.json();
      const files = data.files || [];

      files.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      return new Response(JSON.stringify({ albumId, files }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. CREATE FOLDER
    if (req.method === "POST" && action === "create_folder") {
      const folderName = url.searchParams.get("name") || "Nuevo Disco";
      const parentId = url.searchParams.get("parentFolderId") || rootFolderId;

      const metadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      };

      const driveRes = await fetch("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name,mimeType,webViewLink", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      const result = await driveRes.json();
      return new Response(JSON.stringify(result), {
        status: driveRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. UPLOAD TRACK OR FILE (Multipart upload)
    if (req.method === "POST" && action === "upload") {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const folderId = url.searchParams.get("folderId") || targetFolderId;

      if (!file) {
        return new Response(JSON.stringify({ error: "file is required in formData" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const metadata = {
        name: file.name,
        parents: [folderId],
      };

      // Multipart upload format
      const boundary = "-------314159265358979323846";
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const metadataPart = delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata);

      const fileBuffer = await file.arrayBuffer();
      const filePartHeader = delimiter +
        `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`;

      const encoder = new TextEncoder();
      const part1 = encoder.encode(metadataPart);
      const part2 = encoder.encode(filePartHeader);
      const part3 = new Uint8Array(fileBuffer);
      const part4 = encoder.encode(close_delim);

      const fullBody = new Uint8Array(part1.length + part2.length + part3.length + part4.length);
      fullBody.set(part1, 0);
      fullBody.set(part2, part1.length);
      fullBody.set(part3, part1.length + part2.length);
      fullBody.set(part4, part1.length + part2.length + part3.length);

      const driveRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,size,webViewLink",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: fullBody,
        }
      );

      const result = await driveRes.json();
      return new Response(JSON.stringify(result), {
        status: driveRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. LIST GENERIC FILES IN ANY FOLDER
    if (req.method === "GET" && action === "list") {
      const q = encodeURIComponent(`'${targetFolderId}' in parents and trashed = false`);
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await driveRes.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: driveRes.status,
      });
    }

    // 6. DOWNLOAD / STREAM FILE CONTENT (Images & Audio Streams)
    if (req.method === "GET" && action === "download") {
      const fileId = url.searchParams.get("fileId");
      if (!fileId) {
        return new Response(JSON.stringify({ error: "fileId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const contentType = driveRes.headers.get("Content-Type") || "application/octet-stream";

      return new Response(driveRes.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
          "Content-Disposition": "inline",
        },
        status: driveRes.status,
      });
    }

    // 7. DELETE FILE OR FOLDER
    if (req.method === "DELETE" && action === "delete") {
      const fileId = url.searchParams.get("fileId");
      if (!fileId) {
        return new Response(JSON.stringify({ error: "fileId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (driveRes.status === 204) {
        return new Response(JSON.stringify({ success: true, deletedFileId: fileId }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const err = await driveRes.text();
        return new Response(err, {
          status: driveRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid route or action" }), {
      status: 404,
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
