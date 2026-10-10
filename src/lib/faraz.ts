/*
 * The one place that talks HTTP to Faraz SMS (docs.farazsms.com, served from api.iranpayamak.com).
 * Same endpoints and defensive reading of responses as the store project's integration: Faraz wraps
 * most answers in {status, data, message} and returns some bare, so every reader unwraps carefully.
 * Callers pass the API key in; nothing here touches the database.
 */

const BASE_URL = "https://api.iranpayamak.com";
const TIMEOUT_MS = 15_000;

/** A failure from Faraz (or on the way to it). `message` is Persian and safe to show the owner. */
export class FarazApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "FarazApiError";
  }
}

// Faraz documents `message` as null | string | string[] | { field: string | string[] }; older endpoints spell it `messages`.
function messageText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) return value.map(messageText).filter(Boolean).join("، ") || null;
  if (value && typeof value === "object") return Object.values(value).map(messageText).filter(Boolean).join("، ") || null;
  return null;
}

function providerMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  return messageText(record.message) ?? messageText(record.messages);
}

function statusMessage(status: number, payload: unknown) {
  if (status === 401 || status === 403) return "کلید API فراز اس‌ام‌اس نامعتبر است یا دسترسی لازم را ندارد.";
  if (status === 429) return "تعداد درخواست‌ها به فراز اس‌ام‌اس از حد مجاز گذشت؛ چند لحظه بعد دوباره تلاش کنید.";
  return providerMessage(payload) ?? `درخواست به فراز اس‌ام‌اس با خطای ${status.toLocaleString("fa-IR")} مواجه شد.`;
}

function unwrapObject(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) return record.data as Record<string, unknown>;
    return record;
  }
  return {};
}

function unwrapList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = unwrapObject(payload);
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.data)) return record.data;
  return [];
}

async function farazRequest(apiKey: string, method: "GET" | "POST", path: string, body?: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json", "Api-Key": apiKey },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new FarazApiError("ارتباط با فراز اس‌ام‌اس برقرار نشد؛ اتصال اینترنت سرور یا وضعیت سرویس را بررسی کنید.", 0);
  }
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new FarazApiError(statusMessage(response.status, result), response.status);
  // Faraz's own guidance: check `status`, not just the HTTP code.
  if (result && typeof result === "object" && (result as Record<string, unknown>).status === "error") throw new FarazApiError(providerMessage(result) ?? "فراز اس‌ام‌اس درخواست را نپذیرفت.", response.status);
  return result;
}

/** A phone typed in any common form (Persian digits, +98, 0098) as 09xxxxxxxxx, or null when it is not an Iranian mobile. */
export function normalizeIranPhone(value: string) {
  const digits = value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/\D/g, "");
  const local = digits.startsWith("0098") ? digits.slice(4) : digits.startsWith("98") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits;
  return /^9\d{9}$/.test(local) ? `0${local}` : null;
}

const lineDigits = (value: string) => value.replace(/\D/g, "");

/** Free-text send. Faraz holds every non-pattern message for operator approval, so it is not instant. */
export function sendFarazSms(apiKey: string, lineNumber: string, recipients: string[], text: string) {
  return farazRequest(apiKey, "POST", "/ws/v1/sms/simple", { text, line_number: lineDigits(lineNumber), recipients, number_format: "english" });
}

/** A sample goes only to the account owner's own number: a cheap end-to-end check of key and line. */
export function sendFarazSample(apiKey: string, lineNumber: string, text: string) {
  return farazRequest(apiKey, "POST", "/ws/v1/sms/sample", { text, line_number: lineDigits(lineNumber), number_format: "english" });
}

const numberOrNull = (value: unknown) => {
  if (value === null || value === undefined || (typeof value === "string" && !value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const stringOrNull = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

export type SmsLine = { number: string; title: string | null };
export type SmsAccount = {
  balanceToman: number | null;
  smsCount: number | null;
  displayName: string | null;
  mobile: string | null;
  planTitle: string | null;
  lines: SmsLine[] | null;
  warnings: string[];
};

/**
 * Checks `apiKey` and reads what the panel shows about the account. The balance call is Faraz's
 * documented free way to test a key, so it must succeed; profile and lines failing only warn.
 */
export async function inspectFarazAccount(apiKey: string): Promise<SmsAccount> {
  const [balance, profile, lines] = await Promise.allSettled([
    farazRequest(apiKey, "GET", "/ws/v1/account/balance"),
    farazRequest(apiKey, "GET", "/ws/v1/account/profile"),
    farazRequest(apiKey, "GET", "/ws/v1/lines/accessible"),
  ]);
  if (balance.status === "rejected") throw balance.reason instanceof FarazApiError ? balance.reason : new Error("بررسی حساب فراز اس‌ام‌اس انجام نشد.");
  const warnings: string[] = [];
  const note = (label: string, result: PromiseRejectedResult) => warnings.push(`${label}: ${result.reason instanceof Error ? result.reason.message : "دریافت نشد."}`);
  if (profile.status === "rejected") note("مشخصات حساب", profile);
  if (lines.status === "rejected") note("خطوط ارسال", lines);

  const balanceRecord = unwrapObject(balance.value);
  const profileRecord = profile.status === "fulfilled" ? unwrapObject(profile.value) : {};
  const plan = profileRecord.plan && typeof profileRecord.plan === "object" ? (profileRecord.plan as Record<string, unknown>) : {};

  let lineList: SmsLine[] | null = null;
  if (lines.status === "fulfilled") {
    const seen = new Set<string>();
    lineList = [];
    for (const item of unwrapList(lines.value)) {
      const record = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
      const raw = record ? record.line_number ?? record.lineNumber ?? record.number ?? record.line : item;
      const number = typeof raw === "string" || typeof raw === "number" ? String(raw).replace(/\D/g, "") : "";
      if (!number || seen.has(number)) continue;
      seen.add(number);
      lineList.push({ number, title: record ? stringOrNull(record.title ?? record.name ?? record.description) : null });
    }
  }
  return {
    // `balanceAmount` is the wallet in toman and `balanceCount` how many SMS it still covers.
    balanceToman: numberOrNull(balanceRecord.balanceAmount ?? balanceRecord.balance ?? balanceRecord.credit ?? balanceRecord.amount),
    smsCount: numberOrNull(balanceRecord.balanceCount),
    displayName: stringOrNull(profileRecord.displayName),
    mobile: stringOrNull(profileRecord.mobile),
    planTitle: stringOrNull(plan.title),
    lines: lineList,
    warnings,
  };
}
