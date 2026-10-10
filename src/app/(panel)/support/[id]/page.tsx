import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { db } from "@/lib/db";
import { formatDateTime, formatToman } from "@/lib/format";
import { categoryLabel, chargeLabel, priorityClass, priorityLabel, ticketStatusClass, ticketStatusLabel } from "@/lib/support-labels";
import { ReplyForm } from "./reply-form";

const chip = "rounded-full px-3 py-1 text-xs font-medium";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await db.supportTicket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } }, site: { select: { id: true, domain: true, walletBalance: true, client: { select: { name: true, phone: true } } } } },
  });
  if (!ticket) notFound();
  const clientName = ticket.site.client.name;
  const writable = ticket.status === "OPEN" || ticket.status === "ANSWERED";
  const last = ticket.messages.at(-1);
  const rows: Array<[string, React.ReactNode]> = [
    ["شمارهٔ تیکت", <span key="n" dir="ltr">#{ticket.number}</span>],
    ["وضعیت", <span key="s" className={`${chip} ${ticketStatusClass[ticket.status]}`}>{ticketStatusLabel[ticket.status]}</span>],
    ["اولویت", <span key="p" className={`${chip} ${priorityClass[ticket.priority]}`}>{priorityLabel[ticket.priority]}</span>],
    ["دسته‌بندی", categoryLabel[ticket.category]],
    ["ثبت", formatDateTime(ticket.createdAt)],
    ...(last ? [["آخرین پیام", formatDateTime(last.createdAt)] as [string, React.ReactNode]] : []),
    ["پیام‌ها", ticket.messages.length.toLocaleString("fa-IR")],
    ["هزینه", ticket.charge === "FREE" ? chargeLabel.FREE : `${formatToman(Number(ticket.fee))} · ${chargeLabel[ticket.charge]}`],
  ];

  return (
    <div className="space-y-5">
      <Link href="/support" className="inline-block text-sm text-brand">← بازگشت به تیکت‌ها</Link>

      <header className="card">
        <span dir="ltr" className="text-xs font-bold tracking-wide text-brand">#{ticket.number}</span>
        <h1 className="m-0 mt-0.5 text-xl font-bold leading-relaxed">{ticket.subject}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`${chip} ${ticketStatusClass[ticket.status]}`}>{ticketStatusLabel[ticket.status]}</span>
          <span className={`${chip} ${priorityClass[ticket.priority]}`}>اولویت {priorityLabel[ticket.priority]}</span>
          <span className={`${chip} bg-slate-100 text-slate-700`}>{categoryLabel[ticket.category]}</span>
        </div>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <section className="card relative grid gap-5 overflow-hidden" aria-label="گفتگو">
            <span aria-hidden className="absolute inset-y-9 start-[2.3rem] w-px bg-slate-200" />
            {ticket.messages.map((message, index) => (
              <article key={message.id} className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-3.5">
                <span aria-hidden className={`relative z-10 grid h-9 w-9 place-items-center rounded-full border-2 border-white text-sm font-bold ${message.fromOwner ? "bg-brand text-white" : "bg-slate-200 text-slate-700"}`}>
                  {message.fromOwner ? "ن" : clientName.slice(0, 1)}
                </span>
                <div className={`overflow-hidden rounded-xl border ${message.fromOwner ? "border-indigo-200" : "border-slate-200"}`}>
                  <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-xs ${message.fromOwner ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}>
                    <span className="flex items-center gap-2">
                      <strong className="text-[13px]">{message.fromOwner ? "پشتیبانی نکسورا (شما)" : clientName}</strong>
                      {index === 0 && <span className={`${chip} bg-slate-200 text-slate-700`}>پیام اولیه</span>}
                      {!message.fromOwner && <span className={`${chip} bg-slate-100 text-slate-600`}>ادمین سایت</span>}
                    </span>
                    <time className="text-slate-500" dateTime={message.createdAt.toISOString()}>{formatDateTime(message.createdAt)}</time>
                  </div>
                  <p className="m-0 whitespace-pre-wrap px-4 py-3.5 text-sm leading-8">{message.body}</p>
                </div>
              </article>
            ))}
            {ticket.closedAt && (
              <p className="m-0 flex items-center gap-2 ps-12 text-xs text-slate-500"><CircleCheck size={15} aria-hidden />این تیکت در {formatDateTime(ticket.closedAt)} بسته شد.</p>
            )}
          </section>

          {writable && (
            <div>
              <h2 className="mb-2 mt-0 text-sm font-bold">{last?.fromOwner ? "پیام تازه به مشتری" : "پاسخ به مشتری"}</h2>
              <ReplyForm ticketId={ticket.id} />
            </div>
          )}
        </div>

        <aside className="space-y-5" aria-label="مشخصات">
          <section className="card !p-0">
            <h2 className="m-0 border-b border-slate-100 px-5 py-3 text-sm font-bold">مشخصات تیکت</h2>
            <dl className="m-0 divide-y divide-slate-100 text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 px-5 py-2.5"><dt className="text-slate-500">{label}</dt><dd className="m-0 font-medium">{value}</dd></div>
              ))}
            </dl>
          </section>
          <section className="card !p-0">
            <h2 className="m-0 border-b border-slate-100 px-5 py-3 text-sm font-bold">مشتری</h2>
            <dl className="m-0 divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between gap-3 px-5 py-2.5"><dt className="text-slate-500">نام</dt><dd className="m-0 font-medium">{clientName}</dd></div>
              <div className="flex items-center justify-between gap-3 px-5 py-2.5"><dt className="text-slate-500">دامنه</dt><dd className="m-0 font-medium"><Link href={`/sites/${ticket.site.id}`} dir="ltr" className="text-brand">{ticket.site.domain}</Link></dd></div>
              {ticket.site.client.phone && <div className="flex items-center justify-between gap-3 px-5 py-2.5"><dt className="text-slate-500">تلفن</dt><dd dir="ltr" className="m-0 font-medium">{ticket.site.client.phone}</dd></div>}
              <div className="flex items-center justify-between gap-3 px-5 py-2.5"><dt className="text-slate-500">کیف پول</dt><dd className="m-0 font-medium">{formatToman(Number(ticket.site.walletBalance))}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
