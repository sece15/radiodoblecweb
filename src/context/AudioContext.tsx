"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Subscription, Session } from "@supabase/supabase-js";
import { io, Socket } from "socket.io-client";
import type Hls from "hls.js";
import {
  Station,
  RadioProgram,
  PastBroadcast,
  Song,
  Album,
  UserProfile,
  ChatMessage,
  SocketChatMessage,
  SocketChatConfig
} from "@/types";
import {
  INITIAL_STATIONS,
  INITIAL_PROGRAMS,
  INITIAL_PAST_BROADCASTS,
  INITIAL_ALBUMS,
  INITIAL_SONGS,
  DEFAULT_BANNED_WORDS,
  DEFAULT_AVATAR,
  DEFAULT_STREAM
} from "@/constants";
import { useLocalStorage, useLocalStorageToggle } from "@/hooks/useLocalStorage";

// Mapa de portadas personalizadas para canciones que no se encuentran en iTunes ni se emparejan automáticamente
const CUSTOM_ARTWORK_MAP: Record<string, string> = {
  // Formato: "artista - titulo": "URL de la imagen" (todo en minúsculas y sin espacios adicionales)
  // Ejemplos:
  // "nombre artista - cancion": "https://url-de-la-imagen.com/portada.jpg",
  // "grupo amigo - demo track": "/portadas/disco_amigo.jpg",
};

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
  addAlbum: (name: string, artist: string, releaseYear: string, genre: string, imageUrl: string) => void;

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
  // signInWithEmail eliminada (SC-01: tenía contraseña hardcodeada)

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

// Central Supabase client is imported at the top

// Initial lists and defaults are imported from @/constants at the top

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  // Audio Ref & HLS Loader
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

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
  const [stations, toggleStationLike] = useLocalStorageToggle<Station>("liked_stations", INITIAL_STATIONS, "isLiked");
  const [programs] = useState<RadioProgram[]>(INITIAL_PROGRAMS);
  const [pastBroadcasts] = useState<PastBroadcast[]>(INITIAL_PAST_BROADCASTS);
  const [songs, toggleSongFavorite] = useLocalStorageToggle<Song>("fav_songs", INITIAL_SONGS, "isFavorite");
  const [albums, setAlbums] = useLocalStorage<Album[]>("custom_albums", INITIAL_ALBUMS);
  const [playlistTracks, setPlaylistTracks] = useLocalStorage<{ id: number; title: string; artist: string; album: string; imageUrl: string }[]>("playlist_tracks", []);
  
  // User Profile
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>("user_profile", {
    name: "PETER ARKWALL",
    role: "RADIO EXPLORER / VINYL JUNKIE",
    avatarUrl: DEFAULT_AVATAR,
    stashHours: 124,
    followersCount: "1.2K",
  });

  // Theme Config
  const [activeTheme, setActiveTheme] = useLocalStorage<string>("selected_theme", "PUNK_NEON");

  // Chat/Mod Configuration
  const [isLiveChatModeActive, setLiveChatModeActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [bannedWords, setBannedWords] = useLocalStorage<string[]>("banned_words", DEFAULT_BANNED_WORDS);
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

  const disconnectChatSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // Connect Socket.IO
  const connectChatSocket = (username: string, token: string) => {
    disconnectChatSocket();

    try {
      const chatUrl = process.env.NEXT_PUBLIC_CHAT_URL || "http://localhost:8081";
      console.log(`🔌 Conectando al microservicio de chat en: ${chatUrl}`);
      const socket = io(chatUrl, {
        reconnection: true,
        reconnectionDelay: 2000,
        auth: { token }, // SC-07 / V2-07: JWT en auth para que no aparezca en logs de URL
        query: { username },
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log(`WebSocket chat connected to microservice at ${chatUrl}`);
      });

      socket.on("chat_history", (history: SocketChatMessage[]) => {
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

      socket.on("broadcast_message", (msg: SocketChatMessage) => {
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

      socket.on("chat_config", (config: SocketChatConfig) => {
        if (config.isSlowMode !== undefined) setIsSlowMode(config.isSlowMode);
        if (config.isEmoteOnly !== undefined) setIsEmoteOnly(config.isEmoteOnly);
      });
    } catch (e) {
      console.error("Socket chat failed to boot", e);
    }
  };

  // LocalStorage is handled dynamically inside custom hooks

  // Synchronize activeTheme to document element attribute
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", activeTheme);
    }
  }, [activeTheme]);

  // 1. Initialize Audio element once on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Initialize progress simulator, metadata polling, and auth listeners
  useEffect(() => {
    // 2a. Check if this is a popup auth callback (Same Origin or Cross Origin)
    if (typeof window !== "undefined" && window.opener && window.opener !== window) {
      if (supabase) {
        const checkAndClose = (session: Session | null) => {
          if (session) {
            console.log("[OAuth Popup] Session found! Sending message to opener...", session);
            try {
              window.opener.postMessage({ type: "SUPABASE_AUTH_SUCCESS", session }, "*");
              console.log("[OAuth Popup] Message sent successfully. Closing popup shortly...");
              setTimeout(() => {
                window.close();
              }, 250);
            } catch (e) {
              console.error("[OAuth Popup] Error sending message to opener:", e);
              window.close();
            }
          }
        };

        // Try getting session immediately
        supabase.auth.getSession().then(({ data: { session } }) => {
          checkAndClose(session);
        });

        // Also listen to auth changes in case they haven't settled yet
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          checkAndClose(session);
        });

        return () => {
          subscription.unsubscribe();
        };
      }
    }

    // 2b. Playback progress ticks simulator
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
        const azuraUrl = process.env.NEXT_PUBLIC_AZURACAST_URL;
        if (!azuraUrl) return;
        const res = await fetch(`${azuraUrl}/api/nowplaying`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const np = data[0];
            setIsStreamerLive(np.live?.is_live || false);
            setListenersCount(np.listeners?.current || 0);
            if (np.live?.streamer_name) setLiveShowName(np.live.streamer_name);

            const title = np.now_playing?.song?.title || "";
            const artist = np.now_playing?.song?.artist || "";

            if (title) {
              setLiveTrackTitle(`${title} - ${artist}`);
            }

            // Determine cover art URL
            let artUrl = np.now_playing?.song?.art;

            // If it's a relative URL, prepend the AzuraCast base URL
            if (artUrl && artUrl.startsWith("/")) {
              artUrl = `${azuraUrl}${artUrl}`;
            }

            // Force HTTPS to avoid Mixed Content block in production
            if (artUrl && artUrl.startsWith("http://") && typeof window !== "undefined" && window.location.protocol === "https:") {
              artUrl = artUrl.replace("http://", "https://");
            }

            // Check custom mapping first (case-insensitive)
            const customKey = `${artist} - ${title}`.toLowerCase().trim();
            if (CUSTOM_ARTWORK_MAP[customKey]) {
              artUrl = CUSTOM_ARTWORK_MAP[customKey];
            } else {
              // Fallback to iTunes Search API if artUrl is empty or generic/default station image
              const isDefaultOrMissingArt = !artUrl || artUrl.includes("default") || artUrl.includes("generic") || artUrl.includes("station");
              if (artist && title && isDefaultOrMissingArt) {
                try {
                  // Search iTunes API for artist and title
                  const iTunesRes = await fetch(
                    `https://itunes.apple.com/search?term=${encodeURIComponent(artist + " " + title)}&entity=song&limit=1`
                  );
                  if (iTunesRes.ok) {
                    const iTunesData = await iTunesRes.json();
                    if (iTunesData.results && iTunesData.results.length > 0) {
                      // Extract the high-res 500x500 artwork instead of the default 100x100
                      artUrl = iTunesData.results[0].artworkUrl100.replace("100x100bb", "500x500bb");
                    }
                  }
                } catch (e) {
                  console.warn("[iTunes Search] Artwork lookup failed:", e);
                }
              }
            }

            const defaultStationLogo = "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR";
            const finalArtUrl = artUrl || defaultStationLogo;

            // If current play is live, sync metadata
            if (currentTrack.streamUrl.includes("/live.m3u8") || currentTrack.streamUrl === DEFAULT_STREAM) {
              setCurrentTrack(prev => ({
                ...prev,
                title: title || prev.title,
                album: np.now_playing?.song?.album || prev.album,
                artist: artist || prev.artist,
                imageUrl: finalArtUrl,
              }));
            }
          }
        } else {
          throw new Error("Local API unavailable");
        }
      } catch (err) {
        console.warn("AzuraCast metadata poll failed, using mock fallback:", err);
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
    let subscription: Subscription | null = null;

    // Listen for auth success messages from the popup window
    const handleAuthMessage = (event: MessageEvent) => {
      console.log("[Parent Window] Message received:", event.origin, event.data);
      const origin = event.origin;
      const isAllowed = 
        origin === window.location.origin ||
        origin.endsWith("radiodoblec.com") ||
        origin.endsWith("vercel.app") ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:");

      if (!isAllowed) {
        console.warn("[Parent Window] Ignored message from unauthorized origin:", origin);
        return;
      }

      if (event.data?.type === "SUPABASE_AUTH_SUCCESS" && event.data?.session) {
        const session = event.data.session;
        console.log("[Parent Window] Found session in message, setting session in Supabase...");
        if (supabase) {
          supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }).then(({ data, error }) => {
            if (error) {
              console.error("[Parent Window] Supabase setSession error:", error);
            } else {
              console.log("[Parent Window] Supabase session set successfully!", data);
            }
          });
        }
      }
    };
    window.addEventListener("message", handleAuthMessage);

    if (supabase) {
      const client = supabase;
      client.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsAuthenticated(true);
          const meta = session.user.user_metadata;
          const uName = meta.full_name || session.user.email?.split("@")[0] || "Oyente";
          const uAvatar = meta.avatar_url || `https://api.dicebear.com/7.x/bottts/png?seed=${uName}`;
          
          // Fetch actual database role from profiles table and set profile
          client
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()
            .then(({ data, error }) => {
              const dbRole = !error && data?.role ? data.role : "OYENTE";
              setUserProfile(prev => {
                const updated = {
                  ...prev,
                  name: uName.toUpperCase(),
                  avatarUrl: uAvatar,
                  role: dbRole
                };
                localStorage.setItem("user_profile", JSON.stringify(updated));
                return updated;
              });
            });

          // Connect Socket.IO chat
          connectChatSocket(uName, session.access_token);
        } else {
          // Connect as guest if no session
          setIsAuthenticated(false);
          connectChatSocket("Oyente", "guest");
        }
      });
      const { data } = client.auth.onAuthStateChange((event, session) => {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") && session) {
          setIsAuthenticated(true);
          const meta = session.user.user_metadata;
          const uName = meta.full_name || session.user.email?.split("@")[0] || "Oyente";
          const uAvatar = meta.avatar_url || `https://api.dicebear.com/7.x/bottts/png?seed=${uName}`;
          
          // Fetch actual database role from profiles table and set profile
          client
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()
            .then(({ data, error }) => {
              const dbRole = !error && data?.role ? data.role : "OYENTE";
              setUserProfile(prev => {
                const updated = {
                  ...prev,
                  name: uName.toUpperCase(),
                  avatarUrl: uAvatar,
                  role: dbRole
                };
                localStorage.setItem("user_profile", JSON.stringify(updated));
                return updated;
              });
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
          // Connect as guest on logout
          connectChatSocket("Oyente", "guest");
        }
      });
      subscription = data.subscription;
    } else {
      // Connect as guest if supabase is not initialized
      connectChatSocket("Oyente", "guest");
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      window.removeEventListener("message", handleAuthMessage);
      clearInterval(progressInterval);
      clearInterval(scanInterval);
      clearInterval(metadataInterval);
      disconnectChatSocket();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack.isLive]);
  // Play audio implementation
  const playUrl = (url: string) => {
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
      // Si no hay ninguna fuente de audio cargada aún, la cargamos de inmediato.
      // Esto previene que play() falle por fuente vacía y que luego sea bloqueado por políticas de Autoplay.
      if (!audioRef.current.src || audioRef.current.src === window.location.href) {
        playUrl(currentTrack.streamUrl);
        return;
      }

      if (currentTrack.isLive) {
        // Restore user mute preference and ensure playing
        audioRef.current.muted = isMuted;
        audioRef.current.play().catch(err => {
          console.warn("Autoplay blocked, re-requesting stream:", err);
          playUrl(currentTrack.streamUrl);
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
    playUrl(currentTrack.streamUrl);
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
    playUrl(track.streamUrl);
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
    playUrl(track.streamUrl);
  };

  const playSong = (song: Song) => {
    const isPremiumUser =
      userProfile.role.toUpperCase().includes("VIP") ||
      userProfile.role.toUpperCase().includes("ADMIN") ||
      userProfile.role.toUpperCase().includes("MOD") ||
      userProfile.role.toUpperCase().includes("STREAMER");

    if (!isPremiumUser) {
      alert("⭐ Función Premium: Solo los usuarios VIP o Staff de la radio pueden elegir canciones y álbumes a la carta (estilo Spotify Premium). ¡Sigue disfrutando la señal en vivo! 📻");
      return;
    }

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
    playUrl(track.streamUrl);
  };

  const playPastBroadcast = (broadcast: PastBroadcast) => {
    const isPremiumUser =
      userProfile.role.toUpperCase().includes("VIP") ||
      userProfile.role.toUpperCase().includes("ADMIN") ||
      userProfile.role.toUpperCase().includes("MOD") ||
      userProfile.role.toUpperCase().includes("STREAMER");

    if (!isPremiumUser) {
      alert("⭐ Función Premium: Solo los usuarios VIP o Staff de la radio pueden escuchar emisiones pasadas a la carta. ¡Sigue disfrutando la señal en vivo! 📻");
      return;
    }

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
    } catch {}
    setTotalTime(dur);
    playUrl(track.streamUrl);
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
    playUrl(track.streamUrl);
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
    playUrl(track.streamUrl);
  };

  // Local-First DB toggles are handled directly by custom hook toggle functions (toggleStationLike, toggleSongFavorite)

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
      return [...prev, track];
    });
  };

  const deleteTrackFromPlaylist = (id: number) => {
    setPlaylistTracks(prev => prev.filter(t => t.id !== id));
  };

  const saveProfile = (name: string, role: string, avatarUrl: string, hours: number, followers: string) => {
    setUserProfile({ name, role, avatarUrl, stashHours: hours, followersCount: followers });
  };

  const addAlbum = (name: string, artist: string, releaseYear: string, genre: string, imageUrl: string) => {
    const newAlbum: Album = {
      id: `album-${Date.now()}`,
      name,
      artist,
      releaseYear,
      genre,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80",
    };
    setAlbums((prev) => [...prev, newAlbum]);
  };

  // SC-06: Solo disponible en modo desarrollo para evitar manipulación de roles desde la consola del navegador.
  const updateUserRole = (newRole: string) => {
    if (process.env.NODE_ENV !== "development") {
      console.warn("🛡️ No puedes cambiar tu rol en producción.");
      return;
    }
    setUserProfile(prev => ({ ...prev, role: newRole }));
  };

  // Theme settings
  const selectTheme = (themeName: string) => {
    setActiveTheme(themeName);
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
      setBannedWords(prev => [...prev, trimmed]);
    }
  };

  const removeBannedWord = (word: string) => {
    setBannedWords(prev => prev.filter(w => w !== word));
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
      const client = supabase;
      const { data, error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error("Auth error:", error);
        alert("Error al iniciar sesión con Google");
        return;
      }

      if (data?.url) {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          data.url,
          "Google Sign-In - Radio Doble C",
          `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
        );

        if (!popup) {
          alert("Por favor permite las ventanas emergentes (popups) en tu navegador para iniciar sesión.");
          return;
        }

        const interval = setInterval(() => {
          if (popup.closed) {
            clearInterval(interval);
            return;
          }
          client.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              popup.close();
              clearInterval(interval);
            }
          });
        }, 1000);
      }
    }
  };

  // SC-01: signInWithEmail ELIMINADA — tenía la contraseña "123456" hardcodeada.
  // El único flujo de autenticación soportado es Google OAuth (signInWithGoogle).

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
        addAlbum,
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
        // signInWithEmail eliminada (SC-01)
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
