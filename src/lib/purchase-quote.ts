import { db } from "@/lib/db";
import { upgradeAmount } from "@/lib/pricing";

export type Quote = { ok: true; title: string; amountToman: number } | { ok: false; status: number; message: string };

/**
 * What a site pays for a feature or a package right now: the feature's price, or the package's price
 * minus what the site already owns of it. The same rules for every way of paying (gateway, wallet).
 */
export async function quotePurchase(input: { ownedKeys: ReadonlySet<string>; featureKey?: string; packageId?: string }): Promise<Quote> {
  let amountToman: number;
  let title: string;
  if (input.featureKey) {
    const feature = await db.feature.findUnique({ where: { key: input.featureKey }, select: { title: true, price: true, isActive: true } });
    if (!feature) return { ok: false, status: 404, message: "قابلیت پیدا نشد." };
    if (!feature.isActive) return { ok: false, status: 409, message: "این قابلیت فعلاً غیرفعال است." };
    if (input.ownedKeys.has(input.featureKey)) return { ok: false, status: 409, message: "این قابلیت از قبل برای سایت فعال است." };
    amountToman = Number(feature.price);
    title = feature.title;
  } else {
    const [pkg, features] = await Promise.all([
      db.package.findUnique({ where: { id: input.packageId }, select: { name: true, price: true, features: { select: { featureKey: true } } } }),
      db.feature.findMany({ select: { key: true, price: true } }),
    ]);
    if (!pkg) return { ok: false, status: 404, message: "بسته پیدا نشد." };
    const packageFeatureKeys = pkg.features.map((f) => f.featureKey);
    if (packageFeatureKeys.every((key) => input.ownedKeys.has(key))) return { ok: false, status: 409, message: "همهٔ قابلیت‌های این بسته از قبل برای سایت فعال است." };
    amountToman = upgradeAmount({ packagePrice: Number(pkg.price), packageFeatureKeys, ownedKeys: input.ownedKeys, prices: new Map(features.map((f) => [f.key, Number(f.price)])) });
    title = `بستهٔ ${pkg.name}`;
  }
  if (!Number.isSafeInteger(amountToman) || amountToman < 1) return { ok: false, status: 409, message: "برای این مورد هنوز قیمتی تعیین نشده است؛ با فروشنده تماس بگیرید." };
  return { ok: true, title, amountToman };
}
