/** What the browser and the chat route exchange; free of server-only imports so client components can use it. */
export type ChatBlock = { type: string; [key: string]: unknown };
export type ChatMessage = { role: "user" | "assistant"; content: string | ChatBlock[] };
export type PendingCall = { id: string; name: string; label: string; input: unknown };
