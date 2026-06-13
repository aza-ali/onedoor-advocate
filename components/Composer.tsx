"use client";

import { useRef, useState } from "react";
import Uploader from "./Uploader";

type Props = {
  onSend: (text: string) => void;
  onExtracted: (fields: Record<string, any>) => void;
  busy: boolean;
  placeholder?: string;
};

const MAX_TEXTAREA_PX = 132;

// Sticky bottom composer: a growable textarea, a thumb-sized send button, and an attach
// toggle that reveals the document Uploader. One-handed phone use (large tap targets,
// safe-area inset, >=16px font to avoid iOS focus-zoom).
export default function Composer({ onSend, onExtracted, busy, placeholder = "Type your answer" }: Props) {
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
    requestAnimationFrame(() => { if (taRef.current) taRef.current.style.height = "auto"; });
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }
  function handleExtracted(fields: Record<string, any>) { onExtracted(fields); setShowUploader(false); }

  const canSend = text.trim().length > 0 && !busy;

  return (
    <div>
      {showUploader && (
        <div className="upanel"><Uploader onExtracted={handleExtracted} /></div>
      )}
      <div className="composer">
        <button type="button" className="icon-btn" aria-label="Attach a document" aria-pressed={showUploader} onClick={() => setShowUploader((s) => !s)}>
          <span aria-hidden style={{ fontSize: 22, lineHeight: 1 }}>{showUploader ? "×" : "+"}</span>
        </button>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => { setText(e.target.value); autosize(); }}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
          enterKeyHint="send"
        />
        <button type="button" className="send-btn" aria-label="Send message" onClick={submit} disabled={!canSend}>
          <span aria-hidden style={{ fontSize: 17, transform: "translateX(1px)" }}>&#10148;</span>
        </button>
      </div>
    </div>
  );
}
