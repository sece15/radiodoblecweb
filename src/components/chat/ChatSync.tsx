"use client";

import { useEffect, useRef } from "react";
import { useAudioStore, audioStore } from "@/store/useAudioStore";
import { useChatSocket } from "@/hooks/useChatSocket";
import { supabase } from "@/lib/supabase";

/**
 * ChatSync: Sincronizador autónomo del Chat en vivo.
 * Aísla toda la lógica de conexión de sockets, eventos y moderación
 * fuera de AudioContext para mantener un código limpio y desacoplado.
 */
export const ChatSync = () => {
  const userProfile = useAudioStore((s) => s.userProfile);
  const isAuthenticated = useAudioStore((s) => s.isAuthenticated);
  const refreshProfile = useAudioStore((s) => s.refreshProfile);

  const chatSocket = useChatSocket({ userProfile, isAuthenticated, refreshProfile });
  const chatSocketRef = useRef(chatSocket);

  useEffect(() => {
    chatSocketRef.current = chatSocket;
  }, [chatSocket]);

  // Manejar conexión y autenticación del socket de chat
  useEffect(() => {
    let isMounted = true;

    const syncSocketConnection = async () => {
      if (supabase && isAuthenticated) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!isMounted) return;
          if (session?.access_token) {
            chatSocketRef.current.connectChatSocket(userProfile.name || "Oyente", session.access_token);
            return;
          }
        } catch (e) {
          console.error("[ChatSync] Error al obtener sesión para el socket:", e);
        }
      }

      if (isMounted) {
        chatSocketRef.current.connectChatSocket(
          userProfile.name && userProfile.name !== "PETER ARKWALL" ? userProfile.name : "Oyente",
          "guest"
        );
      }
    };

    syncSocketConnection();

    return () => {
      isMounted = false;
      chatSocketRef.current.disconnectChatSocket();
    };
  }, [isAuthenticated, userProfile.name]);

  // Sincronizar estado y acciones del chat directamente en audioStore
  useEffect(() => {
    audioStore.setState({
      chatMessages: chatSocket.chatMessages,
      isLiveChatModeActive: chatSocket.isLiveChatModeActive,
      isChatConnected: chatSocket.isChatConnected,
      onlineChatUsers: chatSocket.onlineChatUsers,
      setLiveChatModeActive: chatSocket.setLiveChatModeActive,
      sendChatMessage: chatSocket.sendChatMessage,
      lunaGreetings: chatSocket.lunaGreetings,
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
      pendingVoiceGreetings: chatSocket.pendingVoiceGreetings,
      submitVoiceGreeting: chatSocket.submitVoiceGreeting,
      approveVoiceGreeting: chatSocket.approveVoiceGreeting,
      rejectVoiceGreeting: chatSocket.rejectVoiceGreeting,
    });
  }, [
    chatSocket.chatMessages,
    chatSocket.isLiveChatModeActive,
    chatSocket.isChatConnected,
    chatSocket.onlineChatUsers,
    chatSocket.setLiveChatModeActive,
    chatSocket.sendChatMessage,
    chatSocket.lunaGreetings,
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
    chatSocket.pendingVoiceGreetings,
    chatSocket.submitVoiceGreeting,
    chatSocket.approveVoiceGreeting,
    chatSocket.rejectVoiceGreeting,
  ]);

  return null;
};
