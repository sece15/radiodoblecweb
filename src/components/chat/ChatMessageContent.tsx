import Image from "next/image";
import { splitMascotMessage } from "@/lib/mascotEmojis";

export function ChatMessageContent({ text, emojiSize = 19 }: { text: string; emojiSize?: number }) {
  return <>{splitMascotMessage(text).map((part, index) => part.emoji ? (
    <Image key={index} src={emojiSize <= 19 ? part.emoji.smallSrc : part.emoji.src}
      alt={part.emoji.label} title={part.emoji.label} width={emojiSize} height={emojiSize} unoptimized
      style={{ display: "inline-block", verticalAlign: "middle", imageRendering: "auto", margin: "0 1px" }} />
  ) : <span key={index}>{part.text}</span>)}</>;
}
