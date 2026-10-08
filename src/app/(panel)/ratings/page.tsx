import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { readPage } from "@/lib/paging";
import { RatingsTable, type ShopRatings } from "./ratings-table";

const fa = (value: number, digits = 0) => value.toLocaleString("fa-IR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

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
      select: { id: true, siteId: true, stars: true, createdAt: true, feature: { select: { title: true } }, package: { select: { name: true } } },
    }),
  ]);
  const siteById = new Map(sites.map((site) => [site.id, site]));
  const shops: ShopRatings[] = grouped.flatMap((row) => {
    const site = siteById.get(row.siteId);
    if (!site) return [];
    const items = ratings
      .filter((rating) => rating.siteId === row.siteId)
      .map((rating) => ({ id: rating.id, title: rating.feature ? rating.feature.title : rating.package?.name ?? "", kind: rating.feature ? "قابلیت" : "بسته", stars: rating.stars, at: formatDateTime(rating.createdAt) }));
    return [{ siteId: row.siteId, name: site.client.name, domain: site.domain, count: row._count._all, average: row._avg.stars ?? 0, lastAt: formatDateTime(row._max.updatedAt ?? new Date(0)), items }];
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

      <RatingsTable shops={shops} />
      <Pagination page={page} pageCount={pageCount} basePath="/ratings" />
    </>
  );
}
