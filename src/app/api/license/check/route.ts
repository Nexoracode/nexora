import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { hashLicenseKey, normalizeDomain, signLicenseToken } from "@/lib/license-token";

const bodySchema = z.object({ licenseKey: z.string().min(8).max(100), domain: z.string().min(1).max(191) });

const reject = (status: number) => NextResponse.json({ message: "لایسنس نامعتبر است." }, { status });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !env.LICENSE_PRIVATE_KEY) return reject(400);

  const site = await db.site.findUnique({
    where: { licenseKeyHash: hashLicenseKey(parsed.data.licenseKey) },
    select: { id: true, domain: true, status: true, expiresAt: true, features: { select: { featureKey: true } } },
  });
  if (!site) return reject(401);

  if (normalizeDomain(site.domain) !== normalizeDomain(parsed.data.domain)) {
    await db.licenseEvent.create({ data: { siteId: site.id, type: "CHECK_REJECTED", message: `دامنهٔ نامطابق: ${normalizeDomain(parsed.data.domain)}`.slice(0, 255) } });
    return reject(403);
  }

  // An expired contract is served exactly like a suspension so the site locks its optional features.
  const expired = site.expiresAt !== null && site.expiresAt.getTime() <= Date.now();
  const status = site.status === "ACTIVE" && !expired ? "ACTIVE" : "SUSPENDED";
  const iat = Math.floor(Date.now() / 1000);
  const token = signLicenseToken(
    { siteId: site.id, domain: site.domain, status, features: status === "ACTIVE" ? site.features.map((f) => f.featureKey) : [], iat, exp: iat + env.LICENSE_TOKEN_DAYS * 86400 },
    env.LICENSE_PRIVATE_KEY,
  );
  await db.site.update({ where: { id: site.id }, data: { lastSeenAt: new Date() }, select: { id: true } });
  return NextResponse.json({ token });
}
