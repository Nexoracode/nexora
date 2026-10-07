import "dotenv/config";
import { db } from "../src/lib/db";
import { defaultFeatures } from "../src/lib/catalog";

/**
 * The ready packages, smallest to largest. Prices are in toman and, like everything else here,
 * can be edited in the panel afterwards.
 */
const defaultPackages = [
  { name: "آغاز", price: 3_000_000, featureKeys: ["card-to-card", "compare", "promotions"] },
  { name: "نشر", price: 5_000_000, featureKeys: ["blog", "page-builder", "seo-tools"] },
  {
    name: "فروشگاهی",
    price: 10_000_000,
    featureKeys: ["card-to-card", "compare", "inventory", "product-import", "promotions", "reports", "returns", "sms-campaigns", "wallet"],
  },
  {
    name: "اوج",
    price: 17_000_000,
    featureKeys: [
      "audit-log", "blog", "card-to-card", "compare", "inventory", "page-builder", "product-import", "promotions",
      "referral", "reports", "returns", "seo-tools", "sms-campaigns", "tickets", "wallet",
    ],
  },
  {
    name: "اوج طلایی",
    price: 20_000_000,
    featureKeys: [
      "audit-log", "blog", "card-to-card", "compare", "gold", "inventory", "page-builder", "product-import", "promotions",
      "referral", "reports", "returns", "seo-tools", "sms-campaigns", "tickets", "wallet",
    ],
  },
];

// Creates missing features and fills empty descriptions only; titles, descriptions and prices
// edited in the panel are never overwritten. The same goes for packages: one that already exists
// by name is left exactly as it is.
async function main() {
  for (const [index, feature] of defaultFeatures.entries()) {
    await db.feature.upsert({ where: { key: feature.key }, create: { ...feature, sortOrder: index }, update: {} });
    await db.feature.updateMany({ where: { key: feature.key, description: null }, data: { description: feature.description } });
  }
  console.log(`Seeded ${defaultFeatures.length} features`);

  for (const pkg of defaultPackages) {
    if (await db.package.findFirst({ where: { name: pkg.name }, select: { id: true } })) continue;
    await db.package.create({
      data: { name: pkg.name, price: pkg.price, features: { create: pkg.featureKeys.map((featureKey) => ({ featureKey })) } },
    });
    console.log(`Created package ${pkg.name}`);
  }
}

main().finally(() => db.$disconnect());
