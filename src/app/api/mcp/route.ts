import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { handleMcpMessage } from "@/lib/mcp/server";

/** The panel's MCP endpoint (streamable HTTP, JSON replies). Owner session only; write tools are never run from here. */
export async function POST(request: Request) {
  if (!(await isOwner())) return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Unauthorized" } }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
  const messages = Array.isArray(body) ? body : [body];
  const replies = (await Promise.all(messages.map((message) => handleMcpMessage(message, { allowWrite: false })))).filter((reply) => reply !== null);
  if (replies.length === 0) return new NextResponse(null, { status: 202 });
  return NextResponse.json(Array.isArray(body) ? replies : replies[0]);
}

export function GET() {
  return new NextResponse(null, { status: 405, headers: { allow: "POST" } });
}
