import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@generated/prisma/client";
import { CONVERSATION_ID, conversationTitle, type ChatMessage } from "@/lib/ai-chat-types";
import { message } from "@/lib/ai-chat-schema";
import { isOwner } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const pendingCall = z.object({ id: z.string().min(1).max(100), name: z.string().max(128), label: z.string().max(200), input: z.unknown() });
const bodySchema = z.object({ messages: z.array(message).min(1).max(80), pending: z.array(pendingCall).max(20) });

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
type Ctx = { params: Promise<{ id: string }> };

/** One saved conversation; only the panel session may read or change it. */
export async function GET(_request: NextRequest, { params }: Ctx) {
  if (!(await isOwner())) return json({ message: "Unauthorized" }, 401);
  const { id } = await params;
  const row = CONVERSATION_ID.test(id) ? await db.aiConversation.findUnique({ where: { id } }) : null;
  const parsed = bodySchema.safeParse(row?.data);
  if (!row || !parsed.success) return json({ message: "Not found" }, 404);
  return json({ id: row.id, title: row.title, ...parsed.data });
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  if (!(await isOwner())) return json({ message: "Unauthorized" }, 401);
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!CONVERSATION_ID.test(id) || !parsed.success) return json({ message: "درخواست نامعتبر است." }, 400);
  const data = JSON.parse(JSON.stringify(parsed.data)) as Prisma.InputJsonObject;
  // The title comes from the first message and is set once, when the conversation is created.
  const title = conversationTitle(parsed.data.messages as ChatMessage[]);
  const row = await db.aiConversation.upsert({ where: { id }, create: { id, title, data }, update: { data }, select: { title: true, updatedAt: true } });
  return json(row);
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  if (!(await isOwner())) return json({ message: "Unauthorized" }, 401);
  const { id } = await params;
  if (CONVERSATION_ID.test(id)) await db.aiConversation.deleteMany({ where: { id } });
  return json({ ok: true });
}
