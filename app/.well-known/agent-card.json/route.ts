// /.well-known/agent-card.json — A2A AgentCard. Ported from worker.mjs agentCard().
// The skills' inputSchema/outputSchema come from the SAME single-source schema object the MCP
// tools/list reads, so one edit to schema/onedoor.schema.json breaks BOTH surfaces.
import { NextRequest, NextResponse } from "next/server";
import { agentCard } from "../../../lib/typed-api";

export const runtime = "nodejs";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function GET(req: NextRequest) {
  return NextResponse.json(agentCard(new URL(req.url).origin), { headers: CORS });
}
