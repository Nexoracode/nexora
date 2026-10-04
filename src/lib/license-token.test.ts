import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import test from "node:test";
import { normalizeDomain, signLicenseToken } from "./license-token";

test("signed token verifies with the matching public key only", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString().trim().replace(/\n/g, "\n");
  const token = signLicenseToken({ siteId: "s", domain: "a.ir", status: "ACTIVE", features: ["wallet"], iat: 1, exp: 2 }, pem);
  const [part, signature] = token.split(".");
  assert.ok(verify(null, Buffer.from(part), publicKey, Buffer.from(signature, "base64url")));
  assert.ok(!verify(null, Buffer.from(part + "x"), publicKey, Buffer.from(signature, "base64url")));
});

test("normalizeDomain strips scheme, www, port and path", () => {
  assert.equal(normalizeDomain("HTTPS://www.Shop.ir:443/path"), "shop.ir");
});
