// /mcp — Streamable HTTP MCP endpoint (JSON-RPC 2.0). Ported from worker.mjs handleMcp.
// Shares the single-source schema + callTool with the A2A AgentCard via lib/typed-api.
import { NextRequest, NextResponse } from "next/server";
import { toolList, callTool, schemaVersion } from "../../lib/typed-api";

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
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }, { status: 400, headers: CORS });
  }
  const { id, method, params } = body || {};
  const reply = (result: any) => NextResponse.json({ jsonrpc: "2.0", id, result }, { headers: CORS });

  if (method === "initialize") {
    return reply({ protocolVersion: "2025-06-18", serverInfo: { name: "onedoor-ca", version: schemaVersion() }, capabilities: { tools: {} } });
  }
  if (method === "tools/list") return reply({ tools: toolList() });
  if (method === "tools/call") {
    try {
      return reply(await callTool(params.name, params.arguments || {}));
    } catch (e) {
      return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32000, message: String(e).slice(0, 120) } }, { headers: CORS });
    }
  }
  if (method === "ping") return reply({});
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "method not found" } }, { headers: CORS });
}
