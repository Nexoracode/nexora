import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  OWNER_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  LICENSE_PRIVATE_KEY: z.string().default(""),
  LICENSE_TOKEN_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  // Zarinpal merchant id for the "pay online" option. Unset means online payment is off. The gateway runs in
  // sandbox mode everywhere except production, so development never charges real money.
  ZARINPAL_MERCHANT_ID: z.preprocess((value) => (value === "" ? undefined : value), z.string().uuid().optional()),
  // "true" forces the gateway's sandbox, "false" the live one; unset follows NODE_ENV. A test merchant id only works in the sandbox.
  ZARINPAL_SANDBOX: z.preprocess((value) => (value === "" ? undefined : value), z.enum(["true", "false"]).optional()),
  // The panel's AI chat talks to any OpenAI-compatible server. The default is a local Ollama, which is free and needs no key.
  AI_BASE_URL: z.url().default("http://localhost:11434/v1"),
  AI_MODEL: z.string().min(1).default("qwen2.5:7b"),
  AI_API_KEY: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
  // Public address of this panel; the payment gateway sends buyers back to it.
  APP_URL: z.url().default("http://localhost:3001"),
});

export const env = schema.parse(process.env);
