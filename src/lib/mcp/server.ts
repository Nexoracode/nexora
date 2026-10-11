import { findMcpTool, mcpTools } from "@/lib/mcp/tools";

/** A minimal MCP server (JSON-RPC 2.0, tools only) over the panel's own data. */
type RpcRequest = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
export type RpcResponse = { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string } };

export type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

const asText = (value: unknown): ToolResult => ({ content: [{ type: "text", text: JSON.stringify(value) }] });
const failure = (message: string): ToolResult => ({ ...asText({ error: message }), isError: true });

/** Runs one tool. Write tools only run when the caller says the owner confirmed them. */
export async function callTool(name: string, rawArgs: unknown, options: { allowWrite: boolean }): Promise<ToolResult> {
  const tool = findMcpTool(name);
  if (!tool) return failure("ابزار پیدا نشد.");
  if (tool.write && !options.allowWrite) return failure("این عملیات فقط پس از تأیید مالک اجرا می‌شود.");
  const parsed = tool.schema.safeParse(rawArgs ?? {});
  if (!parsed.success) return failure(`ورودی نامعتبر: ${parsed.error.issues.map((issue) => `${issue.path.join(".") || "ورودی"} ${issue.message}`).join("؛ ")}`);
  try {
    const result = await tool.run(parsed.data);
    const isError = typeof result === "object" && result !== null && "error" in result;
    return isError ? { ...asText(result), isError: true } : asText(result);
  } catch {
    return failure("اجرای ابزار با خطا روبه‌رو شد.");
  }
}

export const listTools = () => mcpTools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));

/** Handles one JSON-RPC message; notifications have no id and get no response. */
export async function handleMcpMessage(message: RpcRequest, options: { allowWrite: boolean }): Promise<RpcResponse | null> {
  const id = message.id ?? null;
  if (message.id === undefined) return null;
  switch (message.method) {
    case "initialize":
      return { jsonrpc: "2.0", id, result: { protocolVersion: "2025-03-26", capabilities: { tools: {} }, serverInfo: { name: "nexora-panel", version: "1.0.0" } } };
    case "ping":
      return { jsonrpc: "2.0", id, result: {} };
    case "tools/list":
      return { jsonrpc: "2.0", id, result: { tools: listTools() } };
    case "tools/call": {
      const params = message.params ?? {};
      return { jsonrpc: "2.0", id, result: await callTool(String(params.name ?? ""), params.arguments, options) };
    }
    default:
      return { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } };
  }
}
