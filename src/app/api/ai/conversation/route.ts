import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { message } from "@/lib/ai-chat-schema";
import { isOwner } from "@/lib/auth";
import type { Prisma } from "@generated/prisma/client";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const pendingCall = z.object({ id: z.string().min(1).max(100), name: z.string().max(128), label: z.string().max(200), input: z.unknown() });
const bodySchema = z.object({ messages: z.array(message).max(80), pending: z.array(pendingCall).max(20) });

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });

/** The owner's one saved assistant conversation; only the panel session may read or change it. */
export async function GET() {
  if (!(await isOwner())) return json({ message: "Unauthorized" }, 401);
  const row = await db.aiConversation.findUnique({ where: { id: "main" } });
  const parsed = bodySchema.safeParse(row?.data);
  return json(parsed.success ? parsed.data : { messages: [], pending: [] });
}

export async function PUT(request: NextRequest) {
  if (!(await isOwner())) return json({ message: "Unauthorized" }, 401);
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ message: "درخواست نامعتبر است." }, 400);
  if (parsed.data.messages.length === 0) {
    await db.aiConversation.deleteMany({ where: { id: "main" } });
  } else {
    const data = JSON.parse(JSON.stringify(parsed.data)) as Prisma.InputJsonObject;
    await db.aiConversation.upsert({ where: { id: "main" }, create: { id: "main", data }, update: { data } });
  }
  return json({ ok: true });
}
