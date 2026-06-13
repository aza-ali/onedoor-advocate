// SERVER-ONLY. The grounding brain binding. The LLM never computes eligibility or invents a
// rule; it calls these functions, which delegate to the preserved deterministic engine
// (src/engine/calfresh.mjs) and the cited ruleset. Every served dollar figure / verdict / rule
// originates here, with its citation. Import only from server code (route handlers / actions).
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
// @ts-ignore - preserved ESM engine (allowJs); see config/rules.json for cited constants
import { screenCalFresh, recommendStack, ENGINE_META } from "../src/engine/calfresh.mjs";
// @ts-ignore
import { SHELF } from "../src/server/shelf.mjs";
// @ts-ignore
import { DICT, localize, LANGS } from "../src/server/i18n.mjs";

export type Member = {
  age?: number; immigration_status?: string; is_student?: boolean; work_hours_per_week?: number;
  is_disabled?: boolean; is_elderly?: boolean; has_dependent_under_14?: boolean; is_pregnant?: boolean;
};
export type Household = {
  today?: string; county?: string; household_size?: number;
  monthly_earned_income?: number; monthly_unearned_income?: number;
  shelter_cost_monthly?: number; utilities_monthly?: number;
  dependent_care_monthly?: number; medical_expenses_monthly?: number; members?: Member[];
};

const rulesPath = path.join(process.cwd(), "config", "rules.json");
function rules(): any { return JSON.parse(readFileSync(rulesPath, "utf8")); }

// The single screen-response code path (REST /api/screen + the screen_eligibility tool share it).
export function runScreen(household: Household = {}, lang = "en") {
  const hh = { today: ENGINE_META.as_of_date, ...household };
  const r = screenCalFresh(hh);
  const recs = recommendStack(hh, r);
  const citations = (r.engine_provenance || []).map((p: any) => ({
    rule: p.rule, source_id: p.source_id, source_url: p.source_url, paragraph: p.paragraph, verified_at: p.verified_at,
  }));
  const status_assumptions: string[] = [];
  if ((r.uncertain_facts || []).length) status_assumptions.push("One or more facts could not be settled by the engine and are flagged for live verification.");
  if (r.abawd_risk) status_assumptions.push("ABAWD work-requirement time limit may apply.");
  return {
    program: r.program, status: r.status,
    monthly_benefit: r.monthly_benefit ?? null, confidence: r.confidence ?? 0.5,
    citations, engine_provenance: r.engine_provenance || [],
    as_of_date: hh.today, status_assumptions, disclaimer: r.disclaimer,
    computation: r.computation, why: r.why, warnings: r.warnings,
    uncertain_facts: r.uncertain_facts || [], abawd_risk: r.abawd_risk || null,
    recommendations: recs, fallback: r.status === "needs_more_info" ? r.fallback : undefined,
    navigator_fallback: r.navigator_fallback,
    // localize() builds the full card incl. recommendations, so it must see them (the raw
    // engine result `r` has no .recommendations — those are computed separately above).
    presentation: localize({ ...r, recommendations: recs }, LANGS.includes(lang) ? lang : "en"),
    schema_version: "1.0.0",
  };
}

export function recommend(household: Household = {}) {
  const hh = { today: ENGINE_META.as_of_date, ...household };
  return recommendStack(hh, screenCalFresh(hh));
}

export function getRuleCitation(rule_id: string) {
  const R = rules();
  const r = R[rule_id];
  if (!r) return { error: `unknown rule_id '${rule_id}'`, available: Object.keys(R).filter((k) => k !== "sources" && k !== "_note") };
  const src = (R.sources || {})[r.source_id] || {};
  return { rule: rule_id, value: r.value, source_id: r.source_id, source_url: r.source_url_override || src.url || null,
    paragraph: r.paragraph, effective_from: r.effective_from, effective_to: r.effective_to, verified_at: r.verified_at, confidence: r.confidence, known_gap: r.known_gap || null };
}

export function shelf() { return SHELF; }
export function i18n() { return { dict: DICT, langs: LANGS }; }
export { ENGINE_META };

// ---- Anthropic tool-use definitions (the contract Claude is given) ------------------------
export const TOOLS = [
  {
    name: "screen_eligibility",
    description: "Compute a household's CalFresh eligibility verdict and estimated monthly benefit from the deterministic, cited engine. Call this for ANY eligibility verdict or dollar figure. Never state a benefit amount or eligibility result that did not come from this tool.",
    input_schema: {
      type: "object",
      properties: {
        household: {
          type: "object",
          description: "What you have gathered about the household so far. Omit unknown fields.",
          properties: {
            today: { type: "string", description: "YYYY-MM-DD; defaults to today" },
            county: { type: "string" },
            household_size: { type: "integer" },
            monthly_earned_income: { type: "number" },
            monthly_unearned_income: { type: "number" },
            shelter_cost_monthly: { type: "number" },
            utilities_monthly: { type: "number" },
            dependent_care_monthly: { type: "number" },
            medical_expenses_monthly: { type: "number" },
            members: { type: "array", items: { type: "object" } },
          },
        },
        lang: { type: "string", enum: ["en", "es", "fa"] },
      },
      required: ["household"],
    },
  },
  {
    name: "recommend_stack",
    description: "Given a household, list OTHER California benefits it likely qualifies for (WIC, Medi-Cal, CalEITC, CARE/FERA, LifeLine, school meals, SUN Bucks). Each item is cited and carries NO dollar figure (only CalFresh is computed).",
    input_schema: {
      type: "object",
      properties: { household: { type: "object" } },
      required: ["household"],
    },
  },
  {
    name: "get_rule_citation",
    description: "Fetch the exact cited policy paragraph + source URL behind a named rule (e.g. 'ca_bbce_gross_limit', 'hr1_abawd_work_requirement', 'max_allotment'). Use when explaining WHY a rule applies.",
    input_schema: {
      type: "object",
      properties: { rule_id: { type: "string" } },
      required: ["rule_id"],
    },
  },
] as const;

export function runTool(name: string, input: any) {
  switch (name) {
    case "screen_eligibility": return runScreen(input?.household || {}, input?.lang || "en");
    case "recommend_stack": return recommend(input?.household || {});
    case "get_rule_citation": return getRuleCitation(input?.rule_id);
    default: return { error: `unknown tool ${name}` };
  }
}
