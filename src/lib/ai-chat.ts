import { env } from "@/lib/env";

/** Bounds shared by the chat box, the API and the model call; free of the database so client components can import it. */
export const aiChatLimits = { message: 4000, history: 40 } as const;

export type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = "You are a helpful assistant inside the owner's admin panel of Nexora, a company that sells store software. Reply in the language the user writes in, which is usually Persian. Keep answers short and plain text.";

/** Sends the conversation to the model. Throws a user-safe Persian message on any failure. */
export async function askAssistant(messages: ChatMessage[]): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${env.AI_BASE_URL.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(env.AI_API_KEY ? { authorization: `Bearer ${env.AI_API_KEY}` } : {}) },
      body: JSON.stringify({ model: env.AI_MODEL, messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages], stream: false }),
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });
  } catch {
    throw new Error("ارتباط با هوش مصنوعی برقرار نشد. دوباره تلاش کنید.");
  }
  if (!response.ok) throw new Error("هوش مصنوعی پاسخ نداد. کمی بعد دوباره تلاش کنید.");
  const data = (await response.json().catch(() => ({}))) as { choices?: { message?: { content?: string | null } }[] };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("پاسخی دریافت نشد. دوباره تلاش کنید.");
  return text;
}
