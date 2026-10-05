import Link from "next/link";
import { notFound } from "next/navigation";
import { updateSiteAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { SiteEditor } from "@/components/site-editor";
import { getClientNames, getFeatureOptions, getPackageOptions } from "@/lib/catalog-queries";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { SiteDangerZone } from "./danger-zone";

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await db.site.findUnique({
    where: { id },
    include: { client: true, features: { select: { featureKey: true } }, events: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!site) notFound();
  const [features, packages, clientNames] = await Promise.all([getFeatureOptions(), getPackageOptions(), getClientNames()]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="mb-3 inline-block text-sm text-brand">← بازگشت به سایت‌ها</Link>
        <PageHeader title={site.domain} description={`آخرین اتصال: ${formatDateTime(site.lastSeenAt)} · کلید: ${site.keyPrefix}…`} />
      </div>
      <SiteEditor
        mode="edit"
        action={updateSiteAction.bind(null, site.id)}
        features={features}
        packages={packages}
        clientNames={clientNames}
        site={{
          domain: site.domain,
          clientName: site.client.name,
          clientPhone: site.client.phone ?? "",
          status: site.status,
          contractPrice: Number(site.contractPrice),
          expiresAt: site.expiresAt ? site.expiresAt.toISOString().slice(0, 10) : "",
          notes: site.notes ?? "",
          featureKeys: site.features.map((f) => f.featureKey),
        }}
      />
      <SiteDangerZone siteId={site.id} />
      <section className="card">
        <h2 className="mb-3 font-bold">تاریخچه</h2>
        {site.events.length === 0 ? (
          <p className="text-sm text-slate-500">رویدادی ثبت نشده است.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {site.events.map((event) => (
              <li key={event.id} className="flex justify-between gap-4 py-2"><span>{event.message}</span><span className="shrink-0 text-xs text-slate-500">{formatDateTime(event.createdAt)}</span></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
