// ==========================================
// USER & PERMISSION TYPES (src/types/user.ts)
// ==========================================

export type UserRole = "OYENTE" | "VIP" | "MODERADOR" | "STREAMER" | "ADMIN";

export interface UserProfile {
  id?: string;
  name: string;
  role: string;
  bio?: string;
  avatarUrl: string;
  stashHours: number;
  followersCount: string;
}

export interface AdminUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

export interface RoleBadgeInfo {
  label: string;
  badge: string;
  color: string;
  bg: string;
  border: string;
}

// ==========================================
// GAMIFICACIÓN & NIVELES DE OYENTE
// ==========================================
export interface ListenerBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progressText: string;
}

export interface ListenerLevel {
  level: number;
  minHours: number;
  title: string;
  icon: string;
  color: string;
}

export interface SpinReward {
  type: "c_coins" | "coupon" | "voice_pass" | "badge";
  amount?: number;
  code?: string;
  label: string;
  icon: string;
}
