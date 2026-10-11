import { NextResponse } from "next/server";
import { z } from "zod";
import { isOwner } from "@/lib/auth";
import { callTool } from "@/lib/mcp/server";
import { findMcpTool } from "@/lib/mcp/tools";

const bodySchema = z.object({ tool: z.string().min(1).max(60), args: z.record(z.string(), z.unknown()) });

/** Runs a write tool the owner confirmed in the chat, through the same MCP tool layer the model uses. */
export async function POST(request: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "دسترسی ندارید." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !findMcpTool(parsed.data.tool)?.write) return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 400 });
  const result = await callTool(parsed.data.tool, parsed.data.args, { allowWrite: true });
  const payload = JSON.parse(result.content[0].text) as { error?: string; message?: string };
  if (result.isError) return NextResponse.json({ error: payload.error ?? "عملیات انجام نشد." }, { status: 422 });
  return NextResponse.json({ message: payload.message ?? "انجام شد." });
}
