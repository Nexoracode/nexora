import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getOnlinePaymentConfig } from "@/lib/payment-config";
import { normalizeDomain } from "@/lib/license-token";
import { tomanToRials } from "@/lib/pricing";
import { quotePurchase } from "@/lib/purchase-quote";
import { authenticateSite } from "@/lib/site-auth";
import { requestPayment } from "@/lib/zarinpal";

const bodySchema = z
  .object({
    licenseKey: z.string().min(8).max(100),
    domain: z.string().min(1).max(191),
    featureKey: z.string().min(1).max(64).optional(),
    packageId: z.string().min(1).max(191).optional(),
    returnUrl: z.url().max(500),
  })
  .refine((body) => Boolean(body.featureKey) !== Boolean(body.packageId), { message: "exactly one of featureKey / packageId" });

const fail = (status: number, message: string) => NextResponse.json({ message }, { status });

/** Starts an online payment for a feature or package and returns the gateway address to send the buyer to. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "اطلاعات درخواست نامعتبر است.");
  const { licenseKey, domain, featureKey, packageId, returnUrl } = parsed.data;

  const auth = await authenticateSite(licenseKey, domain);
  if (!auth.ok) return fail(auth.status, "لایسنس نامعتبر است.");
  const { site } = auth;
  // The buyer is sent back to the site that asked, never to an address of someone else's choosing.
  if (normalizeDomain(new URL(returnUrl).host) !== normalizeDomain(site.domain)) return fail(400, "آدرس بازگشت نامعتبر است.");

  const payment = await getOnlinePaymentConfig();
  if (!payment) return fail(409, "پرداخت آنلاین فعال نیست؛ از کارت‌به‌کارت استفاده کنید.");

  const quote = await quotePurchase({ ownedKeys: new Set(site.features.map((f) => f.featureKey)), featureKey, packageId });
  if (!quote.ok) return fail(quote.status, quote.message);
  const { amountToman, title } = quote;

  const purchase = await db.purchaseRequest.create({
    data: { siteId: site.id, featureKey, packageId, method: "ONLINE", status: "AWAITING_PAYMENT", trackingCode: "online", amount: amountToman, returnUrl },
    select: { id: true },
  });
  try {
    const gateway = await requestPayment(
      payment,
      { amountRials: tomanToRials(amountToman), callbackUrl: `${env.APP_URL.replace(/\/$/, "")}/api/pay/callback?r=${purchase.id}`, description: `خرید ${title}` },
    );
    await db.purchaseRequest.update({ where: { id: purchase.id }, data: { authority: gateway.authority }, select: { id: true } });
    return NextResponse.json({ redirectUrl: gateway.redirectUrl });
  } catch (error) {
    // The reason stays in the panel's log; the buyer only needs to know it did not start.
    console.error("Online payment could not be started:", error instanceof Error ? `${error.message}${error.cause ? ` — ${String(error.cause)}` : ""}` : error);
    await db.purchaseRequest.update({ where: { id: purchase.id }, data: { status: "FAILED", resolvedAt: new Date() }, select: { id: true } });
    return fail(502, "اتصال به درگاه پرداخت برقرار نشد؛ دوباره تلاش کنید.");
  }
}
