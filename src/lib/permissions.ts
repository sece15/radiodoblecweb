// Módulo centralizado de roles y permisos para Radio Doble C

export type UserRole = "OYENTE" | "VIP" | "MODERADOR" | "STREAMER" | "ADMIN";

export function normalizeRole(role?: string): string {
  return (role || "OYENTE").trim().toUpperCase();
}

export function isAdmin(role?: string): boolean {
  return normalizeRole(role) === "ADMIN";
}

export function isVip(role?: string): boolean {
  const r = normalizeRole(role);
  return ["VIP", "ADMIN", "STREAMER", "MODERADOR"].includes(r);
}

export function isStaff(role?: string): boolean {
  const r = normalizeRole(role);
  return ["ADMIN", "STREAMER", "MODERADOR"].includes(r);
}

export function isModerator(role?: string): boolean {
  const r = normalizeRole(role);
  return ["ADMIN", "MODERADOR"].includes(r);
}

export interface RoleBadgeInfo {
  label: string;
  badge: string;
  color: string;
  bg: string;
  border: string;
}

export function getRoleBadgeInfo(role?: string): RoleBadgeInfo {
  const r = normalizeRole(role);

  if (r.includes("ADMIN")) {
    return {
      label: "ADMIN",
      badge: "👑 ADMIN",
      color: "#000000",
      bg: "#FFB000",
      border: "#BA1A1A",
    };
  }

  if (r.includes("STREAMER")) {
    return {
      label: "STREAMER",
      badge: "🎙️ STREAMER",
      color: "#000000",
      bg: "#FFDE82",
      border: "#524300",
    };
  }

  if (r.includes("MODERADOR") || r.includes("MOD")) {
    return {
      label: "MODERADOR",
      badge: "🛡️ MOD",
      color: "#FFFFFF",
      bg: "#00522B",
      border: "#00391C",
    };
  }

  if (r.includes("VIP")) {
    return {
      label: "VIP",
      badge: "⭐ VIP",
      color: "#000000",
      bg: "#FFE082",
      border: "#FFB000",
    };
  }

  return {
    label: "OYENTE",
    badge: "📻 OYENTE",
    color: "var(--primary)",
    bg: "var(--surface-container)",
    border: "var(--primary)",
  };
}
