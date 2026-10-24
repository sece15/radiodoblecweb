// ==========================================
// RADIO & STREAMING TYPES (src/types/radio.ts)
// ==========================================

export interface NowPlayingSong {
  title: string;
  artist: string;
  album: string;
  art: string;
}

export interface NowPlayingLive {
  is_live: boolean;
  streamer_name: string;
}

export interface NowPlayingListeners {
  current: number;
  real: number;
}

export interface NowPlayingStationPayload {
  listeners: NowPlayingListeners;
  live: NowPlayingLive;
  now_playing: {
    song: NowPlayingSong;
  };
}

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

// ==========================================
// PROGRAMACIÓN Y HORARIOS (SCHEDULE)
// ==========================================
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

// ==========================================
// CONTROL Y ESTADO DE REPRODUCCIÓN (PLAYBACK)
// ==========================================
export interface PlaybackState {
  currentTrack: TrackInfo;
  isPlaying: boolean;
}

export interface UseMediaSessionProps {
  currentTrack: TrackInfo;
  isPlaying: boolean;
  togglePlayPause: () => void;
}

export interface CurrentlyPlayingCardProps {
  currentTrack: CurrentTrack;
  isPlaying: boolean;
  liveStatusText: string;
  onTogglePlayPause: () => void;
}

