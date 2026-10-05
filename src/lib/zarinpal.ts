import { z } from "zod";

type Config = { merchantId: string; sandbox: boolean };

const TIMEOUT_MS = 10_000;

const responseSchema = z.object({
  data: z.object({ code: z.number().optional(), authority: z.string().optional(), ref_id: z.union([z.string(), z.number()]).optional() }).nullish().catch(null),
});

function bases(sandbox: boolean) {
  return sandbox
    ? { api: "https://sandbox.zarinpal.com/pg/v4/payment", pay: "https://sandbox.zarinpal.com/pg/StartPay" }
    : { api: "https://api.zarinpal.com/pg/v4/payment", pay: "https://www.zarinpal.com/pg/StartPay" };
}

async function post(config: Config, path: "request" | "verify", body: Record<string, unknown>) {
  const response = await fetch(`${bases(config.sandbox).api}/${path}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ merchant_id: config.merchantId, ...body }),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Zarinpal HTTP ${response.status}`);
  return responseSchema.parse(await response.json());
}

/** `amountRials` is what Zarinpal charges; the panel stores prices in toman. */
export async function requestPayment(config: Config, input: { amountRials: number; callbackUrl: string; description: string }) {
  const result = await post(config, "request", { amount: input.amountRials, callback_url: input.callbackUrl, description: input.description });
  if (result.data?.code !== 100 || !result.data.authority) throw new Error("Zarinpal rejected the payment request");
  return { authority: result.data.authority, redirectUrl: `${bases(config.sandbox).pay}/${encodeURIComponent(result.data.authority)}` };
}

export async function verifyPayment(config: Config, input: { amountRials: number; authority: string }) {
  const result = await post(config, "verify", { amount: input.amountRials, authority: input.authority });
  if (![100, 101].includes(result.data?.code ?? 0) || result.data?.ref_id === undefined) throw new Error("Zarinpal rejected the verification");
  return { refId: String(result.data.ref_id) };
}
