import Link from "next/link";
import { ColumnFilter } from "@/components/column-filter";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { formatDateTime, formatToman } from "@/lib/format";
import { readPage } from "@/lib/paging";
import { categoryLabel, chargeLabel, priorityClass, priorityLabel, ticketStatusClass, ticketStatusLabel } from "@/lib/support-labels";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/lib/support-limits";

type SearchParams = Promise<{ status?: string; category?: string; priority?: string; q?: string; page?: string; size?: string }>;
const statuses = ["OPEN", "ANSWERED", "CLOSED"] as const;

export default async function SupportPage({ searchParams }: { searchParams: SearchParams }) {
  const { status = "", category = "", priority = "", q = "", page: pageParam, size: sizeParam } = await searchParams;
  const categoryFilter = TICKET_CATEGORIES.find((value) => value === category);
  const priorityFilter = TICKET_PRIORITIES.find((value) => value === priority);
  const statusFilter = statuses.find((value) => value === status);
  const query = q.trim().slice(0, 100);
  const where = {
    status: statusFilter ?? { in: [...statuses] },
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(priorityFilter ? { priority: priorityFilter } : {}),
    ...(query ? { OR: [{ subject: { contains: query } }, { site: { domain: { contains: query } } }, { site: { client: { name: { contains: query } } } }] } : {}),
  };
  const total = await db.supportTicket.count({ where });
  const { page, pageCount, skip, take, size } = readPage(pageParam, total, sizeParam);
  const tickets = await db.supportTicket.findMany({
    where,
    skip,
    take,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
    select: { id: true, number: true, subject: true, status: true, category: true, priority: true, charge: true, fee: true, updatedAt: true, site: { select: { domain: true, client: { select: { name: true } } } } },
  });

  return (
    <>
      <PageHeader title="تیکت‌های پشتیبانی" />
      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[64rem] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">شماره</th>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">موضوع<ColumnFilter param="q" label="موضوع، سایت یا دامنه" /></span></th>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">دسته<ColumnFilter param="category" label="دسته" options={TICKET_CATEGORIES.map((value) => ({ value, label: categoryLabel[value] }))} /></span></th>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">اولویت<ColumnFilter param="priority" label="اولویت" options={TICKET_PRIORITIES.map((value) => ({ value, label: priorityLabel[value] }))} /></span></th>
              <th className="px-4 py-3 text-start font-medium">نام سایت</th>
              <th className="px-4 py-3 text-start font-medium">دامنه</th>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">وضعیت<ColumnFilter param="status" label="وضعیت" options={statuses.map((value) => ({ value, label: ticketStatusLabel[value] }))} /></span></th>
              <th className="px-4 py-3 text-start font-medium">هزینه</th>
              <th className="px-4 py-3 text-start font-medium">آخرین تغییر</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">تیکتی پیدا نشد.</td></tr>}
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="relative border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500"><span dir="ltr">#{ticket.number}</span></td>
                <td className="px-4 py-3 font-bold">
                  <Link href={`/support/${ticket.id}`} className="after:absolute after:inset-0">{ticket.subject}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{categoryLabel[ticket.category]}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityClass[ticket.priority]}`}>{priorityLabel[ticket.priority]}</span></td>
                <td className="px-4 py-3">{ticket.site.client.name}</td>
                <td className="px-4 py-3 text-slate-600"><span dir="ltr" className="inline-block">{ticket.site.domain}</span></td>
                <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-medium ${ticketStatusClass[ticket.status]}`}>{ticketStatusLabel[ticket.status]}</span></td>
                <td className="px-4 py-3">{ticket.charge === "FREE" ? chargeLabel.FREE : `${formatToman(Number(ticket.fee))} · ${chargeLabel[ticket.charge]}`}</td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(ticket.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} basePath="/support" params={{ q: query, status: statusFilter ?? "", category: categoryFilter ?? "", priority: priorityFilter ?? "" }} size={size} total={total} />
    </>
  );
}
