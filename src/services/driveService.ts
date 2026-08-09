// Servicio de conexión con Google Drive API a través de Supabase Edge Functions
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://skkwodwxaeajdaukjsqg.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/google-drive-api`;

export async function fetchDriveFiles(): Promise<DriveFile[]> {
  try {
    const res = await fetch(`${FUNCTION_URL}?action=list`, {
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return (data.files || []) as DriveFile[];
  } catch (error) {
    console.error("Error al cargar archivos de Google Drive:", error);
    return [];
  }
}

export function getDriveStreamUrl(fileId: string): string {
  return `${FUNCTION_URL}?action=download&fileId=${encodeURIComponent(fileId)}`;
}

export async function uploadDriveFile(file: File, customName?: string): Promise<DriveFile> {
  const formData = new FormData();
  formData.append("file", file, customName || file.name);

  const res = await fetch(`${FUNCTION_URL}?action=upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al subir archivo (${res.status}): ${errorText}`);
  }

  return await res.json();
}

export async function deleteDriveFile(fileId: string): Promise<boolean> {
  const res = await fetch(`${FUNCTION_URL}?action=delete&fileId=${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al eliminar archivo (${res.status}): ${errorText}`);
  }

  return true;
}
