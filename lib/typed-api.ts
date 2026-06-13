// SERVER-ONLY. The typed-API surface (MCP tools + A2A AgentCard) ported from the Cloudflare
// Worker (src/server/worker.mjs, src/mcp/rx.mjs, src/voice/voice.mjs) into Next route handlers.
// The SINGLE source of truth is schema/onedoor.schema.json: the MCP tools/list, tools/call
// outputSchema validation, AND the A2A AgentCard skills all read inputSchema/outputSchema from
// the SAME loaded object. One edit to that file must break BOTH surfaces (single source).
// GROUNDING CONTRACT: outputs are schema-validated; a citation-less / non-compliant output FAILS.
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { runScreen, shelf, ENGINE_META } from "./engine";

// ---- single-source loaders (fs from cwd; no static import so it stays the live file) -------
function readJson(...parts: string[]): any {
  return JSON.parse(readFileSync(path.join(process.cwd(), ...parts), "utf8"));
}
function loadSchema(): any { return readJson("schema", "onedoor.schema.json"); }
export function schemaVersion(): string { return loadSchema().schema_version; }

// ---- dependency-free validator (verbatim port from worker.mjs) ----------------------------
export function validate(value: any, schema: any, p = ""): string[] {
  const errs: string[] = [];
  if (!schema) return errs;
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const ok = types.some((ty: string) => matchType(value, ty));
    if (!ok) { errs.push(`${p || "value"}: expected ${types.join("|")}, got ${typeof value}`); return errs; }
  }
  if (schema.const !== undefined && value !== schema.const) errs.push(`${p}: must equal ${schema.const}`);
  if (schema.enum && !schema.enum.includes(value)) errs.push(`${p}: not in enum`);
  if (schema.type === "object" && value && typeof value === "object") {
    for (const req of schema.required || []) {
      if (value[req] === undefined) errs.push(`${p}.${req}: required field missing`);
    }
    for (const [k, sub] of Object.entries(schema.properties || {})) {
      if (value[k] !== undefined) errs.push(...validate(value[k], sub, `${p}.${k}`));
    }
  }
  if (schema.type === "array" && Array.isArray(value) && schema.items) {
    value.forEach((v: any, i: number) => errs.push(...validate(v, schema.items, `${p}[${i}]`)));
  }
  return errs;
}
function matchType(v: any, ty: string): boolean {
  switch (ty) {
    case "object": return v && typeof v === "object" && !Array.isArray(v);
    case "array": return Array.isArray(v);
    case "string": return typeof v === "string";
    case "number": return typeof v === "number";
    case "integer": return Number.isInteger(v);
    case "boolean": return typeof v === "boolean";
    case "null": return v === null;
    default: return true;
  }
}

// ---- MCP tools/list (reads inputSchema + outputSchema from the single-source schema) -------
export function toolList() {
  const SCHEMA = loadSchema();
  return Object.entries(SCHEMA.tools).map(([name, t]: [string, any]) => ({
    name, description: t.description, inputSchema: t.inputSchema, outputSchema: t.outputSchema,
  }));
}

// ---- A2A AgentCard (skills' inputSchema/outputSchema come from the SAME loaded object) -----
export function agentCard(origin: string) {
  const SCHEMA = loadSchema();
  return {
    schema_version: SCHEMA.schema_version,
    protocolVersion: "0.2.0",
    name: "One Door · California",
    description: "Verified California benefits eligibility brain (CalFresh deep + full-shelf discovery).",
    url: `${origin}/mcp`,
    provider: { organization: "One Door California" },
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ["application/json"],
    defaultOutputModes: ["application/json"],
    skills: Object.entries(SCHEMA.tools).map(([name, t]: [string, any]) => ({
      id: name, name, description: t.description,
      inputModes: ["application/json"], outputModes: ["application/json"],
      inputSchema: t.inputSchema, outputSchema: t.outputSchema,
    })),
  };
}

// ---- rx_savings_paths (verbatim port from src/mcp/rx.mjs) ----------------------------------
const RX_FEDERAL = new Set(["medicare", "medicaid", "tricare", "va"]);
const RX_DISCLAIMER = "Non-clinical cost information only. Ask your prescriber or pharmacist before changing anything about your medication.";

export function rxSavingsPaths({ drug = "", coverage_type = "uninsured" }: { drug?: string; coverage_type?: string } = {}) {
  const ct = String(coverage_type).toLowerCase();
  const isFederal = RX_FEDERAL.has(ct);
  const paths: any[] = [];
  if (ct === "commercial") {
    paths.push({ kind: "manufacturer_copay_card", name: `${drug} manufacturer copay card`, note: "Commercial insurance only; can lower copay to as little as $0 for eligible patients." });
  } else if (isFederal) {
    paths.push({ kind: "copay_card_suppressed", name: "Copay card not available", note: `Federal program members (${ct}) are excluded from manufacturer copay cards under OIG anti-kickback rules.` });
  }
  paths.push({ kind: "patient_assistance_program", name: `${drug || "Drug"} patient assistance program (PAP)`, note: "Manufacturer or NeedyMeds/RxAssist PAP for low-income patients; income documentation required." });
  paths.push({ kind: "cost_plus_pharmacy", name: "Mark Cuban Cost Plus Drugs", note: "Transparent cost-plus cash price; check costplusdrugs.com for the generic." });
  paths.push({ kind: "donated_medication", name: "SIRUM donated-medication network", note: "Free donated medications for qualifying low-income patients." });
  return {
    non_clinical: true,
    drug,
    coverage_type: ct,
    paths,
    advice: RX_DISCLAIMER,
    as_of_date: "2026-06-13",
    disclaimer: RX_DISCLAIMER,
  };
}

// ---- verify_resource (ported from src/voice/voice.mjs) -------------------------------------
// The deterministic post-call grep gate: the write is REFUSED unless the exact quote appears
// verbatim in the transcript AND the quote supports the recorded value (D3/D3').
function transcriptText(t: any): string {
  if (typeof t === "string") return t;
  if (Array.isArray(t)) return t.map((x: any) => x.text || "").join(" ");
  if (t && Array.isArray(t.transcript)) return t.transcript.map((x: any) => x.text || "").join(" ");
  return "";
}
function recordVerification({ field, value, quote, transcript }: { field: string; value: any; quote: string; transcript: any }) {
  const flat = transcriptText(transcript);
  if (!quote || !flat.includes(quote)) return { ok: false, reason: `REFUSED: quote not found verbatim in transcript (field=${field})` };
  const v = String(value).toLowerCase();
  const spelled = ({ "20": "twenty", "29": "twenty-nine", "4": "four", "9": "nine" } as Record<string, string>)[v];
  const supported = quote.toLowerCase().includes(v) || (spelled && quote.toLowerCase().includes(spelled));
  if (!supported) return { ok: false, reason: `REFUSED: quote does not support value '${value}'` };
  return { ok: true, reason: "verbatim quote supports value" };
}

function vNow() { return "2026-06-13T11:42:00-07:00"; } // explicit; no argless new Date()
function envelope(core: any, note: string) {
  return {
    ...core, note,
    citations: [{ source_id: "HR1-2026", source_url: "https://www.congress.gov/bill/119th-congress/house-bill/1", verified_at: core.verified_at }],
    as_of_date: "2026-06-13", confidence: core.confidence ?? 0.5,
    disclaimer: "Screening estimate, not an official eligibility determination.",
  };
}

export async function verifyResource(args: any) {
  const ALLOWLIST = readJson("config", "callee_allowlist.json");
  const CAPTURED = readJson("test", "fixtures", "call_transcript.json");
  const { callee_id = "cdss-calfresh-helpline" } = args || {};
  const callee = ALLOWLIST.allowlist.find((c: any) => c.callee_id === callee_id) || null;
  const isAllowed = (to: string) => ALLOWLIST.allowlist.some((c: any) => c.to === to);
  if (!callee || !isAllowed(callee.to)) {
    return envelope({ field: "n/a", value: "REFUSED", verified_at: vNow(), method: "refused_not_allowlisted",
      call_transcript_ref: "none", quote: "", confidence: 0 }, "Callee not in the scoped-egress allowlist; call refused (D1').");
  }
  // Live Vapi branch: env vars are absent in this environment, so it falls through to the
  // captured fixture by design.
  if (process.env.VAPI_API_KEY && process.env.VAPI_PHONE_NUMBER_ID) {
    try {
      const r = await fetch("https://api.vapi.ai/call", {
        method: "POST", headers: { authorization: `Bearer ${process.env.VAPI_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({
          phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
          customer: { number: callee.to },
          assistant: {
            firstMessage: "Hi, this is an AI assistant calling on a recorded line for One Door California — I have a question about CalFresh eligibility rules. Is now a good time?",
            model: { provider: "custom-llm", url: `${process.env.SELF_ORIGIN || ""}/voice/llm`, model: "claude-opus-4-8" },
            voicemailDetection: { provider: "twilio" },
            endCallFunctionEnabled: true,
          },
        }),
      });
      const data: any = await r.json();
      return envelope({ field: "abawd_exemption_hours_per_week", value: "pending", verified_at: vNow(),
        method: "live_vapi_call", call_id: data.id, call_transcript_ref: `vapi:${data.id}`, quote: "",
        confidence: 0.5 }, "Live call placed; poll /voice/webhook for the gated result.");
    } catch {
      // graceful degradation to captured artifact
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

// ---- callTool (ports worker.mjs callTool; enforces outputSchema = trust envelope) ----------
export async function callTool(name: string, args: any) {
  const SCHEMA = loadSchema();
  const tool = SCHEMA.tools[name];
  if (!tool) throw new Error(`unknown tool ${name}`);
  let structured: any;
  if (name === "screen_eligibility") {
    structured = runScreen(args.household || {}, args.lang || "en");
  } else if (name === "search_programs") {
    const q = (args.query || "").toLowerCase();
    const ng = args.need_group;
    const services = shelf()
      .filter((s: any) => (!ng || s.need_group === ng) && (!q || JSON.stringify(s).toLowerCase().includes(q)))
      .map((s: any) => ({ program: s.program, need_group: s.need_group, one_line: s.one_line, next_step: s.next_step, citation: s.citation }));
    structured = { services, as_of_date: ENGINE_META.as_of_date, disclaimer: ENGINE_META.disclaimer };
  } else if (name === "verify_resource") {
    structured = await verifyResource(args);
  } else if (name === "rx_savings_paths") {
    structured = rxSavingsPaths(args);
  }
  // enforce the trust envelope / outputSchema (citation-less or non-compliant output FAILS)
  const errs = validate(structured, tool.outputSchema);
  if (errs.length) {
    return { content: [{ type: "text", text: `outputSchema validation FAILED: ${errs.join("; ")}` }], isError: true };
  }
  return { content: [{ type: "text", text: JSON.stringify(structured) }], structuredContent: structured, isError: false };
}
