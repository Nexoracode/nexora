import "dotenv/config";
import { db } from "../src/lib/db";
import { defaultFeatures } from "../src/lib/catalog";

// Creates missing features and fills empty descriptions only; titles, descriptions and prices
// edited in the panel are never overwritten.
async function main() {
  for (const [index, feature] of defaultFeatures.entries()) {
    await db.feature.upsert({ where: { key: feature.key }, create: { ...feature, sortOrder: index }, update: {} });
    await db.feature.updateMany({ where: { key: feature.key, description: null }, data: { description: feature.description } });
  }
  console.log(`Seeded ${defaultFeatures.length} features`);
}

main().finally(() => db.$disconnect());
