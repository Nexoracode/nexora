import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ColumnFilter } from "@/components/column-filter";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatToman } from "@/lib/format";
import { readPage } from "@/lib/paging";

type SearchParams = Promise<{ q?: string; status?: string; page?: string; size?: string }>;

export default async function SitesPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", status = "", page: pageParam, size: sizeParam } = await searchParams;
  const query = q.trim().slice(0, 100);
  const statusFilter: "ACTIVE" | "SUSPENDED" | undefined = status === "ACTIVE" ? "ACTIVE" : status === "SUSPENDED" ? "SUSPENDED" : undefined;
  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(query ? { OR: [{ domain: { contains: query } }, { client: { name: { contains: query } } }] } : {}),
  };
  const total = await db.site.count({ where });
  const { page, pageCount, skip, take, size } = readPage(pageParam, total, sizeParam);
  const [sites, featureTotal, totals, activeCount] = await Promise.all([
    db.site.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, domain: true, status: true, contractPrice: true, expiresAt: true, lastSeenAt: true,
        client: { select: { name: true } },
        _count: { select: { features: true } },
      },
    }),
    db.feature.count(),
    db.site.aggregate({ _count: true, _sum: { contractPrice: true } }),
    db.site.count({ where: { status: "ACTIVE" } }),
  ]);

  const stats = [
    { label: "کل سایت‌ها", value: totals._count.toLocaleString("fa-IR") },
    { label: "سایت‌های فعال", value: activeCount.toLocaleString("fa-IR") },
    { label: "جمع قراردادها", value: formatToman(Number(totals._sum.contractPrice ?? 0)) },
  ];

  return (
    <>
      <PageHeader
        title="سایت‌ها"
        description="سایت‌های فروخته‌شده و قابلیت‌های هرکدام."
        action={<Link href="/sites/new" className="btn btn-primary"><Plus size={16} aria-hidden />سایت جدید</Link>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <p className="m-0 text-sm text-slate-500">{stat.label}</p>
            <p className="m-0 mt-1 text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">نام سایت<ColumnFilter param="q" label="نام سایت یا دامنه" /></span></th>
              <th className="px-4 py-3 text-start font-medium">دامنه</th>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">وضعیت<ColumnFilter param="status" label="وضعیت" options={[{ value: "ACTIVE", label: "فعال" }, { value: "SUSPENDED", label: "تعلیق" }]} /></span></th>
              <th className="px-4 py-3 text-start font-medium">قابلیت‌ها</th>
              <th className="px-4 py-3 text-start font-medium">قرارداد</th>
              <th className="px-4 py-3 text-start font-medium">انقضا</th>
              <th className="px-4 py-3 text-start font-medium">آخرین اتصال</th>
            </tr>
          </thead>
          <tbody>
            {sites.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">چیزی پیدا نشد.</td></tr>
            )}
            {sites.map((site) => (
              <tr key={site.id} className="relative border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-bold">{site.client.name}</td>
                <td className="px-4 py-3">
                  {/* The link's overlay makes the whole row clickable without JavaScript. */}
                  <Link href={`/sites/${site.id}`} dir="ltr" className="inline-block text-slate-600 after:absolute after:inset-0">{site.domain}</Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${site.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{site.status === "ACTIVE" ? "فعال" : "تعلیق"}</span>
                </td>
                <td className="px-4 py-3">{site._count.features.toLocaleString("fa-IR")} از {featureTotal.toLocaleString("fa-IR")}</td>
                <td className="px-4 py-3">{formatToman(Number(site.contractPrice))}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(site.expiresAt)}</td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(site.lastSeenAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} basePath="/" params={{ q: query, status: statusFilter ?? "" }} size={size} total={total} />
    </>
  );
}
