"use client";

import { useState, useEffect, useRef } from "react";
import { useAudio } from "@/hooks/useAudio";
import { useShallow } from "zustand/react/shallow";
import type { RichChatInputRef } from "./chat/RichChatInput";
import { fetchSponsorBusinesses, INITIAL_SPONSORS, type SponsorBusiness } from "@/services/sponsorService";
import { getGreetingCommand } from "@/lib/chatCommands";
import { useChatVoiceRecorder } from "./chat/useChatVoiceRecorder";
import { ChatSidebarHeader } from "./chat/ChatSidebarHeader";
import { ChatModeratorPanel } from "./chat/ChatModeratorPanel";
import { ChatMessageFeed } from "./chat/ChatMessageFeed";
import { ChatComposerFooter } from "./chat/ChatComposerFooter";

interface ChatSidebarProps {
  onClose: () => void;
}

export const ChatSidebar = ({ onClose }: ChatSidebarProps) => {
  const {
    chatMessages,
    sendChatMessage,
    lunaGreetings,
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
    userProfile,
    listenersCount,
    isStreamerLive,
    isChatConnected,
    onlineChatUsers,
    isAuthenticated,
    signInWithGoogle,
    puntosC,
    consumePuntosC,
    pendingVoiceGreetings,
    submitVoiceGreeting,
    approveVoiceGreeting,
    rejectVoiceGreeting,
    setIsSponsorModalOpen,
    setActiveSponsorSlug,
  } = useAudio(
    useShallow((s) => ({
      chatMessages: s.chatMessages,
      sendChatMessage: s.sendChatMessage,
      lunaGreetings: s.lunaGreetings,
      bannedWords: s.bannedWords,
      bannedUsers: s.bannedUsers,
      deletedMessageIds: s.deletedMessageIds,
      isSlowMode: s.isSlowMode,
      isEmoteOnly: s.isEmoteOnly,
      isLinksAllowed: s.isLinksAllowed,
      isCurrentUserBanned: s.isCurrentUserBanned,
      isModPanelVisible: s.isModPanelVisible,
      setModPanelVisible: s.setModPanelVisible,
      toggleSlowMode: s.toggleSlowMode,
      toggleEmoteOnly: s.toggleEmoteOnly,
      toggleLinksAllowed: s.toggleLinksAllowed,
      addBannedWord: s.addBannedWord,
      removeBannedWord: s.removeBannedWord,
      banUser: s.banUser,
      unbanUser: s.unbanUser,
      deleteMessage: s.deleteMessage,
      clearChat: s.clearChat,
      userProfile: s.userProfile,
      listenersCount: s.listenersCount,
      isStreamerLive: s.isStreamerLive,
      isChatConnected: s.isChatConnected,
      onlineChatUsers: s.onlineChatUsers,
      isAuthenticated: s.isAuthenticated,
      signInWithGoogle: s.signInWithGoogle,
      puntosC: s.puntosC,
      consumePuntosC: s.consumePuntosC,
      pendingVoiceGreetings: s.pendingVoiceGreetings,
      submitVoiceGreeting: s.submitVoiceGreeting,
      approveVoiceGreeting: s.approveVoiceGreeting,
      rejectVoiceGreeting: s.rejectVoiceGreeting,
      setIsSponsorModalOpen: s.setIsSponsorModalOpen,
      setActiveSponsorSlug: s.setActiveSponsorSlug,
    }))
  );

  const [typedMessage, setTypedMessage] = useState("");
  const greetingActive = !!getGreetingCommand(typedMessage);
  const richInputRef = useRef<RichChatInputRef>(null);
  const messageFeedRef = useRef<HTMLDivElement>(null);

  const completedGreeting = lunaGreetings?.completed;
  useEffect(() => {
    if (completedGreeting && richInputRef.current?.getText() === completedGreeting.messageText) {
      richInputRef.current.clear();
    }
  }, [completedGreeting]);

  useEffect(() => {
    if (messageFeedRef.current) {
      messageFeedRef.current.scrollTop = messageFeedRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const [isSponsorAccordionOpen, setIsSponsorAccordionOpen] = useState(false);
  const [sponsorsList, setSponsorsList] = useState<SponsorBusiness[]>(INITIAL_SPONSORS);

  useEffect(() => {
    fetchSponsorBusinesses().then((list) => {
      if (list && list.length > 0) {
        setSponsorsList(list);
      }
    });
  }, []);

  const voiceRecorder = useChatVoiceRecorder({
    userRole: userProfile.role,
    puntosC,
    bannedWords,
    consumePuntosC,
    submitVoiceGreeting,
  });

  const handleDismissGreeting = () => {
    richInputRef.current?.clear();
    setTypedMessage("");
    lunaGreetings?.discardPending();
  };

  const handleSend = () => {
    const raw = richInputRef.current?.getText() || typedMessage;
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (getGreetingCommand(trimmed)) {
      void lunaGreetings?.submit(trimmed);
      return false;
    }

    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith("/pedir") ||
      lower.startsWith("/auspicio") ||
      lower.startsWith("/pizza") ||
      lower.startsWith("/pollo") ||
      lower.startsWith("/mostrito") ||
      lower.startsWith("/salchipapa") ||
      lower.startsWith("/broaster")
    ) {
      setActiveSponsorSlug("pizzas");
      setIsSponsorModalOpen(true);
      richInputRef.current?.clear();
      setTypedMessage("");
      return;
    }

    sendChatMessage(trimmed);
    richInputRef.current?.clear();
    setTypedMessage("");
  };

  const hasModPrivileges =
    userProfile.role.includes("STREAMER") ||
    userProfile.role.includes("MOD") ||
    userProfile.role.includes("ADMIN");

  const activeChatUsers = isChatConnected
    ? Math.max(1, onlineChatUsers, listenersCount)
    : listenersCount;

  return (
    <div className="chat-sidebar-container">
      <ChatSidebarHeader
        isStreamerLive={isStreamerLive}
        isChatConnected={isChatConnected}
        activeChatUsers={activeChatUsers}
        hasModPrivileges={hasModPrivileges}
        isModPanelVisible={isModPanelVisible}
        onToggleModPanel={() => setModPanelVisible(!isModPanelVisible)}
        onClose={onClose}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "12px 12px 0 12px",
          gap: "12px",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {hasModPrivileges && isModPanelVisible && (
          <ChatModeratorPanel
            pendingVoiceGreetings={pendingVoiceGreetings}
            isSlowMode={isSlowMode}
            isEmoteOnly={isEmoteOnly}
            isLinksAllowed={isLinksAllowed}
            bannedWords={bannedWords}
            bannedUsers={bannedUsers}
            onApproveVoiceGreeting={approveVoiceGreeting}
            onRejectVoiceGreeting={rejectVoiceGreeting}
            onToggleSlowMode={toggleSlowMode}
            onToggleEmoteOnly={toggleEmoteOnly}
            onToggleLinksAllowed={toggleLinksAllowed}
            onClearChat={clearChat}
            onAddBannedWord={addBannedWord}
            onRemoveBannedWord={removeBannedWord}
            onUnbanUser={unbanUser}
          />
        )}

        <ChatMessageFeed
          messageFeedRef={messageFeedRef}
          chatMessages={chatMessages}
          currentUserName={userProfile.name}
          bannedUsers={bannedUsers}
          deletedMessageIds={deletedMessageIds}
          hasModPrivileges={hasModPrivileges}
          onDeleteMessage={deleteMessage}
          onBanUser={banUser}
        />
      </div>

      <ChatComposerFooter
        isAuthenticated={isAuthenticated}
        isCurrentUserBanned={isCurrentUserBanned}
        isRecordingVoice={voiceRecorder.isRecordingVoice}
        recordingSeconds={voiceRecorder.recordingSeconds}
        voiceAudioUrl={voiceRecorder.voiceAudioUrl}
        voiceGreetingSent={voiceRecorder.voiceGreetingSent}
        puntosC={puntosC}
        isSponsorAccordionOpen={isSponsorAccordionOpen}
        sponsorsList={sponsorsList}
        typedMessage={typedMessage}
        greetingActive={greetingActive}
        userName={userProfile.name}
        lunaGreetings={lunaGreetings}
        richInputRef={richInputRef}
        onSignInWithGoogle={signInWithGoogle}
        onStartVoiceRecording={voiceRecorder.handleStartVoiceRecording}
        onStopVoiceRecording={voiceRecorder.handleStopVoiceRecording}
        onCancelVoiceRecording={voiceRecorder.handleCancelVoiceRecording}
        onSendVoiceGreeting={voiceRecorder.handleSendVoiceGreeting}
        onToggleSponsorAccordion={() => setIsSponsorAccordionOpen((prev) => !prev)}
        onSelectSponsor={(slug) => {
          setActiveSponsorSlug(slug);
          setIsSponsorModalOpen(true);
        }}
        onTextChange={setTypedMessage}
        onSend={handleSend}
        onDismissGreeting={handleDismissGreeting}
      />
    </div>
  );
};
