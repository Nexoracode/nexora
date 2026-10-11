import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { runChat } from "@/lib/ai-chat";
import { isOwner } from "@/lib/auth";
import { ApiError } from "@/lib/owner-api-core";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.union([z.string().max(8000), z.array(z.record(z.string(), z.unknown())).max(60)]) }))
    .min(1)
    .max(80),
  decisions: z.record(z.string(), z.enum(["approve", "reject"])).default({}),
});

const reply = (status: number, message: string) => NextResponse.json({ message }, { status, headers: { "cache-control": "no-store" } });

/** The owner's AI assistant. Only the panel session may call it; write tools need a decision per tool call. */
export async function POST(request: NextRequest) {
  if (!(await isOwner())) return reply(401, "Unauthorized");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return reply(400, "درخواست نامعتبر است.");
  const { messages, decisions } = parsed.data;
  if (messages.length >= 80) return reply(400, "گفتگو خیلی طولانی شد؛ گفتگوی جدید شروع کنید.");

  try {
    const result = await runChat(messages as Anthropic.MessageParam[], decisions);
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) return reply(error.status, error.message);
    if (error instanceof Anthropic.RateLimitError) return reply(429, "محدودیت درخواست مدل؛ کمی بعد دوباره تلاش کنید.");
    if (error instanceof Anthropic.AuthenticationError) return reply(502, "کلید ANTHROPIC_API_KEY معتبر نیست.");
    if (error instanceof Anthropic.APIError) {
      console.error("[ai-chat] model error", error.status, error.message);
      return reply(502, "پاسخی از مدل دریافت نشد.");
    }
    console.error("[ai-chat]", error);
    return reply(500, "خطای داخلی.");
  }
}
