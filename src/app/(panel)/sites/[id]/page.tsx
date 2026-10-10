import Link from "next/link";
import { notFound } from "next/navigation";
import { updateSiteAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { SiteEditor } from "@/components/site-editor";
import { getClientNames, getFeatureOptions, getPackageOptions } from "@/lib/catalog-queries";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { SiteDangerZone } from "./danger-zone";
import { WalletPanel } from "./wallet-panel";

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
          supportFreeMonths: site.supportFreeMonths,
          notes: site.notes ?? "",
          featureKeys: site.features.map((f) => f.featureKey),
        }}
        extraTabs={[{ id: "wallet", label: "کیف پول", content: <WalletPanel siteId={site.id} /> }]}
        infoTop={<SiteDangerZone siteId={site.id} keyPrefix={site.keyPrefix} />}
        infoAside={
          // On wide screens the card is exactly as tall as the form beside it and its list scrolls inside;
          // when stacked it simply takes its own height.
          <div className="relative">
          <section className="card flex flex-col xl:absolute xl:inset-0" aria-label="تاریخچه">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
              <h2 className="m-0 text-sm font-bold">تاریخچه</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{site.events.length.toLocaleString("fa-IR")}</span>
            </div>
            {site.events.length === 0 ? (
              <p className="m-0 text-sm text-slate-500">رویدادی ثبت نشده است.</p>
            ) : (
              <ul className="m-0 max-h-[32rem] min-h-0 list-none divide-y divide-slate-100 overflow-y-auto p-0 text-sm xl:max-h-none xl:flex-1">
                {site.events.map((event) => (
                  <li key={event.id} className="py-2.5">
                    <p className="m-0 leading-6">{event.message}</p>
                    <p className="m-0 mt-0.5 text-xs text-slate-500">{formatDateTime(event.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          </div>
        }
      />
    </div>
  );
}
