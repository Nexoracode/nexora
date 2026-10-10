import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getOnlinePaymentConfig } from "@/lib/payment-config";
import { normalizeDomain, signLicenseToken } from "@/lib/license-token";
import { loadRatings } from "@/lib/ratings";
import { authenticateSite } from "@/lib/site-auth";

const bodySchema = z.object({ licenseKey: z.string().min(8).max(100), domain: z.string().min(1).max(191), siteUrl: z.url().max(300).optional() });

const reject = (status: number) => NextResponse.json({ message: "لایسنس نامعتبر است." }, { status });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !env.LICENSE_PRIVATE_KEY) return reject(400);

  const auth = await authenticateSite(parsed.data.licenseKey, parsed.data.domain);
  if (!auth.ok) return reject(auth.status);
  const { site } = auth;

  const status = site.status;
  const iat = Math.floor(Date.now() / 1000);
  const token = signLicenseToken(
    { siteId: site.id, domain: site.domain, status, features: status === "ACTIVE" ? site.features.map((f) => f.featureKey) : [], iat, exp: iat + env.LICENSE_TOKEN_DAYS * 86400 },
    env.LICENSE_PRIVATE_KEY,
  );
  const REJECTION_DAYS = 30;
  const [catalog, owner, pending, packages, rejectedRows, approvedRows, ratingData] = await Promise.all([
    db.feature.findMany({ orderBy: { sortOrder: "asc" }, select: { key: true, title: true, description: true, group: true, price: true, isActive: true } }),
    db.ownerSettings.findUnique({ where: { id: "main" }, select: { holderName: true, cardNumber: true, sheba: true, bankName: true, contactPhone: true, note: true } }),
    db.purchaseRequest.findMany({ where: { siteId: site.id, status: "PENDING" }, select: { featureKey: true, packageId: true } }),
    db.package.findMany({ orderBy: { price: "asc" }, select: { id: true, name: true, price: true, features: { select: { featureKey: true } } } }),
    db.purchaseRequest.findMany({
      where: { siteId: site.id, status: "REJECTED", rejectReason: { not: null }, resolvedAt: { gte: new Date(Date.now() - REJECTION_DAYS * 86_400_000) } },
      orderBy: { resolvedAt: "desc" },
      select: { id: true, featureKey: true, packageId: true, rejectReason: true, resolvedAt: true },
    }),
    // Card-to-card purchases the owner approved lately; the site shows a "your purchase is active" page for each until it is acknowledged.
    db.purchaseRequest.findMany({
      where: { siteId: site.id, status: "APPROVED", method: "CARD_TO_CARD", resolvedAt: { gte: new Date(Date.now() - REJECTION_DAYS * 86_400_000) } },
      orderBy: { resolvedAt: "desc" },
      take: 20,
      select: { id: true, featureKey: true, packageId: true, resolvedAt: true },
    }),
    loadRatings(site.id),
  ]);
  // The latest rejection per feature or package, unless it has been bought since or is waiting again.
  const ownedKeys = new Set(site.features.map((f) => f.featureKey));
  const waiting = new Set(pending.map((p) => p.featureKey ?? p.packageId));
  const seen = new Set<string>();
  const rejected = rejectedRows.flatMap((row) => {
    const target = row.featureKey ?? row.packageId;
    if (!target || seen.has(target)) return [];
    seen.add(target);
    if (waiting.has(target) || (row.featureKey && ownedKeys.has(row.featureKey))) return [];
    return [{ id: row.id, featureKey: row.featureKey, packageId: row.packageId, reason: row.rejectReason ?? "", at: row.resolvedAt?.toISOString() ?? null }];
  });
  // The site tells us where to reach it. Only an address on its own registered domain is remembered, so a
  // caller cannot point our notifications at somebody else.
  const siteUrl = parsed.data.siteUrl ? new URL(parsed.data.siteUrl) : null;
  const callbackUrl = siteUrl && normalizeDomain(siteUrl.host) === normalizeDomain(site.domain) ? siteUrl.origin : undefined;
  await db.site.update({ where: { id: site.id }, data: { lastSeenAt: new Date(), ...(callbackUrl ? { callbackUrl } : {}) }, select: { id: true } });
  // Display-only extras for the customer's purchase screen; the signed token alone grants features.
  return NextResponse.json({
    token,
    catalog: catalog.map((f) => ({ key: f.key, title: f.title, description: f.description ?? "", group: f.group, price: Number(f.price), isActive: f.isActive })),
    owner,
    // The merchant id never leaves the panel; sites only learn whether paying online is possible.
    onlineEnabled: (await getOnlinePaymentConfig()) !== null,
    // What the site can spend on features and packages without a gateway.
    walletBalance: Number((await db.site.findUniqueOrThrow({ where: { id: site.id }, select: { walletBalance: true } })).walletBalance),
    pending: pending.flatMap((p) => (p.featureKey ? [p.featureKey] : [])),
    pendingPackages: pending.flatMap((p) => (p.packageId ? [p.packageId] : [])),
    rejected,
    // Star summaries of every feature and package, and what this site itself gave.
    ratings: ratingData.ratings,
    myRatings: ratingData.myRatings,
    approved: approvedRows.map((row) => ({ id: row.id, featureKey: row.featureKey, packageId: row.packageId, at: row.resolvedAt?.toISOString() ?? null })),
    packages: packages.map((p) => ({ id: p.id, name: p.name, price: Number(p.price), featureKeys: p.features.map((f) => f.featureKey) })),
  });
}
