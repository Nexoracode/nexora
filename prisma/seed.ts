import "dotenv/config";
import { db } from "../src/lib/db";
import { defaultFeatures } from "../src/lib/catalog";

/**
 * Ready packages, from a first shop to a complete one. Each bigger package contains the smaller
 * one. `discount` is how much cheaper than buying its features one by one the package starts out;
 * the price is a starting point to be edited in the panel.
 */
const starterKeys = ["card-to-card", "promotions", "compare", "tickets"];
const growthKeys = [...starterKeys, "wallet", "returns", "inventory", "product-import", "seo-tools", "sms-campaigns"];
const defaultPackages = [
  { name: "آغاز", featureKeys: starterKeys, discount: 0.15 },
  { name: "رشد", featureKeys: growthKeys, discount: 0.25 },
  { name: "اوج", featureKeys: defaultFeatures.map((feature) => feature.key), discount: 0.35 },
];

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

// Creates missing features and fills empty descriptions only; titles, descriptions and prices
// edited in the panel are never overwritten. The same goes for packages: one that already exists
// by name is left exactly as it is.
async function main() {
  for (const [index, feature] of defaultFeatures.entries()) {
    await db.feature.upsert({ where: { key: feature.key }, create: { ...feature, sortOrder: index }, update: {} });
    await db.feature.updateMany({ where: { key: feature.key, description: null }, data: { description: feature.description } });
  }
  console.log(`Seeded ${defaultFeatures.length} features`);

  const features = await db.feature.findMany({ select: { key: true, price: true } });
  const priceOf = new Map(features.map((feature) => [feature.key, Number(feature.price)]));
  for (const pkg of defaultPackages) {
    if (await db.package.findFirst({ where: { name: pkg.name }, select: { id: true } })) continue;
    const total = pkg.featureKeys.reduce((sum, key) => sum + (priceOf.get(key) ?? 0), 0);
    await db.package.create({
      data: { name: pkg.name, price: roundTo(total * (1 - pkg.discount), 10_000), features: { create: pkg.featureKeys.map((featureKey) => ({ featureKey })) } },
    });
    console.log(`Created package ${pkg.name}`);
  }
}

main().finally(() => db.$disconnect());
