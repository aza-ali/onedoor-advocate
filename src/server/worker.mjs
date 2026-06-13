// One Door · California — the SINGLE Cloudflare Worker.
// Serves: the SPA (/), /healthz, /api/*, /mcp (Streamable HTTP MCP), the A2A AgentCard,
// and /voice/* (Vapi webhook + Opus SSE proxy). One `wrangler deploy`, one *.workers.dev URL.
// CPU-only metering, so awaiting Opus mid-call is safe.
//
// The eligibility math is done ONLY by the compiled engine (src/engine). Opus (when a key is
// present) does the 6 reasoning lanes; with no key the engine path + schema/MCP/A2A still run
// fully offline (Tier-1). Voice + Opus runtime light up when their secrets are supplied.

import { screenCalFresh, recommendStack, ENGINE_META } from "../engine/calfresh.mjs";
import SCHEMA from "../../schema/onedoor.schema.json" with { type: "json" };
import { DICT, localize, LANGS } from "./i18n.mjs";
import { SPA_HTML } from "./spa.mjs";
import { SHELF } from "./shelf.mjs";
import { handleExtract } from "./extract.mjs";
import { rxSavingsPaths } from "../mcp/rx.mjs";
import { handleVoice, verifyResource } from "../voice/voice.mjs";

const J = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", ...extra } });

// ---- the ONE screen-response code path (REST + MCP share this) ----------------------------
export function buildScreenResponse(household = {}, lang = "en") {
  household = { today: ENGINE_META.as_of_date, ...household }; // anonymous mode: defaults fill in
  const r = screenCalFresh(household);
  const recs = recommendStack(household, r);
  const citations = (r.engine_provenance || []).map((p) => ({
    rule: p.rule, source_id: p.source_id, source_url: p.source_url, paragraph: p.paragraph, verified_at: p.verified_at,
  }));
  const status_assumptions = [];
  if ((r.uncertain_facts || []).length) status_assumptions.push("One or more facts could not be settled by the engine and are flagged for live verification.");
  if (r.abawd_risk) status_assumptions.push("ABAWD work-requirement time limit may apply.");
  const out = {
    program: r.program,
    status: r.status,
    monthly_benefit: r.monthly_benefit ?? null,
    confidence: r.confidence ?? 0.5,
    citations,
    engine_provenance: r.engine_provenance || [],
    as_of_date: household.today,
    status_assumptions,
    disclaimer: r.disclaimer,
    computation: r.computation,
    why: r.why,
    warnings: r.warnings,
    uncertain_facts: r.uncertain_facts || [],
    abawd_risk: r.abawd_risk || null,
    recommendations: recs,
    fallback: r.status === "needs_more_info" ? r.fallback : undefined,
    navigator_fallback: r.navigator_fallback,
    presentation: localize(r, LANGS.includes(lang) ? lang : "en"),
    schema_version: SCHEMA.schema_version,
  };
  return out;
}

// ---- MCP (Streamable HTTP, JSON-RPC 2.0) --------------------------------------------------
function toolList() {
  return Object.entries(SCHEMA.tools).map(([name, t]) => ({
    name, description: t.description, inputSchema: t.inputSchema, outputSchema: t.outputSchema,
  }));
}

// minimal, dependency-free validator against the single-source schema (enough to make E4 bite)
export function validate(value, schema, path = "") {
  const errs = [];
  if (!schema) return errs;
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const ok = types.some((ty) => matchType(value, ty));
    if (!ok) { errs.push(`${path || "value"}: expected ${types.join("|")}, got ${typeof value}`); return errs; }
  }
  if (schema.const !== undefined && value !== schema.const) errs.push(`${path}: must equal ${schema.const}`);
  if (schema.enum && !schema.enum.includes(value)) errs.push(`${path}: not in enum`);
  if (schema.type === "object" && value && typeof value === "object") {
    for (const req of schema.required || []) {
      if (value[req] === undefined) errs.push(`${path}.${req}: required field missing`);
    }
    for (const [k, sub] of Object.entries(schema.properties || {})) {
      if (value[k] !== undefined) errs.push(...validate(value[k], sub, `${path}.${k}`));
    }
  }
  if (schema.type === "array" && Array.isArray(value) && schema.items) {
    value.forEach((v, i) => errs.push(...validate(v, schema.items, `${path}[${i}]`)));
  }
  return errs;
}
function matchType(v, ty) {
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

async function callTool(name, args, env) {
  const tool = SCHEMA.tools[name];
  if (!tool) throw new Error(`unknown tool ${name}`);
  let structured;
  if (name === "screen_eligibility") {
    structured = buildScreenResponse(args.household || {}, args.lang || "en");
  } else if (name === "search_programs") {
    const q = (args.query || "").toLowerCase();
    const ng = args.need_group;
    const services = SHELF.filter((s) => (!ng || s.need_group === ng) && (!q || JSON.stringify(s).toLowerCase().includes(q)))
      .map((s) => ({ program: s.program, need_group: s.need_group, one_line: s.one_line, next_step: s.next_step, citation: s.citation }));
    structured = { services, as_of_date: ENGINE_META.as_of_date, disclaimer: ENGINE_META.disclaimer };
  } else if (name === "verify_resource") {
    structured = await verifyResource(args, env);
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

async function handleMcp(req, env) {
  let body;
  try { body = await req.json(); } catch { return J({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }, 400); }
  const { id, method, params } = body;
  const reply = (result) => J({ jsonrpc: "2.0", id, result });
  if (method === "initialize") return reply({ protocolVersion: "2025-06-18", serverInfo: { name: "onedoor-ca", version: SCHEMA.schema_version }, capabilities: { tools: {} } });
  if (method === "tools/list") return reply({ tools: toolList() });
  if (method === "tools/call") {
    try { return reply(await callTool(params.name, params.arguments || {}, env)); }
    catch (e) { return J({ jsonrpc: "2.0", id, error: { code: -32000, message: String(e).slice(0, 120) } }); }
  }
  if (method === "ping") return reply({});
  return J({ jsonrpc: "2.0", id, error: { code: -32601, message: "method not found" } });
}

// ---- A2A AgentCard (imports the SAME schema by path; E3/E4) -------------------------------
function agentCard(origin) {
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
    skills: Object.entries(SCHEMA.tools).map(([name, t]) => ({
      id: name, name, description: t.description,
      // the AgentCard's I/O contract IS the single-source schema (tamper one field => both break)
      inputModes: ["application/json"], outputModes: ["application/json"],
      inputSchema: t.inputSchema, outputSchema: t.outputSchema,
    })),
  };
}

// ---- router -------------------------------------------------------------------------------
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (req.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS" } });

    if (p === "/healthz") return J({ ok: true, service: "onedoor-ca", ruleset: ENGINE_META.ruleset_id, as_of_date: ENGINE_META.as_of_date });
    if (p === "/" || p === "/index.html") return new Response(SPA_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
    if (p === "/.well-known/agent-card.json") return J(agentCard(url.origin));
    if (p === "/api/shelf") return J({ shelf: SHELF, as_of_date: ENGINE_META.as_of_date });
    if (p === "/api/i18n") return J({ dict: DICT, langs: LANGS });

    if (p === "/api/screen" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      return J(buildScreenResponse(body.household || body || {}, body.lang || "en"));
    }
    if (p === "/api/extract" && req.method === "POST") return handleExtract(req, env);
    if (p === "/api/verify-resource" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      return J(await verifyResource(body, env));
    }
    if (p === "/mcp" && req.method === "POST") return handleMcp(req, env);
    if (p.startsWith("/voice/")) return handleVoice(req, env, p);

    return J({ error: "not found", path: p }, 404);
  },
};
