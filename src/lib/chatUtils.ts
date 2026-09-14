/**
 * Utilidades compartidas para el Chat de Radio Doble C
 */

export const CHAT_QUICK_REACTIONS = ["🔥", "📻", "🎙️", "⚡", "🤘", "🎧", "🎸", "🖤"] as const;

export const getRoleBadgeColor = (role: string): string => {
  const r = role.toUpperCase();
  if (r.includes("ADMIN")) return "#FFB000";
  if (r.includes("STREAMER") || r.includes("BROADCASTER")) return "#BA1A1A";
  if (r.includes("MOD") || r.includes("MODERADOR")) return "#E87A00";
  if (r.includes("VIP")) return "#008B8B";
  if (r.includes("BOT")) return "#1A1D10";
  return "#444933";
};

export const getRoleBadgeText = (role: string): string => {
  const r = role.toUpperCase();
  if (r.includes("ADMIN")) return "👑 ADMIN";
  if (r.includes("STREAMER") || r.includes("BROADCASTER")) return "🎙️ STREAMER";
  if (r.includes("MOD") || r.includes("MODERADOR")) return "🛡️ MOD";
  if (r.includes("VIP")) return "⭐ VIP";
  if (r.includes("BOT")) return "🤖 BOT";
  return "OYENTE";
};
