// Servicio de conexión con Google Drive API (Programas, Discos, Carpetas y Streaming)
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface DriveAlbum {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  trackCount: number;
  coverFileId: string | null;
  coverUrl: string | null;
  webViewLink?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://skkwodwxaeajdaukjsqg.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/google-drive-api`;

// ID raíz conocido de la carpeta Programas en Google Drive
export const PROGRAMAS_ROOT_FOLDER_ID = "1_uebi4lDZ8kPcVCk9rNjW7bIXfT5Qf1Y";

// 1. Obtener la lista de subcarpetas de programas dentro de "Programas"
export async function fetchProgramFolders(): Promise<DriveFile[]> {
  try {
    return await fetchDriveFiles(PROGRAMAS_ROOT_FOLDER_ID);
  } catch (error) {
    console.error("Error al cargar carpetas de programas:", error);
    return [];
  }
}

// 2. Normalizador de nombres de programas para búsqueda en Google Drive
function normalizeProgramKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

// 3. Obtener las grabaciones/emisiones pasadas de un programa específico
export async function fetchProgramRecordings(programTitle: string): Promise<DriveFile[]> {
  try {
    const folders = await fetchProgramFolders();
    const targetKey = normalizeProgramKey(programTitle);

    // Buscar coincidencia exacta o parcial
    const matchedFolder = folders.find((f) => {
      const folderKey = normalizeProgramKey(f.name);
      return (
        folderKey === targetKey ||
        folderKey.includes(targetKey) ||
        targetKey.includes(folderKey)
      );
    });

    if (!matchedFolder) {
      console.log(`No se encontró carpeta en Drive para el programa: "${programTitle}"`);
      return [];
    }

    // Listar los archivos dentro de la carpeta del programa
    return await fetchDriveFiles(matchedFolder.id);
  } catch (error) {
    console.error(`Error al cargar grabaciones del programa ${programTitle}:`, error);
    return [];
  }
}

// 4. Obtener la lista de todos los Álbumes (Carpetas de Discos dentro de DISCOS)
export async function fetchDriveAlbums(): Promise<{ discosFolderId: string; albums: DriveAlbum[] }> {
  try {
    const res = await fetch(`${FUNCTION_URL}?action=albums`, {
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const albums = ((data.albums || []) as DriveAlbum[]).map((a) => {
      const coverUrl = a.coverFileId ? getDriveStreamUrl(a.coverFileId) : a.coverUrl ? getDriveStreamUrl(a.coverFileId || "") : null;
      return {
        ...a,
        coverUrl,
      };
    });

    return {
      discosFolderId: data.discosFolderId || "",
      albums,
    };
  } catch (error) {
    console.error("Error al cargar álbumes de Google Drive:", error);
    return { discosFolderId: "", albums: [] };
  }
}

// 5. Obtener las canciones y archivos dentro de un Álbum específico
export async function fetchAlbumTracks(albumId: string): Promise<DriveFile[]> {
  try {
    const res = await fetch(`${FUNCTION_URL}?action=album_tracks&albumId=${encodeURIComponent(albumId)}`, {
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
    console.error("Error al cargar canciones del álbum:", error);
    return [];
  }
}

// 6. Crear una nueva carpeta de Álbum / Disco dentro de DISCOS
export async function createDriveAlbum(albumName: string, parentFolderId?: string): Promise<DriveFile> {
  const url = parentFolderId
    ? `${FUNCTION_URL}?action=create_folder&name=${encodeURIComponent(albumName)}&parentFolderId=${encodeURIComponent(parentFolderId)}`
    : `${FUNCTION_URL}?action=create_folder&name=${encodeURIComponent(albumName)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al crear disco (${res.status}): ${errorText}`);
  }

  return await res.json();
}

// 7. Subir canción o portada directamente a una carpeta de disco o programa
export async function uploadTrackToAlbum(file: File, albumFolderId: string, customName?: string): Promise<DriveFile> {
  const formData = new FormData();
  formData.append("file", file, customName || file.name);

  const res = await fetch(`${FUNCTION_URL}?action=upload&folderId=${encodeURIComponent(albumFolderId)}`, {
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

// 8. Listar archivos genéricos o de una subcarpeta
export async function fetchDriveFiles(folderId?: string): Promise<DriveFile[]> {
  try {
    const url = folderId
      ? `${FUNCTION_URL}?action=list&folderId=${encodeURIComponent(folderId)}`
      : `${FUNCTION_URL}?action=list`;

    const res = await fetch(url, {
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

// 9. Generar URL de streaming directo
export function getDriveStreamUrl(fileId: string): string {
  return `${FUNCTION_URL}?action=download&fileId=${encodeURIComponent(fileId)}`;
}

// 10. Subir archivo a la raíz
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

// 11. Eliminar archivo o carpeta
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

// 12. Subir grabación de programa directamente a la carpeta del programa en Google Drive
export async function uploadProgramRecording(
  file: File,
  programTitle: string,
  customName?: string
): Promise<DriveFile> {
  const folders = await fetchProgramFolders();
  const targetKey = normalizeProgramKey(programTitle);

  let matchedFolder = folders.find((f) => {
    const folderKey = normalizeProgramKey(f.name);
    return (
      folderKey === targetKey ||
      folderKey.includes(targetKey) ||
      targetKey.includes(folderKey)
    );
  });

  // Si la carpeta del programa no existe aún en Google Drive, la creamos dentro de Programas
  if (!matchedFolder) {
    matchedFolder = await createDriveAlbum(programTitle, PROGRAMAS_ROOT_FOLDER_ID);
  }

  return await uploadTrackToAlbum(file, matchedFolder.id, customName);
}
