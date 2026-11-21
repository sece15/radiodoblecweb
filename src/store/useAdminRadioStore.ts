import { create } from "zustand";
import type { AdminUploadResponse } from "@/types/adminRadio";

export type AdminPlayerTab = "search" | "upload" | "voice" | "queue";

export interface AdminPlayerFeedback {
  type: "success" | "error";
  text: string;
}

interface AdminRadioStoreState {
  activeTab: AdminPlayerTab;
  searchQuery: string;
  selectedFilterPlaylistId: string;
  enqueuingId: string | number | null;
  enqueuedIds: Record<string, boolean>;
  selectedUploadPlaylistId: number | null;
  uploadFolder: string;
  uploadArtist: string;
  uploadTitle: string;
  enqueueNext: boolean;
  lastUploadResult: AdminUploadResponse | null;
  feedback: AdminPlayerFeedback | null;

  setActiveTab: (tab: AdminPlayerTab) => void;
  setSearchQuery: (q: string) => void;
  setSelectedFilterPlaylistId: (playlistId: string) => void;
  setEnqueuingId: (id: string | number | null) => void;
  markTrackEnqueued: (id: string | number) => void;
  setSelectedUploadPlaylistId: (id: number | null) => void;
  setUploadFolder: (folder: string) => void;
  setUploadArtist: (artist: string) => void;
  setUploadTitle: (title: string) => void;
  setEnqueueNext: (enqueue: boolean) => void;
  setLastUploadResult: (result: AdminUploadResponse | null) => void;
  setFeedback: (feedback: AdminPlayerFeedback | null) => void;
  resetUploadMetadata: () => void;
}

export const useAdminRadioStore = create<AdminRadioStoreState>((set) => ({
  activeTab: "search",
  searchQuery: "",
  selectedFilterPlaylistId: "",
  enqueuingId: null,
  enqueuedIds: {},
  selectedUploadPlaylistId: null,
  uploadFolder: "lo_mas_nuevo",
  uploadArtist: "",
  uploadTitle: "",
  enqueueNext: true,
  lastUploadResult: null,
  feedback: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedFilterPlaylistId: (selectedFilterPlaylistId) =>
    set({ selectedFilterPlaylistId }),
  setEnqueuingId: (enqueuingId) => set({ enqueuingId }),
  markTrackEnqueued: (id) =>
    set((state) => ({
      enqueuedIds: { ...state.enqueuedIds, [String(id)]: true },
    })),
  setSelectedUploadPlaylistId: (selectedUploadPlaylistId) =>
    set({ selectedUploadPlaylistId }),
  setUploadFolder: (uploadFolder) => set({ uploadFolder }),
  setUploadArtist: (uploadArtist) => set({ uploadArtist }),
  setUploadTitle: (uploadTitle) => set({ uploadTitle }),
  setEnqueueNext: (enqueueNext) => set({ enqueueNext }),
  setLastUploadResult: (lastUploadResult) => set({ lastUploadResult }),
  setFeedback: (feedback) => set({ feedback }),
  resetUploadMetadata: () => set({ uploadArtist: "", uploadTitle: "" }),
}));
