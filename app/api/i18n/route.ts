import { NextResponse } from "next/server";
import { i18n } from "@/lib/engine";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(i18n());
}
