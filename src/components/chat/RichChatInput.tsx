"use client";

import React, {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { getEmojiByTokenOrId } from "@/lib/mascotEmojis";

export interface RichChatInputRef {
  insertEmoji: (emoji: string | { token: string; src?: string; label?: string; id?: string }) => void;
  clear: () => void;
  focus: () => void;
  getText: () => string;
}

interface RichChatInputProps {
  placeholder?: string;
  maxLength?: number;
  onSend: (text: string) => void;
  onTextChange?: (text: string) => void;
  minHeight?: number;
  maxHeight?: number;
  showCounter?: boolean;
}

function createEmojiImg(def: { token: string; src: string; label?: string; id?: string }): HTMLImageElement {
  const img = document.createElement("img");
  img.src = def.src;
  img.alt = def.token;
  img.title = def.label || def.token;
  img.setAttribute("data-token", def.token);
  img.setAttribute("data-label", def.label || "");
  img.setAttribute("contenteditable", "false");
  img.className = "chat-inline-emoji";
  img.style.display = "inline-block";
  img.style.verticalAlign = "middle";
  img.style.width = "20px";
  img.style.height = "20px";
  img.style.imageRendering = "auto";
  img.style.margin = "0 2px";
  img.style.userSelect = "all";
  return img;
}

function extractTextWithTokens(node: Node): string {
  let result = "";
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent || "";
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      if (el.tagName === "IMG" && el.hasAttribute("data-token")) {
        result += el.getAttribute("data-token") || "";
      } else if (el.tagName === "BR") {
        result += "\n";
      } else {
        result += extractTextWithTokens(el);
      }
    }
  }
  return result;
}

export const RichChatInput = forwardRef<RichChatInputRef, RichChatInputProps>(
  (
    {
      placeholder = "Escribe en el chat...",
      maxLength = 150,
      onSend,
      onTextChange,
      minHeight = 36,
      maxHeight = 80,
      showCounter = true,
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [charCount, setCharCount] = useState(0);
    const [isFocused, setIsFocused] = useState(false);

    const syncState = useCallback(() => {
      if (!editorRef.current) return "";
      const text = extractTextWithTokens(editorRef.current).replace(/\u00A0/g, " ");
      setCharCount(text.length);
      onTextChange?.(text);
      return text;
    }, [onTextChange]);

    const handleSend = useCallback(() => {
      if (!editorRef.current) return;
      const text = extractTextWithTokens(editorRef.current).replace(/\u00A0/g, " ").trim();
      if (!text) return;

      onSend(text);
      editorRef.current.innerHTML = "";
      syncState();
    }, [onSend, syncState]);

    const insertEmoji = useCallback(
      (emojiInput: string | { token: string; src?: string; label?: string; id?: string }) => {
        const container = editorRef.current;
        if (!container) return;

        const token = typeof emojiInput === "string" ? emojiInput : emojiInput.token;
        const found = getEmojiByTokenOrId(token);
        const resolved =
          typeof emojiInput === "object" && emojiInput.src
            ? {
                token: emojiInput.token,
                src: emojiInput.src,
                label: emojiInput.label || "",
                id: emojiInput.id || "",
              }
            : found
            ? {
                token: found.token,
                src: found.src,
                label: found.label,
                id: found.id,
              }
            : null;

        if (!resolved) {
          if (!token) return;
          container.focus();
          const selection = window.getSelection();
          let range: Range | null = null;

          if (selection && selection.rangeCount > 0) {
            const candidate = selection.getRangeAt(0);
            if (container.contains(candidate.commonAncestorContainer)) {
              range = candidate;
            }
          }

          if (!range) {
            range = document.createRange();
            range.selectNodeContents(container);
            range.collapse(false);
          }

          const currentText = extractTextWithTokens(container).replace(/\u00A0/g, " ");
          if (currentText.length + token.length > maxLength) {
            return;
          }

          const textNode = document.createTextNode(token);
          range.deleteContents();
          range.insertNode(textNode);

          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }

          syncState();
          return;
        }

        container.focus();
        const selection = window.getSelection();
        let range: Range | null = null;

        if (selection && selection.rangeCount > 0) {
          const candidate = selection.getRangeAt(0);
          if (container.contains(candidate.commonAncestorContainer)) {
            range = candidate;
          }
        }

        if (!range) {
          range = document.createRange();
          range.selectNodeContents(container);
          range.collapse(false);
        }

        // Check if length would exceed maxLength
        const currentText = extractTextWithTokens(container).replace(/\u00A0/g, " ");
        if (currentText.length + resolved.token.length > maxLength) {
          return;
        }

        const img = createEmojiImg(resolved);

        range.deleteContents();
        range.insertNode(img);

        range.setStartAfter(img);
        range.setEndAfter(img);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }

        syncState();
      },
      [maxLength, syncState]
    );

    useImperativeHandle(
      ref,
      () => ({
        insertEmoji,
        clear: () => {
          if (editorRef.current) {
            editorRef.current.innerHTML = "";
            syncState();
          }
        },
        focus: () => {
          editorRef.current?.focus();
        },
        getText: () => {
          if (!editorRef.current) return "";
          return extractTextWithTokens(editorRef.current).replace(/\u00A0/g, " ").trim();
        },
      }),
      [insertEmoji, syncState]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
        return;
      }

      // Single-press backspace for emojis
      if (e.key === "Backspace") {
        const selection = window.getSelection();
        if (selection && selection.isCollapsed && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const container = editorRef.current;
          if (container && container.contains(range.startContainer)) {
            let targetImgToDelete: HTMLImageElement | null = null;
            let textNodeToDelete: Text | null = null;

            if (range.startContainer.nodeType === Node.TEXT_NODE) {
              const textNode = range.startContainer as Text;
              if (range.startOffset === 0) {
                let prev = textNode.previousSibling;
                while (prev && prev.nodeType === Node.TEXT_NODE && !prev.textContent) {
                  prev = prev.previousSibling;
                }
                if (prev && prev instanceof HTMLImageElement && prev.hasAttribute("data-token")) {
                  targetImgToDelete = prev;
                }
              } else if (range.startOffset === 1 && (textNode.textContent === "\u00A0" || textNode.textContent === " ")) {
                const prev = textNode.previousSibling;
                if (prev && prev instanceof HTMLImageElement && prev.hasAttribute("data-token")) {
                  targetImgToDelete = prev;
                  textNodeToDelete = textNode;
                }
              }
            } else if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
              const elem = range.startContainer as HTMLElement;
              if (range.startOffset > 0) {
                const prev = elem.childNodes[range.startOffset - 1];
                if (prev && prev instanceof HTMLImageElement && prev.hasAttribute("data-token")) {
                  targetImgToDelete = prev;
                }
              }
            }

            if (targetImgToDelete) {
              e.preventDefault();
              const parent = targetImgToDelete.parentNode;
              const prevSibling = targetImgToDelete.previousSibling === textNodeToDelete ? textNodeToDelete?.previousSibling : targetImgToDelete.previousSibling;
              
              if (textNodeToDelete) {
                textNodeToDelete.remove();
              }
              targetImgToDelete.remove();

              const newRange = document.createRange();
              if (prevSibling) {
                newRange.setStartAfter(prevSibling);
                newRange.setEndAfter(prevSibling);
              } else if (parent) {
                newRange.setStart(parent, 0);
                newRange.setEnd(parent, 0);
              }
              selection.removeAllRanges();
              selection.addRange(newRange);
              syncState();
              return;
            }
          }
        }
      }

      // Single-press forward delete for emojis
      if (e.key === "Delete") {
        const selection = window.getSelection();
        if (selection && selection.isCollapsed && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const container = editorRef.current;
          if (container && container.contains(range.startContainer)) {
            let targetImgToDelete: HTMLImageElement | null = null;

            if (range.startContainer.nodeType === Node.TEXT_NODE) {
              const textNode = range.startContainer as Text;
              if (range.startOffset === (textNode.textContent?.length || 0)) {
                let next = textNode.nextSibling;
                while (next && next.nodeType === Node.TEXT_NODE && !next.textContent) {
                  next = next.nextSibling;
                }
                if (next && next instanceof HTMLImageElement && next.hasAttribute("data-token")) {
                  targetImgToDelete = next;
                }
              }
            } else if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
              const elem = range.startContainer as HTMLElement;
              const next = elem.childNodes[range.startOffset];
              if (next && next instanceof HTMLImageElement && next.hasAttribute("data-token")) {
                targetImgToDelete = next;
              }
            }

            if (targetImgToDelete) {
              e.preventDefault();
              targetImgToDelete.remove();
              syncState();
              return;
            }
          }
        }
      }

      // Block typing beyond maxLength
      if (
        charCount >= maxLength &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.length === 1
      ) {
        e.preventDefault();
      }
    };

    const handleInput = () => {
      const container = editorRef.current;
      if (!container) return;

      // Auto-convert typed :c-id: shortcode to image
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        if (node && node.nodeType === Node.TEXT_NODE) {
          const textBeforeCaret = (node.textContent || "").slice(0, range.startOffset);
          const match = textBeforeCaret.match(/:c-([a-z0-9-]+):$/i);
          if (match) {
            const token = match[0];
            const def = getEmojiByTokenOrId(token);
            if (def) {
              const fullText = node.textContent || "";
              const tokenStart = range.startOffset - token.length;
              const before = fullText.slice(0, tokenStart);
              const after = fullText.slice(range.startOffset);

              const parent = node.parentNode;
              if (parent) {
                const img = createEmojiImg(def);

                node.textContent = before;
                const nextSibling = node.nextSibling;
                parent.insertBefore(img, nextSibling);
                if (after) {
                  const afterNode = document.createTextNode(after);
                  parent.insertBefore(afterNode, img.nextSibling);
                }

                const newRange = document.createRange();
                newRange.setStartAfter(img);
                newRange.setEndAfter(img);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
            }
          }
        }
      }

      syncState();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      if (!text) return;

      const current = syncState();
      const allowed = text.slice(0, Math.max(0, maxLength - current.length));
      if (!allowed) return;

      document.execCommand("insertText", false, allowed);
      syncState();
    };

    return (
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPaste={handlePaste}
          style={{
            width: "100%",
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            overflowY: "auto",
            padding: "6px 45px 6px 8px",
            border: isFocused ? "2.5px solid var(--primary)" : "2px solid var(--primary)",
            outline: "none",
            fontSize: "0.72rem",
            lineHeight: "1.25rem",
            fontFamily: "inherit",
            backgroundColor: "#FFFFFF",
            color: "#111111",
            caretColor: "#111111",
            cursor: "text",
            boxShadow: isFocused
              ? "0 0 0 2px var(--primary-container), 2px 2px 0px var(--primary)"
              : "none",
            transition: "box-shadow 0.15s ease, border 0.15s ease",
            boxSizing: "border-box",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        />

        {charCount === 0 && (
          <div
            onClick={() => editorRef.current?.focus()}
            style={{
              position: "absolute",
              left: 10,
              top: 8,
              right: 48,
              color: "#888888",
              fontSize: "0.72rem",
              pointerEvents: "none",
              userSelect: "none",
              lineHeight: "1.25rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {placeholder}
          </div>
        )}

        {showCounter && (
          <span
            style={{
              position: "absolute",
              bottom: "4px",
              right: "6px",
              fontSize: "0.55rem",
              fontWeight: 900,
              color: charCount >= maxLength * 0.9 ? "#BA1A1A" : "gray",
              pointerEvents: "none",
              opacity: charCount > 0 ? 0.7 : 0,
              transition: "opacity 0.2s, color 0.2s",
              fontFamily: "monospace",
            }}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    );
  }
);

RichChatInput.displayName = "RichChatInput";
