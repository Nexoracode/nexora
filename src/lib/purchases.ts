import { db } from "@/lib/db";

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];
type Paid = { refId?: string; wallet?: boolean };

/** The part of an approval that runs inside a transaction, so a caller can do more in the same one (take money from a wallet). */
export async function grantPurchaseIn(tx: Tx, requestId: string, from: "PENDING" | "AWAITING_PAYMENT", extra: Paid = {}) {
  const request = await tx.purchaseRequest.findUnique({
    where: { id: requestId },
    include: { feature: { select: { title: true } }, package: { select: { name: true, features: { select: { featureKey: true } } } } },
  });
  if (!request) return false;
  const grants = request.featureKey ? [request.featureKey] : (request.package?.features.map((f) => f.featureKey) ?? []);
  const title = request.feature?.title ?? (request.package ? `بستهٔ ${request.package.name}` : "قابلیت");

  const flipped = await tx.purchaseRequest.updateMany({
    where: { id: requestId, status: from },
    data: { status: "APPROVED", resolvedAt: new Date(), ...(extra.refId ? { refId: extra.refId, trackingCode: extra.refId } : {}) },
  });
  if (flipped.count === 0) return false;
  for (const featureKey of grants) {
    await tx.siteFeature.upsert({ where: { siteId_featureKey: { siteId: request.siteId, featureKey } }, create: { siteId: request.siteId, featureKey }, update: {}, select: { siteId: true } });
  }
  const how = extra.wallet ? "با کیف پول" : extra.refId ? "با پرداخت آنلاین" : "";
  await tx.licenseEvent.create({ data: { siteId: request.siteId, type: "PURCHASE_RESOLVED", message: `خرید «${title}» ${how} تأیید و فعال شد.`.replace(/\s+/g, " ").slice(0, 255) } });
  return true;
}

/**
 * Approves a purchase request and adds what it bought to the site. Safe to call twice (a gateway
 * callback can arrive more than once): only the call that flips the request status does the work.
 * Returns false when the request was not in the expected state.
 */
export function grantPurchase(requestId: string, from: "PENDING" | "AWAITING_PAYMENT", extra: Paid = {}) {
  return db.$transaction((tx) => grantPurchaseIn(tx, requestId, from, extra));
}
