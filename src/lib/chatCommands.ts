/** Match only the leading command, preserving its original spelling. */
export function getGreetingCommand(text: string): string | null {
  const command = /^\/saludos/i.exec(text)?.[0];
  return command && (text.length === command.length || text[command.length] === " ")
    ? command
    : null;
}

export const CHAT_COMMAND_COLOR = "#FF4FCB";
export const CHAT_COMMAND_BACKGROUND = "#421033";
