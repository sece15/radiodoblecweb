import Image from "next/image";
import { splitMascotMessage } from "@/lib/mascotEmojis";
import { CHAT_COMMAND_BACKGROUND, CHAT_COMMAND_COLOR, getGreetingCommand } from "@/lib/chatCommands";

export function ChatMessageContent({ text, emojiSize = 19 }: { text: string; emojiSize?: number }) {
  const command = getGreetingCommand(text);
  return <>{command && <span style={{ color: CHAT_COMMAND_COLOR, backgroundColor: CHAT_COMMAND_BACKGROUND, fontWeight: 900, borderRadius: "3px", padding: "1px 3px" }}>{command}</span>}{splitMascotMessage(command ? text.slice(command.length) : text).map((part, index) => {
    if (!part.emoji) return <span key={index}>{part.text}</span>;
    const size = Math.round(emojiSize * (part.emoji.scale ?? 1));
    return (
      <Image key={index} src={size <= 19 ? part.emoji.smallSrc : part.emoji.src}
        alt={part.emoji.label} title={part.emoji.label} width={size} height={size} unoptimized
        style={{ display: "inline-block", verticalAlign: "middle", imageRendering: "auto", margin: "0 1px" }} />
    );
  })}</>;
}
