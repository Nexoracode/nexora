/** Bounds and shapes shared by the chat box and the API; free of the server (env, database) so client components can import it. */
export const aiChatLimits = { message: 4000, history: 40 } as const;

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** A write the model asked for. It runs only when the owner presses confirm. */
export type PendingAction = { tool: string; args: Record<string, unknown>; summary: string };

export type AssistantResult = { reply: string; pending?: PendingAction };
