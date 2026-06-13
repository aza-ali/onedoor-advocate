// Document / natural-language -> household_context extraction (Opus reasoning lane #1 & #3).
// Opus 4.8 vision reads an uploaded doc (pay stub / 1040 / past app) OR messy prose into the
// structured household. Extracted fields are returned with needs_confirmation:true and are NOT
// auto-fed to the engine until the human confirms/corrects them (C5). Doc PII is NOT persisted.
import PAYSTUB from "../../test/fixtures/paystub.json" with { type: "json" };

const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });

const SYSTEM = `You extract a CalFresh household_context from messy text or a document image. Return ONLY JSON with keys: county, household_size, monthly_earned_income, monthly_unearned_income, shelter_cost_monthly, members (array of {age, immigration_status?, is_student?, work_hours_per_week?, is_disabled?, is_elderly?, has_dependent_under_14?}), extraction_notes. Convert pay frequencies to MONTHLY (weekly x 4.33, biweekly x 2.17, semimonthly x 2). Never invent values; omit unknowns. You do NO eligibility math.`;

export async function handleExtract(req, env) {
  const body = await req.json().catch(() => ({}));
  // Fixture path (offline / demo backstop): the bundled synthetic pay stub.
  if (body.fixture === "paystub" || (!body.text && !body.document_base64 && !env?.ANTHROPIC_API_KEY)) {
    return J({
      source: "fixture:paystub (synthetic, no real PII; pre-captured backstop)",
      extracted: PAYSTUB.expected_parse,
      needs_confirmation: true,
      persisted: false,
      note: "Confirm or correct these fields before they drive the engine. The document itself is not stored.",
    });
  }
  if (!env?.ANTHROPIC_API_KEY) {
    return J({ error: "live extraction needs ANTHROPIC_API_KEY; POST {fixture:'paystub'} for the offline demo parse." }, 503);
  }
  // Live Opus extraction (deploy-time).
  const content = body.document_base64
    ? [{ type: "image", source: { type: "base64", media_type: body.mime || "image/png", data: body.document_base64 } }, { type: "text", text: "Extract the household_context from this document." }]
    : [{ type: "text", text: `Extract the household_context from: ${body.text}` }];
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-opus-4-8", max_tokens: 1024, system: SYSTEM, messages: [{ role: "user", content }] }),
  });
  const data = await resp.json();
  let extracted = {};
  try { extracted = JSON.parse((data.content?.[0]?.text || "{}").replace(/```json|```/g, "")); } catch {}
  // PII is NOT persisted: we hold extracted only in this response, never written to any store.
  return J({ source: "opus-4.8", extracted: { ...extracted, needs_confirmation: true }, needs_confirmation: true, persisted: false });
}
