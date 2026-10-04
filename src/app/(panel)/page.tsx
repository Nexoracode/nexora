import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatToman } from "@/lib/format";

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function SitesPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", status = "" } = await searchParams;
  const query = q.trim().slice(0, 100);
  const [sites, featureTotal, totals] = await Promise.all([
    db.site.findMany({
      where: {
        ...(status === "ACTIVE" || status === "SUSPENDED" ? { status } : {}),
        ...(query ? { OR: [{ domain: { contains: query } }, { client: { name: { contains: query } } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, domain: true, status: true, contractPrice: true, expiresAt: true, lastSeenAt: true,
        client: { select: { name: true } },
        features: { select: { feature: { select: { title: true } } }, orderBy: { feature: { sortOrder: "asc" } } },
      },
    }),
    db.feature.count(),
    db.site.aggregate({ _count: true, _sum: { contractPrice: true } }),
  ]);
  const activeCount = await db.site.count({ where: { status: "ACTIVE" } });

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-slate-500">کل سایت‌ها</p><p className="mt-1 text-2xl font-bold">{totals._count.toLocaleString("fa-IR")}</p></div>
        <div className="card"><p className="text-sm text-slate-500">سایت‌های فعال</p><p className="mt-1 text-2xl font-bold">{activeCount.toLocaleString("fa-IR")}</p></div>
        <div className="card"><p className="text-sm text-slate-500">جمع قراردادها</p><p className="mt-1 text-2xl font-bold">{formatToman(Number(totals._sum.contractPrice ?? 0))}</p></div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex flex-wrap gap-2" role="search">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input name="q" defaultValue={query} maxLength={100} placeholder="جستجوی دامنه یا مشتری" aria-label="جستجو" className="input !ps-9" />
          </div>
          <select name="status" defaultValue={status} aria-label="وضعیت" className="input !w-auto">
            <option value="">همه وضعیت‌ها</option>
            <option value="ACTIVE">فعال</option>
            <option value="SUSPENDED">تعلیق</option>
          </select>
          <button className="btn btn-ghost" type="submit">اعمال</button>
        </form>
        <Link href="/sites/new" className="btn btn-primary"><Plus size={16} aria-hidden />سایت جدید</Link>
      </div>

      {sites.length === 0 ? (
        <p className="card text-center text-slate-500">چیزی پیدا نشد.</p>
      ) : (
        <div className="space-y-3">
          {sites.map((site) => (
            <Link key={site.id} href={`/sites/${site.id}`} className="card block transition hover:border-brand">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p dir="ltr" className="text-start font-bold">{site.domain}</p>
                  <p className="text-sm text-slate-500">{site.client.name}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${site.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{site.status === "ACTIVE" ? "فعال" : "تعلیق"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {site.features.slice(0, 6).map(({ feature }) => <span key={feature.title} className="rounded-md bg-indigo-50 px-2 py-1 text-xs text-indigo-700">{feature.title}</span>)}
                {site.features.length > 6 && <span className="rounded-md bg-slate-100 px-2 py-1 text-xs">+{(site.features.length - 6).toLocaleString("fa-IR")}</span>}
                {site.features.length === 0 && <span className="text-xs text-slate-400">بدون قابلیت اختیاری</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                <span>{site.features.length.toLocaleString("fa-IR")} از {featureTotal.toLocaleString("fa-IR")} قابلیت</span>
                <span>قرارداد: {formatToman(Number(site.contractPrice))}</span>
                <span>انقضا: {formatDate(site.expiresAt)}</span>
                <span>آخرین اتصال: {formatDateTime(site.lastSeenAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
