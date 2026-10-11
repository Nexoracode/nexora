import { NextResponse } from "next/server";
import { z } from "zod";
import { askAssistant, aiChatLimits } from "@/lib/ai-chat";
import { isOwner } from "@/lib/auth";

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(aiChatLimits.message * 2) }))
    .min(1)
    .max(aiChatLimits.history),
});

export async function POST(request: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "دسترسی ندارید." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") return NextResponse.json({ error: "پیام نامعتبر است." }, { status: 400 });
  try {
    return NextResponse.json({ reply: await askAssistant(parsed.data.messages) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "خطای ناشناخته." }, { status: 502 });
  }
}
