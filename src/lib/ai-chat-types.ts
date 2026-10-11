/** What the browser and the chat route exchange (OpenAI chat format, as DeepSeek speaks it); free of server-only imports. */
export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };
export type PendingCall = { id: string; name: string; label: string; input: unknown };
