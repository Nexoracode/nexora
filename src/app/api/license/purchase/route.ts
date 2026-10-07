import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateSite } from "@/lib/site-auth";

const bodySchema = z
  .object({
    licenseKey: z.string().min(8).max(100),
    domain: z.string().min(1).max(191),
    featureKey: z.string().min(1).max(64).optional(),
    packageId: z.string().min(1).max(191).optional(),
    period: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]).optional(),
    trackingCode: z.string().trim().min(1).max(60),
    note: z.string().trim().max(500).optional(),
  })
  .refine((body) => Boolean(body.featureKey) !== Boolean(body.packageId), { message: "exactly one of featureKey / packageId" })
  .refine((body) => !body.period || Boolean(body.packageId), { message: "period needs a package" });

const fail = (status: number, message: string) => NextResponse.json({ message }, { status });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "اطلاعات درخواست نامعتبر است.");
  const { licenseKey, domain, featureKey, packageId, period, trackingCode, note } = parsed.data;

  const auth = await authenticateSite(licenseKey, domain);
  if (!auth.ok) return fail(auth.status, "لایسنس نامعتبر است.");
  const { site } = auth;
  const owned = new Set(site.features.map((f) => f.featureKey));

  let title: string;
  if (featureKey) {
    const feature = await db.feature.findUnique({ where: { key: featureKey }, select: { title: true, isActive: true } });
    if (!feature) return fail(404, "قابلیت پیدا نشد.");
    if (!feature.isActive) return fail(409, "این قابلیت فعلاً غیرفعال است.");
    if (owned.has(featureKey)) return fail(409, "این قابلیت از قبل برای سایت فعال است.");
    title = feature.title;
  } else {
    const pkg = await db.package.findUnique({ where: { id: packageId }, select: { name: true, monthlyPrice: true, features: { select: { featureKey: true } } } });
    if (!pkg) return fail(404, "بسته پیدا نشد.");
    if (period) {
      if (pkg.monthlyPrice === null) return fail(409, "این بسته به‌عنوان پلن اشتراک عرضه نمی‌شود.");
      title = `اشتراک ${pkg.name}`;
    } else {
      if (pkg.features.every((f) => owned.has(f.featureKey))) return fail(409, "همهٔ قابلیت‌های این بسته از قبل برای سایت فعال است.");
      title = `بستهٔ ${pkg.name}`;
    }
  }
  if (await db.purchaseRequest.findFirst({ where: { siteId: site.id, status: "PENDING", featureKey: featureKey ?? null, packageId: packageId ?? null, period: period ?? null }, select: { id: true } })) {
    return fail(409, "درخواست قبلی هنوز در انتظار بررسی است.");
  }

  await db.$transaction([
    db.purchaseRequest.create({ data: { siteId: site.id, featureKey, packageId, period, trackingCode, note }, select: { id: true } }),
    db.licenseEvent.create({ data: { siteId: site.id, type: "PURCHASE_REQUESTED", message: `درخواست خرید «${title}» · کد پیگیری ${trackingCode}`.slice(0, 255) } }),
  ]);
  return NextResponse.json({ ok: true });
}
