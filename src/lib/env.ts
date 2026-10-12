import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  OWNER_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  // Bearer token for /api/owner/* (the MCP server uses it). Unset keeps that API switched off.
  OWNER_API_TOKEN: z.preprocess((value) => (value === "" ? undefined : value), z.string().min(32).optional()),
  // DeepSeek API key for the panel's AI assistant (/ai). Unset keeps the assistant off. AI_BASE_URL is any OpenAI-compatible endpoint.
  DEEPSEEK_API_KEY: z.preprocess((value) => (value === "" ? undefined : value), z.string().min(10).optional()),
  // Generic key for any other OpenAI-compatible provider (OpenRouter, Groq, Gemini...); wins over DEEPSEEK_API_KEY.
  AI_API_KEY: z.preprocess((value) => (value === "" ? undefined : value), z.string().min(3).optional()),
  AI_MODEL: z.string().min(1).default("deepseek-flash"),
  // HTTP proxy for the model requests only (a VPN client's local proxy, e.g. http://127.0.0.1:10808), for when the server itself
  // is not behind the VPN. Unset = direct.
  AI_PROXY_URL: z.preprocess((value) => (value === "" ? undefined : value), z.url().optional()),
  AI_BASE_URL: z.url().default("https://api.deepseek.com"),
  // The owner's first name, used to greet them on the assistant page ("سلام محمد، شب بخیر"). Unset greets without a name.
  OWNER_NAME: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(40).optional()),
  LICENSE_PRIVATE_KEY: z.string().default(""),
  LICENSE_TOKEN_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  // Zarinpal merchant id for the "pay online" option. Unset means online payment is off. The gateway runs in
  // sandbox mode everywhere except production, so development never charges real money.
  ZARINPAL_MERCHANT_ID: z.preprocess((value) => (value === "" ? undefined : value), z.string().uuid().optional()),
  // "true" forces the gateway's sandbox, "false" the live one; unset follows NODE_ENV. A test merchant id only works in the sandbox.
  ZARINPAL_SANDBOX: z.preprocess((value) => (value === "" ? undefined : value), z.enum(["true", "false"]).optional()),
  // Public address of this panel; the payment gateway sends buyers back to it.
  APP_URL: z.url().default("http://localhost:3001"),
});

export const env = schema.parse(process.env);

/** Where the assistant sends requests. A local endpoint (Ollama, LM Studio) needs no key, so it is on without one. */
const aiKey = env.AI_API_KEY ?? env.DEEPSEEK_API_KEY;
const aiHost = new URL(env.AI_BASE_URL).hostname;
const aiLocal = ["localhost", "127.0.0.1", "[::1]"].includes(aiHost);
export const ai = {
  key: aiKey,
  enabled: Boolean(aiKey) || aiLocal,
  /** Only DeepSeek understands the `thinking` switch; other providers reject unknown fields. */
  deepseek: aiHost.endsWith("deepseek.com"),
};
