import { createHash, createPrivateKey, randomBytes, sign } from "node:crypto";

export type LicenseTokenPayload = {
  siteId: string;
  domain: string;
  status: "ACTIVE" | "SUSPENDED";
  features: string[];
  iat: number;
  exp: number;
};

/** Format: `base64url(JSON payload).base64url(Ed25519 signature over the payload part)`. */
export function signLicenseToken(payload: LicenseTokenPayload, privateKeyPem: string) {
  const part = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = createPrivateKey(privateKeyPem.replace(/\\n/g, "\n"));
  return `${part}.${sign(null, Buffer.from(part), key).toString("base64url")}`;
}

export function hashLicenseKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export function generateLicenseKey() {
  const key = `nx_${randomBytes(24).toString("base64url")}`;
  return { key, hash: hashLicenseKey(key), prefix: key.slice(0, 11) };
}

/** Compares hosts ignoring case, a leading `www.` and any port. */

export function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "").replace(/^www\./, "");
}
