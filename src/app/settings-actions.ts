"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/app/actions";
import { requireOwnerAction } from "@/lib/auth";
import { db } from "@/lib/db";
import { FarazApiError, inspectFarazAccount, normalizeIranPhone, sendFarazSample, sendFarazSms, type SmsAccount } from "@/lib/faraz";
import { smsLimits } from "@/lib/sms-limits";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/secret";

const formError = (fieldErrors: Record<string, string>): FormState => ({ fieldErrors, error: "فرم دارای خطاست." });
const messageOf = (error: unknown, fallback: string) => (error instanceof FarazApiError ? error.message : fallback);

// — Zarinpal ————————————————————————————————————————————

const merchantIdSchema = z.string().trim().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Merchant ID باید به‌شکل xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx باشد.");

/** Saves the Zarinpal gateway. The merchant id is stored encrypted and only replaced when a new one is typed. */
export async function saveZarinpalAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireOwnerAction();
  const typed = String(formData.get("merchantId") ?? "").trim();
  const isSandbox = formData.get("isSandbox") === "on";
  const isActive = formData.get("isActive") === "on";
  const existing = await db.gatewaySetting.findUnique({ where: { provider: "ZARINPAL" }, select: { provider: true } });
  if (!typed && !existing) return formError({ merchantId: "Merchant ID را وارد کنید." });
  if (typed) {
    const parsed = merchantIdSchema.safeParse(typed);
    if (!parsed.success) return formError({ merchantId: parsed.error.issues[0].message });
    await db.gatewaySetting.upsert({
      where: { provider: "ZARINPAL" },
      create: { provider: "ZARINPAL", credentialEncrypted: encryptSecret(parsed.data), credentialMasked: maskSecret(parsed.data), isSandbox, isActive },
      update: { credentialEncrypted: encryptSecret(parsed.data), credentialMasked: maskSecret(parsed.data), isSandbox, isActive },
    });
  } else {
    await db.gatewaySetting.update({ where: { provider: "ZARINPAL" }, data: { isSandbox, isActive } });
  }
  revalidatePath("/", "layout");
  return { saved: true };
}

// — Faraz SMS ———————————————————————————————————————————

async function savedSmsKey() {
  const settings = await db.smsSettings.findUnique({ where: { id: "main" } });
  if (!settings?.apiKeyEncrypted) return null;
  try {
    return { apiKey: decryptSecret(settings.apiKeyEncrypted), lineNumber: settings.lineNumber, isActive: settings.isActive };
  } catch {
    return null;
  }
}

/** Saves the Faraz connection. A newly typed key is checked against the account first; the stored one is never shown again. */
export async function saveSmsSettingsAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireOwnerAction();
  const typedKey = String(formData.get("apiKey") ?? "").trim();
  const lineNumber = String(formData.get("lineNumber") ?? "").replace(/\D/g, "");
  const isActive = formData.get("isActive") === "on";
  if (typedKey.length > smsLimits.apiKey) return formError({ apiKey: `کلید API حداکثر ${smsLimits.apiKey} نویسه است.` });
  if (lineNumber.length > smsLimits.lineNumber) return formError({ lineNumber: `شماره خط حداکثر ${smsLimits.lineNumber} رقم است.` });
  const saved = await savedSmsKey();
  if (!typedKey && !saved) return formError({ apiKey: "کلید API فراز اس‌ام‌اس را وارد کنید." });
  if (isActive && !lineNumber) return formError({ lineNumber: "برای فعال‌سازی، شماره خط ارسال را وارد کنید." });

  if (typedKey) {
    try {
      await inspectFarazAccount(typedKey);
    } catch (error) {
      return formError({ apiKey: messageOf(error, "بررسی کلید انجام نشد؛ دوباره تلاش کنید.") });
    }
  }
  const data = { lineNumber: lineNumber || null, isActive, ...(typedKey ? { apiKeyEncrypted: encryptSecret(typedKey), apiKeyMasked: maskSecret(typedKey) } : {}) };
  await db.smsSettings.upsert({ where: { id: "main" }, create: { id: "main", ...data }, update: data });
  revalidatePath("/settings");
  return { saved: true };
}

export type SmsCheckResult = { account: SmsAccount } | { error: string };

/** Reads the account behind the saved key: balance, plan and the sender lines to pick from. */
export async function checkSmsAccountAction(): Promise<SmsCheckResult> {
  await requireOwnerAction();
  const saved = await savedSmsKey();
  if (!saved) return { error: "ابتدا کلید API را ذخیره کنید." };
  try {
    return { account: await inspectFarazAccount(saved.apiKey) };
  } catch (error) {
    return { error: messageOf(error, "بررسی حساب انجام نشد.") };
  }
}

/** Sends a sample to the account owner's own number: the cheapest end-to-end check of key and line. */
export async function sendSmsSampleAction(): Promise<FormState> {
  await requireOwnerAction();
  const saved = await savedSmsKey();
  if (!saved?.lineNumber) return { error: "کلید API و شماره خط را ذخیره کنید." };
  try {
    await sendFarazSample(saved.apiKey, saved.lineNumber, "پیامک آزمایشی نکسورا");
    return { saved: true };
  } catch (error) {
    return { error: messageOf(error, "ارسال پیامک آزمایشی انجام نشد.") };
  }
}

const sendSchema = z.object({
  text: z.string().trim().min(1, "متن پیامک را وارد کنید.").max(smsLimits.text, `متن پیامک حداکثر ${smsLimits.text} نویسه است.`),
  siteIds: z.array(z.string().max(191)).max(500),
  phones: z.string().max(smsLimits.phones, "فهرست شماره‌ها خیلی بلند است."),
});

/** Sends one message to the chosen clients (by site) and to any extra numbers, and logs each recipient. */
export async function sendSmsAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireOwnerAction();
  const parsed = sendSchema.safeParse({ text: formData.get("text") ?? "", siteIds: formData.getAll("siteIds").map(String), phones: String(formData.get("phones") ?? "") });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return formError(fieldErrors);
  }
  const saved = await savedSmsKey();
  if (!saved?.isActive || !saved.lineNumber) return { error: "پیامک فعال نیست؛ ابتدا آن را در تنظیمات تنظیم و فعال کنید." };

  const targets = new Map<string, string | null>();
  const sites = parsed.data.siteIds.length ? await db.site.findMany({ where: { id: { in: parsed.data.siteIds } }, select: { id: true, client: { select: { phone: true } } } }) : [];
  for (const site of sites) {
    const phone = site.client.phone ? normalizeIranPhone(site.client.phone) : null;
    if (phone) targets.set(phone, site.id);
  }
  const invalid: string[] = [];
  for (const raw of parsed.data.phones.split(/[\s,،;؛]+/).filter(Boolean)) {
    const phone = normalizeIranPhone(raw);
    if (phone) {
      if (!targets.has(phone)) targets.set(phone, null);
    } else invalid.push(raw);
  }
  if (invalid.length) return formError({ phones: `شمارهٔ نامعتبر: ${invalid.slice(0, 3).join("، ")}` });
  if (targets.size === 0) return formError({ phones: "حداقل یک گیرنده با شمارهٔ معتبر انتخاب کنید." });

  const recipients = [...targets.keys()];
  let error: string | null = null;
  try {
    await sendFarazSms(saved.apiKey, saved.lineNumber, recipients, parsed.data.text);
  } catch (caught) {
    error = messageOf(caught, "ارسال پیامک انجام نشد.");
  }
  await db.smsLog.createMany({ data: recipients.map((phone) => ({ phone, siteId: targets.get(phone) ?? null, text: parsed.data.text, ok: error === null, error: error?.slice(0, 255) ?? null })) });
  revalidatePath("/sms");
  return error ? { error } : { saved: true };
}
