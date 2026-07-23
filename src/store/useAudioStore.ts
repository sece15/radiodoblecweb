"use client";

import { useSyncExternalStore } from "react";
import {
  Station,
  RadioProgram,
  PastBroadcast,
  Song,
  Album,
  UserProfile,
  ChatMessage,
} from "@/types";
import {
  INITIAL_STATIONS,
  INITIAL_PROGRAMS,
  INITIAL_PAST_BROADCASTS,
  INITIAL_ALBUMS,
  INITIAL_SONGS,
  DEFAULT_AVATAR,
  DEFAULT_STREAM,
  DEFAULT_BANNED_WORDS,
} from "@/constants";

export interface AudioStoreState {
  // Estado de Audio
  isPlaying: boolean;
  currentTrack: {
    title: string;
    album: string;
    artist: string;
    imageUrl: string;
    streamUrl: string;
    isLive: boolean;
  };
  progress: number;
  currentTime: number;
  totalTime: number;
  volume: number;
  isMuted: boolean;

  // Acciones de Audio
  playLiveStream: () => void;
  playStation: (station: Station) => void;
  playSong: (song: Song) => void;
  playPastBroadcast: (broadcast: PastBroadcast) => void;
  playRadar: () => void;
  togglePlayPause: () => void;
  toggleMute: () => void;
  seekToProgress: (progress: number) => void;
  seekBackMinutes: (minutes: number) => void;
  seekToLiveEdge: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  changeVolume: (volume: number) => void;

  // Datos de la Sala
  stations: Station[];
  programs: RadioProgram[];
  pastBroadcasts: PastBroadcast[];
  songs: Song[];
  albums: Album[];
  userProfile: UserProfile;
  playlistTracks: { id: number; title: string; artist: string; album: string; imageUrl: string }[];
  chatMessages: ChatMessage[];

  // Operaciones de BD Local
  toggleStationLike: (stationId: string) => void;
  toggleSongFavorite: (songId: string) => void;
  addCurrentTrackToPlaylist: () => void;
  deleteTrackFromPlaylist: (id: number) => void;
  saveProfile: (name: string, role: string, avatarUrl: string, hours: number, followers: string) => void;
  updateUserRole: (newRole: string) => void;
  addAlbum: (name: string, artist: string, releaseYear: string, genre: string, imageUrl: string) => void;

  // Moderación y Chat
  isLiveChatModeActive: boolean;
  setLiveChatModeActive: (active: boolean) => void;
  sendChatMessage: (text: string) => void;
  bannedWords: string[];
  bannedUsers: Set<string>;
  deletedMessageIds: Set<number>;
  isSlowMode: boolean;
  isEmoteOnly: boolean;
  isLinksAllowed: boolean;
  isCurrentUserBanned: boolean;
  isModPanelVisible: boolean;
  setModPanelVisible: (visible: boolean) => void;
  toggleSlowMode: () => void;
  toggleEmoteOnly: () => void;
  toggleLinksAllowed: () => void;
  addBannedWord: (word: string) => void;
  removeBannedWord: (word: string) => void;
  banUser: (username: string) => void;
  unbanUser: (username: string) => void;
  deleteMessage: (messageId: number) => void;
  clearChat: () => void;

  // Autenticación y Transmisión en Vivo
  isAuthenticated: boolean;
  signOut: () => void;
  signInWithGoogle: () => void;
  isStreamerLive: boolean;
  liveShowName: string;
  liveTrackTitle: string;
  liveStatusText: string;
  listenersCount: number;
  activeTheme: string;
  selectTheme: (themeName: string) => void;
}

type Listener = () => void;

const noop = () => {};

export const initialStoreState: AudioStoreState = {
  isPlaying: false,
  currentTrack: {
    title: "RADIO DOBLE C",
    album: "RADIO DOBLE C ONLINE",
    artist: "Capitán Doble C",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR",
    streamUrl: DEFAULT_STREAM,
    isLive: true,
  },
  progress: 1.0,
  currentTime: 0,
  totalTime: 1,
  volume: 1.0,
  isMuted: false,

  playLiveStream: noop,
  playStation: noop,
  playSong: noop,
  playPastBroadcast: noop,
  playRadar: noop,
  togglePlayPause: noop,
  toggleMute: noop,
  seekToProgress: noop,
  seekBackMinutes: noop,
  seekToLiveEdge: noop,
  skipNext: noop,
  skipPrevious: noop,
  changeVolume: noop,

  stations: INITIAL_STATIONS,
  programs: INITIAL_PROGRAMS,
  pastBroadcasts: INITIAL_PAST_BROADCASTS,
  songs: INITIAL_SONGS,
  albums: INITIAL_ALBUMS,
  userProfile: {
    name: "PETER ARKWALL",
    role: "RADIO EXPLORER / VINYL JUNKIE",
    avatarUrl: DEFAULT_AVATAR,
    stashHours: 124,
    followersCount: "1.2K",
  },
  playlistTracks: [],
  chatMessages: [],

  toggleStationLike: noop,
  toggleSongFavorite: noop,
  addCurrentTrackToPlaylist: noop,
  deleteTrackFromPlaylist: noop,
  saveProfile: noop,
  updateUserRole: noop,
  addAlbum: noop,

  isLiveChatModeActive: false,
  setLiveChatModeActive: noop,
  sendChatMessage: noop,
  bannedWords: DEFAULT_BANNED_WORDS,
  bannedUsers: new Set(),
  deletedMessageIds: new Set(),
  isSlowMode: false,
  isEmoteOnly: false,
  isLinksAllowed: true,
  isCurrentUserBanned: false,
  isModPanelVisible: false,
  setModPanelVisible: noop,
  toggleSlowMode: noop,
  toggleEmoteOnly: noop,
  toggleLinksAllowed: noop,
  addBannedWord: noop,
  removeBannedWord: noop,
  banUser: noop,
  unbanUser: noop,
  deleteMessage: noop,
  clearChat: noop,

  isAuthenticated: false,
  signOut: noop,
  signInWithGoogle: noop,
  isStreamerLive: false,
  liveShowName: "RADIO DOBLE C ONLINE",
  liveTrackTitle: "RADIO DOBLE C - SEÑAL EN VIVO",
  liveStatusText: "ON AIR",
  listenersCount: 12,
  activeTheme: "PUNK_NEON",
  selectTheme: noop,
};

export type AudioStoreApi = {
  getState: () => AudioStoreState;
  setState: (partial: Partial<AudioStoreState> | ((prev: AudioStoreState) => Partial<AudioStoreState>)) => void;
  subscribe: (listener: Listener) => () => void;
};

export function createAudioStore(initial: AudioStoreState = initialStoreState): AudioStoreApi {
  let currentState = initial;
  const listeners = new Set<Listener>();

  return {
    getState: () => currentState,
    setState: (partial) => {
      const nextPartial = typeof partial === "function" ? partial(currentState) : partial;
      currentState = { ...currentState, ...nextPartial };
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const audioStore = createAudioStore();

export function useAudioStore<U>(selector: (state: AudioStoreState) => U): U {
  return useSyncExternalStore(
    audioStore.subscribe,
    () => selector(audioStore.getState()),
    () => selector(initialStoreState)
  );
}
