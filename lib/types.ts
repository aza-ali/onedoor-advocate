// Shared types referenced by both server and client lanes. Keep in sync with lib/engine.ts.

export type Citation = { rule?: string; source_id: string; source_url: string | null; paragraph?: string; verified_at?: string };

export type Recommendation = { program: string; reason: string; adjunctive_or_threshold_citation?: { source_id: string; note: string }; next_step: string };

export type ScreenResult = {
  program: string;
  status: "likely_eligible" | "possibly_eligible" | "likely_not_eligible" | "needs_more_info";
  monthly_benefit: number | null;
  confidence: number;
  citations: Citation[];
  engine_provenance: Array<{ rule: string; source_id: string; paragraph: string; source_url?: string }>;
  as_of_date: string;
  status_assumptions: string[];
  disclaimer: string;
  computation?: Record<string, any>;
  why?: string[];
  warnings?: string[];
  uncertain_facts?: any[];
  abawd_risk?: any;
  recommendations: Recommendation[];
  navigator_fallback?: { action: string; phone?: string; url?: string; note?: string };
  presentation?: Record<string, any>;
  schema_version?: string;
};

// Accumulated applicant facts carried across turns. localStorage now; Firestore-shaped for later.
export type Profile = {
  schema_version: 1;
  updated_at: string;
  lang: "en" | "es" | "fa";
  household: {
    today?: string; county?: string; household_size?: number;
    monthly_earned_income?: number; monthly_unearned_income?: number;
    shelter_cost_monthly?: number; utilities_monthly?: number;
    dependent_care_monthly?: number; medical_expenses_monthly?: number;
    members?: Array<Record<string, any>>;
  };
  extractions: Array<{ source: string; fields: Record<string, any>; confirmed: boolean; at: string }>;
  last_result?: ScreenResult | null;
};

// One chat message in the UI / wire protocol.
export type ChatMessage = { role: "user" | "assistant"; content: string };

// SSE event shapes streamed by /api/chat.
export type ChatStreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool_use"; name: string; input: any }
  | { type: "tool_result"; name: string; result: any }
  | { type: "result"; result: ScreenResult; household?: Record<string, any> }
  | { type: "done" }
  | { type: "error"; message: string };
