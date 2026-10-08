import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { formatDateTime, formatToman } from "@/lib/format";
import { readPage } from "@/lib/paging";
import { statusClass, statusLabel } from "@/lib/purchase-status";
import { requestAmount, requestSubject } from "@/lib/request-labels";
import { RequestsTable, type RequestRow } from "./requests-table";
import { DEFAULT_SUBSCRIPTION_SETTINGS } from "@/lib/subscription";

const filters = [
  { value: "", label: "همه" },
  { value: "PENDING", label: "در انتظار" },
  { value: "APPROVED", label: "تأیید شده" },
  { value: "REJECTED", label: "رد شده" },
] as const;

type SearchParams = Promise<{ status?: string; page?: string; size?: string }>;

export default async function RequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const { status = "", page: pageParam, size: sizeParam } = await searchParams;
  const active = filters.find((filter) => filter.value === status)?.value ?? "";
  const settings = (await db.subscriptionSettings.findUnique({ where: { id: "main" } })) ?? DEFAULT_SUBSCRIPTION_SETTINGS;
  const where = { status: active ? (active as "PENDING" | "APPROVED" | "REJECTED") : { in: ["PENDING", "APPROVED", "REJECTED"] as Array<"PENDING" | "APPROVED" | "REJECTED"> } };
  const total = await db.purchaseRequest.count({ where });
  const { page, pageCount, skip, take, size } = readPage(pageParam, total, sizeParam);
  const requests = await db.purchaseRequest.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    skip,
    take,
    include: { feature: { select: { title: true, price: true } }, package: { select: { name: true, price: true, monthlyPrice: true } }, site: { select: { domain: true, client: { select: { name: true, phone: true } } } } },
  });

  const rows: RequestRow[] = requests.map((request) => {
    const subject = requestSubject(request);
    const amount = formatToman(requestAmount(request, settings));
    const method = request.method === "ONLINE" ? "پرداخت آنلاین" : "کارت‌به‌کارت";
    return {
      id: request.id,
      subject,
      shopName: request.site.client.name,
      domain: request.site.domain,
      amount,
      method: request.method === "ONLINE" ? "آنلاین" : "کارت‌به‌کارت",
      status: request.status,
      statusLabel: statusLabel[request.status],
      statusClass: statusClass[request.status],
      createdAt: formatDateTime(request.createdAt),
      details: [
        { label: request.feature ? "قابلیت" : "بسته", value: subject },
        { label: "مبلغ", value: amount },
        { label: "روش پرداخت", value: method },
        { label: request.method === "ONLINE" ? "شناسه مرجع" : "کد پیگیری", value: request.trackingCode, ltr: true },
        ...(request.refId ? [{ label: "شماره مرجع درگاه", value: request.refId, ltr: true }] : []),
        { label: "نام سایت", value: request.site.client.name },
        { label: "دامنه", value: request.site.domain, ltr: true },
        ...(request.site.client.phone ? [{ label: "تلفن مشتری", value: request.site.client.phone, ltr: true }] : []),
        { label: "ثبت درخواست", value: formatDateTime(request.createdAt) },
        ...(request.resolvedAt ? [{ label: "تعیین وضعیت", value: formatDateTime(request.resolvedAt) }] : []),
      ],
      note: request.note,
      rejectReason: request.rejectReason,
    };
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

      <RequestsTable rows={rows} />
      <Pagination page={page} pageCount={pageCount} basePath="/requests" params={{ status: active }} size={size} total={total} />
    </>
  );
}
