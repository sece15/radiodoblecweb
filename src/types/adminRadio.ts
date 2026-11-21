// ==========================================
// ADMIN RADIO RESOLVER TYPES (src/types/adminRadio.ts)
// ==========================================

export interface AdminRadioTrack {
  id: string | number;
  path: string;
  title: string;
  artist: string;
  text: string;
  length: number;
  length_text: string;
  playlists: Array<string | number>;
}

export interface AdminMediaSearchResponse {
  total: number;
  tracks: AdminRadioTrack[];
}

export interface AdminRadioPlaylist {
  id: number;
  name: string;
  is_enabled: boolean;
  type: string;
  weight: number;
  num_songs: number;
}

export interface AdminPlaylistsResponse {
  playlists: AdminRadioPlaylist[];
  default_upload_playlist_id: number;
  rocola_playlist_id: number;
}

export interface AdminUploadResponse {
  status: string;
  path: string;
  playlist_id: number;
  enqueued: boolean;
  media_id: string | number;
}

export interface AdminUploadTrackInput {
  file: File;
  playlist_id: number;
  folder: string;
  artist?: string;
  title?: string;
  enqueue_next: boolean;
}

export const ADMIN_UPLOAD_FOLDERS = [
  "lo_mas_nuevo",
  "spotify_hits/salsa",
  "spotify_hits/reggaeton",
  "spotify_hits/pop_reggaeton",
  "spotify_hits/urban_electro",
  "spotify_hits/lofi",
  "spotify_hits/hiphop_rnb",
] as const;

export const ADMIN_MAX_UPLOAD_BYTES = 45 * 1024 * 1024; // 45 MB
export const ADMIN_MAX_VOICE_BYTES = 95 * 1024 * 1024; // 95 MB

export interface AdminVoiceNoteInput {
  file: Blob | File;
  filename: string;
  enqueue_next: boolean;
  voice_enhance: boolean;
  playlist_id?: number | null;
  title?: string;
  artist?: string;
}

export interface AdminVoiceNoteResponse {
  status?: string;
  path?: string;
  playlist_id?: number | null;
  enqueued?: boolean;
  media_id?: string | number;
  message?: string;
}

export interface AdminQueueItem {
  id: string | number;
  cued_at?: number;
  played_at?: number;
  duration?: number;
  is_request?: boolean;
  playlist?: string;
  title?: string;
  artist?: string;
  text?: string;
  song?: {
    id?: string;
    title?: string;
    artist?: string;
    text?: string;
  };
}
