export interface Station {
  id: string;
  name: string;
  frequency: string;
  description: string;
  imageUrl: string;
  isLiked: boolean;
  style: string;
}

export interface RadioProgram {
  id: string;
  title: string;
  host: string;
  timeSlot: string;
  genre: string;
  imageUrl: string;
  description: string;
}

export interface PastBroadcast {
  id: string;
  programId: string;
  title: string;
  date: string;
  duration: string;
  audioUrl: string;
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
  name: string;
  role: string;
  avatarUrl: string;
  stashHours: number;
  followersCount: string;
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
}

export interface CartItem {
  id: string; // combination: productId-color-size
  product: {
    id: string;
    name: string;
    price: string; // e.g. "$25.00"
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
