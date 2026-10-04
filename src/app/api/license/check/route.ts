import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { signLicenseToken } from "@/lib/license-token";
import { authenticateSite } from "@/lib/site-auth";

const bodySchema = z.object({ licenseKey: z.string().min(8).max(100), domain: z.string().min(1).max(191) });

const reject = (status: number) => NextResponse.json({ message: "لایسنس نامعتبر است." }, { status });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !env.LICENSE_PRIVATE_KEY) return reject(400);

  const auth = await authenticateSite(parsed.data.licenseKey, parsed.data.domain);
  if (!auth.ok) return reject(auth.status);
  const { site } = auth;

  // An expired contract is served exactly like a suspension so the site locks its optional features.
  const expired = site.expiresAt !== null && site.expiresAt.getTime() <= Date.now();
  const status = site.status === "ACTIVE" && !expired ? "ACTIVE" : "SUSPENDED";
  const iat = Math.floor(Date.now() / 1000);
  const token = signLicenseToken(
    { siteId: site.id, domain: site.domain, status, features: status === "ACTIVE" ? site.features.map((f) => f.featureKey) : [], iat, exp: iat + env.LICENSE_TOKEN_DAYS * 86400 },
    env.LICENSE_PRIVATE_KEY,
  );
  const [catalog, owner, pending] = await Promise.all([
    db.feature.findMany({ orderBy: { sortOrder: "asc" }, select: { key: true, title: true, price: true } }),
    db.ownerSettings.findUnique({ where: { id: "main" }, select: { holderName: true, cardNumber: true, sheba: true, bankName: true, contactPhone: true, note: true } }),
    db.purchaseRequest.findMany({ where: { siteId: site.id, status: "PENDING" }, select: { featureKey: true } }),
  ]);
  await db.site.update({ where: { id: site.id }, data: { lastSeenAt: new Date() }, select: { id: true } });
  // Display-only extras for the customer's purchase screen; the signed token alone grants features.
  return NextResponse.json({
    token,
    catalog: catalog.map((f) => ({ key: f.key, title: f.title, price: Number(f.price) })),
    owner,
    pending: pending.map((p) => p.featureKey),
  });
}
