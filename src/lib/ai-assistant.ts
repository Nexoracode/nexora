import { env } from "@/lib/env";
import type { AssistantResult, ChatMessage } from "@/lib/ai-chat";
import { callTool, listTools } from "@/lib/mcp/server";
import { findMcpTool } from "@/lib/mcp/tools";

const MAX_STEPS = 5;

const SYSTEM_PROMPT = `You are the assistant inside the owner's admin panel of Nexora, a company that sells store software to customer sites.
Use the tools to look up sites, tickets, purchase requests and wallet top-ups; never invent data. Tools that change data are only proposed: the owner confirms them in the interface, so after calling one just say briefly that it awaits confirmation.
Reply in the language the user writes in, usually Persian. Keep answers short and plain text, no markdown. Today is ${new Date().toISOString().slice(0, 10)}.`;

type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
type WireMessage = { role: "system" | "user" | "assistant" | "tool"; content: string | null; tool_calls?: ToolCall[]; tool_call_id?: string };

async function complete(messages: WireMessage[]) {
  let response: Response;
  try {
    response = await fetch(`${env.AI_BASE_URL.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(env.AI_API_KEY ? { authorization: `Bearer ${env.AI_API_KEY}` } : {}) },
      body: JSON.stringify({
        model: env.AI_MODEL,
        messages,
        tools: listTools().map((tool) => ({ type: "function", function: { name: tool.name, description: tool.description, parameters: tool.inputSchema } })),
        stream: false,
      }),
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });
  } catch {
    throw new Error("ارتباط با هوش مصنوعی برقرار نشد. دوباره تلاش کنید.");
  }
  if (response.status === 401 || response.status === 403) throw new Error("کلید هوش مصنوعی پذیرفته نشد. AI_API_KEY را بررسی کنید.");
  if (response.status === 429) throw new Error("سقف درخواست مدل رایگان پر شده است. کمی بعد دوباره تلاش کنید.");
  if (!response.ok) throw new Error("هوش مصنوعی پاسخ نداد. کمی بعد دوباره تلاش کنید.");
  const data = (await response.json().catch(() => ({}))) as { choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[] };
  const message = data.choices?.[0]?.message;
  if (!message) throw new Error("پاسخی دریافت نشد. دوباره تلاش کنید.");
  return message;
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(raw || "{}");
    return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Answers the conversation, letting the model call the panel's MCP tools. Read tools run right away;
 * the first write tool stops the loop and is handed back to be confirmed by the owner.
 * Throws a user-safe Persian message on any failure.
 */
export async function askAssistant(history: ChatMessage[]): Promise<AssistantResult> {
  const messages: WireMessage[] = [{ role: "system", content: SYSTEM_PROMPT }, ...history];
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const message = await complete(messages);
    const calls = message.tool_calls ?? [];
    const content = message.content?.trim() ?? "";
    if (calls.length === 0) {
      if (!content) throw new Error("پاسخی دریافت نشد. دوباره تلاش کنید.");
      return { reply: content };
    }
    messages.push({ role: "assistant", content: message.content ?? null, tool_calls: calls });
    for (const call of calls) {
      const tool = findMcpTool(call.function.name);
      const args = parseArgs(call.function.arguments);
      if (tool?.write) {
        const valid = tool.schema.safeParse(args);
        if (valid.success) return { reply: content || "برای اجرای این عملیات تأیید شما لازم است.", pending: { tool: tool.name, args: valid.data, summary: tool.summary?.(valid.data) ?? tool.name } };
      }
      const result = await callTool(call.function.name, args, { allowWrite: false });
      messages.push({ role: "tool", tool_call_id: call.id, content: result.content[0].text });
    }
  }
  throw new Error("پاسخی دریافت نشد. سؤال را ساده‌تر بپرسید.");
}
