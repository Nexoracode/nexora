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
    stars: z.number().int().min(1).max(5),
  })
  .refine((body) => Boolean(body.featureKey) !== Boolean(body.packageId), { message: "exactly one of featureKey / packageId" });

const fail = (status: number, message: string) => NextResponse.json({ message }, { status });

/** A site rates a feature or package it bought. Giving the same target again replaces the earlier rating. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "اطلاعات درخواست نامعتبر است.");
  const { licenseKey, domain, featureKey, packageId, stars } = parsed.data;

  const auth = await authenticateSite(licenseKey, domain);
  if (!auth.ok) return fail(auth.status, "لایسنس نامعتبر است.");
  const { site } = auth;

  if (featureKey) {
    if (!site.features.some((f) => f.featureKey === featureKey)) return fail(403, "فقط پس از خرید می‌توانید امتیاز بدهید.");
    await db.rating.upsert({
      where: { siteId_featureKey: { siteId: site.id, featureKey } },
      create: { siteId: site.id, featureKey, stars },
      update: { stars },
      select: { id: true },
    });
  } else if (packageId) {
    const bought = await db.purchaseRequest.findFirst({ where: { siteId: site.id, packageId, status: "APPROVED" }, select: { id: true } });
    if (!bought) return fail(403, "فقط پس از خرید می‌توانید امتیاز بدهید.");
    await db.rating.upsert({
      where: { siteId_packageId: { siteId: site.id, packageId } },
      create: { siteId: site.id, packageId, stars },
      update: { stars },
      select: { id: true },
    });
  }
  return NextResponse.json({ ok: true });
}
