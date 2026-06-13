import { NextResponse } from "next/server";
import { ENGINE_META } from "@/lib/engine";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, service: "onedoor-advocate", ruleset: ENGINE_META.ruleset_id, as_of_date: ENGINE_META.as_of_date });
}
