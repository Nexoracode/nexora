import { Fragment } from "react";
import { CalendarDays, Globe, MessageSquare } from "lucide-react";
import type { ChatMessage } from "@/lib/ai-chat-types";
import { isStatusWord } from "@/lib/ai-status";
import { categoryLabel, chargeLabel } from "@/lib/support-labels";
import { StatusChip } from "./status-chip";

type Ticket = {
  id: string;
  number: number;
  subject: string;
  status: string;
  category: string;
  priority: string;
  charge: string;
  fee?: number;
  createdAt: string;
  closedAt?: string | null;
  updatedAt?: string;
  site?: { id: string; domain: string } | null;
  messages?: { fromOwner: boolean; body: string; createdAt: string }[];
  messageCount?: number;
};

const dateTime = (value: string) => new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const pick = <T extends Record<string, string>>(labels: T, key: string) => (Object.hasOwn(labels, key) ? labels[key as keyof T] : key);

function Chip({ value }: { value: string }) {
  return isStatusWord(value) ? <StatusChip word={value} /> : <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">{value}</span>;
}

/** One ticket with its whole conversation: customer and owner messages as clearly separated quotes. */
function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#dfe2ee] bg-white">
      <header className="border-b border-[#e6e8f3] px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="m-0 text-base font-bold">
            <span className="text-[#7a8196]">#{ticket.number.toLocaleString("fa-IR")}</span> {ticket.subject}
          </h3>
          <span className="flex flex-wrap items-center gap-1.5">
            <Chip value={ticket.status} />
            <Chip value={ticket.priority} />
            <span className="rounded-full bg-[#e6e8f3] px-2.5 py-0.5 text-xs font-medium text-[#3a4054]">{pick(categoryLabel, ticket.category)}</span>
            {ticket.charge !== "FREE" && <span className="rounded-full bg-[#e6e8f3] px-2.5 py-0.5 text-xs font-medium text-[#3a4054]">{pick(chargeLabel, ticket.charge)}</span>}
          </span>
        </div>
        <p className="m-0 mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#5b6275]">
          {ticket.site && <span className="inline-flex items-center gap-1.5"><Globe size={14} aria-hidden /><bdi dir="ltr">{ticket.site.domain}</bdi></span>}
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} aria-hidden />ایجاد: {dateTime(ticket.createdAt)}</span>
          {ticket.closedAt && <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} aria-hidden />بسته شد: {dateTime(ticket.closedAt)}</span>}
        </p>
      </header>

      <div className="space-y-5 p-5">
        {(ticket.messages ?? []).map((message, index) => (
          // A quote: a solid vertical line down the whole message, brand-coloured for the owner and grey for the customer.
          <blockquote key={index} className="m-0 flex gap-3.5">
            <span aria-hidden className={`w-[3px] shrink-0 self-stretch rounded-full ${message.fromOwner ? "bg-brand" : "bg-slate-300"}`} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-baseline gap-x-3 text-xs">
                <strong className={`text-sm ${message.fromOwner ? "text-brand" : "text-[#3a4054]"}`}>{message.fromOwner ? "پاسخ مالک" : "مشتری"}</strong>
                <time className="text-[#7a8196]">{dateTime(message.createdAt)}</time>
              </div>
              <p dir="auto" className="m-0 whitespace-pre-wrap break-words text-sm leading-7 text-[#29304a]">{message.body}</p>
            </div>
          </blockquote>
        ))}
        {(ticket.messages ?? []).length === 0 && <p className="m-0 text-sm text-[#7a8196]">پیامی ثبت نشده است.</p>}
      </div>
    </section>
  );
}

/** The ticket list as compact rows. */
function TicketList({ tickets, total }: { tickets: Ticket[]; total?: number }) {
  if (tickets.length === 0) return <p className="m-0 rounded-2xl border border-[#dfe2ee] bg-white px-5 py-4 text-sm text-[#5b6275]">تیکتی پیدا نشد.</p>;
  return (
    <section className="overflow-hidden rounded-2xl border border-[#dfe2ee] bg-white">
      <ul className="m-0 list-none divide-y divide-[#e6e8f3] p-0">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
            <span className="w-10 shrink-0 text-sm font-bold text-[#7a8196]">#{ticket.number.toLocaleString("fa-IR")}</span>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-bold">{ticket.subject}</p>
              <p className="m-0 mt-0.5 flex flex-wrap items-center gap-x-4 text-xs text-[#5b6275]">
                {ticket.site && <bdi dir="ltr">{ticket.site.domain}</bdi>}
                <span>{dateTime(ticket.updatedAt ?? ticket.createdAt)}</span>
                {ticket.messageCount !== undefined && <span className="inline-flex items-center gap-1"><MessageSquare size={13} aria-hidden />{ticket.messageCount.toLocaleString("fa-IR")}</span>}
              </p>
            </div>
            <span className="flex items-center gap-1.5"><Chip value={ticket.priority} /><Chip value={ticket.status} /></span>
          </li>
        ))}
      </ul>
      {total !== undefined && total > tickets.length && <p className="m-0 border-t border-[#e6e8f3] bg-[#f6f7fb] px-5 py-2 text-xs text-[#5b6275]">{tickets.length.toLocaleString("fa-IR")} تیکت از {total.toLocaleString("fa-IR")}</p>}
    </section>
  );
}

function parse(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return null; // cut off for length, or an error line
  }
}

/** Cards built from what the tools returned, shown above the assistant's own text. */
export function ToolCards({ message, all }: { message: Extract<ChatMessage, { role: "assistant" }>; all: ChatMessage[] }) {
  const cards = (message.tool_calls ?? []).map((call) => {
    const result = all.find((m): m is Extract<ChatMessage, { role: "tool" }> => m.role === "tool" && m.tool_call_id === call.id);
    const data = result ? (parse(result.content) as Record<string, unknown> | null) : null;
    if (!data) return null;
    if (call.function.name === "get_ticket" && typeof data.subject === "string") return <TicketCard key={call.id} ticket={data as unknown as Ticket} />;
    if (call.function.name === "list_tickets" && Array.isArray(data.tickets)) return <TicketList key={call.id} tickets={data.tickets as Ticket[]} total={typeof data.total === "number" ? data.total : undefined} />;
    return null;
  });
  if (!cards.some(Boolean)) return null;
  return <div className="space-y-3 ps-8">{cards.map((card, index) => <Fragment key={index}>{card}</Fragment>)}</div>;
}
