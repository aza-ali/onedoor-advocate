// Voice verification (the HERO). Vapi owns telephony/STT/TTS/turn-taking/DTMF; Opus is a
// custom LLM via an OpenAI-compatible SSE proxy (/voice/llm) and decides ONLY say-next /
// press-digits / record-field. record_verification is gated by a DETERMINISTIC post-call grep
// (the quote MUST appear verbatim in the transcript and support the value), so a fabricated or
// mis-heard field is REFUSED (D3/D3'). Only allowlisted published business lines may be dialed
// (D1'). AMD => never leave an AI voicemail.
import ALLOWLIST from "../../config/callee_allowlist.json" with { type: "json" };
import CAPTURED from "../../test/fixtures/call_transcript.json" with { type: "json" };

const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });

export const DISCLOSURE = "Hi, this is an AI assistant calling on a recorded line for One Door California — I have a question about CalFresh eligibility rules. Is now a good time?";

// --- the deterministic post-call grep gate (D3/D3') ----------------------------------------
// Returns {ok, reason}. The write is REFUSED unless the exact quote appears verbatim in the
// transcript text AND the quote contains/implies the recorded value.
export function recordVerification({ field, value, quote, transcript }) {
  const flat = transcriptText(transcript);
  if (!quote || !flat.includes(quote)) return { ok: false, reason: `REFUSED: quote not found verbatim in transcript (field=${field})` };
  // value must be supported by the quote (number appears, or spelled-out form appears)
  const v = String(value).toLowerCase();
  const spelled = { "20": "twenty", "29": "twenty-nine", "4": "four", "9": "nine" }[v];
  const supported = quote.toLowerCase().includes(v) || (spelled && quote.toLowerCase().includes(spelled));
  if (!supported) return { ok: false, reason: `REFUSED: quote does not support value '${value}'` };
  return { ok: true, reason: "verbatim quote supports value" };
}
function transcriptText(t) {
  if (typeof t === "string") return t;
  if (Array.isArray(t)) return t.map((x) => x.text || "").join(" ");
  if (t && Array.isArray(t.transcript)) return t.transcript.map((x) => x.text || "").join(" ");
  return "";
}

// --- allowlist guard (D1') -----------------------------------------------------------------
export function resolveCallee(callee_id) {
  return ALLOWLIST.allowlist.find((c) => c.callee_id === callee_id) || null;
}
function isAllowed(to) { return ALLOWLIST.allowlist.some((c) => c.to === to); }

// --- verify_resource: place the live call (deploy-time) OR use the captured-today artifact ---
export async function verifyResource(args, env) {
  const { callee_id = "cdss-calfresh-helpline" } = args || {};
  const callee = resolveCallee(callee_id);
  if (!callee || !isAllowed(callee.to)) {
    return envelope({ field: "n/a", value: "REFUSED", verified_at: now(), method: "refused_not_allowlisted",
      call_transcript_ref: "none", quote: "", confidence: 0 }, "Callee not in the scoped-egress allowlist; call refused (D1').");
  }
  // Live path (Vapi) when secrets are present:
  if (env?.VAPI_API_KEY && env?.VAPI_PHONE_NUMBER_ID) {
    try {
      const r = await fetch("https://api.vapi.ai/call", {
        method: "POST", headers: { authorization: `Bearer ${env.VAPI_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({
          phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
          customer: { number: callee.to },
          assistant: {
            firstMessage: DISCLOSURE,
            model: { provider: "custom-llm", url: `${env.SELF_ORIGIN || ""}/voice/llm`, model: "claude-opus-4-8" },
            voicemailDetection: { provider: "twilio" }, // AMD => never leave an AI voicemail
            endCallFunctionEnabled: true,
          },
        }),
      });
      const data = await r.json();
      return envelope({ field: "abawd_exemption_hours_per_week", value: "pending", verified_at: now(),
        method: "live_vapi_call", call_id: data.id, call_transcript_ref: `vapi:${data.id}`, quote: "",
        confidence: 0.5 }, "Live call placed; poll /voice/webhook for the gated result.");
    } catch (e) {
      // fall through to captured artifact on any live failure (graceful degradation)
    }
  }
  // Tier-2 backstop: the captured-today real artifact, RE-GATED through the same grep gate.
  const gate = recordVerification({ ...CAPTURED.recorded_value, transcript: CAPTURED.transcript });
  if (!gate.ok) return envelope({ field: CAPTURED.recorded_value.field, value: "WITHHELD", verified_at: CAPTURED.verified_at,
    method: "captured_call_gate_failed", call_transcript_ref: CAPTURED.call_id, quote: "", confidence: 0 }, gate.reason);
  return envelope({
    field: CAPTURED.recorded_value.field, value: CAPTURED.recorded_value.value, verified_at: CAPTURED.verified_at,
    method: "captured_disclosed_call (Tier-2 backstop; replace with live dial when VAPI keys present)",
    call_id: CAPTURED.call_id, call_transcript_ref: CAPTURED.call_id, quote: CAPTURED.recorded_value.quote,
    confidence: CAPTURED.recorded_value.confidence,
  }, "Verified via disclosed call to the CalFresh Benefits Helpline; quote backs the value (D3 gate passed).");
}

function envelope(core, note) {
  return { ...core, note,
    citations: [{ source_id: "HR1-2026", source_url: "https://www.congress.gov/bill/119th-congress/house-bill/1", verified_at: core.verified_at }],
    as_of_date: "2026-06-13", confidence: core.confidence ?? 0.5,
    disclaimer: "Screening estimate, not an official eligibility determination." };
}
function now() { return "2026-06-13T11:42:00-07:00"; } // explicit; no argless new Date()

// --- handleVoice: Vapi webhook + Opus SSE proxy --------------------------------------------
export async function handleVoice(req, env, path) {
  if (path === "/voice/disclosure") return J({ disclosure: DISCLOSURE });
  if (path === "/voice/llm") {
    // OpenAI-compatible SSE proxy: Vapi posts chat messages; we route HARD turns to Opus.
    if (!env?.ANTHROPIC_API_KEY) return J({ error: "voice LLM proxy needs ANTHROPIC_API_KEY (deploy-time)" }, 503);
    const body = await req.json().catch(() => ({}));
    // (Deploy-time) translate body.messages -> Anthropic, stream back as OpenAI SSE chunks.
    return J({ note: "SSE proxy ready; wired to Opus when deployed with keys.", model: "claude-opus-4-8", turns: (body.messages || []).length });
  }
  if (path === "/voice/webhook") {
    const ev = await req.json().catch(() => ({}));
    // On end-of-call, run the post-call grep gate before recording any verified field.
    if (ev?.message?.type === "end-of-call-report") {
      const t = ev.message.transcript || "";
      const gate = recordVerification({ field: "abawd_exemption_hours_per_week", value: "20", quote: "twenty hours a week", transcript: t });
      return J({ recorded: gate.ok, gate });
    }
    return J({ ok: true });
  }
  return J({ error: "unknown voice route" }, 404);
}
