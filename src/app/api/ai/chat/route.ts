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

  // Newline-delimited JSON: {"type":"tool","label"} while a tool runs, then one {"type":"done",...} or {"type":"error",...}.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: unknown) => controller.enqueue(encoder.encode(JSON.stringify(event) + String.fromCharCode(10)));
      try {
        const result = await runChat(messages as ChatMessage[], decisions, (label) => emit({ type: "tool", label }));
        emit({ type: "done", ...result });
      } catch (error) {
        if (error instanceof ApiError) emit({ type: "error", message: error.message });
        else if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) emit({ type: "error", message: "مدل دیر پاسخ داد؛ دوباره تلاش کنید." });
        else {
          console.error("[ai-chat]", error);
          emit({ type: "error", message: "خطای داخلی." });
        }
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
