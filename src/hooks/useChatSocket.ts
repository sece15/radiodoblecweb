"use client";

import { useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { ChatMessage, SocketChatMessage, SocketChatConfig, UserProfile } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DEFAULT_BANNED_WORDS } from "@/constants";

interface UseChatSocketProps {
  userProfile: UserProfile;
}

export const useChatSocket = ({ userProfile }: UseChatSocketProps) => {
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

  const socketRef = useRef<Socket | null>(null);

  const disconnectChatSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const connectChatSocket = (username: string, token: string) => {
    disconnectChatSocket();

    try {
      const chatUrl = process.env.NEXT_PUBLIC_CHAT_URL || "http://localhost:8081";
      const socket = io(chatUrl, {
        reconnection: true,
        reconnectionDelay: 2000,
        auth: { token },
        query: { username },
      });
      socketRef.current = socket;

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
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
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
        setDeletedMessageIds((prev) => new Set([...prev, messageId]));
        setChatMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, messageText: "<Mensaje borrado por moderación>", isDeleted: true } : m))
        );
      });

      socket.on("user_banned", ({ username: un }: { username: string }) => {
        const upper = un.toUpperCase();
        setBannedUsers((prev) => new Set([...prev, upper]));
        setChatMessages((prev) => prev.filter((m) => m.senderName.toUpperCase() !== upper));
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

  const toggleLinksAllowed = () => setIsLinksAllowed((prev) => !prev);

  const addBannedWord = (word: string) => {
    const trimmed = word.trim().toLowerCase();
    if (trimmed && !bannedWords.includes(trimmed)) {
      setBannedWords((prev) => [...prev, trimmed]);
    }
  };

  const removeBannedWord = (word: string) => {
    setBannedWords((prev) => prev.filter((w) => w !== word));
  };

  const banUser = (username: string) => {
    const upper = username.toUpperCase();
    setBannedUsers((prev) => new Set([...prev, upper]));
    if (socketRef.current) {
      socketRef.current.emit("ban_user", { username, moderatorName: userProfile.name });
    }
  };

  const unbanUser = (username: string) => {
    const upper = username.toUpperCase();
    setBannedUsers((prev) => {
      const next = new Set(prev);
      next.delete(upper);
      return next;
    });
  };

  const deleteMessage = (messageId: number) => {
    setDeletedMessageIds((prev) => new Set([...prev, messageId]));
    if (socketRef.current) {
      socketRef.current.emit("delete_message", { messageId, moderatorName: userProfile.name });
    }
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;

    const upperName = userProfile.name.toUpperCase();
    if (isCurrentUserBanned || bannedUsers.has(upperName)) return;

    const cleanText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[._\-* ]/g, "");
    const containsBanned = bannedWords.some((w) => cleanText.includes(w));

    const isImmune =
      userProfile.role.includes("VIP") ||
      userProfile.role.includes("MOD") ||
      userProfile.role.includes("STREAMER") ||
      userProfile.role.includes("ADMIN");
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
      setChatMessages((prev) => [
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

  return {
    isLiveChatModeActive,
    setLiveChatModeActive,
    chatMessages,
    bannedWords,
    bannedUsers,
    deletedMessageIds,
    isSlowMode,
    isEmoteOnly,
    isLinksAllowed,
    isCurrentUserBanned,
    isModPanelVisible,
    setModPanelVisible,
    connectChatSocket,
    disconnectChatSocket,
    toggleSlowMode,
    toggleEmoteOnly,
    toggleLinksAllowed,
    addBannedWord,
    removeBannedWord,
    banUser,
    unbanUser,
    deleteMessage,
    clearChat,
    sendChatMessage,
  };
};
