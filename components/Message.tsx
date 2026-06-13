"use client";

import type { ChatMessage } from "../lib/types";

// One chat bubble. User messages sit on the trailing edge (accent), assistant
// messages on the leading edge (panel). Alignment follows the document's
// writing direction, so it flips correctly under RTL (e.g. Farsi).
export default function Message({ role, content }: ChatMessage) {
  const isUser = role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          maxWidth: "82%",
          padding: "10px 14px",
          borderRadius: 18,
          // Soften the corner nearest the speaker's edge for a "tail" feel.
          borderEndStartRadius: isUser ? 18 : 4,
          borderEndEndRadius: isUser ? 4 : 18,
          background: isUser ? "var(--accent)" : "var(--panel)",
          color: isUser ? "#06210d" : "var(--ink)",
          border: isUser ? "none" : "1px solid var(--line)",
          fontSize: 15,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          textAlign: "start",
        }}
      >
        {content}
      </div>
    </div>
  );
}
