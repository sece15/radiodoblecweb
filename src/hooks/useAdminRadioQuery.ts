import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminDeleteQueueItem,
  adminEnqueueTrack,
  adminFetchPlaylists,
  adminFetchQueue,
  adminSearchMedia,
  adminSkipNext,
  adminUploadTrack,
  adminUploadVoiceNote,
  refreshNowPlayingState,
} from "@/services/adminRadioService";
import type {
  AdminMediaSearchResponse,
  AdminPlaylistsResponse,
  AdminQueueItem,
  AdminUploadResponse,
  AdminUploadTrackInput,
  AdminVoiceNoteInput,
  AdminVoiceNoteResponse,
} from "@/types/adminRadio";

export const ADMIN_PLAYLISTS_QUERY_KEY = ["admin_radio", "playlists"] as const;
export const ADMIN_MEDIA_QUERY_KEY = ["admin_radio", "media", "all"] as const;
export const ADMIN_QUEUE_QUERY_KEY = ["admin_radio", "queue"] as const;

export function useAdminPlaylists(enabled: boolean) {
  return useQuery<AdminPlaylistsResponse>({
    queryKey: ADMIN_PLAYLISTS_QUERY_KEY,
    queryFn: adminFetchPlaylists,
    enabled,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useAdminMediaCatalog(enabled: boolean) {
  return useQuery<AdminMediaSearchResponse>({
    queryKey: ADMIN_MEDIA_QUERY_KEY,
    queryFn: () => adminSearchMedia("", null, 1000),
    enabled,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useAdminQueue(enabled: boolean) {
  return useQuery<AdminQueueItem[]>({
    queryKey: ADMIN_QUEUE_QUERY_KEY,
    queryFn: adminFetchQueue,
    enabled,
    staleTime: 1000 * 10,
    refetchInterval: enabled ? 15000 : false,
    retry: 1,
  });
}

export function useAdminSkipNext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminSkipNext,
    onSuccess: async () => {
      await refreshNowPlayingState();
      void queryClient.invalidateQueries({ queryKey: ADMIN_QUEUE_QUERY_KEY });
      window.setTimeout(() => {
        void refreshNowPlayingState();
        void queryClient.invalidateQueries({ queryKey: ADMIN_QUEUE_QUERY_KEY });
      }, 1500);
    },
  });
}

export function useAdminEnqueueTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaId: string | number) => adminEnqueueTrack(mediaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_QUEUE_QUERY_KEY });
    },
  });
}

export function useAdminDeleteQueueItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string | number) => adminDeleteQueueItem(itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_QUEUE_QUERY_KEY });
    },
  });
}

export function useAdminUploadTrack() {
  const queryClient = useQueryClient();

  return useMutation<AdminUploadResponse, Error, AdminUploadTrackInput>({
    mutationFn: (input) => adminUploadTrack(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_MEDIA_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ADMIN_PLAYLISTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ADMIN_QUEUE_QUERY_KEY });
    },
  });
}

export function useAdminVoiceNote() {
  const queryClient = useQueryClient();

  return useMutation<AdminVoiceNoteResponse, Error, AdminVoiceNoteInput>({
    mutationFn: (input) => adminUploadVoiceNote(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_QUEUE_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ADMIN_MEDIA_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ADMIN_PLAYLISTS_QUERY_KEY });
    },
  });
}
