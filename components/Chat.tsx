"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatStreamEvent, Profile, ScreenResult } from "../lib/types";
import { loadProfile, updateProfile } from "../lib/profile";
import Message from "./Message";
import Composer from "./Composer";
import Outputs from "./Outputs";

// Warm advocate greeting that opens the conversation and asks the first question.
// Mirrors the greeting in src/server/i18n.mjs (single wording, both surfaces).
const GREETING: Record<string, string> = {
  en: "Hi, I am your benefits advocate. Tell me a little about your situation and I will check what you may qualify for. To start, which county do you live in?",
  es: "Hola, soy su defensor de beneficios. Cuénteme un poco sobre su situación y revisaré para qué podría calificar. Para comenzar, ¿en qué condado vive?",
  fa: "سلام، من مدافع مزایای شما هستم. کمی درباره وضعیت خود بگویید تا بررسی کنم واجد شرایط چه چیزی هستید. برای شروع، در کدام شهرستان زندگی می‌کنید؟",
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
  checking: { en: "Checking your eligibility", es: "Revisando su elegibilidad", fa: "در حال بررسی واجد شرایط بودن شما" },
  placeholder: { en: "Type your answer", es: "Escriba su respuesta", fa: "پاسخ خود را بنویسید" },
  attach: { en: "Attach a document", es: "Adjuntar un documento", fa: "پیوست سند" },
  send: { en: "Send message", es: "Enviar mensaje", fa: "ارسال پیام" },
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
  const prevLang = useRef(lang);
  const lastHousehold = useRef<Record<string, any> | null>(null);
  const langGen = useRef(0); // bumped on each language switch; only the latest commits its card
  const abortRef = useRef<AbortController | null>(null); // cancels an in-flight chat turn

  // Restore prior conversation + last result on first mount; otherwise seed a greeting.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const restored = loadMessages();
    let lastResult: ScreenResult | null = null;
    try {
      const p = loadProfile();
      if (p?.last_result) lastResult = p.last_result;
      if (p?.household && Object.keys(p.household).length) lastHousehold.current = p.household;
      // Sync the language ref to the SAVED language so the page's post-mount lang hydration
      // (en -> saved) is NOT mistaken for a user switch (which would truncate the restored
      // transcript and fire a spurious billed turn on every reload for non-English users).
      if (p?.lang) prevLang.current = p.lang;
    } catch {
      // fresh start
    }
    setMessages(restored ?? [{ role: "assistant", content: GREETING[lang] ?? GREETING.en }]);
    if (lastResult) setResult(lastResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the newest content in view as messages grow or stream in.
  useEffect(() => {
    const el = scrollRef.current; // .thread is the scroll container
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
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages, lang, profile: loadProfile() }),
          signal: ctrl.signal,
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
              // Remember the screened household so a later language switch can re-screen
              // deterministically (the card stays correct even if the model does not re-call
              // the tool). Persist it so the profile "knows you" across reloads.
              if (evt.household && Object.keys(evt.household).length) {
                lastHousehold.current = evt.household;
                try { updateProfile({ household: evt.household as Profile["household"] }); } catch {}
              }
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
      } catch (err: any) {
        // A language switch aborts the in-flight turn on purpose; that is not an error.
        if (err?.name !== "AbortError") setError(t("network", lang));
        setMessages((prev) => {
          // Drop an empty placeholder assistant bubble on failure or cancellation.
          if (assistantIndex >= 0 && prev[assistantIndex]?.content === "") {
            const copy = prev.slice();
            copy.splice(assistantIndex, 1);
            return copy;
          }
          return prev;
        });
      } finally {
        // Only clear busy/streaming if this turn is still the active one. A turn superseded by
        // a language switch must not flip busy off under the replacement turn that is now running.
        if (abortRef.current === ctrl) {
          abortRef.current = null;
          setStreaming(false);
          setChecking(false);
          setBusy(false);
        }
        // Persist the settled transcript + result.
        setMessages((prev) => {
          persist(prev, turnResult);
          return prev;
        });
      }
    },
    [lang, persist]
  );

  // Language change -> the agent regenerates the latest answer in the new language. It re-runs
  // the conversation through the model, which re-calls the engine, so the verdict + dollars come
  // back identical but the whole answer (prose AND the generative card) is worded in the new
  // language. The card clears briefly, then re-renders from the freshly localized result.
  useEffect(() => {
    if (!hydrated.current) { prevLang.current = lang; return; }
    if (prevLang.current === lang) return;
    prevLang.current = lang;
    const gen = ++langGen.current; // only the newest switch may commit its card / prose

    // Cancel any in-flight turn so a slower old-language answer cannot land on top.
    abortRef.current?.abort();
    abortRef.current = null;

    // Re-render the answer card in the new language immediately and deterministically:
    // re-screen the known household (math is identical, only the localized presentation
    // changes), so the card is always correct regardless of what the model does next.
    const hh = lastHousehold.current || loadProfile().household;
    if (hh && Object.keys(hh).length) {
      fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ household: hh, lang }),
      })
        .then((r) => r.json())
        .then((res) => { if (gen === langGen.current) setResult(res); }) // ignore a stale switch
        .catch(() => {});
    } else {
      setResult(null);
    }

    // Regenerate the conversational prose in the new language (the agent re-answers). We do this
    // even if a turn was mid-flight, because we just aborted it.
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx === -1) {
      // No question asked yet: simply re-localize the opening greeting.
      setBusy(false);
      setStreaming(false);
      setMessages([{ role: "assistant", content: GREETING[lang] ?? GREETING.en }]);
      return;
    }
    const base = messages.slice(0, lastUserIdx + 1);
    setMessages(base);
    runTurn(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

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
    <div className="chat">
      <div ref={scrollRef} className="thread">
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
          <div className="checking" role="status" aria-live="polite"><span className="spin" aria-hidden />{t("checking", lang)}</div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              fontSize: 13,
              color: "var(--bad)",
              background: "var(--bad-dim)",
              border: "1px solid var(--bad)",
              borderRadius: "var(--r-sm)",
              padding: "10px 12px",
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div className="composer-dock">
        <Composer onSend={handleSend} onExtracted={handleExtracted} busy={busy} lang={lang} placeholder={t("placeholder", lang)} attachLabel={t("attach", lang)} sendLabel={t("send", lang)} />
      </div>
    </div>
  );
}

// Animated three-dot typing affordance shown while the assistant turn streams.
function TypingDots() {
  return (
    <div className="row assistant">
      <div className="typing" aria-label="typing"><i /><i /><i /></div>
    </div>
  );
}
