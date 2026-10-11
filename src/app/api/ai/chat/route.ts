import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { ChatMessage } from "@/lib/ai-chat-types";
import { runChat } from "@/lib/ai-chat";
import { message } from "@/lib/ai-chat-schema";
import { isOwner } from "@/lib/auth";
import { ApiError } from "@/lib/owner-api-core";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  messages: z.array(message).min(1).max(80),
  decisions: z.record(z.string(), z.enum(["approve", "reject"])).default({}),
});

const reply = (status: number, text: string) => NextResponse.json({ message: text }, { status, headers: { "cache-control": "no-store" } });

/** The owner's AI assistant. Only the panel session may call it; write tools need a decision per tool call. */
export async function POST(request: NextRequest) {
  if (!(await isOwner())) return reply(401, "Unauthorized");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return reply(400, "درخواست نامعتبر است.");
  const { messages, decisions } = parsed.data;
  if (messages.length >= 80) return reply(400, "گفتگو خیلی طولانی شد؛ گفتگوی جدید شروع کنید.");

  try {
    const result = await runChat(messages as ChatMessage[], decisions);
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) return reply(error.status, error.message);
    if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) return reply(504, "مدل دیر پاسخ داد؛ دوباره تلاش کنید.");
    console.error("[ai-chat]", error);
    return reply(500, "خطای داخلی.");
  }
}
