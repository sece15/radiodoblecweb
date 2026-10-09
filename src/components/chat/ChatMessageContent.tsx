import Image from "next/image";
import { splitMascotMessage } from "@/lib/mascotEmojis";
import { CHAT_COMMAND_COLOR, getGreetingCommand } from "@/lib/chatCommands";

export function ChatMessageContent({ text, emojiSize = 19 }: { text: string; emojiSize?: number }) {
  const command = getGreetingCommand(text);
  return <>{command && <span style={{ color: CHAT_COMMAND_COLOR }}>{command}</span>}{splitMascotMessage(command ? text.slice(command.length) : text).map((part, index) => part.emoji ? (
    <Image key={index} src={emojiSize <= 19 ? part.emoji.smallSrc : part.emoji.src}
      alt={part.emoji.label} title={part.emoji.label} width={emojiSize} height={emojiSize} unoptimized
      style={{ display: "inline-block", verticalAlign: "middle", imageRendering: "auto", margin: "0 1px" }} />
  ) : <span key={index}>{part.text}</span>)}</>;
}
