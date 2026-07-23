"use client";

import { useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Subscription } from "@supabase/supabase-js";
import type Hls from "hls.js";
import {
  Station,
  RadioProgram,
  PastBroadcast,
  Song,
  Album,
  UserProfile,
} from "@/types";
import {
  INITIAL_STATIONS,
  INITIAL_PROGRAMS,
  INITIAL_PAST_BROADCASTS,
  INITIAL_ALBUMS,
  INITIAL_SONGS,
  DEFAULT_AVATAR,
  DEFAULT_STREAM,
} from "@/constants";
import { useLocalStorage, useLocalStorageToggle } from "@/hooks/useLocalStorage";
import { useMediaSession } from "@/hooks/useMediaSession";
import { useAzuraCastMetadata } from "@/hooks/useAzuraCastMetadata";
import { useChatSocket } from "@/hooks/useChatSocket";
import { audioStore } from "@/store/useAudioStore";

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  // Referencia de Audio y Cargador HLS
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Estados
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState({
    title: "RADIO DOBLE C",
    album: "RADIO DOBLE C ONLINE",
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

  // Datos iniciales de la sala
  const [stations, toggleStationLike] = useLocalStorageToggle<Station>("liked_stations", INITIAL_STATIONS, "isLiked");
  const [programs] = useState<RadioProgram[]>(INITIAL_PROGRAMS);
  const [pastBroadcasts] = useState<PastBroadcast[]>(INITIAL_PAST_BROADCASTS);
  const [songs, toggleSongFavorite] = useLocalStorageToggle<Song>("fav_songs", INITIAL_SONGS, "isFavorite");
  const [albums, setAlbums] = useLocalStorage<Album[]>("custom_albums", INITIAL_ALBUMS);
  const [playlistTracks, setPlaylistTracks] = useLocalStorage<{ id: number; title: string; artist: string; album: string; imageUrl: string }[]>("playlist_tracks", []);

  // Perfil de Usuario
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>("user_profile", {
    name: "PETER ARKWALL",
    role: "RADIO EXPLORER / VINYL JUNKIE",
    avatarUrl: DEFAULT_AVATAR,
    stashHours: 124,
    followersCount: "1.2K",
  });

  // Configuración de Tema Visual
  const [activeTheme, setActiveTheme] = useLocalStorage<string>("selected_theme", "PUNK_NEON");

  // Estados de Autenticación Supabase
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Integración de Custom Hooks
  const {
    isStreamerLive,
    liveShowName,
    liveTrackTitle,
    liveStatusText,
    listenersCount,
  } = useAzuraCastMetadata({ currentTrack, setCurrentTrack });

  const chatSocket = useChatSocket({ userProfile });



  // 1. Inicializar elemento de Audio al montar el componente
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

  // Sincronizar el atributo data-theme del elemento HTML principal
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", activeTheme);
    }
  }, [activeTheme]);

  // Simulador de avance de reproducción
  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        if (currentTrack.isLive) {
          setTotalTime((prev) => {
            const nextTotal = prev + 1;
            setCurrentTime((curr) => {
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
          const curr = Math.floor(audioRef.current.currentTime);
          const dur = Math.floor(audioRef.current.duration) || totalTime;
          setCurrentTime(curr);
          setTotalTime(dur);
          setProgress(curr / dur);
        }
      }
    }, 1000);

    let subscription: Subscription | null = null;

    const handleAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      const isAllowed =
        origin === window.location.origin ||
        origin.endsWith("radiodoblec.com") ||
        origin.endsWith("vercel.app") ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:");

      if (!isAllowed) return;

      if (event.data?.type === "SUPABASE_AUTH_SUCCESS" && event.data?.session) {
        const session = event.data.session;
        if (supabase) {
          supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
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

          client
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()
            .then(({ data, error }) => {
              const dbRole = !error && data?.role ? data.role : "OYENTE";
              setUserProfile((prev) => {
                const updated = {
                  ...prev,
                  name: uName.toUpperCase(),
                  avatarUrl: uAvatar,
                  role: dbRole,
                };
                localStorage.setItem("user_profile", JSON.stringify(updated));
                return updated;
              });
            });

          chatSocket.connectChatSocket(uName, session.access_token);
        } else {
          setIsAuthenticated(false);
          chatSocket.connectChatSocket("Oyente", "guest");
        }
      });

      const { data } = client.auth.onAuthStateChange((event, session) => {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") && session) {
          setIsAuthenticated(true);
          const meta = session.user.user_metadata;
          const uName = meta.full_name || session.user.email?.split("@")[0] || "Oyente";
          const uAvatar = meta.avatar_url || `https://api.dicebear.com/7.x/bottts/png?seed=${uName}`;

          client
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()
            .then(({ data, error }) => {
              const dbRole = !error && data?.role ? data.role : "OYENTE";
              setUserProfile((prev) => {
                const updated = {
                  ...prev,
                  name: uName.toUpperCase(),
                  avatarUrl: uAvatar,
                  role: dbRole,
                };
                localStorage.setItem("user_profile", JSON.stringify(updated));
                return updated;
              });
            });

          chatSocket.connectChatSocket(uName, session.access_token);
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
          chatSocket.connectChatSocket("Oyente", "guest");
        }
      });
      subscription = data.subscription;
    } else {
      chatSocket.connectChatSocket("Oyente", "guest");
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      window.removeEventListener("message", handleAuthMessage);
      clearInterval(progressInterval);
      chatSocket.disconnectChatSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack.isLive]);

  // Implementación de reproducción de audio
  const playUrl = useCallback((url: string) => {
    if (!audioRef.current) return;

    setCurrentTime(0);
    setProgress(0);
    audioRef.current.muted = isMuted;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (url.includes(".m3u8")) {
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
          audioRef.current!.src = url;
          audioRef.current!.muted = isMuted;
          audioRef.current!.play();
          setIsPlaying(true);
        }
      });
    } else {
      audioRef.current.src = url;
      audioRef.current.muted = isMuted;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isMuted]);

  // Controles del reproductor
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      if (currentTrack.isLive) {
        audioRef.current.muted = true;
      } else {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src || audioRef.current.src === window.location.href) {
        playUrl(currentTrack.streamUrl);
        return;
      }

      if (currentTrack.isLive) {
        audioRef.current.muted = isMuted;
        audioRef.current.play().catch((err) => {
          console.warn("Autoplay blocked, re-requesting stream:", err);
          playUrl(currentTrack.streamUrl);
        });
      } else {
        audioRef.current.play();
      }
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack, isMuted, playUrl]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioRef.current.muted = !isPlaying ? true : nextMute;
  }, [isMuted, isPlaying]);

  const changeVolume = useCallback((v: number) => {
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
  }, [isMuted, isPlaying]);

  const seekToProgress = useCallback((prg: number) => {
    if (!audioRef.current) return;
    const target = prg * totalTime;
    setCurrentTime(Math.floor(target));
    setProgress(prg);

    if (currentTrack.isLive) {
      if (hlsRef.current) {
        audioRef.current.currentTime = target;
      }
    } else {
      audioRef.current.currentTime = target;
    }
  }, [totalTime, currentTrack.isLive]);

  const seekBackMinutes = useCallback((minutes: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, audioRef.current.currentTime - minutes * 60);
    audioRef.current.currentTime = target;
    setCurrentTime(Math.floor(target));
  }, []);

  const seekToLiveEdge = useCallback(() => {
    if (!audioRef.current || !currentTrack.isLive) return;
    playUrl(currentTrack.streamUrl);
    setCurrentTime(totalTime);
    setProgress(1.0);
  }, [currentTrack.isLive, currentTrack.streamUrl, playUrl, totalTime]);

  const playLiveStream = useCallback(() => {
    const track = {
      title: liveTrackTitle,
      album: liveShowName,
      artist: "Doble C Live",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR",
      streamUrl: DEFAULT_STREAM,
      isLive: true,
    };
    setCurrentTrack(track);
    setTotalTime(1);
    playUrl(track.streamUrl);
  }, [liveTrackTitle, liveShowName, playUrl]);

  const playStation = useCallback((station: Station) => {
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
  }, [playUrl]);

  const playSong = useCallback((song: Song) => {
    const isPremiumUser =
      userProfile.role.toUpperCase().includes("VIP") ||
      userProfile.role.toUpperCase().includes("ADMIN") ||
      userProfile.role.toUpperCase().includes("MOD") ||
      userProfile.role.toUpperCase().includes("STREAMER");

    if (!isPremiumUser) {
      alert("⭐ Función Premium: Solo los usuarios VIP o Staff de la radio pueden elegir canciones a la carta. ¡Sigue disfrutando la señal en vivo! 📻");
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
  }, [userProfile.role, playUrl]);

  const playPastBroadcast = useCallback((broadcast: PastBroadcast) => {
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

    const parts = broadcast.duration.split(":");
    let dur = 1800;
    try {
      if (parts.length === 3) {
        dur = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      } else if (parts.length === 2) {
        dur = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
    } catch { }
    setTotalTime(dur);
    playUrl(track.streamUrl);
  }, [userProfile.role, playUrl]);

  const playRadar = useCallback(() => {
    if (stations.length > 0) {
      const rand = stations[Math.floor(Math.random() * stations.length)];
      playStation(rand);
    }
  }, [stations, playStation]);

  const skipNext = useCallback(() => {
    if (stations.length === 0) return;
    const currentIndex = stations.findIndex((s) => s.name === currentTrack.title);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % stations.length;
    playStation(stations[nextIndex]);
  }, [stations, currentTrack.title, playStation]);

  const skipPrevious = useCallback(() => {
    if (stations.length === 0) return;
    const currentIndex = stations.findIndex((s) => s.name === currentTrack.title);
    const prevIndex = currentIndex < 0 ? 0 : (currentIndex - 1 + stations.length) % stations.length;
    playStation(stations[prevIndex]);
  }, [stations, currentTrack.title, playStation]);

  // Sincronizar widget de MediaSession nativo
  useMediaSession({ currentTrack, isPlaying, togglePlayPause });

  const addCurrentTrackToPlaylist = useCallback(() => {
    setPlaylistTracks((prev) => {
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
  }, [currentTrack, setPlaylistTracks]);

  const deleteTrackFromPlaylist = useCallback((id: number) => {
    setPlaylistTracks((prev) => prev.filter((t) => t.id !== id));
  }, [setPlaylistTracks]);

  const saveProfile = useCallback((name: string, role: string, avatarUrl: string, hours: number, followers: string) => {
    setUserProfile({ name, role, avatarUrl, stashHours: hours, followersCount: followers });
  }, [setUserProfile]);

  const addAlbum = useCallback((name: string, artist: string, releaseYear: string, genre: string, imageUrl: string) => {
    const newAlbum: Album = {
      id: `album-${Date.now()}`,
      name,
      artist,
      releaseYear,
      genre,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80",
    };
    setAlbums((prev) => [...prev, newAlbum]);
  }, [setAlbums]);

  const updateUserRole = useCallback((newRole: string) => {
    if (process.env.NODE_ENV !== "development") {
      console.warn("🛡️ No puedes cambiar tu rol en producción.");
      return;
    }
    setUserProfile((prev) => ({ ...prev, role: newRole }));
  }, [setUserProfile]);

  const selectTheme = useCallback((themeName: string) => {
    setActiveTheme(themeName);
  }, [setActiveTheme]);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
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
  }, []);

  // Sincronizar el estado y acciones con el store atómico audioStore (estilo Zustand)
  useEffect(() => {
    audioStore.setState({
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
      changeVolume,
      stations,
      programs,
      pastBroadcasts,
      songs,
      albums,
      userProfile,
      playlistTracks,
      toggleStationLike,
      toggleSongFavorite,
      addCurrentTrackToPlaylist,
      deleteTrackFromPlaylist,
      saveProfile,
      updateUserRole,
      addAlbum,
      chatMessages: chatSocket.chatMessages,
      isLiveChatModeActive: chatSocket.isLiveChatModeActive,
      setLiveChatModeActive: chatSocket.setLiveChatModeActive,
      sendChatMessage: chatSocket.sendChatMessage,
      bannedWords: chatSocket.bannedWords,
      bannedUsers: chatSocket.bannedUsers,
      deletedMessageIds: chatSocket.deletedMessageIds,
      isSlowMode: chatSocket.isSlowMode,
      isEmoteOnly: chatSocket.isEmoteOnly,
      isLinksAllowed: chatSocket.isLinksAllowed,
      isCurrentUserBanned: chatSocket.isCurrentUserBanned,
      isModPanelVisible: chatSocket.isModPanelVisible,
      setModPanelVisible: chatSocket.setModPanelVisible,
      toggleSlowMode: chatSocket.toggleSlowMode,
      toggleEmoteOnly: chatSocket.toggleEmoteOnly,
      toggleLinksAllowed: chatSocket.toggleLinksAllowed,
      addBannedWord: chatSocket.addBannedWord,
      removeBannedWord: chatSocket.removeBannedWord,
      banUser: chatSocket.banUser,
      unbanUser: chatSocket.unbanUser,
      deleteMessage: chatSocket.deleteMessage,
      clearChat: chatSocket.clearChat,
      isAuthenticated,
      signOut,
      signInWithGoogle,
      isStreamerLive,
      liveShowName,
      liveTrackTitle,
      liveStatusText,
      listenersCount,
      activeTheme,
      selectTheme,
    });
  }, [
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
    changeVolume,
    stations,
    programs,
    pastBroadcasts,
    songs,
    albums,
    userProfile,
    playlistTracks,
    toggleStationLike,
    toggleSongFavorite,
    addCurrentTrackToPlaylist,
    deleteTrackFromPlaylist,
    saveProfile,
    updateUserRole,
    addAlbum,
    chatSocket.chatMessages,
    chatSocket.isLiveChatModeActive,
    chatSocket.setLiveChatModeActive,
    chatSocket.sendChatMessage,
    chatSocket.bannedWords,
    chatSocket.bannedUsers,
    chatSocket.deletedMessageIds,
    chatSocket.isSlowMode,
    chatSocket.isEmoteOnly,
    chatSocket.isLinksAllowed,
    chatSocket.isCurrentUserBanned,
    chatSocket.isModPanelVisible,
    chatSocket.setModPanelVisible,
    chatSocket.toggleSlowMode,
    chatSocket.toggleEmoteOnly,
    chatSocket.toggleLinksAllowed,
    chatSocket.addBannedWord,
    chatSocket.removeBannedWord,
    chatSocket.banUser,
    chatSocket.unbanUser,
    chatSocket.deleteMessage,
    chatSocket.clearChat,
    isAuthenticated,
    signOut,
    signInWithGoogle,
    isStreamerLive,
    liveShowName,
    liveTrackTitle,
    liveStatusText,
    listenersCount,
    activeTheme,
    selectTheme,
  ]);

  return <>{children}</>;
};
