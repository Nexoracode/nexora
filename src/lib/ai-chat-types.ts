/** What the browser and the chat route exchange (OpenAI chat format, as DeepSeek speaks it); free of server-only imports. */
export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };
export type PendingCall = { id: string; name: string; label: string; input: unknown };

/** The history-list title of a conversation: its first user message, shortened. */
export function conversationTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  const text = first && first.role === "user" ? first.content.replace(/\s+/g, " ").trim() : "";
  return text.length > 60 ? `${text.slice(0, 60)}…` : text || "گفتگوی جدید";
}

export const CONVERSATION_ID = /^[A-Za-z0-9-]{8,64}$/;
