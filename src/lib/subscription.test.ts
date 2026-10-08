import assert from "node:assert/strict";
import test from "node:test";
import { addMonths, normalizeReminderDays, periodPrice, renewalTooEarly, renewalWindowDays, renewedEnd } from "./subscription";

const discounts = { quarterlyDiscountPercent: 10, yearlyDiscountPercent: 20 };

test("a plan costs months times the monthly price, less the period's discount", () => {
  assert.equal(periodPrice(1_000_000, "MONTHLY", discounts), 1_000_000);
  assert.equal(periodPrice(1_000_000, "QUARTERLY", discounts), 2_700_000);
  assert.equal(periodPrice(1_000_000, "YEARLY", discounts), 9_600_000);
});

test("months are added by calendar, and a missing day lands on the month's last day", () => {
  assert.equal(addMonths(new Date("2026-01-15T00:00:00Z"), 1).toISOString(), "2026-02-15T00:00:00.000Z");
  assert.equal(addMonths(new Date("2026-01-31T00:00:00Z"), 1).toISOString(), "2026-02-28T00:00:00.000Z");
  assert.equal(addMonths(new Date("2026-11-30T00:00:00Z"), 3).toISOString(), "2027-02-28T00:00:00.000Z");
  assert.equal(addMonths(new Date("2026-03-10T00:00:00Z"), 12).toISOString(), "2027-03-10T00:00:00.000Z");
});

test("renewing early extends from the current end, renewing late from today", () => {
  const now = new Date("2026-10-07T09:00:00Z");
  assert.equal(renewedEnd(new Date("2026-12-01T00:00:00Z"), "MONTHLY", now).toISOString(), "2027-01-01T00:00:00.000Z");
  assert.equal(renewedEnd(new Date("2026-09-01T00:00:00Z"), "MONTHLY", now).toISOString(), "2026-11-07T00:00:00.000Z");
  assert.equal(renewedEnd(null, "YEARLY", now).toISOString(), "2027-10-07T00:00:00.000Z");
});

test("reminder days are a short list of distinct whole days, largest first", () => {
  assert.equal(normalizeReminderDays("1, 7,3,7"), "7,3,1");
  assert.equal(normalizeReminderDays("7،3"), "7,3");
  assert.equal(normalizeReminderDays("0"), null);
  assert.equal(normalizeReminderDays("7,x"), null);
  assert.equal(normalizeReminderDays("61"), null);
  assert.equal(normalizeReminderDays("1,2,3,4,5,6"), null);
});

test("the renewal window is the first reminder day, a week when there is none", () => {
  assert.equal(renewalWindowDays("7,3,1"), 7);
  assert.equal(renewalWindowDays("14,3"), 14);
  assert.equal(renewalWindowDays(""), 7);
});

test("only the same plan and period waits for its window", () => {
  const base = { endsAt: new Date("2026-12-01T00:00:00Z"), planId: "p1", currentPeriod: "MONTHLY" as const, packageId: "p1", period: "MONTHLY" as const, reminderDays: "7,3,1", now: new Date("2026-10-07T00:00:00Z") };
  assert.equal(renewalTooEarly(base), true);
  assert.equal(renewalTooEarly({ ...base, period: "YEARLY" }), false);
  assert.equal(renewalTooEarly({ ...base, packageId: "p2" }), false);
  assert.equal(renewalTooEarly({ ...base, now: new Date("2026-11-27T00:00:00Z") }), false);
  assert.equal(renewalTooEarly({ ...base, endsAt: null }), false);
});
