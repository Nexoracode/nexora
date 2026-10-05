import assert from "node:assert/strict";
import test from "node:test";
import { tomanToRials, upgradeAmount } from "./pricing";

const prices = new Map([["a", 100], ["b", 200], ["c", 300], ["d", 400]]);

test("package price minus what the site already owns of it", () => {
  assert.equal(upgradeAmount({ packagePrice: 800, packageFeatureKeys: ["a", "b", "c", "d"], ownedKeys: new Set(["a", "b"]), prices }), 500);
});

test("never above the missing features' own total", () => {
  assert.equal(upgradeAmount({ packagePrice: 5000, packageFeatureKeys: ["a", "b", "c", "d"], ownedKeys: new Set(["a", "b", "c"]), prices }), 400);
});

test("never negative", () => {
  assert.equal(upgradeAmount({ packagePrice: 100, packageFeatureKeys: ["a", "b", "c"], ownedKeys: new Set(["a", "b"]), prices }), 0);
});

test("toman to rials", () => {
  assert.equal(tomanToRials(1500), 15000);
});
