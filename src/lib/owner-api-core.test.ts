import assert from "node:assert/strict";
import test from "node:test";
import { matchRoute, schemas, tokenMatches, type Route } from "./owner-api-core";

const token = "a".repeat(40);

test("bearer token must match exactly", () => {
  assert.equal(tokenMatches(`Bearer ${token}`, token), true);
  assert.equal(tokenMatches(`Bearer ${token}x`, token), false);
  assert.equal(tokenMatches(token, token), false);
  assert.equal(tokenMatches(null, token), false);
});

test("API stays closed while no token is configured", () => {
  assert.equal(tokenMatches("Bearer ", undefined), false);
  assert.equal(tokenMatches("Bearer anything", undefined), false);
});

const routes: Route<string>[] = [
  { method: "GET", pattern: /^\/sites$/, handler: "list" },
  { method: "GET", pattern: /^\/sites\/([^/]+)$/, handler: "get" },
  { method: "PATCH", pattern: /^\/sites\/([^/]+)$/, handler: "patch" },
];

test("routes match by method and capture params", () => {
  const hit = matchRoute(routes, "PATCH", "/sites/abc%20d/");
  assert.equal(hit.route?.handler, "patch");
  assert.deepEqual(hit.route && "params" in hit ? hit.params : null, ["abc d"]);
});

test("known path with wrong method is told apart from an unknown path", () => {
  assert.deepEqual(matchRoute(routes, "POST", "/sites"), { route: null, pathMatched: true });
  assert.deepEqual(matchRoute(routes, "GET", "/nope"), { route: null, pathMatched: false });
});

test("site update rejects unknown fields (no domain or key changes)", () => {
  assert.equal(schemas.siteUpdate.safeParse({ domain: "evil.example" }).success, false);
  assert.equal(schemas.siteUpdate.safeParse({ licenseKeyHash: "x" }).success, false);
  assert.equal(schemas.siteUpdate.safeParse({ status: "SUSPENDED", notes: null }).success, true);
});

test("wallet adjustment needs a positive whole amount and a reason", () => {
  assert.equal(schemas.walletAdjust.safeParse({ direction: "credit", amount: 5000, description: "جبران" }).success, true);
  assert.equal(schemas.walletAdjust.safeParse({ direction: "credit", amount: 0, description: "x" }).success, false);
  assert.equal(schemas.walletAdjust.safeParse({ direction: "credit", amount: 1.5, description: "x" }).success, false);
  assert.equal(schemas.walletAdjust.safeParse({ direction: "credit", amount: 10, description: "" }).success, false);
  assert.equal(schemas.walletAdjust.safeParse({ direction: "mint", amount: 10, description: "x" }).success, false);
});

test("a rejection needs a real reason", () => {
  assert.equal(schemas.reject.safeParse({ reason: "ab" }).success, false);
  assert.equal(schemas.reject.safeParse({ reason: "رسید نامعتبر است" }).success, true);
});
