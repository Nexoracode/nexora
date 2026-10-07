import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { approvePurchaseAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDateTime, formatToman } from "@/lib/format";
import { statusClass, statusLabel } from "@/lib/purchase-status";
import { RejectForm } from "../reject-form";

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await db.purchaseRequest.findUnique({
    where: { id },
    include: {
      feature: { select: { title: true, price: true } },
      package: { select: { name: true, price: true } },
      site: { select: { id: true, domain: true, client: { select: { name: true, phone: true } } } },
    },
  });
  if (!request) notFound();

  const subject = request.feature ? request.feature.title : `بستهٔ ${request.package?.name ?? ""}`;
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: request.feature ? "قابلیت" : "بسته", value: subject },
    { label: "مبلغ", value: formatToman(Number(request.amount ?? (request.feature ?? request.package)?.price ?? 0)) },
    { label: "روش پرداخت", value: request.method === "ONLINE" ? "پرداخت آنلاین" : "کارت‌به‌کارت" },
    { label: request.method === "ONLINE" ? "شناسه مرجع" : "کد پیگیری", value: <code dir="ltr">{request.trackingCode}</code> },
    ...(request.refId ? [{ label: "شماره مرجع درگاه", value: <code dir="ltr">{request.refId}</code> }] : []),
    { label: "نام سایت", value: request.site.client.name },
    { label: "دامنه", value: <Link href={`/sites/${request.site.id}`} dir="ltr" className="inline-block text-brand">{request.site.domain}</Link> },
    ...(request.site.client.phone ? [{ label: "تلفن مشتری", value: <span dir="ltr" className="inline-block">{request.site.client.phone}</span> }] : []),
    { label: "ثبت درخواست", value: formatDateTime(request.createdAt) },
    ...(request.resolvedAt ? [{ label: "تعیین وضعیت", value: formatDateTime(request.resolvedAt) }] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/requests" className="inline-flex items-center gap-1 text-sm text-slate-500"><ChevronRight size={15} aria-hidden />بازگشت به درخواست‌ها</Link>
      <PageHeader
        title={subject}
        description="جزئیات درخواست خرید."
        action={<span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass[request.status]}`}>{statusLabel[request.status]}</span>}
      />

      <dl className="card m-0 divide-y divide-slate-100 !p-0">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="m-0 font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      {request.note && (
        <div className="card text-sm">
          <p className="m-0 mb-1 text-slate-500">توضیح مشتری</p>
          <p className="m-0 leading-7">{request.note}</p>
        </div>
      )}

      {request.status === "REJECTED" && request.rejectReason && (
        <div className="card text-sm text-red-700">
          <p className="m-0 mb-1">دلیل رد</p>
          <p className="m-0 leading-7">{request.rejectReason}</p>
        </div>
      )}

      {request.status === "PENDING" && (
        <div className="card flex flex-wrap items-start gap-3">
          <form action={approvePurchaseAction.bind(null, request.id)}><SubmitButton>تأیید و فعال‌سازی</SubmitButton></form>
          <RejectForm requestId={request.id} />
        </div>
      )}
    </div>
  );
}
