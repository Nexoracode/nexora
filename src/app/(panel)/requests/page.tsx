import Link from "next/link";
import { approvePurchaseAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/ui";
import { RejectForm } from "./reject-form";
import { db } from "@/lib/db";
import { formatDateTime, formatToman } from "@/lib/format";

const statusLabel = { PENDING: "در انتظار", APPROVED: "تأیید شده", REJECTED: "رد شده", AWAITING_PAYMENT: "در انتظار پرداخت", FAILED: "ناموفق" } as const;
const statusClass = { PENDING: "bg-amber-100 text-amber-700", APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700", AWAITING_PAYMENT: "bg-slate-100 text-slate-700", FAILED: "bg-red-100 text-red-700" } as const;

export default async function RequestsPage() {
  const requests = await db.purchaseRequest.findMany({
    where: { status: { in: ["PENDING", "APPROVED", "REJECTED"] } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { feature: { select: { title: true, price: true } }, package: { select: { name: true, price: true } }, site: { select: { id: true, domain: true, client: { select: { name: true } } } } },
  });
  return (
    <div className="space-y-4">
      <PageHeader title="درخواست‌های خرید" description="درخواست‌های سایت‌ها برای باز کردن قابلیت یا ارتقای بسته." />
      {requests.length === 0 && <p className="card text-center text-slate-500">درخواستی ثبت نشده است.</p>}
      {requests.map((request) => (
        <div key={request.id} className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold">{request.feature ? request.feature.title : `بستهٔ ${request.package?.name ?? ""}`} · {formatToman(Number((request.feature ?? request.package)?.price ?? 0))}</p>
              <Link href={`/sites/${request.site.id}`} dir="ltr" className="text-sm text-brand">{request.site.domain}</Link>
              <span className="text-sm text-slate-500"> · {request.site.client.name}</span>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass[request.status]}`}>{statusLabel[request.status]}</span>
          </div>
          <p className="text-sm">{request.method === "ONLINE" ? "پرداخت آنلاین · شناسه مرجع" : "کارت‌به‌کارت · کد پیگیری"}: <code dir="ltr">{request.trackingCode}</code></p>
          {request.note && <p className="text-sm text-slate-600">{request.note}</p>}
          {request.status === "REJECTED" && request.rejectReason && <p className="text-sm text-red-700">دلیل رد: {request.rejectReason}</p>}
          <p className="text-xs text-slate-500">{formatDateTime(request.createdAt)}</p>
          {request.status === "PENDING" && (
            <div className="flex gap-3">
              <form action={approvePurchaseAction.bind(null, request.id)}><SubmitButton>تأیید و فعال‌سازی</SubmitButton></form>
              <RejectForm requestId={request.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
