import { getGreetingCommand } from "./chatCommands";

export interface LunaGreetingOptions {
  price: number;
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

export const LUNA_GREETING_STATUSES: Record<string, string> = {
  pending: "Pendiente",
  reserved: "Preparando",
  queued: "Pendiente de emisión",
  played: "Emitido",
  refunded: "Devuelto",
};

export function parseLunaGreetingOptions(value: unknown): LunaGreetingOptions | null {
  const data = Array.isArray(value) ? value[0] : value;
  if (!data || typeof data !== "object") return null;
  const option = data as Record<string, unknown>;
  if (typeof option.price !== "number" || !Number.isFinite(option.price) || option.price < 0 ||
      typeof option.currency !== "string" || !option.currency.trim() ||
      typeof option.accepting !== "boolean" ||
      typeof option.hours !== "string" || !option.hours.trim() ||
      typeof option.timezone !== "string" || !option.timezone.trim()) return null;
  try {
    new Intl.DateTimeFormat("es-PE", { timeZone: option.timezone });
  } catch { return null; }
  return option as unknown as LunaGreetingOptions;
}

export function greetingRecipient(text: string, senderName: string): { name: string; error: string | null } {
  const command = getGreetingCommand(text);
  if (!command) return { name: "", error: "Escribe /saludos al comienzo del mensaje." };
  const argument = text.slice(command.length).trim();
  if (!argument) return { name: senderName, error: null };
  const name = argument.replace(/^(?:a|para)(?: +|$)/i, "").trim();
  const valid = /^\p{L}[\p{L}\p{M}]*(?: +\p{L}[\p{L}\p{M}]*)*$/u.test(name) &&
    Array.from(name.normalize("NFC")).length <= 40 && name.split(/ +/).length <= 5;
  return { name, error: valid ? null : "Usa un nombre de hasta 40 letras y cinco palabras, sin números ni símbolos." };
}

export function isActiveGreeting(status: string): boolean {
  return status === "pending" || status === "reserved" || status === "queued";
}
