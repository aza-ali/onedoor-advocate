// /api/verify-resource — captured-fixture-backed voice verification (D3 grep gate).
// Ported from worker.mjs /api/verify-resource -> voice.mjs verifyResource().
import { NextRequest, NextResponse } from "next/server";
import { verifyResource } from "../../../lib/typed-api";

export const runtime = "nodejs";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(await verifyResource(body), { headers: CORS });
}
