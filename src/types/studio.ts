// ==========================================
// STUDIO DAW & AI TYPES (src/types/studio.ts)
// ==========================================

export type InstrumentId =
  | "kick"
  | "snare"
  | "hihat_closed"
  | "hihat_open"
  | "clap"
  | "bass808"
  | "synth_lead"
  | "perc";

export type InstrumentCategory = "drum" | "bass" | "synth" | "fx";

export interface PianoRollNote {
  id: string;
  step: number;       // 0 to 15 (or 31)
  pitch: number;      // MIDI note number (e.g. 60 = C4, 48 = C3)
  noteName: string;   // e.g. "C3", "F#3"
  duration: number;   // In steps (usually 1 or 2)
  velocity: number;   // 0.0 to 1.0
}

export interface TrackChannel {
  id: InstrumentId;
  name: string;
  shortName: string;
  category: InstrumentCategory;
  color: string;
  accentColor: string;
  muted: boolean;
  solo: boolean;
  volume: number;     // 0.0 to 1.0
  pan: number;        // -1.0 to 1.0
  steps: boolean[];   // Length 16 or 32
  notes: PianoRollNote[];
}

export type PlaybackMode = "PAT" | "SONG";

export interface DawState {
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
  swing: number;          // 0 to 100%
  stepsCount: number;     // 16 default
  metronome: boolean;
  masterVolume: number;   // 0.0 to 1.0
  mode: PlaybackMode;
}

export type MusicGenrePreset =
  | "trap"
  | "punk_rock"
  | "boombap"
  | "dembow"
  | "cyberpunk_drill"
  | "synthwave";

export interface AiGenerationConfig {
  prompt: string;
  genre: MusicGenrePreset;
  bpm: number;
  density: "sparse" | "balanced" | "dense";
  includeBass: boolean;
  includeMelody: boolean;
  apiEndpoint?: string; // Optional custom endpoint
}

export interface MidiEvent {
  step: number;
  pitch: number;
  velocity: number;
  duration: number;
  channel: number;
}

// ==========================================
// C-STATION PLUGINS ECOSYSTEM
// ==========================================
export type PluginModalId = "c_bass" | "c_drums" | "c_sampler" | "c_digger" | null;

// 1. C-BASS IA
export type BassModelType =
  | "sub_808"
  | "acid_303"
  | "reese_dnb"
  | "punk_dist"
  | "slap_funk"
  | "rolling_synthwave";

export interface CBassParams {
  type: BassModelType;
  cutoff: number;      // 50 to 5000 Hz
  resonance: number;   // 0.1 to 20 Q
  drive: number;       // 0 to 100% saturation
  glide: number;       // 0 to 300 ms portamento
  subOctave: number;   // 0 to 100% sub blend
  decay: number;       // 0.1 to 2.5s
  volume: number;      // 0 to 1
}

// 2. C-DRUMS IA
export type DrumKitType =
  | "trap_808"
  | "punk_raw"
  | "boombap_vinyl"
  | "uk_drill"
  | "dembow_latin"
  | "retrowave_80s";

export interface CDrumsParams {
  kit: DrumKitType;
  tuning: number;      // -12 to +12 semitones
  snappiness: number;  // 0 to 100%
  punch: number;       // 0 to 100%
  reverb: number;      // 0 to 100%
  humanize: number;    // 0 to 100%
  volume: number;
}

// 3. C-SAMPLER (Serato Sampler Replica)
export interface SamplerCuePoint {
  id: number;          // 1 to 16
  name: string;
  startSec: number;
  endSec?: number;
  color: string;
  active: boolean;
  keyNote?: string;
}

export type SamplerTriggerMode = "hold" | "one_shot" | "full_track" | "trigger";

export type Akai16LevelsType = "tune" | "velocity" | "filter" | "decay";

export interface CSamplerParams {
  sampleName: string;
  pitchSemi: number;   // -12 to +12
  timeStretch: number; // 0.5x to 2.0x
  mode: SamplerTriggerMode;
  volume: number;
  filterCutoff: number;
}

export interface DiggerMiniPad {
  id: number;
  timeSec: number;
  label: string;
  color: string;
}

// 4. C-DIGGER (Samplette-inspired YouTube Crate Digger & Stem Sampler)
export interface CuratorChannel {
  id: string;
  name: string;
  handle: string;
  channelId?: string;
  genre: string;
  country: string;
  description: string;
  verified: boolean;
  featuredTrackIds: string[];
}

export interface DiggerTrack {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  genre: string;
  decade: string;
  year?: number;
  country: string;
  bpm: number;
  key: string;
  views?: string;
  obscurity?: "ultra_rare" | "rare" | "known";
  description: string;
  durationSec: number;
  miniPads?: DiggerMiniPad[];
  curator?: string;
  curatorHandle?: string;
}

export interface PlayedHistoryItem {
  id: string;
  youtubeId: string;
  title: string;
  artist: string;
  genre: string;
  country: string;
  decade?: string;
  bpm?: number;
  key?: string;
  playedAt: number;
}

export interface LoadedSampleData {
  name: string;
  buffer: AudioBuffer | null;
  cues?: SamplerCuePoint[];
  trackInfo?: Partial<DiggerTrack>;
}

// ==========================================
// 5. C-STEMS IA (SERATO STEMS 4-WAY SEPARATOR)
// ==========================================
export type StemType = "drums" | "bass" | "melody" | "vocals";

export interface StemTrack {
  id: StemType;
  name: string;
  shortLabel: string;
  color: string;
  icon: string;
  muted: boolean;
  solo: boolean;
  volume: number; // 0.0 to 1.0
  buffer: AudioBuffer | null;
  peaks: number[]; // Array de amplitudes normalizadas (0 a 1) para visualización de onda
}

export interface StemsSeparationResult {
  drums: AudioBuffer | null;
  bass: AudioBuffer | null;
  melody: AudioBuffer | null;
  vocals: AudioBuffer | null;
  durationSec: number;
  sampleRate: number;
}

// ==========================================
// 6. YOUTUBE IFRAME API TYPES (Samplette Architecture)
// ==========================================
export interface YTPlayer {
  loadVideoById(args: string | { videoId: string; startSeconds?: number; endSeconds?: number }): void;
  cueVideoById(args: string | { videoId: string; startSeconds?: number; endSeconds?: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(volume: number): void;
  getVolume(): number;
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
  getIframe(): HTMLIFrameElement;
}

export interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId?: string;
          width?: string | number;
          height?: string | number;
          host?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: YTPlayerEvent) => void;
            onError?: (event: YTPlayerEvent) => void;
          };
        }
      ) => YTPlayer;
      PlayerState?: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
      ready?: (fn: () => void) => void;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

