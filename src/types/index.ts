export interface Station {
  id: string;
  name: string;
  frequency: string;
  description: string;
  imageUrl: string;
  isLiked: boolean;
  style: string;
}

export interface ProgramSegment {
  time?: string;
  icon?: string;
  control: string;
  locution: string;
}

export interface RadioProgram {
  id: string;
  title: string;
  host: string;
  timeSlot: string;
  genre: string;
  imageUrl: string;
  description: string;
  slogan?: string;
  hostBio?: string;
  hostHobbies?: string[];
  hostRole?: string;
  showStructure?: string;
  segments?: ProgramSegment[];
}

export interface PastBroadcast {
  id: string;
  programId: string;
  title: string;
  date: string;
  duration: string;
  audioUrl: string;
}

export interface TrackInfo {
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  streamUrl: string;
  isLive: boolean;
  stationId?: string;
  type?: "live" | "station" | "album_song" | "past_broadcast" | "vip_exclusive" | "vip_jukebox";
  vipRequester?: string;
  dedication?: string;
  isVipSong?: boolean;
}

export type CurrentTrack = TrackInfo;

export interface VipSongRequest {
  id: string;
  title: string;
  artist: string;
  requestedBy: string;
  userAvatar?: string;
  dedication?: string;
  audioUrl: string;
  coverUrl: string;
  durationSeconds?: number;
  status: "queued" | "playing" | "played";
  createdAt: string;
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
  id?: string;
  name: string;
  role: string;
  bio?: string;
  avatarUrl: string;
  stashHours: number;
  followersCount: string;
}

export interface VoiceGreeting {
  id: string;
  senderName: string;
  senderUid?: string | null;
  senderRole?: string;
  audioUrl: string;
  durationSeconds: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  transcript?: string;
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
  voiceAudioUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  rotation: number;
  description: string;
  colors: string[];
  sizes: string[];
  variantImages?: Record<string, string>;
  badge?: string;
  isFeatured?: boolean;
  driveFileId?: string;
  specs?: string;
  careInstructions?: string;
}

export interface CartItem {
  id: string; // Combinación: idProducto-color-talla
  product: {
    id: string;
    name: string;
    price: string; // ej. "$25.00"
    imageUrl: string;
  };
  color: string;
  size: string;
  quantity: number;
}

export interface SocketChatMessage {
  id?: number;
  senderName: string;
  senderRole?: string;
  messageText: string;
  timestamp?: string;
}

export interface SocketChatConfig {
  isSlowMode?: boolean;
  isEmoteOnly?: boolean;
}

export interface MusicScheduleBlock {
  id: string;
  timeSlot: string;
  startHour: number; // 0-23
  endHour: number;   // 0-24 (e.g. 1 means 01:00 next day)
  name: string;
  subtitle?: string;
  genres: string[];
  energyLevel: "Alta" | "Media" | "Media-Baja" | "Muy Alta" | "Baja" | "Automatizada";
  energyDescription: string;
  bpmInfo?: string;
  period: "morning" | "workday" | "lunch" | "afternoon" | "primetime" | "night" | "autodj";
  iconName?: string;
  tagColor?: string;
  badge?: string;
}

export interface DayOfWeekItem {
  id: string;
  label: string;
  short: string;
  dayIndex: number;
  isWeekend: boolean;
  hasSpecialShows?: boolean;
}

export interface HourlyMusicItem {
  timeText: string;
  title: string;
  daysText: string;
  genres: string;
  description: string;
  host?: string;
  isSpecialShow?: boolean;
  badgeText?: string;
}

export interface SpecialProgramSchedule {
  id: string;
  title: string;
  host: string;
  timeText: string;
  genre: string;
  isLiveRightNow: boolean;
}
