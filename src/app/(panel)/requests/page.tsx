import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { formatDateTime, formatToman } from "@/lib/format";
import { statusClass, statusLabel } from "@/lib/purchase-status";

const filters = [
  { value: "", label: "همه" },
  { value: "PENDING", label: "در انتظار" },
  { value: "APPROVED", label: "تأیید شده" },
  { value: "REJECTED", label: "رد شده" },
] as const;

type SearchParams = Promise<{ status?: string }>;

export default async function RequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const { status = "" } = await searchParams;
  const active = filters.find((filter) => filter.value === status)?.value ?? "";
  const requests = await db.purchaseRequest.findMany({
    where: { status: active ? (active as "PENDING" | "APPROVED" | "REJECTED") : { in: ["PENDING", "APPROVED", "REJECTED"] } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { feature: { select: { title: true, price: true } }, package: { select: { name: true, price: true } }, site: { select: { domain: true, client: { select: { name: true } } } } },
  });

  return (
    <>
      <PageHeader title="درخواست‌های خرید" description="درخواست‌های سایت‌ها برای باز کردن قابلیت یا ارتقای بسته. برای دیدن جزئیات و تأیید یا رد، روی هر ردیف بزنید." />

      <nav aria-label="فیلتر وضعیت" className="mb-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value ? `/requests?status=${filter.value}` : "/requests"}
            aria-current={active === filter.value ? "page" : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm ${active === filter.value ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-slate-600"}`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">قابلیت / بسته</th>
              <th className="px-4 py-3 text-start font-medium">نام سایت</th>
              <th className="px-4 py-3 text-start font-medium">دامنه</th>
              <th className="px-4 py-3 text-start font-medium">مبلغ</th>
              <th className="px-4 py-3 text-start font-medium">روش</th>
              <th className="px-4 py-3 text-start font-medium">وضعیت</th>
              <th className="px-4 py-3 text-start font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">درخواستی پیدا نشد.</td></tr>
            )}
            {requests.map((request) => (
              <tr key={request.id} className="relative border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-bold">
                  {/* The link's overlay makes the whole row clickable without JavaScript. */}
                  <Link href={`/requests/${request.id}`} className="after:absolute after:inset-0">{request.feature ? request.feature.title : `بستهٔ ${request.package?.name ?? ""}`}</Link>
                </td>
                <td className="px-4 py-3">{request.site.client.name}</td>
                <td className="px-4 py-3 text-slate-600"><span dir="ltr" className="inline-block">{request.site.domain}</span></td>
                <td className="px-4 py-3">{formatToman(Number(request.amount ?? (request.feature ?? request.package)?.price ?? 0))}</td>
                <td className="px-4 py-3 text-slate-600">{request.method === "ONLINE" ? "آنلاین" : "کارت‌به‌کارت"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass[request.status]}`}>{statusLabel[request.status]}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(request.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
