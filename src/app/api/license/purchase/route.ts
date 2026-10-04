import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateSite } from "@/lib/site-auth";

const bodySchema = z.object({
  licenseKey: z.string().min(8).max(100),
  domain: z.string().min(1).max(191),
  featureKey: z.string().min(1).max(64),
  trackingCode: z.string().trim().min(1).max(60),
  note: z.string().trim().max(500).optional(),
});

const fail = (status: number, message: string) => NextResponse.json({ message }, { status });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "اطلاعات درخواست نامعتبر است.");
  const { licenseKey, domain, featureKey, trackingCode, note } = parsed.data;

  const auth = await authenticateSite(licenseKey, domain);
  if (!auth.ok) return fail(auth.status, "لایسنس نامعتبر است.");
  const { site } = auth;

  const feature = await db.feature.findUnique({ where: { key: featureKey }, select: { title: true } });
  if (!feature) return fail(404, "قابلیت پیدا نشد.");
  if (site.features.some((f) => f.featureKey === featureKey)) return fail(409, "این قابلیت از قبل برای سایت فعال است.");
  if (await db.purchaseRequest.findFirst({ where: { siteId: site.id, featureKey, status: "PENDING" }, select: { id: true } })) return fail(409, "درخواست قبلی هنوز در انتظار بررسی است.");

  await db.$transaction([
    db.purchaseRequest.create({ data: { siteId: site.id, featureKey, trackingCode, note }, select: { id: true } }),
    db.licenseEvent.create({ data: { siteId: site.id, type: "PURCHASE_REQUESTED", message: `درخواست خرید «${feature.title}» · کد پیگیری ${trackingCode}`.slice(0, 255) } }),
  ]);
  return NextResponse.json({ ok: true });
}
