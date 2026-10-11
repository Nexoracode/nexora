import { z } from "zod";

const toolCall = z.object({ id: z.string().min(1).max(100), type: z.literal("function"), function: z.object({ name: z.string().min(1).max(128), arguments: z.string().max(20_000) }) });
/** One chat message as the browser sends and stores it. */
export const message = z.discriminatedUnion("role", [
  z.object({ role: z.literal("user"), content: z.string().max(8000) }),
  z.object({ role: z.literal("assistant"), content: z.string().max(60_000).nullable(), tool_calls: z.array(toolCall).max(20).optional() }),
  z.object({ role: z.literal("tool"), tool_call_id: z.string().min(1).max(100), content: z.string().max(60_000) }),
]);
