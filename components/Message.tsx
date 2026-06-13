"use client";

import type { ChatMessage } from "../lib/types";

// Safety net: the model is told to write plain text, but if any Markdown slips through we
// strip it so it never renders raw in a bubble (the bubbles are plain text, not a md renderer).
function clean(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")        // **bold** -> bold
    .replace(/\*(.+?)\*/g, "$1")            // *italic* -> italic
    .replace(/__(.+?)__/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 ($2)") // [text](url) -> text (url), keep the link
    .replace(/^#{1,6}\s+/gm, "")            // # headings
    .replace(/^\s*[-*]\s+/gm, "")           // - bullets
    .trim();
}

// One chat bubble. User on the trailing edge (clay), assistant on the leading edge
// (warm surface). Alignment follows the document writing direction, so it flips under RTL.
export default function Message({ role, content }: ChatMessage) {
  return (
    <div className={`row ${role === "user" ? "user" : "assistant"}`}>
      <div className="bubble">{role === "assistant" ? clean(content) : content}</div>
    </div>
  );
}
