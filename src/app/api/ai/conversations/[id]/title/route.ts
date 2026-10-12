import { NextResponse, type NextRequest } from "next/server";
import { generateTitle } from "@/lib/ai-chat";
import { CONVERSATION_ID } from "@/lib/ai-chat-types";
import { isOwner } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Message = { role?: string; content?: string | null };

/** Names a saved conversation from its first question and answer, the way chat apps title a new chat. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const row = CONVERSATION_ID.test(id) ? await db.aiConversation.findUnique({ where: { id }, select: { data: true } }) : null;
  const messages = ((row?.data as { messages?: Message[] } | null)?.messages ?? []) as Message[];
  const user = messages.find((m) => m.role === "user")?.content;
  const reply = messages.find((m) => m.role === "assistant" && m.content?.trim())?.content;
  if (!user || !reply) return NextResponse.json({ title: null });

  const title = await generateTitle(user, reply);
  if (title) await db.aiConversation.updateMany({ where: { id }, data: { title } });
  return NextResponse.json({ title }, { headers: { "cache-control": "no-store" } });
}
