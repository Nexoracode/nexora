import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { normalizeDomain } from "@/lib/license-token";
import { tomanToRials, upgradeAmount } from "@/lib/pricing";
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

  const owner = await db.ownerSettings.findUnique({ where: { id: "main" }, select: { onlineMerchantId: true, onlineSandbox: true } });
  if (!owner?.onlineMerchantId) return fail(409, "پرداخت آنلاین فعال نیست؛ از کارت‌به‌کارت استفاده کنید.");

  const owned = new Set(site.features.map((f) => f.featureKey));
  let amountToman: number;
  let title: string;
  if (featureKey) {
    const feature = await db.feature.findUnique({ where: { key: featureKey }, select: { title: true, price: true, isActive: true } });
    if (!feature) return fail(404, "قابلیت پیدا نشد.");
    if (!feature.isActive) return fail(409, "این قابلیت فعلاً غیرفعال است.");
    if (owned.has(featureKey)) return fail(409, "این قابلیت از قبل برای سایت فعال است.");
    amountToman = Number(feature.price);
    title = feature.title;
  } else {
    const [pkg, features] = await Promise.all([
      db.package.findUnique({ where: { id: packageId }, select: { name: true, price: true, features: { select: { featureKey: true } } } }),
      db.feature.findMany({ select: { key: true, price: true } }),
    ]);
    if (!pkg) return fail(404, "بسته پیدا نشد.");
    const packageFeatureKeys = pkg.features.map((f) => f.featureKey);
    if (packageFeatureKeys.every((key) => owned.has(key))) return fail(409, "همهٔ قابلیت‌های این بسته از قبل برای سایت فعال است.");
    amountToman = upgradeAmount({ packagePrice: Number(pkg.price), packageFeatureKeys, ownedKeys: owned, prices: new Map(features.map((f) => [f.key, Number(f.price)])) });
    title = `بستهٔ ${pkg.name}`;
  }
  if (!Number.isSafeInteger(amountToman) || amountToman < 1) return fail(409, "برای این مورد هنوز قیمتی تعیین نشده است؛ با فروشنده تماس بگیرید.");

  const purchase = await db.purchaseRequest.create({
    data: { siteId: site.id, featureKey, packageId, method: "ONLINE", status: "AWAITING_PAYMENT", trackingCode: "online", amount: amountToman, returnUrl },
    select: { id: true },
  });
  try {
    const payment = await requestPayment(
      { merchantId: owner.onlineMerchantId, sandbox: owner.onlineSandbox },
      { amountRials: tomanToRials(amountToman), callbackUrl: `${env.APP_URL.replace(/\/$/, "")}/api/pay/callback?r=${purchase.id}`, description: `خرید ${title}` },
    );
    await db.purchaseRequest.update({ where: { id: purchase.id }, data: { authority: payment.authority }, select: { id: true } });
    return NextResponse.json({ redirectUrl: payment.redirectUrl });
  } catch {
    await db.purchaseRequest.update({ where: { id: purchase.id }, data: { status: "FAILED", resolvedAt: new Date() }, select: { id: true } });
    return fail(502, "اتصال به درگاه پرداخت برقرار نشد؛ دوباره تلاش کنید.");
  }
}
