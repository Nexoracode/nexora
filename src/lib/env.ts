import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  OWNER_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  LICENSE_PRIVATE_KEY: z.string().default(""),
  LICENSE_TOKEN_DAYS: z.coerce.number().int().min(1).max(90).default(7),
});

export const env = schema.parse(process.env);
