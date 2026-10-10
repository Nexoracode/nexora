import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

/** Credentials saved from the panel (gateway merchant id, SMS API key) are stored encrypted, never in plain text. */
const key = () => createHash("sha256").update(`${env.SESSION_SECRET}:panel-secrets:v1`).digest();

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(envelope: string) {
  const [version, iv, tag, encrypted] = envelope.split(".");
  if (version !== "v1" || !iv || !tag || !encrypted) throw new Error("Invalid secret envelope");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

/** Shows only the end of a secret, enough to tell two apart. */
export function maskSecret(value: string) {
  return `${"•".repeat(Math.min(12, Math.max(4, value.length - 4)))}${value.slice(-4)}`;
}
