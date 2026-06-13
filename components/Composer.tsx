"use client";

import { useRef, useState } from "react";
import Uploader from "./Uploader";

type Props = {
  onSend: (text: string) => void;
  onExtracted: (fields: Record<string, any>) => void;
  busy: boolean;
};

const MAX_TEXTAREA_PX = 140;

// Sticky bottom composer: a growable textarea, a thumb-sized send button, and
// an attach toggle that reveals the document Uploader panel. Designed for
// one-handed phone use (large tap targets, safe-area inset, no horizontal scroll).
export default function Composer({ onSend, onExtracted, busy }: Props) {
  const [text, setText] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  function autosize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }

  function submit() {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setText("");
    // Reset the textarea height after clearing.
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (ta) ta.style.height = "auto";
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleExtracted(fields: Record<string, any>) {
    onExtracted(fields);
    setShowUploader(false);
  }

  const canSend = text.trim().length > 0 && !busy;

  return (
    <div
      style={{
        borderTop: "1px solid var(--line)",
        background: "var(--bg2)",
        padding: "10px 12px",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
      }}
    >
      {showUploader && (
        <div
          style={{
            marginBottom: 10,
            border: "1px solid var(--line)",
            borderRadius: 12,
            background: "var(--panel)",
            padding: 12,
          }}
        >
          <Uploader onExtracted={handleExtracted} />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        <button
          type="button"
          aria-label="Attach a document"
          aria-pressed={showUploader}
          onClick={() => setShowUploader((s) => !s)}
          style={{
            flex: "0 0 auto",
            width: 44,
            height: 44,
            borderRadius: 22,
            border: "1px solid var(--line)",
            background: showUploader ? "var(--panel2)" : "var(--panel)",
            color: "var(--ink)",
            fontSize: 20,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>

        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            autosize();
          }}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Type your answer..."
          enterKeyHint="send"
          style={{
            flex: 1,
            minHeight: 44,
            maxHeight: MAX_TEXTAREA_PX,
            resize: "none",
            borderRadius: 22,
            border: "1px solid var(--line)",
            background: "var(--panel)",
            color: "var(--ink)",
            padding: "11px 16px",
            fontSize: 16, // >=16px avoids iOS Safari auto-zoom on focus
            lineHeight: 1.4,
            outline: "none",
            overflowY: "auto",
          }}
        />

        <button
          type="button"
          aria-label="Send message"
          onClick={submit}
          disabled={!canSend}
          style={{
            flex: "0 0 auto",
            width: 44,
            height: 44,
            borderRadius: 22,
            border: "none",
            background: canSend ? "var(--accent)" : "var(--panel2)",
            color: canSend ? "#06210d" : "var(--mut)",
            fontSize: 18,
            cursor: canSend ? "pointer" : "default",
            transition: "background 120ms ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Send glyph; flips with writing direction via the parent dir. */}
          <span aria-hidden style={{ transform: "translateX(1px)" }}>
            &#10148;
          </span>
        </button>
      </div>
    </div>
  );
}
