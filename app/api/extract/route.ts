// Document / natural-language -> household_context extraction (Opus reasoning lane).
// Opus 4.8 vision reads an uploaded doc (pay stub / 1040 / past app) OR messy prose into the
// structured household. Extracted fields are returned with needs_confirmation:true and are NOT
// auto-fed to the engine until the human confirms/corrects them. Document PII is NOT persisted.
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getClient, hasKey, MODEL } from "@/lib/anthropic";

// Node runtime: reads the offline fixture via fs and runs the server-only Anthropic client.
export const runtime = "nodejs";

const DISCLAIMER =
  "This is education and navigation, never an official determination, legal, or medical advice.";

const SYSTEM = `You extract a CalFresh household_context from messy text or a document image. Return ONLY JSON with keys: county, household_size, monthly_earned_income, monthly_unearned_income, shelter_cost_monthly, members (array of {age, immigration_status?, is_student?, work_hours_per_week?, is_disabled?, is_elderly?, has_dependent_under_14?}), extraction_notes. Convert pay frequencies to MONTHLY (weekly x 4.33, biweekly x 2.17, semimonthly x 2). Never invent values; omit unknowns. You do NO eligibility math.`;

type ExtractBody = {
  text?: string;
  document_base64?: string;
  mime?: string;
  fixture?: string;
};

export async function POST(req: Request) {
  const body: ExtractBody = await req.json().catch(() => ({}));

  // Fixture path (offline / demo backstop): the bundled synthetic pay stub. Used when explicitly
  // requested, or when there is no input AND no key (graceful offline default).
  const wantsFixture =
    body.fixture === "paystub" ||
    (!body.text && !body.document_base64 && !hasKey());
  if (wantsFixture) {
    try {
      const fixturePath = path.join(process.cwd(), "test", "fixtures", "paystub.json");
      const raw = await fs.readFile(fixturePath, "utf8");
      const paystub = JSON.parse(raw);
      return NextResponse.json({
        source: "fixture:paystub (synthetic, no real PII)",
        extracted: paystub.expected_parse,
        needs_confirmation: true,
        persisted: false,
        note: "Confirm or correct these fields before they drive the engine. The document itself is not stored.",
        disclaimer: DISCLAIMER,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: `could not load offline fixture: ${err?.message || String(err)}`, disclaimer: DISCLAIMER },
        { status: 500 },
      );
    }
  }

  // No key and not a fixture request -> cannot do live extraction.
  if (!hasKey()) {
    return NextResponse.json(
      { error: "live extraction needs ANTHROPIC_API_KEY; POST {fixture:'paystub'} for the offline demo parse." },
      { status: 503 },
    );
  }

  // Live Opus extraction. Document images go as a base64 image block; prose goes as a text block.
  const content: any[] = body.document_base64
    ? [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: body.mime || "image/png",
            data: body.document_base64,
          },
        },
        { type: "text", text: "Extract the household_context from this document." },
      ]
    : [{ type: "text", text: `Extract the household_context from: ${body.text || ""}` }];

  try {
    const resp = await getClient().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: "user", content }],
    });

    // Pull the model's text and parse JSON, stripping any ```json fences.
    const textOut =
      resp.content
        ?.filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("") || "{}";
    let extracted: Record<string, any> = {};
    try {
      extracted = JSON.parse(textOut.replace(/```json|```/g, "").trim());
    } catch {
      extracted = { extraction_notes: "Model output was not valid JSON; please re-enter the fields manually." };
    }

    // PII is NOT persisted: extracted fields exist only in this response, never written to any store.
    return NextResponse.json({
      source: "opus-4.8",
      extracted: { ...extracted, needs_confirmation: true },
      needs_confirmation: true,
      persisted: false,
      note: "Confirm or correct these fields before they drive the engine. The document itself is not stored.",
      disclaimer: DISCLAIMER,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `live extraction failed: ${err?.message || String(err)}`, disclaimer: DISCLAIMER },
      { status: 502 },
    );
  }
}
