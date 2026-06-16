"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { io, Socket } from "socket.io-client";

// Define Types
export interface Station {
  id: string;
  name: string;
  frequency: string;
  description: string;
  imageUrl: string;
  isLiked: boolean;
  style: string;
}

export interface RadioProgram {
  id: string;
  title: string;
  host: string;
  timeSlot: string;
  genre: string;
  imageUrl: string;
  description: string;
}

export interface PastBroadcast {
  id: string;
  programId: string;
  title: string;
  date: string;
  duration: string;
  audioUrl: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumName: string;
  imageUrl: string;
  streamUrl: string;
  isFavorite: boolean;
  durationSeconds: number;
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  imageUrl: string;
  releaseYear: string;
  genre: string;
}

export interface UserProfile {
  name: string;
  role: string;
  avatarUrl: string;
  stashHours: number;
  followersCount: string;
}

export interface ChatMessage {
  id: number;
  senderName: string;
  senderRole: string;
  messageText: string;
  senderUid?: string | null;
  stationId: string;
  createdAt: string;
  isDeleted: boolean;
}

interface AudioContextType {
  // Audio state
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

  // Audio actions
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

  // Local-first DB tables (Room state)
  stations: Station[];
  programs: RadioProgram[];
  pastBroadcasts: PastBroadcast[];
  songs: Song[];
  albums: Album[];
  userProfile: UserProfile;
  playlistTracks: { id: number; title: string; artist: string; album: string; imageUrl: string }[];
  chatMessages: ChatMessage[];

  // Database operations
  toggleStationLike: (stationId: string) => void;
  toggleSongFavorite: (songId: string) => void;
  addCurrentTrackToPlaylist: () => void;
  deleteTrackFromPlaylist: (id: number) => void;
  saveProfile: (name: string, role: string, avatarUrl: string, hours: number, followers: string) => void;
  updateUserRole: (newRole: string) => void;

  // Chat socket & moderation configurations
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

  // Supabase Auth
  isAuthenticated: boolean;
  signOut: () => void;
  signInWithGoogle: () => void;
  signInWithEmail: (email: string) => void;

  // Live status / now playing metadata
  isStreamerLive: boolean;
  liveShowName: string;
  liveTrackTitle: string;
  liveStatusText: string;
  listenersCount: number;
  scanState: string;
  activeTheme: string;
  selectTheme: (themeName: string) => void;
  changeVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Supabase Init
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Initial Lists
const INITIAL_STATIONS: Station[] = [
  {
    id: "subterraneo",
    name: "Subterraneo Rock",
    frequency: "99.1 FM",
    description: "Solo lo que las disqueras odian. 24/7 de distorsión pura.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEwx7PRgZwc3Fq5lf-LteMcltfrm-d19hJSZ5AGRSGyOZ7oZxj7sHycotYD7EDmkliWOl0WXEO2kOzVE1mDXM00Uig4z44AZHZoxYfHKE8vfVxzFpkpIW7vdQFGA9piEEDHfoqNYJoOywV4f5QFWHZSs9EvvT3yt9zl_sb4tCcgjY-2PWAOBxxXp_gwAHJvuV6NbXax2Rk49MbXIaFBgKFcgNL9C9xFp8kH_h5qWJJ4GCWcqmJ2Dvb8-TQ9fpEZFNcUiYImzJUOQSH",
    isLiked: false,
    style: "ROCK N' ROLL",
  },
  {
    id: "neonpop",
    name: "Neon Pop",
    frequency: "102.5 FM",
    description: "Burbujas, brillo y sintetizadores que te harán vibrar el cráneo.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHgkKkWI_L4cptOscww4Dqg9x_1l7Emt7I7f7cP8GxYKYJzFfwnp8agBIhRPcjZJzeTgH-zj8nOeiRn7iwvHmoEpiRlSp1Kjb5TTmrMRR_oAUbZKBCZY4iDX3OZoIVLWsBpfKMB4fbJ4WN66-s_w6SyWu1T0VwPmyENDkyz3VVWSRm2UBEuqa-pewg9z6FZLUb-gOuZUtWz13j1vBrHEHV2UoAfLcYLgMRYvBzFCKJ-fFwRueGTkM-KTLbprP3-qLFhpJIIjdgRMKg",
    isLiked: true,
    style: "POP TRASH",
  },
  {
    id: "berlin",
    name: "Berlin Brutal",
    frequency: "88.8 FM",
    description: "Ritmos industriales grabados en sótanos abandonados.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP5uqy10MAsI_x_MDmv3GUkMl0tbrhB4Ec956sMPCsxdGlc08vXZjcHtzIALHzom5LlwJFu9uaZyI4MDwKrnpzWl-t9Og2VRWKuJqEMWxwOSjXF0jStgRCxict6yaAbmMtaUC_Yh0c_FRU4i9SBx6FiBBN_-QB_f5kAALQEsGI9a7aG9md2Iuugg2BWCVDTSGKaAhJzV7uXZYOlff2WNDjpjVK9XCYM-CIV_zDTNGZiYHu5M7u7L4T6FS2AYz3h5EcCYnBy7m9tI2m",
    isLiked: false,
    style: "TECHNO CORE",
  },
];

const INITIAL_PROGRAMS: RadioProgram[] = [
  {
    id: "callejon",
    title: "El Callejón del Ritmo",
    host: "DJ Flaco",
    timeSlot: "SÁBADOS 22:00 - 00:00",
    genre: "HIP HOP UNDERGROUND",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEwx7PRgZwc3Fq5lf-LteMcltfrm-d19hJSZ5AGRSGyOZ7oZxj7sHycotYD7EDmkliWOl0WXEO2kOzVE1mDXM00Uig4z44AZHZoxYfHKE8vfVxzFpkpIW7vdQFGA9piEEDHfoqNYJoOywV4f5QFWHZSs9EvvT3yt9zl_sb4tCcgjY-2PWAOBxxXp_gwAHJvuV6NbXax2Rk49MbXIaFBgKFcgNL9C9xFp8kH_h5qWJJ4GCWcqmJ2Dvb8-TQ9fpEZFNcUiYImzJUOQSH",
    description: "El callejón con los beats analógicos más crudos de la estación. Frecuencia real urbana.",
  },
  {
    id: "berlin_ind",
    title: "Berlín Industrial",
    host: "Eva Schatten",
    timeSlot: "VIERNES 23:00 - 02:00",
    genre: "HEAVY TECHNO CORE",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP5uqy10MAsI_x_MDmv3GUkMl0tbrhB4Ec956sMPCsxdGlc08vXZjcHtzIALHzom5LlwJFu9uaZyI4MDwKrnpzWl-t9Og2VRWKuJqEMWxwOSjXF0jStgRCxict6yaAbmMtaUC_Yh0c_FRU4i9SBx6FiBBN_-QB_f5kAALQEsGI9a7aG9md2Iuugg2BWCVDTSGKaAhJzV7uXZYOlff2WNDjpjVK9XCYM-CIV_zDTNGZiYHu5M7u7L4T6FS2AYz3h5EcCYnBy7m9tI2m",
    description: "Sets directos grabados en sótanos oscuros y búnkeres abandonados. Distorsión maquinal.",
  },
  {
    id: "distorsion_punk",
    title: "Distorsión Punk",
    host: "Capitán Doble C",
    timeSlot: "SÁBADOS 20:00 - 22:00",
    genre: "ELECTRO PUNK / GARAGE",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR",
    description: "Espacio pirata con fanzine sonoro y los ritmos punk sintéticos más rebeldes.",
  },
  {
    id: "cosmico",
    title: "Sintético Cósmico",
    host: "Lyra Volt",
    timeSlot: "JUEVES 21:00 - 23:00",
    genre: "COSMIC AMBIENT",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHgkKkWI_L4cptOscww4Dqg9x_1l7Emt7I7f7cP8GxYKYJzFfwnp8agBIhRPcjZJzeTgH-zj8nOeiRn7iwvHmoEpiRlSp1Kjb5TTmrMRR_oAUbZKBCZY4iDX3OZoIVLWsBpfKMB4fbJ4WN66-s_w6SyWu1T0VwPmyENDkyz3VVWSRm2UBEuqa-pewg9z6FZLUb-gOuZUtWz13j1vBrHEHV2UoAfLcYLgMRYvBzFCKJ-fFwRueGTkM-KTLbprP3-qLFhpJIIjdgRMKg",
    description: "Viaje mental guiado por sintetizadores y ondas analógicas espaciales.",
  },
];

const INITIAL_PAST_BROADCASTS: PastBroadcast[] = [
  { id: "callejon_1", programId: "callejon", title: "El Callejón: Beats de Asfalto", date: "Ayer", duration: "01:24:10", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "callejon_2", programId: "callejon", title: "El Callejón: Scratching analógico", date: "Hace 3 días", duration: "01:10:45", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "berlin_1", programId: "berlin_ind", title: "Berlín Ind: Búnker Subterráneo", date: "Hace 2 días", duration: "01:45:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "berlin_2", programId: "berlin_ind", title: "Berlín Ind: Ruido Industrial", date: "Hace 5 days", duration: "01:30:15", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: "punk_1", programId: "distorsion_punk", title: "Punk: Fanzine Sonoro", date: "Hace 4 días", duration: "00:58:30", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { id: "cosmico_1", programId: "cosmico", title: "Cósmico: Sintetizadores del Vacío", date: "Hace 1 semana", duration: "02:00:15", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
];

const INITIAL_ALBUMS: Album[] = [
  {
    id: "berlin_set",
    name: "Berlín Underground",
    artist: "Schatten DJ",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP5uqy10MAsI_x_MDmv3GUkMl0tbrhB4Ec956sMPCsxdGlc08vXZjcHtzIALHzom5LlwJFu9uaZyI4MDwKrnpzWl-t9Og2VRWKuJqEMWxwOSjXF0jStgRCxict6yaAbmMtaUC_Yh0c_FRU4i9SBx6FiBBN_-QB_f5kAALQEsGI9a7aG9md2Iuugg2BWCVDTSGKaAhJzV7uXZYOlff2WNDjpjVK9XCYM-CIV_zDTNGZiYHu5M7u7L4T6FS2AYz3h5EcCYnBy7m9tI2m",
    releaseYear: "2025",
    genre: "Industrial Techno",
  },
  {
    id: "fanzine_4",
    name: "Fanzine Vol. 4",
    artist: "La Banda Rebel",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR",
    releaseYear: "2026",
    genre: "Electro Punk",
  },
];

const INITIAL_SONGS: Song[] = [
  {
    id: "heartbeat",
    title: "Cybernetic Heartbeat",
    artist: "Schatten DJ",
    albumName: "Berlín Underground",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP5uqy10MAsI_x_MDmv3GUkMl0tbrhB4Ec956sMPCsxdGlc08vXZjcHtzIALHzom5LlwJFu9uaZyI4MDwKrnpzWl-t9Og2VRWKuJqEMWxwOSjXF0jStgRCxict6yaAbmMtaUC_Yh0c_FRU4i9SBx6FiBBN_-QB_f5kAALQEsGI9a7aG9md2Iuugg2BWCVDTSGKaAhJzV7uXZYOlff2WNDjpjVK9XCYM-CIV_zDTNGZiYHu5M7u7L4T6FS2AYz3h5EcCYnBy7m9tI2m",
    streamUrl: "https://stream.zeno.fm/4sqc41bg84zuv",
    isFavorite: true,
    durationSeconds: 184,
  },
  {
    id: "reverb",
    title: "Rhythm & Reverb",
    artist: "La Banda Rebel",
    albumName: "Fanzine Vol. 4",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR",
    streamUrl: "https://stream.zeno.fm/4sqc41bg84zuv",
    isFavorite: false,
    durationSeconds: 212,
  },
  {
    id: "acid_dance",
    title: "Neon Acid Dance",
    artist: "Schatten DJ",
    albumName: "Berlín Underground",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP5uqy10MAsI_x_MDmv3GUkMl0tbrhB4Ec956sMPCsxdGlc08vXZjcHtzIALHzom5LlwJFu9uaZyI4MDwKrnpzWl-t9Og2VRWKuJqEMWxwOSjXF0jStgRCxict6yaAbmMtaUC_Yh0c_FRU4i9SBx6FiBBN_-QB_f5kAALQEsGI9a7aG9md2Iuugg2BWCVDTSGKaAhJzV7uXZYOlff2WNDjpjVK9XCYM-CIV_zDTNGZiYHu5M7u7L4T6FS2AYz3h5EcCYnBy7m9tI2m",
    streamUrl: "https://stream.zeno.fm/4sqc41bg84zuv",
    isFavorite: false,
    durationSeconds: 156,
  },
];

const DEFAULT_BANNED_WORDS = [
  "spam", "toxico", "sonico", "sonica", "hack", "virus", "puta", "puto",
  "mamahuevo", "hijoeputa", "marica", "maricon", "paja", "pajero", "culo", "coño", "verga"
];

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuA6srmeb-vk1Q2DfS7yC25Domf9c0kLipds57TXJh5KR9tiwF0baTSxCYrkymfzHxHofWx2YGAQDG57_xmYQtC9MQx8VQPS6a0rLLTKzaPewxsyENt8isBr4H-DAbKm6rLb-w9dsT6EiKYAAbHSbGQA863cyUibAznEG1WcAP_Dj4yODOI3MVpRgwobV6sGpli8fKGgEMGNGPG7wXpGs26dibxLVsd1eiJZvnFe-8M6cXt8AYRNIw6JQ294dBMMJ4TD46rF6izIPJeP";

const DEFAULT_STREAM = process.env.NEXT_PUBLIC_STREAM_URL || "http://31.220.77.18:8000/radio.mp3";

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Audio Ref & HLS Loader
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<any>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState({
    title: "ELECTRO PUNK ZINE",
    album: "DOBLE C SESSIONS VOL. 4",
    artist: "Capitán Doble C",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR",
    streamUrl: DEFAULT_STREAM,
    isLive: true,
  });

  const [progress, setProgress] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(1);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Room DB seed data
  const [stations, setStations] = useState<Station[]>(INITIAL_STATIONS);
  const [programs, setPrograms] = useState<RadioProgram[]>(INITIAL_PROGRAMS);
  const [pastBroadcasts, setPastBroadcasts] = useState<PastBroadcast[]>(INITIAL_PAST_BROADCASTS);
  const [songs, setSongs] = useState<Song[]>(INITIAL_SONGS);
  const [albums, setAlbums] = useState<Album[]>(INITIAL_ALBUMS);
  const [playlistTracks, setPlaylistTracks] = useState<{ id: number; title: string; artist: string; album: string; imageUrl: string }[]>([]);
  
  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "PETER ARKWALL",
    role: "RADIO EXPLORER / VINYL JUNKIE",
    avatarUrl: DEFAULT_AVATAR,
    stashHours: 124,
    followersCount: "1.2K",
  });

  // Theme Config
  const [activeTheme, setActiveTheme] = useState("PUNK_NEON");

  // Chat/Mod Configuration
  const [isLiveChatModeActive, setLiveChatModeActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>(DEFAULT_BANNED_WORDS);
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<number>>(new Set());
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [isEmoteOnly, setIsEmoteOnly] = useState(false);
  const [isLinksAllowed, setIsLinksAllowed] = useState(true);
  const [isCurrentUserBanned, setIsCurrentUserBanned] = useState(false);
  const [isModPanelVisible, setModPanelVisible] = useState(false);

  // Polled Live details
  const [isStreamerLive, setIsStreamerLive] = useState(false);
  const [liveShowName, setLiveShowName] = useState("UNDERGROUND ANTISYSTEM");
  const [liveTrackTitle, setLiveTrackTitle] = useState("TRANSYLVANIA TECHNO - DJ BLOODY");
  const [liveStatusText, setLiveStatusText] = useState("02:44:12 ON AIR");
  const [listenersCount, setListenersCount] = useState(12);
  const [scanState, setScanState] = useState("SCANNING...");

  // Supabase Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // References for WebSocket chat
  const socketRef = useRef<Socket | null>(null);

  // Initialize browser elements
  useEffect(() => {
    // 1. Audio element
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    // Load persisted local-first items
    const savedLikes = localStorage.getItem("liked_stations");
    if (savedLikes) {
      const parsed = JSON.parse(savedLikes);
      setStations(prev => prev.map(s => ({ ...s, isLiked: parsed.includes(s.id) })));
    }
    const savedFavorites = localStorage.getItem("fav_songs");
    if (savedFavorites) {
      const parsed = JSON.parse(savedFavorites);
      setSongs(prev => prev.map(s => ({ ...s, isFavorite: parsed.includes(s.id) })));
    }
    const savedPlaylist = localStorage.getItem("playlist_tracks");
    if (savedPlaylist) {
      setPlaylistTracks(JSON.parse(savedPlaylist));
    }
    const savedProfile = localStorage.getItem("user_profile");
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
    const savedTheme = localStorage.getItem("selected_theme");
    if (savedTheme) {
      setActiveTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "PUNK_NEON");
    }
    const savedBannedWords = localStorage.getItem("banned_words");
    if (savedBannedWords) {
      setBannedWords(JSON.parse(savedBannedWords));
    }

    // 2. Playback progress ticks simulator
    const progressInterval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        if (currentTrack.isLive) {
          // Live stream total grows
          setTotalTime(prev => {
            const nextTotal = prev + 1;
            setCurrentTime(curr => {
              // If at live edge, follow it
              if (curr >= prev - 2) {
                setProgress(1.0);
                return nextTotal;
              } else {
                const nextCurr = curr + 1;
                setProgress(nextCurr / nextTotal);
                return nextCurr;
              }
            });
            return nextTotal;
          });
        } else {
          // Static song/broadcast
          const curr = Math.floor(audioRef.current.currentTime);
          const dur = Math.floor(audioRef.current.duration) || totalTime;
          setCurrentTime(curr);
          setTotalTime(dur);
          setProgress(curr / dur);
        }
      }
    }, 1000);

    // 3. Scan states ticker
    const scanStates = ["SIGNAL OK", "SCANNING...", "NOISE FOUND", "DECODING..."];
    let scanIndex = 1;
    const scanInterval = setInterval(() => {
      setScanState(scanStates[scanIndex]);
      scanIndex = (scanIndex + 1) % scanStates.length;
    }, 3000);

    // 4. AzuraCast Nowplaying metadata poll simulation & fetch attempt
    const pollMetadata = async () => {
      try {
        const azuraUrl = process.env.NEXT_PUBLIC_AZURACAST_URL || "http://31.220.77.18";
        const res = await fetch(`${azuraUrl}/api/nowplaying`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const np = data[0];
            setIsStreamerLive(np.live?.is_live || false);
            setListenersCount(np.listeners?.current || 0);
            if (np.live?.streamer_name) setLiveShowName(np.live.streamer_name);
            if (np.now_playing?.song?.title) {
              setLiveTrackTitle(`${np.now_playing.song.title} - ${np.now_playing.song.artist}`);
            }
            // If current play is live, sync metadata
            if (currentTrack.streamUrl.includes("/live.m3u8") || currentTrack.streamUrl === DEFAULT_STREAM) {
              setCurrentTrack(prev => ({
                ...prev,
                title: np.now_playing?.song?.title || prev.title,
                album: np.now_playing?.song?.album || prev.album,
                artist: np.now_playing?.song?.artist || prev.artist,
                imageUrl: np.now_playing?.song?.art || prev.imageUrl,
              }));
            }
          }
        } else {
          throw new Error("Local API unavailable");
        }
      } catch (err) {
        // Fallback simulated updates
        const mockTracks = [
          { title: "TRANSYLVANIA TECHNO", artist: "DJ BLOODY", album: "TRANSYLVANIA MEGAMIX" },
          { title: "BERLIN BRUTAL SESS", artist: "Eva Schatten", album: "BUNKER SESSIONS" },
          { title: "UNDERGROUND BEATS", artist: "DJ Flaco", album: "CALLEJÓN DEL RITMO" },
        ];
        const randomTrack = mockTracks[Math.floor(Math.random() * mockTracks.length)];
        setLiveTrackTitle(`${randomTrack.title} - ${randomTrack.artist}`);
        setLiveShowName("ESTACIÓN DOBLE C LIVE");
        setListenersCount(Math.floor(Math.random() * 25) + 5);
        setLiveStatusText(`${new Date().toLocaleTimeString()} ON AIR`);
      }
    };
    pollMetadata();
    const metadataInterval = setInterval(pollMetadata, 8000);

    // 5. Supabase Auth state collection
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsAuthenticated(true);
          const meta = session.user.user_metadata;
          const uName = meta.full_name || session.user.email?.split("@")[0] || "Oyente";
          const uAvatar = meta.avatar_url || `https://api.dicebear.com/7.x/bottts/png?seed=${uName}`;
          
          setUserProfile(prev => {
            const updated = {
              ...prev,
              name: uName.toUpperCase(),
              avatarUrl: uAvatar,
            };
            localStorage.setItem("user_profile", JSON.stringify(updated));
            return updated;
          });

          // Connect Socket.IO chat
          connectChatSocket(uName, session.access_token);
        }
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") && session) {
          setIsAuthenticated(true);
          const meta = session.user.user_metadata;
          const uName = meta.full_name || session.user.email?.split("@")[0] || "Oyente";
          const uAvatar = meta.avatar_url || `https://api.dicebear.com/7.x/bottts/png?seed=${uName}`;
          
          setUserProfile(prev => {
            const updated = {
              ...prev,
              name: uName.toUpperCase(),
              avatarUrl: uAvatar,
            };
            localStorage.setItem("user_profile", JSON.stringify(updated));
            return updated;
          });

          connectChatSocket(uName, session.access_token);

          // Clean up URL hash after successful login redirect
          if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
            window.history.replaceState(null, "", window.location.pathname);
          }
        } else if (event === "SIGNED_OUT") {
          setIsAuthenticated(false);
          setUserProfile({
            name: "PETER ARKWALL",
            role: "RADIO EXPLORER / VINYL JUNKIE",
            avatarUrl: DEFAULT_AVATAR,
            stashHours: 124,
            followersCount: "1.2K",
          });
          localStorage.removeItem("user_profile");
          disconnectChatSocket();
        }
      });      return () => {
        subscription.unsubscribe();
        clearInterval(progressInterval);
        clearInterval(scanInterval);
        clearInterval(metadataInterval);
        disconnectChatSocket();
      };
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(scanInterval);
      clearInterval(metadataInterval);
      disconnectChatSocket();
    };
  }, [currentTrack.isLive]);

  // Connect Socket.IO
  const connectChatSocket = (username: string, token: string) => {
    disconnectChatSocket();

    try {
      const chatUrl = process.env.NEXT_PUBLIC_CHAT_URL || "http://localhost:8081";
      console.log(`🔌 Conectando al microservicio de chat en: ${chatUrl}`);
      const socket = io(chatUrl, {
        reconnection: true,
        reconnectionDelay: 2000,
        query: { username, accessToken: token },
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log(`WebSocket chat connected to microservice at ${chatUrl}`);
      });

      socket.on("chat_history", (history: any[]) => {
        const formatted = history.map((h, index) => ({
          id: h.id || index,
          senderName: h.senderName,
          senderRole: h.senderRole || "OYENTE",
          messageText: h.messageText,
          createdAt: h.timestamp || "",
          stationId: "general",
          isDeleted: h.messageText.includes("borrado por moderación"),
        }));
        setChatMessages(formatted);
      });

      socket.on("broadcast_message", (msg: any) => {
        setChatMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [
            ...prev,
            {
              id: msg.id || Date.now(),
              senderName: msg.senderName,
              senderRole: msg.senderRole || "OYENTE",
              messageText: msg.messageText,
              createdAt: msg.timestamp || new Date().toISOString(),
              stationId: "general",
              isDeleted: false,
            },
          ];
        });
      });

      socket.on("message_deleted", ({ messageId }: { messageId: number }) => {
        setDeletedMessageIds(prev => new Set([...prev, messageId]));
        setChatMessages(prev =>
          prev.map(m => (m.id === messageId ? { ...m, messageText: "<Mensaje borrado por moderación>", isDeleted: true } : m))
        );
      });

      socket.on("user_banned", ({ username }: { username: string }) => {
        const upper = username.toUpperCase();
        setBannedUsers(prev => new Set([...prev, upper]));
        setChatMessages(prev => prev.filter(m => m.senderName.toUpperCase() !== upper));
      });

      socket.on("banned_notice", () => {
        setIsCurrentUserBanned(true);
      });

      socket.on("chat_config", (config: any) => {
        if (config.isSlowMode !== undefined) setIsSlowMode(config.isSlowMode);
        if (config.isEmoteOnly !== undefined) setIsEmoteOnly(config.isEmoteOnly);
      });
    } catch (e) {
      console.error("Socket chat failed to boot", e);
    }
  };

  const disconnectChatSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // Play audio implementation
  const playUrl = (url: string, isLive: boolean) => {
    if (!audioRef.current) return;

    // Reset progress tracking states
    setCurrentTime(0);
    setProgress(0);

    // Sync muted state with user choice
    audioRef.current.muted = isMuted;

    // Stop Hls if active
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (url.includes(".m3u8")) {
      // Dynamic import Hls.js
      import("hls.js").then((HlsPackage) => {
        const Hls = HlsPackage.default;
        if (Hls.isSupported()) {
          const hls = new Hls();
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(audioRef.current!);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            audioRef.current!.muted = isMuted;
            audioRef.current!.play();
            setIsPlaying(true);
          });
        } else if (audioRef.current!.canPlayType("application/vnd.apple.mpegurl")) {
          // Native Safari HLS
          audioRef.current!.src = url;
          audioRef.current!.muted = isMuted;
          audioRef.current!.play();
          setIsPlaying(true);
        }
      });
    } else {
      // Standard MP3 streams
      audioRef.current.src = url;
      audioRef.current.muted = isMuted;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Player controls
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      if (currentTrack.isLive) {
        // Mute instead of pause for live stream to keep background stream active at live edge
        audioRef.current.muted = true;
      } else {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (currentTrack.isLive) {
        // Restore user mute preference and ensure playing
        audioRef.current.muted = isMuted;
        audioRef.current.play().catch(err => {
          console.warn("Autoplay blocked, re-requesting stream:", err);
          playUrl(currentTrack.streamUrl, true);
        });
      } else {
        audioRef.current.play();
      }
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    // Keep muted if player is paused, otherwise set to nextMute
    audioRef.current.muted = !isPlaying ? true : nextMute;
  };

  const changeVolume = (v: number) => {
    if (!audioRef.current) return;
    const cleanV = Math.max(0, Math.min(1, v));
    setVolume(cleanV);
    audioRef.current.volume = cleanV;
    if (cleanV > 0 && isMuted) {
      setIsMuted(false);
      if (isPlaying) {
        audioRef.current.muted = false;
      }
    }
  };

  const seekToProgress = (prg: number) => {
    if (!audioRef.current) return;
    const target = prg * totalTime;
    setCurrentTime(Math.floor(target));
    setProgress(prg);

    if (currentTrack.isLive) {
      // HLS seek
      if (hlsRef.current) {
        audioRef.current.currentTime = target;
      }
    } else {
      audioRef.current.currentTime = target;
    }
  };

  const seekBackMinutes = (minutes: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, audioRef.current.currentTime - minutes * 60);
    audioRef.current.currentTime = target;
    setCurrentTime(Math.floor(target));
  };

  const seekToLiveEdge = () => {
    if (!audioRef.current || !currentTrack.isLive) return;
    // Reload live stream to sync live edge
    playUrl(currentTrack.streamUrl, true);
    setCurrentTime(totalTime);
    setProgress(1.0);
  };

  // Play specific feeds
  const playLiveStream = () => {
    const track = {
      title: liveTrackTitle,
      album: liveShowName,
      artist: "Doble C Live",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR",
      streamUrl: DEFAULT_STREAM,
      isLive: true,
    };
    setCurrentTrack(track);
    setTotalTime(1);
    playUrl(track.streamUrl, true);
  };

  const playStation = (station: Station) => {
    const track = {
      title: station.name,
      album: `Frecuencia ${station.frequency} Curada`,
      artist: station.style,
      imageUrl: station.imageUrl,
      streamUrl: DEFAULT_STREAM,
      isLive: true,
    };
    setCurrentTrack(track);
    setTotalTime(1);
    playUrl(track.streamUrl, true);
  };

  const playSong = (song: Song) => {
    const track = {
      title: song.title,
      album: song.albumName,
      artist: song.artist,
      imageUrl: song.imageUrl,
      streamUrl: song.streamUrl,
      isLive: false,
    };
    setCurrentTrack(track);
    setTotalTime(song.durationSeconds);
    playUrl(track.streamUrl, false);
  };

  const playPastBroadcast = (broadcast: PastBroadcast) => {
    const track = {
      title: broadcast.title,
      album: `Emisión del ${broadcast.date}`,
      artist: "Doble C Grabaciones",
      imageUrl: "https://images.unsplash.com/photo-1610116306796-6ebd3051c330?q=80&w=300",
      streamUrl: broadcast.audioUrl,
      isLive: false,
    };
    setCurrentTrack(track);
    
    // Parse duration string to seconds
    const parts = broadcast.duration.split(":");
    let dur = 1800;
    try {
      if (parts.length === 3) {
        dur = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      } else if (parts.length === 2) {
        dur = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
    } catch (e) {}
    setTotalTime(dur);
    playUrl(track.streamUrl, false);
  };

  const playRadar = () => {
    if (stations.length > 0) {
      const rand = stations[Math.floor(Math.random() * stations.length)];
      playStation(rand);
    }
  };

  const skipNext = () => {
    // Berlin Brutal Sess
    const track = {
      title: "BERLIN BRUTAL SESS",
      album: "INDUSTRIAL ARCHIVE",
      artist: "Eva Schatten",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP5uqy10MAsI_x_MDmv3GUkMl0tbrhB4Ec956sMPCsxdGlc08vXZjcHtzIALHzom5LlwJFu9uaZyI4MDwKrnpzWl-t9Og2VRWKuJqEMWxwOSjXF0jStgRCxict6yaAbmMtaUC_Yh0c_FRU4i9SBx6FiBBN_-QB_f5kAALQEsGI9a7aG9md2Iuugg2BWCVDTSGKaAhJzV7uXZYOlff2WNDjpjVK9XCYM-CIV_zDTNGZiYHu5M7u7L4T6FS2AYz3h5EcCYnBy7m9tI2m",
      streamUrl: DEFAULT_STREAM,
      isLive: true,
    };
    setCurrentTrack(track);
    setTotalTime(1);
    playUrl(track.streamUrl, true);
  };

  const skipPrevious = () => {
    // Electro Punk Zine
    const track = {
      title: "ELECTRO PUNK ZINE",
      album: "DOBLE C SESSIONS VOL. 4",
      artist: "Capitán Doble C",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR",
      streamUrl: DEFAULT_STREAM,
      isLive: true,
    };
    setCurrentTrack(track);
    setTotalTime(1);
    playUrl(track.streamUrl, true);
  };

  // Local-First DB toggles
  const toggleStationLike = (id: string) => {
    setStations(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, isLiked: !s.isLiked } : s));
      const likedIds = next.filter(s => s.isLiked).map(s => s.id);
      localStorage.setItem("liked_stations", JSON.stringify(likedIds));
      return next;
    });
  };

  const toggleSongFavorite = (id: string) => {
    setSongs(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
      const favIds = next.filter(s => s.isFavorite).map(s => s.id);
      localStorage.setItem("fav_songs", JSON.stringify(favIds));
      return next;
    });
  };

  const addCurrentTrackToPlaylist = () => {
    setPlaylistTracks(prev => {
      const id = Date.now();
      const track = {
        id,
        title: currentTrack.title,
        artist: currentTrack.artist || "Radio Doble C Guest",
        album: currentTrack.album,
        imageUrl: currentTrack.imageUrl,
      };
      const next = [...prev, track];
      localStorage.setItem("playlist_tracks", JSON.stringify(next));
      return next;
    });
  };

  const deleteTrackFromPlaylist = (id: number) => {
    setPlaylistTracks(prev => {
      const next = prev.filter(t => t.id !== id);
      localStorage.setItem("playlist_tracks", JSON.stringify(next));
      return next;
    });
  };

  const saveProfile = (name: string, role: string, avatarUrl: string, hours: number, followers: string) => {
    const updated = { name, role, avatarUrl, stashHours: hours, followersCount: followers };
    setUserProfile(updated);
    localStorage.setItem("user_profile", JSON.stringify(updated));
  };

  const updateUserRole = (newRole: string) => {
    setUserProfile(prev => {
      const updated = { ...prev, role: newRole };
      localStorage.setItem("user_profile", JSON.stringify(updated));
      return updated;
    });
  };

  // Theme settings
  const selectTheme = (themeName: string) => {
    setActiveTheme(themeName);
    localStorage.setItem("selected_theme", themeName);
    document.documentElement.setAttribute("data-theme", themeName);
  };

  // Banned words & moderation panel actions
  const toggleSlowMode = () => {
    const val = !isSlowMode;
    setIsSlowMode(val);
    if (socketRef.current) socketRef.current.emit("update_config", { isSlowMode: val });
  };
  const toggleEmoteOnly = () => {
    const val = !isEmoteOnly;
    setIsEmoteOnly(val);
    if (socketRef.current) socketRef.current.emit("update_config", { isEmoteOnly: val });
  };
  const toggleLinksAllowed = () => setIsLinksAllowed(prev => !prev);

  const addBannedWord = (word: string) => {
    const trimmed = word.trim().toLowerCase();
    if (trimmed && !bannedWords.includes(trimmed)) {
      const next = [...bannedWords, trimmed];
      setBannedWords(next);
      localStorage.setItem("banned_words", JSON.stringify(next));
    }
  };

  const removeBannedWord = (word: string) => {
    const next = bannedWords.filter(w => w !== word);
    setBannedWords(next);
    localStorage.setItem("banned_words", JSON.stringify(next));
  };

  const banUser = (username: string) => {
    const upper = username.toUpperCase();
    setBannedUsers(prev => new Set([...prev, upper]));
    if (socketRef.current) {
      socketRef.current.emit("ban_user", { username, moderatorName: userProfile.name });
    }
  };

  const unbanUser = (username: string) => {
    const upper = username.toUpperCase();
    setBannedUsers(prev => {
      const next = new Set(prev);
      next.delete(upper);
      return next;
    });
  };

  const deleteMessage = (messageId: number) => {
    setDeletedMessageIds(prev => new Set([...prev, messageId]));
    if (socketRef.current) {
      socketRef.current.emit("delete_message", { messageId, moderatorName: userProfile.name });
    }
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;

    // Check if banned
    const upperName = userProfile.name.toUpperCase();
    if (isCurrentUserBanned || bannedUsers.has(upperName)) return;

    // Banned words filters (client-side fast check)
    const cleanText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[._\-* ]/g, "");
    const containsBanned = bannedWords.some(w => cleanText.includes(w));
    
    const isImmune = userProfile.role.includes("VIP") || userProfile.role.includes("MOD") || userProfile.role.includes("STREAMER") || userProfile.role.includes("ADMIN");
    if (containsBanned && !isImmune) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit("send_message", {
        senderName: userProfile.name,
        senderRole: userProfile.role,
        messageText: text,
        avatarUrl: userProfile.avatarUrl,
      });
    } else {
      // Local simulated offline message mapping
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          senderName: userProfile.name,
          senderRole: userProfile.role,
          messageText: text,
          createdAt: new Date().toISOString(),
          stationId: "general",
          isDeleted: false,
        },
      ]);
    }
  };

  // Auth Operations
  const signInWithGoogle = async () => {
    if (supabase) {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
    }
  };

  const signInWithEmail = async (email: string) => {
    if (supabase) {
      // Seeding a dummy password for direct login matching Deno credentials
      await supabase.auth.signInWithPassword({
        email,
        password: "123456",
      });
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        currentTrack,
        progress,
        currentTime,
        totalTime,
        volume,
        isMuted,
        playLiveStream,
        playStation,
        playSong,
        playPastBroadcast,
        playRadar,
        togglePlayPause,
        toggleMute,
        seekToProgress,
        seekBackMinutes,
        seekToLiveEdge,
        skipNext,
        skipPrevious,
        stations,
        programs,
        pastBroadcasts,
        songs,
        albums,
        userProfile,
        playlistTracks,
        chatMessages,
        toggleStationLike,
        toggleSongFavorite,
        addCurrentTrackToPlaylist,
        deleteTrackFromPlaylist,
        saveProfile,
        updateUserRole,
        isLiveChatModeActive,
        setLiveChatModeActive,
        sendChatMessage,
        bannedWords,
        bannedUsers,
        deletedMessageIds,
        isSlowMode,
        isEmoteOnly,
        isLinksAllowed,
        isCurrentUserBanned,
        isModPanelVisible,
        setModPanelVisible,
        toggleSlowMode,
        toggleEmoteOnly,
        toggleLinksAllowed,
        addBannedWord,
        removeBannedWord,
        banUser,
        unbanUser,
        deleteMessage,
        clearChat,
        isAuthenticated,
        signOut,
        signInWithGoogle,
        signInWithEmail,
        isStreamerLive,
        liveShowName,
        liveTrackTitle,
        liveStatusText,
        listenersCount,
        scanState,
        activeTheme,
        selectTheme,
        changeVolume,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
