import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { readPage } from "@/lib/paging";

const fa = (value: number, digits = 0) => value.toLocaleString("fa-IR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Every rating one shop has given, as a plain table however many there are. */
export default async function ShopRatingsPage({ params, searchParams }: { params: Promise<{ siteId: string }>; searchParams: Promise<{ page?: string }> }) {
  const { siteId } = await params;
  const { page: pageParam } = await searchParams;
  const site = await db.site.findUnique({ where: { id: siteId }, select: { id: true, domain: true, client: { select: { name: true } } } });
  if (!site) notFound();
  const [totals, count] = await Promise.all([
    db.rating.aggregate({ where: { siteId }, _avg: { stars: true } }),
    db.rating.count({ where: { siteId } }),
  ]);
  const { page, pageCount, skip, take } = readPage(pageParam, count);
  const ratings = await db.rating.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    skip,
    take,
    select: { id: true, stars: true, createdAt: true, feature: { select: { title: true } }, package: { select: { name: true } } },
  });
  const average = totals._avg.stars ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/ratings" className="inline-flex items-center gap-1 text-sm text-slate-500"><ChevronRight size={15} aria-hidden />بازگشت به امتیازها</Link>
      <PageHeader
        title={site.client.name}
        description={`${fa(count)} امتیاز · میانگین ${count ? fa(average, 1) : "—"}`}
        action={<Link href={`/sites/${site.id}`} dir="ltr" className="text-sm text-brand">{site.domain}</Link>}
      />

      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">قابلیت / بسته</th>
              <th className="px-4 py-3 text-start font-medium">نوع</th>
              <th className="px-4 py-3 text-start font-medium">امتیاز</th>
              <th className="px-4 py-3 text-start font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {ratings.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">این فروشگاه هنوز امتیازی نداده است.</td></tr>}
            {ratings.map((rating) => (
              <tr key={rating.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-bold">{rating.feature ? rating.feature.title : `بستهٔ ${rating.package?.name ?? ""}`}</td>
                <td className="px-4 py-3 text-slate-600">{rating.feature ? "قابلیت" : "بسته"}</td>
                <td className="px-4 py-3">
                  <span dir="ltr" className="inline-flex items-center gap-0.5" role="img" aria-label={`${fa(rating.stars)} از ۵`}>
                    {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} aria-hidden className={rating.stars >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"} />)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(rating.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} basePath={`/ratings/${siteId}`} />
    </div>
  );
}
