import "dotenv/config";
import { db } from "../src/lib/db";
import { generateLicenseKey, normalizeDomain } from "../src/lib/license-token";

/**
 * Registers a site from the command line and prints its license key once.
 *   npm run site:create -- <domain> <client name> [feature,feature,...]
 * Features default to none; pass `all` for every feature in the catalog.
 */
const [domainArg, clientName, featureArg = ""] = process.argv.slice(2);
if (!domainArg || !clientName) {
  console.error("Usage: npm run site:create -- <domain> <client name> [feature,feature,...|all]");
  process.exit(1);
}

const domain = normalizeDomain(domainArg);
const catalog = await db.feature.findMany({ select: { key: true } });
const keys = featureArg === "all" ? catalog.map((f) => f.key) : featureArg.split(",").map((k) => k.trim()).filter(Boolean);
const unknown = keys.filter((key) => !catalog.some((f) => f.key === key));
if (unknown.length) {
  console.error(`Unknown features: ${unknown.join(", ")}`);
  process.exit(1);
}
if (await db.site.findUnique({ where: { domain }, select: { id: true } })) {
  console.error(`A site for ${domain} already exists.`);
  process.exit(1);
}

const license = generateLicenseKey();
const client = await db.client.upsert({ where: { name: clientName }, create: { name: clientName }, update: {} });
await db.site.create({
  data: {
    clientId: client.id,
    domain,
    licenseKeyHash: license.hash,
    keyPrefix: license.prefix,
    features: { create: keys.map((featureKey) => ({ featureKey })) },
    events: { create: { type: "SITE_CREATED", message: `سایت با ${keys.length} قابلیت ثبت شد.` } },
  },
  select: { id: true },
});
console.log(`LICENSE_KEY=${license.key}`);
await db.$disconnect();
