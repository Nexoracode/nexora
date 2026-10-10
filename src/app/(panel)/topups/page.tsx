import { ColumnFilter } from "@/components/column-filter";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { formatDateTime, formatToman } from "@/lib/format";
import { readPage } from "@/lib/paging";
import { topupStatusClass, topupStatusLabel } from "@/lib/support-labels";
import { TopupActions } from "./topup-actions";

type SearchParams = Promise<{ status?: string; method?: string; q?: string; page?: string; size?: string }>;
const statuses = ["PENDING", "APPROVED", "REJECTED"] as const;

export default async function TopupsPage({ searchParams }: { searchParams: SearchParams }) {
  const { status = "", method = "", q = "", page: pageParam, size: sizeParam } = await searchParams;
  const statusFilter = statuses.find((value) => value === status);
  const methodFilter: "ONLINE" | "CARD_TO_CARD" | undefined = method === "ONLINE" ? "ONLINE" : method === "CARD_TO_CARD" ? "CARD_TO_CARD" : undefined;
  const query = q.trim().slice(0, 100);
  const where = {
    status: statusFilter ?? { in: [...statuses] },
    ...(methodFilter ? { method: methodFilter } : {}),
    ...(query ? { OR: [{ site: { domain: { contains: query } } }, { site: { client: { name: { contains: query } } } }, { trackingCode: { contains: query } }] } : {}),
  };
  const total = await db.walletTopup.count({ where });
  const { page, pageCount, skip, take, size } = readPage(pageParam, total, sizeParam);
  const topups = await db.walletTopup.findMany({
    where,
    skip,
    take,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: { id: true, amount: true, method: true, status: true, trackingCode: true, refId: true, rejectReason: true, createdAt: true, site: { select: { domain: true, client: { select: { name: true } } } } },
  });

  return (
    <>
      <PageHeader title="شارژ کیف پول" />
      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">نام سایت<ColumnFilter param="q" label="سایت، دامنه یا کد پیگیری" /></span></th>
              <th className="px-4 py-3 text-start font-medium">دامنه</th>
              <th className="px-4 py-3 text-start font-medium">مبلغ</th>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">روش<ColumnFilter param="method" label="روش" options={[{ value: "ONLINE", label: "آنلاین" }, { value: "CARD_TO_CARD", label: "کارت‌به‌کارت" }]} /></span></th>
              <th className="px-4 py-3 text-start font-medium">کد پیگیری</th>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">وضعیت<ColumnFilter param="status" label="وضعیت" options={statuses.map((value) => ({ value, label: topupStatusLabel[value] }))} /></span></th>
              <th className="px-4 py-3 text-start font-medium">تاریخ</th>
              <th className="px-4 py-3 text-start font-medium"><span className="sr-only">عملیات</span></th>
            </tr>
          </thead>
          <tbody>
            {topups.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">درخواستی پیدا نشد.</td></tr>}
            {topups.map((topup) => (
              <tr key={topup.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                <td className="px-4 py-3 font-bold">{topup.site.client.name}</td>
                <td className="px-4 py-3 text-slate-600"><span dir="ltr" className="inline-block">{topup.site.domain}</span></td>
                <td className="px-4 py-3">{formatToman(Number(topup.amount))}</td>
                <td className="px-4 py-3 text-slate-600">{topup.method === "ONLINE" ? "آنلاین" : "کارت‌به‌کارت"}</td>
                <td className="px-4 py-3"><code dir="ltr">{topup.trackingCode ?? topup.refId ?? "—"}</code></td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${topupStatusClass[topup.status]}`}>{topupStatusLabel[topup.status]}</span>
                  {topup.status === "REJECTED" && topup.rejectReason && <p className="m-0 mt-1.5 text-xs text-red-700">{topup.rejectReason}</p>}
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(topup.createdAt)}</td>
                <td className="px-4 py-3">{topup.status === "PENDING" && <TopupActions topupId={topup.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} basePath="/topups" params={{ q: query, status: statusFilter ?? "", method: methodFilter ?? "" }} size={size} total={total} />
    </>
  );
}
