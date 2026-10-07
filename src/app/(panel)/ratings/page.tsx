import Link from "next/link";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

const fa = (value: number, digits = 0) => value.toLocaleString("fa-IR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Which shops rate, and what each of them gave to which feature or package. */
export default async function RatingsPage() {
  const ratings = await db.rating.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, stars: true, createdAt: true,
      site: { select: { id: true, domain: true, client: { select: { name: true } } } },
      feature: { select: { title: true } },
      package: { select: { name: true } },
    },
  });

  const shops = new Map<string, { siteId: string; name: string; domain: string; items: Array<{ id: string; title: string; stars: number; at: Date }> }>();
  for (const rating of ratings) {
    const shop = shops.get(rating.site.id) ?? { siteId: rating.site.id, name: rating.site.client.name, domain: rating.site.domain, items: [] };
    shop.items.push({ id: rating.id, title: rating.feature ? rating.feature.title : `بستهٔ ${rating.package?.name ?? ""}`, stars: rating.stars, at: rating.createdAt });
    shops.set(rating.site.id, shop);
  }
  const rows = [...shops.values()]
    .map((shop) => ({ ...shop, average: shop.items.reduce((sum, item) => sum + item.stars, 0) / shop.items.length, lastAt: shop.items.reduce((latest, item) => (item.at > latest ? item.at : latest), shop.items[0].at) }))
    .sort((a, b) => b.items.length - a.items.length || b.lastAt.getTime() - a.lastAt.getTime());

  const overall = ratings.length ? ratings.reduce((sum, rating) => sum + rating.stars, 0) / ratings.length : 0;
  const stats = [
    { label: "کل امتیازها", value: fa(ratings.length) },
    { label: "فروشگاه‌های امتیازدهنده", value: fa(rows.length) },
    { label: "میانگین امتیازها", value: ratings.length ? fa(overall, 1) : "—" },
  ];

  return (
    <>
      <PageHeader title="امتیازها" description="فروشگاه‌هایی که امتیاز داده‌اند و اینکه هرکدام به کدام قابلیت یا بسته چند ستاره داده‌اند." />

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
              <th className="px-4 py-3 text-start font-medium">امتیازهای داده‌شده</th>
              <th className="px-4 py-3 text-start font-medium">آخرین امتیاز</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">هنوز هیچ فروشگاهی امتیاز نداده است.</td></tr>
            )}
            {rows.map((shop) => (
              <tr key={shop.siteId} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3 font-bold">{shop.name}</td>
                <td className="px-4 py-3"><Link href={`/sites/${shop.siteId}`} dir="ltr" className="inline-block text-brand">{shop.domain}</Link></td>
                <td className="px-4 py-3">{fa(shop.items.length)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5"><Star size={15} aria-hidden className="fill-amber-400 text-amber-400" /><strong>{fa(shop.average, 1)}</strong></span>
                </td>
                <td className="px-4 py-3">
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {shop.items.map((item) => (
                      <li key={item.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs">
                        {item.title}
                        <span className="inline-flex items-center gap-0.5 font-bold"><Star size={12} aria-hidden className="fill-amber-400 text-amber-400" />{fa(item.stars)}</span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(shop.lastAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
