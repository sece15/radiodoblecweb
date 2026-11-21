import { supabase } from "@/lib/supabase";
import { audioStore } from "@/store/useAudioStore";
import { DEFAULT_STREAM } from "@/constants";
import {
  ADMIN_MAX_UPLOAD_BYTES,
  ADMIN_MAX_VOICE_BYTES,
  type AdminMediaSearchResponse,
  type AdminPlaylistsResponse,
  type AdminQueueItem,
  type AdminUploadResponse,
  type AdminUploadTrackInput,
  type AdminVoiceNoteInput,
  type AdminVoiceNoteResponse,
} from "@/types/adminRadio";

// Proxy interno de Next.js hacia https://resolver.andrealvarado.dev/api/admin/* para evitar bloqueos CORS en navegador
const ADMIN_API_BASE = "/api/admin-radio";

export class AdminRadioError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminRadioError";
    this.status = status;
  }
}

async function getAdminAccessToken(): Promise<string> {
  if (!supabase) {
    throw new AdminRadioError(401, "Supabase no está configurado en este entorno.");
  }
  const { data, error } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (error || !token) {
    throw new AdminRadioError(
      401,
      "Sesión no encontrada o expirada (401). Inicia sesión nuevamente con tu cuenta ADMIN."
    );
  }
  return token;
}

async function parseAdminResponse<T>(res: Response): Promise<T> {
  if (res.status === 401 || res.status === 403) {
    throw new AdminRadioError(
      res.status,
      `Sin permisos de Administrador (${res.status}). Verifica que tu cuenta tenga rol ADMIN y sesión activa.`
    );
  }
  if (res.status === 413) {
    throw new AdminRadioError(
      413,
      "El archivo excede el límite máximo permitido de 45 MB (413)."
    );
  }

  let body: unknown = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    body = await res.json().catch(() => null);
  } else {
    body = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const detail =
      typeof body === "object" && body !== null
        ? (body as { detail?: string; error?: string; message?: string }).detail ||
          (body as { detail?: string; error?: string; message?: string }).error ||
          (body as { detail?: string; error?: string; message?: string }).message
        : typeof body === "string"
        ? body
        : null;
    throw new AdminRadioError(
      res.status,
      detail || `Error del servidor (${res.status}). Intenta nuevamente.`
    );
  }

  return body as T;
}

export async function adminSkipNext(): Promise<{ status?: string; message?: string }> {
  const token = await getAdminAccessToken();
  const res = await fetch(`${ADMIN_API_BASE}/next`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseAdminResponse<{ status?: string; message?: string }>(res);
}

export async function adminFetchPlaylists(): Promise<AdminPlaylistsResponse> {
  const token = await getAdminAccessToken();
  const res = await fetch(`${ADMIN_API_BASE}/playlists`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseAdminResponse<AdminPlaylistsResponse>(res);
}

export async function adminSearchMedia(
  q = "",
  playlistId?: number | null,
  limit = 1000
): Promise<AdminMediaSearchResponse> {
  const token = await getAdminAccessToken();
  const params = new URLSearchParams();
  if (q.trim()) {
    params.set("q", q.trim());
  }
  params.set("limit", String(limit));
  if (typeof playlistId === "number" && Number.isFinite(playlistId)) {
    params.set("playlist_id", String(playlistId));
  }

  const res = await fetch(`${ADMIN_API_BASE}/media?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseAdminResponse<AdminMediaSearchResponse>(res);
}

export async function adminEnqueueTrack(
  mediaId: string | number
): Promise<{ status?: string; message?: string }> {
  const token = await getAdminAccessToken();
  const res = await fetch(`${ADMIN_API_BASE}/queue`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ media_id: mediaId }),
  });
  return parseAdminResponse<{ status?: string; message?: string }>(res);
}

export async function adminUploadTrack(
  input: AdminUploadTrackInput
): Promise<AdminUploadResponse> {
  if (input.file.size > ADMIN_MAX_UPLOAD_BYTES) {
    throw new AdminRadioError(
      413,
      "El archivo supera el límite máximo de 45 MB (413). Comprime o elige un MP3 más ligero."
    );
  }

  const token = await getAdminAccessToken();
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("playlist_id", String(input.playlist_id));
  formData.append("folder", input.folder.trim() || "lo_mas_nuevo");
  if (input.artist?.trim()) {
    formData.append("artist", input.artist.trim());
  }
  if (input.title?.trim()) {
    formData.append("title", input.title.trim());
  }
  formData.append("enqueue_next", input.enqueue_next ? "true" : "false");

  const res = await fetch(`${ADMIN_API_BASE}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return parseAdminResponse<AdminUploadResponse>(res);
}

export async function adminUploadVoiceNote(
  input: AdminVoiceNoteInput
): Promise<AdminVoiceNoteResponse> {
  if (input.file.size > ADMIN_MAX_VOICE_BYTES) {
    throw new AdminRadioError(
      413,
      "El archivo de voz/podcast supera el límite máximo de 95 MB (413)."
    );
  }

  const token = await getAdminAccessToken();
  const formData = new FormData();
  formData.append("file", input.file, input.filename);
  formData.append("enqueue_next", input.enqueue_next ? "true" : "false");
  formData.append("voice_enhance", input.voice_enhance ? "true" : "false");
  formData.append(
    "playlist_id",
    typeof input.playlist_id === "number" && Number.isFinite(input.playlist_id)
      ? String(input.playlist_id)
      : ""
  );
  if (input.title?.trim()) {
    formData.append("title", input.title.trim());
  }
  if (input.artist?.trim()) {
    formData.append("artist", input.artist.trim());
  }

  const res = await fetch(`${ADMIN_API_BASE}/voice-note`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return parseAdminResponse<AdminVoiceNoteResponse>(res);
}

export async function adminFetchQueue(): Promise<AdminQueueItem[]> {
  const token = await getAdminAccessToken();
  const res = await fetch(`${ADMIN_API_BASE}/queue`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await parseAdminResponse<
    AdminQueueItem[] | { queue?: AdminQueueItem[]; items?: AdminQueueItem[] }
  >(res);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.queue)) return data.queue;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export async function adminDeleteQueueItem(
  itemId: string | number
): Promise<{ status?: string; message?: string }> {
  const token = await getAdminAccessToken();
  const res = await fetch(
    `${ADMIN_API_BASE}/queue/${encodeURIComponent(String(itemId))}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return parseAdminResponse<{ status?: string; message?: string }>(res);
}

/**
 * Refreshes Now Playing immediately from /api/radio/nowplaying and syncs Zustand store.
 */
export async function refreshNowPlayingState(): Promise<void> {
  try {
    const res = await fetch("/api/radio/nowplaying", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return;

    const np = data[0];
    const isLiveStream = Boolean(np.live?.is_live);
    const streamerName = np.live?.streamer_name || "RADIO DOBLE C ONLINE";
    const title = np.now_playing?.song?.title || "";
    const artist = np.now_playing?.song?.artist || "";
    const liveTrackTitle = title ? `${title} - ${artist}` : "RADIO DOBLE C - SEÑAL EN VIVO";

    audioStore.setState({
      isStreamerLive: isLiveStream,
      liveShowName: streamerName,
      liveTrackTitle,
      liveStatusText: isLiveStream ? "EN VIVO" : "ON AIR",
    });

    const state = audioStore.getState();
    const currentTrack = state.currentTrack;
    if (
      currentTrack &&
      (currentTrack.streamUrl.includes(".m3u8") || currentTrack.streamUrl === DEFAULT_STREAM)
    ) {
      audioStore.setState({
        currentTrack: {
          ...currentTrack,
          title: title || currentTrack.title,
          artist: artist || currentTrack.artist,
          album: np.now_playing?.song?.album || currentTrack.album,
        },
      });
    }
  } catch {
    // Non-fatal refresh error
  }
}
