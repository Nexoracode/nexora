import { z } from "zod";

/** The subscription periods a site can pay for, and how many months each covers. */
export const SUBSCRIPTION_PERIODS = { MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 } as const;
export type SubscriptionPeriod = keyof typeof SUBSCRIPTION_PERIODS;

export const periodLabels: Record<SubscriptionPeriod, string> = { MONTHLY: "ماهانه", QUARTERLY: "سه‌ماهه", YEARLY: "سالانه" };

export const lockLabels = {
  OPTIONAL_FEATURES: "فقط قابلیت‌های اختیاری قفل شود",
  ADMIN_PANEL: "پنل مدیریت بسته شود (ویترین باز بماند)",
  FULL: "کل فروشگاه بسته شود",
} as const;

/** Bounds shared by the form, the server action and the column definitions. */
export const subscriptionLimits = { discountMax: 90, graceDaysMax: 90, retentionDaysMax: 730, reminderDaysMax: 60, reminderCountMax: 5, reminderTextMax: 40 } as const;

export const DEFAULT_SUBSCRIPTION_SETTINGS = {
  quarterlyDiscountPercent: 10,
  yearlyDiscountPercent: 20,
  graceDays: 7,
  retentionDays: 90,
  lockAfterGrace: "ADMIN_PANEL" as keyof typeof lockLabels,
  reminderDays: "7,3,1",
};
export type SubscriptionSettingsValues = typeof DEFAULT_SUBSCRIPTION_SETTINGS;

const whole = (label: string, max: number) =>
  z.coerce.number({ message: `${label} را به‌صورت عدد وارد کنید.` }).int(`${label} باید عدد صحیح باشد.`).min(0, `${label} نمی‌تواند منفی باشد.`).max(max, `${label} حداکثر ${max.toLocaleString("fa-IR")} است.`);

/** "7, 3,1" → "7,3,1"; null when it is not a short list of distinct whole days. */
export function normalizeReminderDays(text: string): string | null {
  const days = text.split(/[,،\s]+/).filter(Boolean).map(Number);
  if (days.length > subscriptionLimits.reminderCountMax) return null;
  if (days.some((day) => !Number.isInteger(day) || day < 1 || day > subscriptionLimits.reminderDaysMax)) return null;
  return [...new Set(days)].sort((a, b) => b - a).join(",");
}

export const subscriptionSettingsSchema = z.object({
  quarterlyDiscountPercent: whole("تخفیف سه‌ماهه", subscriptionLimits.discountMax),
  yearlyDiscountPercent: whole("تخفیف سالانه", subscriptionLimits.discountMax),
  graceDays: whole("مهلت پس از پایان", subscriptionLimits.graceDaysMax),
  retentionDays: whole("نگه‌داری داده", subscriptionLimits.retentionDaysMax),
  lockAfterGrace: z.enum(["OPTIONAL_FEATURES", "ADMIN_PANEL", "FULL"], { message: "یکی از حالت‌ها را انتخاب کنید." }),
  reminderDays: z.string().trim().max(subscriptionLimits.reminderTextMax, "فهرست روزها خیلی بلند است.").transform((text, ctx) => {
    const normalized = normalizeReminderDays(text);
    if (normalized === null) {
      ctx.addIssue({ code: "custom", message: `حداکثر ${subscriptionLimits.reminderCountMax.toLocaleString("fa-IR")} روز بین ۱ تا ${subscriptionLimits.reminderDaysMax.toLocaleString("fa-IR")}، با ویرگول جدا شده (مثل 7,3,1).` });
      return z.NEVER;
    }
    return normalized;
  }),
});

/** What a plan costs for a period: months × monthly price, less the period's discount, in whole toman. */
export function periodPrice(monthlyPrice: number, period: SubscriptionPeriod, settings: Pick<SubscriptionSettingsValues, "quarterlyDiscountPercent" | "yearlyDiscountPercent">) {
  const discount = period === "QUARTERLY" ? settings.quarterlyDiscountPercent : period === "YEARLY" ? settings.yearlyDiscountPercent : 0;
  return Math.round((monthlyPrice * SUBSCRIPTION_PERIODS[period] * (100 - discount)) / 100);
}

/** `date` moved forward by whole calendar months (UTC); a day that does not exist in the target month lands on its last day. */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return target;
}

/** Midnight UTC of the day `date` falls on: the panel stores an expiry as a bare day. */
export const startOfUtcDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

/** Where a subscription ends after paying for `period`: from the later of today and the current end, so renewing early loses nothing. */
export function renewedEnd(currentEnd: Date | null, period: SubscriptionPeriod, now = new Date()): Date {
  const today = startOfUtcDay(now);
  const base = currentEnd && startOfUtcDay(currentEnd) > today ? startOfUtcDay(currentEnd) : today;
  return addMonths(base, SUBSCRIPTION_PERIODS[period]);
}

export const isSubscriptionPeriod = (value: unknown): value is SubscriptionPeriod => typeof value === "string" && value in SUBSCRIPTION_PERIODS;

/** The current plan is renewed inside the first reminder window before its end (a week by default), not months ahead. */
export function renewalWindowDays(reminderDays: string): number {
  return Math.max(0, ...reminderDays.split(",").map(Number).filter(Number.isInteger)) || 7;
}

/** True while the site's own plan still has so long to run that renewing it now is too early. */
export function renewalTooEarly(input: { endsAt: Date | null; planId: string | null; packageId: string; reminderDays: string; now?: Date }): boolean {
  if (!input.endsAt || input.planId !== input.packageId) return false;
  const msLeft = input.endsAt.getTime() - (input.now ?? new Date()).getTime();
  return msLeft > renewalWindowDays(input.reminderDays) * 86_400_000;
}
