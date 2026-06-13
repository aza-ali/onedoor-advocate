"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActiveLanguage, ChatMessage, ChatStreamEvent, Profile, ScreenResult } from "../lib/types";
import { loadProfile, updateProfile } from "../lib/profile";
import Message from "./Message";
import Composer from "./Composer";
import Outputs from "./Outputs";

// A welcoming, language-first greeting. The model takes over in the person's language as soon
// as it knows it (via set_language). Kept warm and multilingual so anyone feels invited.
const GREETING =
  "Hi, I am your benefits advocate, and I can help in any language. Which language would you like to use? Just tell me, or type in your language.\n\nHola · 你好 · مرحبا · Xin chào · 안녕하세요 · Tagalog?";

// English fallbacks for the few chrome strings. When the model sets a language it also sends
// translations of these (language.ui), so the whole interface matches; until then, English.
const EN = {
  placeholder: "Type your answer",
  checking: "Checking your eligibility",
  send: "Send message",
  attach: "Attach a document",
  network: "Sorry, I had trouble connecting. Please check your connection and try again.",
  attached: "I uploaded a document. Here is what it found:",
};

// Map the conversational language label to a builtin uploader locale (en/es/fa); other
// languages fall back to English chrome in the uploader (the conversation + card are translated).
function uploaderLang(label: string): string {
  const l = label.toLowerCase();
  if (l.startsWith("span") || l.includes("español") || l.includes("espanol")) return "es";
  if (l.includes("fars") || l.includes("persian") || l.includes("dari") || l.includes("فارس")) return "fa";
  return "en";
}

const MSG_KEY = "onedoor.messages";
function loadMessages(): ChatMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MSG_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length ? (parsed as ChatMessage[]) : null;
  } catch { return null; }
}
function saveMessages(msgs: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(MSG_KEY, JSON.stringify(msgs)); } catch { /* full/disabled */ }
}

const FIELD_LABELS: Record<string, string> = {
  county: "county", household_size: "household size", monthly_earned_income: "monthly earned income",
  monthly_unearned_income: "monthly unearned income", shelter_cost_monthly: "monthly rent/shelter",
  utilities_monthly: "monthly utilities", dependent_care_monthly: "monthly dependent care",
  medical_expenses_monthly: "monthly medical expenses",
};
function summarizeFields(fields: Record<string, any>): string {
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${FIELD_LABELS[k] ?? k}: ${v}`);
  return [EN.attached, ...lines].join("\n");
}

export default function Chat({ language, onLanguage }: { language: ActiveLanguage; onLanguage: (l: ActiveLanguage) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [result, setResult] = useState<ScreenResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const hydrated = useRef(false);
  const lastHousehold = useRef<Record<string, any> | null>(null);
  const languageRef = useRef(language);
  languageRef.current = language;

  const chrome = (k: keyof typeof EN) => language.ui?.[k] || EN[k];

  // Restore prior conversation + result + household on first mount; else seed the greeting.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const restored = loadMessages();
    try {
      const p = loadProfile();
      if (p?.last_result) setResult(p.last_result);
      if (p?.household && Object.keys(p.household).length) lastHousehold.current = p.household;
    } catch { /* fresh */ }
    setMessages(restored ?? [{ role: "assistant", content: GREETING }]);
  }, []);

  // Keep newest content in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming, checking, result]);

  const persist = useCallback((msgs: ChatMessage[], res: ScreenResult | null) => {
    saveMessages(msgs);
    try { if (res) updateProfile({ last_result: res }); } catch { /* non-fatal */ }
  }, []);

  // Re-localize an EXISTING card when the language changes mid-conversation (deterministic
  // re-screen: numbers identical, only the card prose changes). The upcoming turn's result is
  // already translated by the server, so this only matters for a card from a prior turn.
  const relocalizeCard = useCallback((label: string) => {
    const hh = lastHousehold.current || loadProfile().household;
    if (!hh || !Object.keys(hh).length) return;
    fetch("/api/localize-card", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ household: hh, language: label }),
    }).then((r) => r.json()).then((res) => { if (!res?.error) setResult(res); }).catch(() => {});
  }, []);

  const runTurn = useCallback(
    async (nextMessages: ChatMessage[]) => {
      setBusy(true); setStreaming(true); setError(null);
      let assistantIndex = -1;
      setMessages((prev) => {
        const withAssistant = [...prev, { role: "assistant" as const, content: "" }];
        assistantIndex = withAssistant.length - 1;
        return withAssistant;
      });
      let turnResult: ScreenResult | null = null;

      try {
        const res = await fetch("/api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages, language: languageRef.current.label, profile: loadProfile() }),
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const handle = (evt: ChatStreamEvent) => {
          switch (evt.type) {
            case "text":
              setMessages((prev) => {
                const copy = prev.slice();
                if (assistantIndex >= 0 && copy[assistantIndex]) copy[assistantIndex] = { role: "assistant", content: copy[assistantIndex].content + evt.delta };
                return copy;
              });
              break;
            case "tool_use": if (evt.name === "screen_eligibility") setChecking(true); break;
            case "tool_result": setChecking(false); break;
            case "language": {
              const next: ActiveLanguage = { label: evt.language, dir: evt.dir, ui: evt.ui || {} };
              onLanguage(next);
              relocalizeCard(evt.language);
              break;
            }
            case "result":
              turnResult = evt.result;
              setResult(evt.result);
              if (evt.household && Object.keys(evt.household).length) {
                lastHousehold.current = evt.household;
                try { updateProfile({ household: evt.household as Profile["household"] }); } catch {}
              }
              setChecking(false);
              break;
            case "error": setError(evt.message); setChecking(false); break;
            case "done": break;
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const record = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            for (const line of record.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (!payload) continue;
              try { handle(JSON.parse(payload) as ChatStreamEvent); } catch { /* skip */ }
            }
          }
        }
      } catch {
        setError(chrome("network"));
        setMessages((prev) => {
          if (assistantIndex >= 0 && prev[assistantIndex]?.content === "") { const c = prev.slice(); c.splice(assistantIndex, 1); return c; }
          return prev;
        });
      } finally {
        setStreaming(false); setChecking(false); setBusy(false);
        setMessages((prev) => { persist(prev, turnResult); return prev; });
      }
    },
    [persist, onLanguage, relocalizeCard, language]
  );

  function handleSend(text: string) {
    if (busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    runTurn(next);
  }

  function handleExtracted(fields: Record<string, any>) {
    try {
      updateProfile({ household: { ...fields } as Profile["household"], extractions: [{ source: "upload", fields, confirmed: false, at: new Date().toISOString() }] });
    } catch { /* best-effort */ }
    const next: ChatMessage[] = [...messages, { role: "user", content: summarizeFields(fields) }];
    setMessages(next);
    runTurn(next);
  }

  return (
    <div className="chat">
      <div ref={scrollRef} className="thread">
        {messages.map((m, i) => {
          const isLastAssistant = m.role === "assistant" && i === messages.length - 1;
          const showDots = isLastAssistant && streaming && m.content === "";
          return (
            <div key={i}>
              {showDots ? <TypingDots /> : <Message role={m.role} content={m.content} />}
              {isLastAssistant && result && !streaming && (
                <div style={{ margin: "4px 0 12px" }}>
                  <Outputs result={result} />
                </div>
              )}
            </div>
          );
        })}

        {checking && <div className="checking" role="status" aria-live="polite"><span className="spin" aria-hidden />{chrome("checking")}</div>}

        {error && (
          <div role="alert" style={{ fontSize: 13, color: "var(--bad)", background: "var(--bad-soft)", border: "1px solid var(--bad)", borderRadius: "var(--r-sm)", padding: "10px 12px" }}>
            {error}
          </div>
        )}
      </div>

      <div className="composer-dock">
        <Composer onSend={handleSend} onExtracted={handleExtracted} busy={busy} lang={uploaderLang(language.label)} placeholder={chrome("placeholder")} attachLabel={chrome("attach")} sendLabel={chrome("send")} />
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="row assistant">
      <div className="typing" aria-label="typing"><i /><i /><i /></div>
    </div>
  );
}
