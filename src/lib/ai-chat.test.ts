import assert from "node:assert/strict";
import test from "node:test";
import type { ChatMessage } from "./ai-chat-types";

// The module reads its settings when imported, so they are set first.
Object.assign(process.env, {
  DATABASE_URL: "mysql://u:p@127.0.0.1:3306/none",
  OWNER_PASSWORD: "x",
  SESSION_SECRET: "s".repeat(40),
  DEEPSEEK_API_KEY: "test-key-123456",
});
const { runChat } = await import("./ai-chat");

type Reply = { content?: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[]; finish?: string };

/** Replaces fetch with a scripted model and records what was sent to it. */
function scriptModel(replies: Reply[]) {
  const sent: { messages: { role: string; content: string | null }[]; thinking: unknown; auth: string }[] = [];
  globalThis.fetch = (async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    sent.push({ messages: body.messages, thinking: body.thinking, auth: (init.headers as Record<string, string>).authorization });
    const next = replies.shift();
    assert.ok(next, "the model was called more often than scripted");
    return new Response(JSON.stringify({ choices: [{ message: { content: next.content ?? null, tool_calls: next.tool_calls }, finish_reason: next.finish ?? "stop" }] }), { status: 200 });
  }) as typeof fetch;
  return sent;
}

const reject = { id: "call_1", type: "function" as const, function: { name: "reject_purchase", arguments: JSON.stringify({ purchase_id: "p1", reason: "رسید نامعتبر" }) } };
const ask: ChatMessage[] = [{ role: "user", content: "خرید p1 را رد کن" }];

test("a write tool call stops as a pending card and nothing runs", async () => {
  const sent = scriptModel([{ tool_calls: [reject] }]);
  const result = await runChat(ask, {});
  assert.equal(result.pending.length, 1);
  assert.deepEqual(result.pending[0], { id: "call_1", name: "reject_purchase", label: "رد خرید", input: { purchase_id: "p1", reason: "رسید نامعتبر" } });
  assert.equal(result.messages.at(-1)?.role, "assistant");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].messages[0].role, "system");
  assert.deepEqual(sent[0].thinking, { type: "disabled" });
  assert.equal(sent[0].auth, "Bearer test-key-123456");
});

test("a declined write is reported to the model and never executed", async () => {
  scriptModel([{ tool_calls: [reject] }]);
  const pending = (await runChat(ask, {})).messages;
  const sent = scriptModel([{ content: "باشه، انجام نشد." }]);
  const result = await runChat(pending, { call_1: "reject" });
  assert.equal(result.pending.length, 0);
  const toolMessage = sent[0].messages.find((m) => m.role === "tool");
  assert.match(String(toolMessage?.content), /declined/);
  assert.equal(result.messages.at(-1)?.content, "باشه، انجام نشد.");
});

test("without a decision the same card stays pending and the model is not called again", async () => {
  scriptModel([{ tool_calls: [reject] }]);
  const first = await runChat(ask, {});
  const sent = scriptModel([]);
  const again = await runChat(first.messages, {});
  assert.equal(again.pending.length, 1);
  assert.equal(sent.length, 0);
});

test("broken tool arguments come back to the model as an error instead of crashing", async () => {
  const sent = scriptModel([{ tool_calls: [{ id: "call_9", type: "function", function: { name: "get_site", arguments: "{not json" } }] }, { content: "نشد" }]);
  const result = await runChat([{ role: "user", content: "سایت" }], {});
  assert.equal(result.pending.length, 0);
  assert.match(String(sent[1].messages.find((m) => m.role === "tool")?.content), /not valid JSON/);
  assert.equal(result.messages.at(-1)?.content, "نشد");
});

test("an unknown tool name is refused", async () => {
  scriptModel([{ tool_calls: [{ id: "call_x", type: "function", function: { name: "delete_site", arguments: "{}" } }] }, { content: "ok" }]);
  const result = await runChat([{ role: "user", content: "حذف" }], {});
  const toolMessage = result.messages.find((m) => m.role === "tool");
  assert.match(String(toolMessage?.content), /unknown tool/);
});
