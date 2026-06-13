import { NextResponse } from "next/server";
import { shelf, ENGINE_META } from "@/lib/engine";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ shelf: shelf(), as_of_date: ENGINE_META.as_of_date });
}
