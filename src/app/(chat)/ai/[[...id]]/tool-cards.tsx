import { Fragment, type ReactNode } from "react";
import { CalendarDays, Globe, Phone } from "lucide-react";
import type { ChatMessage } from "@/lib/ai-chat-types";
import { categoryLabel, chargeLabel, entryTypeLabel } from "@/lib/support-labels";
import { CheckMark, Chip, DataTable, Panel, Stars, date, dateTime, ltr, num, toman } from "./card-ui";

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- tool results are parsed JSON of several shapes

const pick = <T extends Record<string, string>>(labels: T, key: string) => (Object.hasOwn(labels, key) ? labels[key as keyof T] : key);
const methodLabel: Record<string, string> = { CARD_TO_CARD: "کارت به کارت", ONLINE: "پرداخت آنلاین", WALLET: "کیف پول" };

/** One ticket with its whole conversation: customer and owner messages as quotes with a vertical line. */
function TicketCard({ ticket }: { ticket: Json }) {
  const messages: Json[] = ticket.messages ?? [];
  return (
    <section className="overflow-hidden rounded-2xl border border-[#dfe2ee] bg-white">
      <header className="border-b border-[#e6e8f3] px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="m-0 text-base font-bold">
            <span className="text-[#7a8196]">#{num(ticket.number)}</span> {ticket.subject}
          </h3>
          <span className="flex flex-wrap items-center gap-1.5">
            <Chip value={ticket.status} />
            <Chip value={ticket.priority} />
            <Chip value={ticket.category} label={pick(categoryLabel, ticket.category)} />
            {ticket.charge !== "FREE" && <Chip value={ticket.charge} label={pick(chargeLabel, ticket.charge)} />}
          </span>
        </div>
        <p className="m-0 mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#5b6275]">
          {ticket.site && <span className="inline-flex items-center gap-1.5"><Globe size={14} aria-hidden />{ltr(ticket.site.domain)}</span>}
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} aria-hidden />ایجاد: {dateTime(ticket.createdAt)}</span>
          {ticket.closedAt && <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} aria-hidden />بسته شد: {dateTime(ticket.closedAt)}</span>}
        </p>
      </header>

      <div className="flex flex-col gap-5 p-5">
        {messages.map((message, index) => (
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
        {messages.length === 0 && <p className="m-0 text-sm text-[#7a8196]">پیامی ثبت نشده است.</p>}
      </div>
    </section>
  );
}

function TicketTable({ data }: { data: Json }) {
  const tickets: Json[] = data.tickets;
  return (
    <DataTable
      rows={tickets}
      empty="تیکتی پیدا نشد."
      footer={typeof data.total === "number" && data.total > tickets.length ? `${num(tickets.length)} تیکت از ${num(data.total)}` : undefined}
      columns={[
        { head: "شماره", className: "text-slate-500", cell: (t) => ltr(`#${t.number}`) },
        { head: "موضوع", className: "font-bold", cell: (t) => t.subject },
        { head: "دسته", className: "text-slate-600", cell: (t) => pick(categoryLabel, t.category) },
        { head: "اولویت", cell: (t) => <Chip value={t.priority} /> },
        { head: "دامنه", className: "text-slate-600", cell: (t) => (t.site ? ltr(t.site.domain) : "—") },
        { head: "وضعیت", cell: (t) => <Chip value={t.status} /> },
        { head: "پیام‌ها", className: "text-slate-600", cell: (t) => (t.messageCount === undefined ? "—" : num(t.messageCount)) },
        { head: "آخرین تغییر", className: "whitespace-nowrap text-slate-500", cell: (t) => dateTime(t.updatedAt ?? t.createdAt) },
      ]}
    />
  );
}

function SummaryCard({ data }: { data: Json }) {
  const tiles: [string, number][] = [
    ["سایت‌ها", data.sites],
    ["سایت‌های فعال", data.activeSites],
    ["خرید در انتظار", data.pendingPurchases],
    ["شارژ در انتظار", data.pendingTopups],
    ["تیکت باز", data.openTickets],
    ["تیکت پاسخ داده شده", data.answeredTickets],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tiles.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-[#dfe2ee] bg-white px-4 py-3.5">
          <p className="m-0 text-xs text-slate-500">{label}</p>
          <p className="m-0 mt-1 text-2xl font-bold">{num(value ?? 0)}</p>
        </div>
      ))}
    </div>
  );
}

function SitesTable({ data }: { data: Json }) {
  const sites: Json[] = data.sites;
  return (
    <DataTable
      rows={sites}
      empty="سایتی پیدا نشد."
      footer={typeof data.total === "number" && data.total > sites.length ? `${num(sites.length)} سایت از ${num(data.total)}` : undefined}
      columns={[
        { head: "دامنه", className: "font-bold", cell: (s) => ltr(s.domain) },
        { head: "مشتری", cell: (s) => s.clientName },
        { head: "وضعیت", cell: (s) => <Chip value={s.status} /> },
        { head: "قابلیت‌ها", className: "text-slate-600", cell: (s) => num(s.featureCount ?? 0) },
        { head: "کیف پول", className: "whitespace-nowrap", cell: (s) => toman(s.walletBalance ?? 0) },
        { head: "آخرین اتصال", className: "whitespace-nowrap text-slate-500", cell: (s) => (s.lastSeenAt ? dateTime(s.lastSeenAt) : "هرگز") },
      ]}
    />
  );
}

function SiteCard({ site }: { site: Json }) {
  const features: Json[] = site.features ?? [];
  const events: Json[] = site.events ?? [];
  return (
    <div className="space-y-3">
      <Panel>
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="m-0 text-base font-bold">{ltr(site.domain)}</h3>
            <Chip value={site.status} />
          </div>
          <p className="m-0 mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#5b6275]">
            <span>{site.clientName}</span>
            {site.clientPhone && <span className="inline-flex items-center gap-1.5"><Phone size={14} aria-hidden />{ltr(site.clientPhone)}</span>}
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} aria-hidden />ساخته شد: {date(site.createdAt)}</span>
            <span>آخرین اتصال: {site.lastSeenAt ? dateTime(site.lastSeenAt) : "هرگز"}</span>
          </p>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-4">
          {[
            ["قیمت قرارداد", toman(site.contractPrice ?? 0)],
            ["موجودی کیف پول", toman(site.walletBalance ?? 0)],
            ["تیکت‌ها", num(site.ticketCount ?? 0)],
            ["درخواست‌های خرید", num(site.purchaseRequestCount ?? 0)],
          ].map(([label, value]) => (
            <div key={label} className="bg-white px-4 py-3">
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="m-0 mt-0.5 text-sm font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        {site.notes && <p className="m-0 border-t border-slate-100 px-5 py-3 text-sm leading-7 text-slate-600">{site.notes}</p>}
      </Panel>

      <Panel title="قابلیت‌های فعال" aside={`${num(features.length)} قابلیت`}>
        {features.length === 0 ? (
          <p className="m-0 px-5 py-4 text-sm text-slate-500">هنوز قابلیتی فعال نیست.</p>
        ) : (
          <ul className="m-0 grid list-none gap-x-6 gap-y-2.5 p-5 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature.key} className="flex items-center gap-2.5 text-sm"><CheckMark />{feature.title}</li>
            ))}
          </ul>
        )}
      </Panel>

      {events.length > 0 && (
        <Panel title="آخرین رویدادها">
          <ul className="m-0 list-none divide-y divide-slate-100 p-0">
            {events.map((event, index) => (
              <li key={index} className="flex flex-wrap items-baseline justify-between gap-x-4 px-5 py-2.5 text-sm"><span>{event.message}</span><time className="text-xs text-slate-500">{dateTime(event.createdAt)}</time></li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function WalletCard({ data }: { data: Json }) {
  const entries: Json[] = data.entries ?? [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl border border-[#dfe2ee] bg-white px-5 py-4">
        <span className="text-sm text-slate-500">کیف پول {ltr(data.domain)}</span>
        <strong className="text-lg">{toman(data.balance ?? 0)}</strong>
      </div>
      <DataTable
        rows={entries}
        empty="تراکنشی ثبت نشده است."
        columns={[
          { head: "نوع", cell: (e) => <Chip value={e.type} label={pick(entryTypeLabel, e.type)} /> },
          { head: "مبلغ", className: "whitespace-nowrap font-bold", cell: (e) => <span className={e.amount < 0 ? "text-red-600" : "text-green-600"}>{toman(e.amount)}</span> },
          { head: "موجودی پس از آن", className: "whitespace-nowrap", cell: (e) => toman(e.balanceAfter) },
          { head: "توضیح", className: "text-slate-600", cell: (e) => e.description ?? "—" },
          { head: "تاریخ", className: "whitespace-nowrap text-slate-500", cell: (e) => dateTime(e.createdAt) },
        ]}
      />
    </div>
  );
}

/** The feature catalog, one section per group with its features listed underneath. */
function FeaturesCard({ data }: { data: Json }) {
  const features: Json[] = data.features ?? [];
  const groups = new Map<string, Json[]>();
  for (const feature of features) groups.set(feature.group, [...(groups.get(feature.group) ?? []), feature]);
  return (
    <div className="space-y-3">
      {[...groups].map(([group, items]) => (
        <Panel key={group} title={group} aside={`${num(items.length)} قابلیت`}>
          <ul className="m-0 list-none divide-y divide-slate-100 p-0">
            {items.map((feature) => (
              <li key={feature.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm">
                <CheckMark on={feature.isActive} />
                <span className={`font-bold ${feature.isActive ? "" : "text-slate-400"}`}>{feature.title}</span>
                {!feature.isActive && <Chip value="غیرفعال" />}
                {feature.description && <span className="min-w-0 flex-1 truncate text-xs text-slate-500">{feature.description}</span>}
                <span className="ms-auto whitespace-nowrap text-xs text-slate-600">{feature.price > 0 ? toman(feature.price) : "رایگان"}</span>
                <span className="whitespace-nowrap text-xs text-slate-500">{num(feature.ownedBySites ?? 0)} سایت</span>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}

function PackagesCard({ data, titles }: { data: Json; titles: Map<string, string> }) {
  const packages: Json[] = data.packages ?? [];
  if (packages.length === 0) return <p className="m-0 rounded-2xl border border-[#dfe2ee] bg-white px-5 py-4 text-sm text-slate-500">بسته‌ای تعریف نشده است.</p>;
  return (
    <div className="space-y-3">
      {packages.map((pack) => (
        <Panel key={pack.id} title={pack.name} aside={toman(pack.price ?? 0)}>
          <ul className="m-0 grid list-none gap-x-6 gap-y-2.5 p-5 sm:grid-cols-2">
            {(pack.featureKeys as string[]).map((key) => (
              <li key={key} className="flex items-center gap-2.5 text-sm"><CheckMark />{(pack.features as Json[] | undefined)?.find((f) => f.key === key)?.title ?? titles.get(key) ?? key}</li>
            ))}
            {pack.featureKeys.length === 0 && <li className="text-sm text-slate-500">قابلیتی ندارد.</li>}
          </ul>
        </Panel>
      ))}
    </div>
  );
}

const subject = (row: Json) => (row.feature ? row.feature.title : row.package ? `بستهٔ ${row.package.name}` : "—");

function PurchasesTable({ data }: { data: Json }) {
  const purchases: Json[] = data.purchases;
  return (
    <DataTable
      rows={purchases}
      empty="درخواستی پیدا نشد."
      footer={typeof data.total === "number" && data.total > purchases.length ? `${num(purchases.length)} درخواست از ${num(data.total)}` : undefined}
      columns={[
        { head: "مورد", className: "font-bold", cell: subject },
        { head: "دامنه", className: "text-slate-600", cell: (p) => (p.site ? ltr(p.site.domain) : "—") },
        { head: "مبلغ", className: "whitespace-nowrap", cell: (p) => (p.amount === null || p.amount === undefined ? "—" : toman(p.amount)) },
        { head: "روش", className: "text-slate-600", cell: (p) => pick(methodLabel, p.method) },
        { head: "وضعیت", cell: (p) => <Chip value={p.status} /> },
        { head: "تاریخ", className: "whitespace-nowrap text-slate-500", cell: (p) => dateTime(p.createdAt) },
      ]}
    />
  );
}

function TopupsTable({ data }: { data: Json }) {
  const topups: Json[] = data.topups;
  return (
    <DataTable
      rows={topups}
      empty="درخواستی پیدا نشد."
      footer={typeof data.total === "number" && data.total > topups.length ? `${num(topups.length)} درخواست از ${num(data.total)}` : undefined}
      columns={[
        { head: "دامنه", className: "font-bold", cell: (t) => (t.site ? ltr(t.site.domain) : "—") },
        { head: "مبلغ", className: "whitespace-nowrap", cell: (t) => toman(t.amount) },
        { head: "روش", className: "text-slate-600", cell: (t) => pick(methodLabel, t.method) },
        { head: "کد پیگیری", className: "text-slate-600", cell: (t) => (t.trackingCode ? ltr(t.trackingCode) : "—") },
        { head: "وضعیت", cell: (t) => <Chip value={t.status} /> },
        { head: "تاریخ", className: "whitespace-nowrap text-slate-500", cell: (t) => dateTime(t.createdAt) },
      ]}
    />
  );
}

function RatingsTable({ data }: { data: Json }) {
  return (
    <DataTable
      rows={data.ratings as Json[]}
      empty="امتیازی ثبت نشده است."
      columns={[
        { head: "دامنه", className: "font-bold", cell: (r) => (r.site ? ltr(r.site.domain) : "—") },
        { head: "مورد", cell: (r) => (r.feature ? r.feature.title : r.package ? `بستهٔ ${r.package.name}` : "—") },
        { head: "امتیاز", cell: (r) => <Stars value={r.stars} /> },
        { head: "تاریخ", className: "whitespace-nowrap text-slate-500", cell: (r) => dateTime(r.updatedAt) },
      ]}
    />
  );
}

function parse(content: string): Json | null {
  try {
    const value = JSON.parse(content);
    return value && typeof value === "object" ? value : null;
  } catch {
    return null; // cut off for length, or an error line
  }
}

/** Cards built from what the tools returned, shown above the assistant's own text. */
export function ToolCards({ message, all }: { message: Extract<ChatMessage, { role: "assistant" }>; all: ChatMessage[] }) {
  const cards = (message.tool_calls ?? []).map((call): ReactNode => {
    const result = all.find((m): m is Extract<ChatMessage, { role: "tool" }> => m.role === "tool" && m.tool_call_id === call.id);
    const data = result ? parse(result.content) : null;
    if (!data) return null;
    switch (call.function.name) {
      case "nexora_summary": return typeof data.sites === "number" ? <SummaryCard data={data} /> : null;
      case "list_sites": return Array.isArray(data.sites) ? <SitesTable data={data} /> : null;
      case "get_site": return typeof data.domain === "string" && Array.isArray(data.features) ? <SiteCard site={data} /> : null;
      case "site_wallet": return Array.isArray(data.entries) ? <WalletCard data={data} /> : null;
      case "list_features": return Array.isArray(data.features) ? <FeaturesCard data={data} /> : null;
      case "list_packages": return Array.isArray(data.packages) ? <PackagesCard data={data} titles={featureTitles(all)} /> : null;
      case "list_purchases": return Array.isArray(data.purchases) ? <PurchasesTable data={data} /> : null;
      case "list_topups": return Array.isArray(data.topups) ? <TopupsTable data={data} /> : null;
      case "list_ratings": return Array.isArray(data.ratings) ? <RatingsTable data={data} /> : null;
      case "get_ticket": return typeof data.subject === "string" ? <TicketCard ticket={data} /> : null;
      case "list_tickets": return Array.isArray(data.tickets) ? <TicketTable data={data} /> : null;
      default: return null;
    }
  });
  if (!cards.some(Boolean)) return null;
  return <div className="space-y-3 ps-8">{cards.map((card, index) => <Fragment key={index}>{card}</Fragment>)}</div>;
}

/** Feature titles by key, from any list_features result earlier in the conversation (packages only carry the keys). */
function featureTitles(all: ChatMessage[]): Map<string, string> {
  const titles = new Map<string, string>();
  const calls = new Map<string, string>();
  for (const m of all) {
    if (m.role === "assistant") for (const call of m.tool_calls ?? []) calls.set(call.id, call.function.name);
    if (m.role === "tool" && calls.get(m.tool_call_id) === "list_features") for (const f of (parse(m.content)?.features ?? []) as Json[]) titles.set(f.key, f.title);
  }
  return titles;
}
