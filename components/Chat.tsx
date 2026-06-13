"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatStreamEvent, Profile, ScreenResult } from "../lib/types";
import { loadProfile, updateProfile } from "../lib/profile";
import Message from "./Message";
import Composer from "./Composer";
import Outputs from "./Outputs";

// Warm advocate greeting that opens the conversation and asks the first question.
const GREETING: Record<string, string> = {
  en: "Hi, I'm your benefits advocate. I can help you check what programs you may qualify for, like food assistance (SNAP). To start, which county do you live in?",
  es: "Hola, soy su defensor de beneficios. Puedo ayudarle a revisar para que programas podria calificar, como la ayuda de alimentos (SNAP). Para comenzar, en que condado vive?",
  fa: "سلام، من مدافع مزایای شما هستم. می‌توانم به شما کمک کنم ببینید واجد شرایط چه برنامه‌هایی هستید، مانند کمک غذایی (SNAP). برای شروع، در کدام شهرستان زندگی می‌کنید؟",
};

// The Profile type/contract has no `messages` field and updateProfile/migrate
// would silently drop it, so the transcript lives under its own localStorage key
// (within this lane). last_result is persisted through updateProfile (supported).
const MSG_KEY = "onedoor.messages";

function loadMessages(): ChatMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MSG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? (parsed as ChatMessage[]) : null;
  } catch {
    return null;
  }
}

function saveMessages(msgs: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MSG_KEY, JSON.stringify(msgs));
  } catch {
    // storage full/disabled: non-fatal
  }
}

const STR = {
  checking: { en: "Checking eligibility...", es: "Verificando elegibilidad...", fa: "در حال بررسی واجد شرایط بودن..." },
  attachedDoc: { en: "I uploaded a document.", es: "Subi un documento.", fa: "یک سند بارگذاری کردم." },
  here: { en: "Here's what I found from it:", es: "Esto es lo que encontre:", fa: "این چیزی است که پیدا کردم:" },
  network: {
    en: "Sorry, I had trouble connecting. Please check your connection and try again.",
    es: "Lo siento, tuve problemas para conectar. Verifique su conexion e intente de nuevo.",
    fa: "متاسفم، در اتصال مشکل داشتم. لطفا اتصال خود را بررسی کرده و دوباره تلاش کنید.",
  },
} as const;

function t(key: keyof typeof STR, lang: string): string {
  const m = STR[key] as Record<string, string>;
  return m[lang] ?? m.en;
}

// Human-readable labels for extracted household fields, used in the confirmation message.
const FIELD_LABELS: Record<string, string> = {
  county: "county",
  household_size: "household size",
  monthly_earned_income: "monthly earned income",
  monthly_unearned_income: "monthly unearned income",
  shelter_cost_monthly: "monthly rent/shelter",
  utilities_monthly: "monthly utilities",
  dependent_care_monthly: "monthly dependent care",
  medical_expenses_monthly: "monthly medical expenses",
  today: "date",
};

function summarizeFields(fields: Record<string, any>, lang: string): string {
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `• ${FIELD_LABELS[k] ?? k}: ${v}`);
  const head = lines.length ? `${t("attachedDoc", lang)} ${t("here", lang)}` : t("attachedDoc", lang);
  return [head, ...lines].join("\n");
}

export default function Chat({ lang }: { lang: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [result, setResult] = useState<ScreenResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false); // typing dots on the in-progress assistant msg
  const [checking, setChecking] = useState(false); // "Checking eligibility..." chip
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const hydrated = useRef(false);

  // Restore prior conversation + last result on first mount; otherwise seed a greeting.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const restored = loadMessages();
    let lastResult: ScreenResult | null = null;
    try {
      const p = loadProfile();
      if (p?.last_result) lastResult = p.last_result;
    } catch {
      // fresh start
    }
    setMessages(restored ?? [{ role: "assistant", content: GREETING[lang] ?? GREETING.en }]);
    if (lastResult) setResult(lastResult);
    // Greeting language is fixed at first mount; subsequent turns honor the picker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the newest content in view as messages grow or stream in.
  useEffect(() => {
    const el = scrollRef.current?.parentElement; // .app-main is the scroll container
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming, checking, result]);

  // Best-effort persistence: transcript to its own key, last_result to the profile.
  const persist = useCallback((msgs: ChatMessage[], res: ScreenResult | null) => {
    saveMessages(msgs);
    try {
      if (res) updateProfile({ last_result: res });
    } catch {
      // non-fatal
    }
  }, []);

  // Core: POST the transcript, stream SSE, and fold events into state.
  const runTurn = useCallback(
    async (nextMessages: ChatMessage[]) => {
      setBusy(true);
      setStreaming(true);
      setError(null);

      // Append a placeholder assistant message we grow with text deltas.
      let assistantIndex = -1;
      setMessages((prev) => {
        const withAssistant = [...prev, { role: "assistant" as const, content: "" }];
        assistantIndex = withAssistant.length - 1;
        return withAssistant;
      });

      let turnResult: ScreenResult | null = null;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages, lang, profile: loadProfile() }),
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
                if (assistantIndex >= 0 && copy[assistantIndex]) {
                  copy[assistantIndex] = {
                    role: "assistant",
                    content: copy[assistantIndex].content + evt.delta,
                  };
                }
                return copy;
              });
              break;
            case "tool_use":
              setChecking(true);
              break;
            case "tool_result":
              setChecking(false);
              break;
            case "result":
              turnResult = evt.result;
              setResult(evt.result);
              setChecking(false);
              break;
            case "error":
              setError(evt.message);
              setChecking(false);
              break;
            case "done":
              break;
          }
        };

        // Read the stream, split on SSE record boundaries, parse each data: line.
        // eslint-disable-next-line no-constant-condition
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
              if (!payload || payload === "[DONE]") continue;
              try {
                handle(JSON.parse(payload) as ChatStreamEvent);
              } catch {
                // skip malformed record, keep streaming
              }
            }
          }
        }
      } catch {
        setError(t("network", lang));
        setMessages((prev) => {
          // Drop an empty placeholder assistant bubble on hard failure.
          if (assistantIndex >= 0 && prev[assistantIndex]?.content === "") {
            const copy = prev.slice();
            copy.splice(assistantIndex, 1);
            return copy;
          }
          return prev;
        });
      } finally {
        setStreaming(false);
        setChecking(false);
        setBusy(false);
        // Persist the settled transcript + result.
        setMessages((prev) => {
          persist(prev, turnResult);
          return prev;
        });
      }
    },
    [lang, persist]
  );

  function handleSend(text: string) {
    if (busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    runTurn(next);
  }

  // Uploader fed us extracted fields: merge into the profile household, post a
  // visible confirmation as a user message, and run a turn so the engine sees them.
  function handleExtracted(fields: Record<string, any>) {
    try {
      // updateProfile shallow-merges household and APPENDS extractions, so pass
      // only the new fields / new record (do not re-include prior state).
      updateProfile({
        household: { ...fields } as Profile["household"],
        extractions: [
          { source: "upload", fields, confirmed: false, at: new Date().toISOString() },
        ],
      });
    } catch {
      // merge is best-effort; the confirmation message still informs the user
    }
    const confirmation = summarizeFields(fields, lang);
    const next: ChatMessage[] = [...messages, { role: "user", content: confirmation }];
    setMessages(next);
    runTurn(next);
  }

  return (
    <>
      <div ref={scrollRef}>
        {messages.map((m, i) => {
          const isLastAssistant =
            m.role === "assistant" && i === messages.length - 1;
          const showDots = isLastAssistant && streaming && m.content === "";
          return (
            <div key={i}>
              {showDots ? <TypingDots /> : <Message role={m.role} content={m.content} />}
              {/* Render the eligibility result inline right after the final assistant turn. */}
              {isLastAssistant && result && !streaming && (
                <div style={{ margin: "4px 0 12px" }}>
                  <Outputs result={result} />
                </div>
              )}
            </div>
          );
        })}

        {checking && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <span
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--mut)",
                background: "var(--panel)",
                border: "1px solid var(--line)",
                borderRadius: 999,
                padding: "6px 12px",
              }}
            >
              {t("checking", lang)}
            </span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 10,
              fontSize: 13,
              color: "var(--bad)",
              background: "rgba(248,81,73,0.08)",
              border: "1px solid var(--bad)",
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Composer is sticky at the bottom of the scroll region. */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          marginLeft: -16,
          marginRight: -16,
          marginBottom: -16,
        }}
      >
        <Composer onSend={handleSend} onExtracted={handleExtracted} busy={busy} />
      </div>
    </>
  );
}

// Animated three-dot typing affordance shown while the assistant turn streams.
function TypingDots() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 18,
          borderEndStartRadius: 4,
          padding: "12px 16px",
          display: "flex",
          gap: 5,
          alignItems: "center",
        }}
        aria-label="typing"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--mut)",
              display: "inline-block",
              animation: "od-blink 1.2s infinite ease-in-out",
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes od-blink { 0%, 80%, 100% { opacity: .25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-2px); } }`}</style>
    </div>
  );
}
