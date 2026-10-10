import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { formatDateTime, formatToman } from "@/lib/format";
import { categoryLabel, chargeLabel, priorityClass, priorityLabel, ticketStatusClass, ticketStatusLabel } from "@/lib/support-labels";
import { ReplyForm } from "./reply-form";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await db.supportTicket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } }, site: { select: { id: true, domain: true, client: { select: { name: true } } } } },
  });
  if (!ticket) notFound();
  const cost = ticket.charge === "FREE" ? chargeLabel.FREE : `${formatToman(Number(ticket.fee))} · ${chargeLabel[ticket.charge]}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/support" className="mb-3 inline-block text-sm text-brand">← بازگشت به تیکت‌ها</Link>
        <PageHeader
          title={`#${ticket.number} · ${ticket.subject}`}
          description={`${ticket.site.client.name} · ${ticket.site.domain} · ${categoryLabel[ticket.category]} · ${cost}`}
          action={<span className="flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityClass[ticket.priority]}`}>اولویت {priorityLabel[ticket.priority]}</span><span className={`rounded-full px-3 py-1 text-xs font-medium ${ticketStatusClass[ticket.status]}`}>{ticketStatusLabel[ticket.status]}</span></span>}
        />
      </div>

      <ul className="m-0 grid list-none gap-3 p-0">
        {ticket.messages.map((message) => (
          <li key={message.id} className={`card !p-4 ${message.fromOwner ? "bg-green-50" : ""}`}>
            <p className="m-0 mb-1 text-xs text-slate-500">{message.fromOwner ? "پشتیبانی" : "ادمین سایت"} · {formatDateTime(message.createdAt)}</p>
            <p className="m-0 whitespace-pre-wrap leading-7">{message.body}</p>
          </li>
        ))}
      </ul>

      {(ticket.status === "OPEN" || ticket.status === "ANSWERED") && <div><ReplyForm ticketId={ticket.id} /></div>}
    </div>
  );
}
