import { NextResponse } from "next/server";
import { localizeResult } from "@/lib/i18n-dynamic";

// Re-localize the answer card into any language the user asked for. The deterministic engine
// computes the numbers (identical across languages); the model translates only the prose.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const household = body.household || {};
  const language = body.language || "English";
  if (!household || !Object.keys(household).length) {
    return NextResponse.json({ error: "household required" }, { status: 400 });
  }
  const result = await localizeResult(household, language);
  return NextResponse.json(result);
}
