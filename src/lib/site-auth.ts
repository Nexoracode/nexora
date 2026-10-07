import { db } from "@/lib/db";
import { hashLicenseKey, normalizeDomain } from "@/lib/license-token";

/** Finds the site for a license key and checks the caller's domain against the registered one. */
export async function authenticateSite(licenseKey: string, domain: string) {
  const site = await db.site.findUnique({
    where: { licenseKeyHash: hashLicenseKey(licenseKey) },
    select: { id: true, domain: true, status: true, expiresAt: true, planId: true, period: true, features: { select: { featureKey: true } } },
  });
  if (!site) return { ok: false, status: 401 } as const;
  if (normalizeDomain(site.domain) !== normalizeDomain(domain)) {
    await db.licenseEvent.create({ data: { siteId: site.id, type: "CHECK_REJECTED", message: `دامنهٔ نامطابق: ${normalizeDomain(domain)}`.slice(0, 255) } });
    return { ok: false, status: 403 } as const;
  }
  return { ok: true, site } as const;
}
