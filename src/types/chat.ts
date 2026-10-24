// ==========================================
// CHAT & MENSAJERÍA (src/types/chat.ts)
// ==========================================

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
  greetingId?: string;
}

export interface SocketChatMessage {
  id?: number;
  senderName: string;
  senderRole?: string;
  messageText: string;
  timestamp?: string;
  greetingId?: string;
}

export interface SocketChatConfig {
  isSlowMode?: boolean;
  isEmoteOnly?: boolean;
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

// ==========================================
// SALUDOS IA (LUNA)
// ==========================================
export interface LunaGreetingOptions {
  price: number;
  basePrice?: number;
  recentCount?: number;
  cooldownSeconds?: number;
  currency: string;
  accepting: boolean;
  hours: string;
  timezone: string;
}

export interface LunaGreetingResult {
  success?: boolean;
  informational?: boolean;
  id?: string;
  status?: string;
  price?: number;
  coins?: number;
  duplicate?: boolean;
  message: string;
  requestId?: string;
}

export interface LunaGreetingRequest {
  id: string;
  status: string;
  created_at: string;
}

export interface PendingLunaGreeting {
  requestId: string;
  messageText: string;
  phase: "sending" | "unknown" | "failed";
}
