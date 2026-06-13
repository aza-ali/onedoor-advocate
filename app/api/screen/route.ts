import { NextResponse } from "next/server";
import { runScreen } from "@/lib/engine";

// Node runtime: the deterministic engine reads config/rules.json via fs. Never the LLM's math.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const household = body.household || body || {};
  const lang = body.lang || "en";
  return NextResponse.json(runScreen(household, lang));
}
