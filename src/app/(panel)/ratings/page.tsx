import Link from "next/link";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { readPage } from "@/lib/paging";

const fa = (value: number, digits = 0) => value.toLocaleString("fa-IR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Chips shown per shop in the list; the rest are on the shop's own page. */
const PREVIEW = 3;

/** Which shops rate, a page of shops at a time. */
export default async function RatingsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const [overall, shopTotal] = await Promise.all([
    db.rating.aggregate({ _count: { _all: true }, _avg: { stars: true } }),
    db.rating.groupBy({ by: ["siteId"] }).then((rows) => rows.length),
  ]);
  const { page, pageCount, skip, take } = readPage(pageParam, shopTotal);

  // This page's shops, the most active first, with how many they gave, their average and their latest.
  const grouped = await db.rating.groupBy({
    by: ["siteId"],
    _count: { _all: true },
    _avg: { stars: true },
    _max: { updatedAt: true },
    orderBy: [{ _count: { siteId: "desc" } }, { _max: { updatedAt: "desc" } }],
    skip,
    take,
  });
  const siteIds = grouped.map((row) => row.siteId);
  const [sites, ratings] = await Promise.all([
    db.site.findMany({ where: { id: { in: siteIds } }, select: { id: true, domain: true, client: { select: { name: true } } } }),
    db.rating.findMany({
      where: { siteId: { in: siteIds } },
      orderBy: { createdAt: "desc" },
      select: { id: true, siteId: true, stars: true, feature: { select: { title: true } }, package: { select: { name: true } } },
    }),
  ]);
  const siteById = new Map(sites.map((site) => [site.id, site]));
  const rows = grouped.flatMap((row) => {
    const site = siteById.get(row.siteId);
    if (!site) return [];
    const items = ratings.filter((rating) => rating.siteId === row.siteId).map((rating) => ({ id: rating.id, title: rating.feature ? rating.feature.title : `بستهٔ ${rating.package?.name ?? ""}`, stars: rating.stars }));
    return [{ siteId: row.siteId, name: site.client.name, domain: site.domain, count: row._count._all, average: row._avg.stars ?? 0, lastAt: row._max.updatedAt ?? new Date(0), items }];
  });

  const stats = [
    { label: "کل امتیازها", value: fa(overall._count._all) },
    { label: "فروشگاه‌های امتیازدهنده", value: fa(shopTotal) },
    { label: "میانگین امتیازها", value: overall._count._all ? fa(overall._avg.stars ?? 0, 1) : "—" },
  ];

  return (
    <>
      <PageHeader title="امتیازها" description="فروشگاه‌هایی که امتیاز داده‌اند. برای دیدن همه‌ی امتیازهای هر فروشگاه، روی ردیف آن بزنید." />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <p className="m-0 text-sm text-slate-500">{stat.label}</p>
            <p className="m-0 mt-1 text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">نام سایت</th>
              <th className="px-4 py-3 text-start font-medium">دامنه</th>
              <th className="px-4 py-3 text-start font-medium">تعداد امتیاز</th>
              <th className="px-4 py-3 text-start font-medium">میانگین</th>
              <th className="px-4 py-3 text-start font-medium">امتیازها</th>
              <th className="px-4 py-3 text-start font-medium">آخرین امتیاز</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">هنوز هیچ فروشگاهی امتیاز نداده است.</td></tr>
            )}
            {rows.map((shop) => (
              <tr key={shop.siteId} className="relative border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-bold">
                  {/* The link's overlay makes the whole row open the shop's ratings. */}
                  <Link href={`/ratings/${shop.siteId}`} className="after:absolute after:inset-0">{shop.name}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600"><span dir="ltr" className="inline-block">{shop.domain}</span></td>
                <td className="px-4 py-3">{fa(shop.count)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5"><Star size={15} aria-hidden className="fill-amber-400 text-amber-400" /><strong>{fa(shop.average, 1)}</strong></span>
                </td>
                <td className="px-4 py-3">
                  <ul className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
                    {shop.items.slice(0, PREVIEW).map((item) => (
                      <li key={item.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs">
                        {item.title}
                        <span className="inline-flex items-center gap-0.5 font-bold"><Star size={12} aria-hidden className="fill-amber-400 text-amber-400" />{fa(item.stars)}</span>
                      </li>
                    ))}
                    {shop.count > PREVIEW && <li className="text-xs text-slate-500">و {fa(shop.count - PREVIEW)} مورد دیگر</li>}
                  </ul>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(shop.lastAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} basePath="/ratings" />
    </>
  );
}
