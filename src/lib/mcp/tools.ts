import { revalidatePath } from "next/cache";
import { z } from "zod";
import { approvePurchaseAction } from "@/app/actions";
import { db } from "@/lib/db";
import { grantTopup, supportLimits } from "@/lib/support";

/** One tool of the panel's MCP server. `write` tools change data, so the chat only runs them after the owner confirms. */
export type McpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  write: boolean;
  schema: z.ZodType<Record<string, unknown>>;
  /** One Persian line telling the owner what a write tool is about to do. */
  summary?: (args: Record<string, unknown>) => string;
  run: (args: Record<string, unknown>) => Promise<unknown>;
};

const MAX_ROWS = 20;
const text = (value: string, max = 400) => (value.length > max ? `${value.slice(0, max)}…` : value);
const ticketStatus = z.enum(["OPEN", "ANSWERED", "CLOSED", "AWAITING_PAYMENT"]);
const requestStatus = z.enum(["PENDING", "APPROVED", "REJECTED", "AWAITING_PAYMENT", "FAILED"]);
const topupStatus = z.enum(["PENDING", "APPROVED", "REJECTED", "AWAITING_PAYMENT", "FAILED"]);
const limit = z.number().int().min(1).max(MAX_ROWS).default(10);

function object(properties: Record<string, unknown>, required: string[] = []) {
  return { type: "object", properties, required, additionalProperties: false };
}

const tools: McpTool[] = [
  {
    name: "list_sites",
    description: "List customer sites, newest first. Optionally search by domain or client name.",
    write: false,
    inputSchema: object({ search: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: MAX_ROWS } }),
    schema: z.object({ search: z.string().trim().max(100).optional(), limit }),
    async run(args) {
      const { search, limit: take } = args as { search?: string; limit: number };
      const sites = await db.site.findMany({
        where: search ? { OR: [{ domain: { contains: search } }, { client: { name: { contains: search } } }] } : undefined,
        orderBy: { createdAt: "desc" },
        take,
        select: { id: true, domain: true, status: true, walletBalance: true, lastSeenAt: true, client: { select: { name: true } } },
      });
      return sites.map((site) => ({ id: site.id, domain: site.domain, client: site.client.name, status: site.status, walletBalance: Number(site.walletBalance), lastSeenAt: site.lastSeenAt }));
    },
  },
  {
    name: "get_site",
    description: "Details of one site: client, status, wallet balance, support period, purchased features and open ticket count.",
    write: false,
    inputSchema: object({ siteId: { type: "string" } }, ["siteId"]),
    schema: z.object({ siteId: z.string().min(1).max(40) }),
    async run(args) {
      const site = await db.site.findUnique({
        where: { id: String(args.siteId) },
        select: {
          id: true, domain: true, status: true, contractPrice: true, walletBalance: true, supportFreeUntil: true, lastSeenAt: true, createdAt: true, notes: true,
          client: { select: { name: true, phone: true } },
          features: { select: { featureKey: true } },
          _count: { select: { tickets: { where: { status: { in: ["OPEN", "ANSWERED"] } } } } },
        },
      });
      if (!site) return { error: "سایت پیدا نشد." };
      return { ...site, contractPrice: Number(site.contractPrice), walletBalance: Number(site.walletBalance), features: site.features.map((f) => f.featureKey), openTickets: site._count.tickets, _count: undefined };
    },
  },
  {
    name: "list_tickets",
    description: "List support tickets, newest activity first. Filter by status.",
    write: false,
    inputSchema: object({ status: { type: "string", enum: ticketStatus.options }, limit: { type: "integer", minimum: 1, maximum: MAX_ROWS } }),
    schema: z.object({ status: ticketStatus.optional(), limit }),
    async run(args) {
      const { status, limit: take } = args as { status?: z.infer<typeof ticketStatus>; limit: number };
      const tickets = await db.supportTicket.findMany({ where: status ? { status } : undefined, orderBy: { updatedAt: "desc" }, take, select: { number: true, subject: true, status: true, priority: true, category: true, updatedAt: true, site: { select: { domain: true } } } });
      return tickets.map((ticket) => ({ ...ticket, domain: ticket.site.domain, site: undefined }));
    },
  },
  {
    name: "get_ticket",
    description: "A ticket with its conversation, found by the ticket number people quote.",
    write: false,
    inputSchema: object({ number: { type: "integer" } }, ["number"]),
    schema: z.object({ number: z.number().int().positive() }),
    async run(args) {
      const ticket = await db.supportTicket.findUnique({
        where: { number: Number(args.number) },
        select: { number: true, subject: true, status: true, priority: true, category: true, createdAt: true, site: { select: { domain: true } }, messages: { orderBy: { createdAt: "asc" }, take: 30, select: { fromOwner: true, body: true, createdAt: true } } },
      });
      if (!ticket) return { error: "تیکت پیدا نشد." };
      return { ...ticket, domain: ticket.site.domain, site: undefined, messages: ticket.messages.map((m) => ({ from: m.fromOwner ? "owner" : "site", body: text(m.body, 1000), createdAt: m.createdAt })) };
    },
  },
  {
    name: "list_purchase_requests",
    description: "List purchase requests for features or packages. Filter by status; PENDING means waiting for the owner.",
    write: false,
    inputSchema: object({ status: { type: "string", enum: requestStatus.options }, limit: { type: "integer", minimum: 1, maximum: MAX_ROWS } }),
    schema: z.object({ status: requestStatus.optional(), limit }),
    async run(args) {
      const { status, limit: take } = args as { status?: z.infer<typeof requestStatus>; limit: number };
      const rows = await db.purchaseRequest.findMany({ where: status ? { status } : undefined, orderBy: { createdAt: "desc" }, take, select: { id: true, status: true, method: true, trackingCode: true, amount: true, createdAt: true, site: { select: { domain: true } }, feature: { select: { title: true } }, package: { select: { name: true } } } });
      return rows.map((row) => ({ id: row.id, status: row.status, method: row.method, trackingCode: row.trackingCode, amount: row.amount === null ? null : Number(row.amount), createdAt: row.createdAt, domain: row.site.domain, item: row.feature?.title ?? row.package?.name ?? null }));
    },
  },
  {
    name: "list_topups",
    description: "List wallet top-up requests. Filter by status; PENDING means a card-to-card payment waiting for approval.",
    write: false,
    inputSchema: object({ status: { type: "string", enum: topupStatus.options }, limit: { type: "integer", minimum: 1, maximum: MAX_ROWS } }),
    schema: z.object({ status: topupStatus.optional(), limit }),
    async run(args) {
      const { status, limit: take } = args as { status?: z.infer<typeof topupStatus>; limit: number };
      const rows = await db.walletTopup.findMany({ where: status ? { status } : undefined, orderBy: { createdAt: "desc" }, take, select: { id: true, status: true, method: true, amount: true, trackingCode: true, createdAt: true, site: { select: { domain: true } } } });
      return rows.map((row) => ({ id: row.id, status: row.status, method: row.method, amount: Number(row.amount), trackingCode: row.trackingCode, createdAt: row.createdAt, domain: row.site.domain }));
    },
  },
  {
    name: "reply_ticket",
    description: "Send the owner's reply to a ticket. Runs only after the owner confirms.",
    write: true,
    inputSchema: object({ number: { type: "integer" }, body: { type: "string", maxLength: supportLimits.message } }, ["number", "body"]),
    schema: z.object({ number: z.number().int().positive(), body: z.string().trim().min(1).max(supportLimits.message) }),
    summary: (args) => `ارسال پاسخ به تیکت ${args.number}: «${text(String(args.body), 200)}»`,
    async run(args) {
      const ticket = await db.supportTicket.findUnique({ where: { number: Number(args.number) }, select: { id: true, status: true } });
      if (!ticket) return { error: "تیکت پیدا نشد." };
      if (ticket.status === "CLOSED" || ticket.status === "AWAITING_PAYMENT") return { error: "به این تیکت نمی‌شود پاسخ داد." };
      await db.$transaction([
        db.supportMessage.create({ data: { ticketId: ticket.id, fromOwner: true, body: String(args.body) }, select: { id: true } }),
        db.supportTicket.update({ where: { id: ticket.id }, data: { status: "ANSWERED" }, select: { id: true } }),
      ]);
      revalidatePath(`/support/${ticket.id}`);
      revalidatePath("/support");
      return { ok: true, message: `پاسخ تیکت ${args.number} ارسال شد.` };
    },
  },
  {
    name: "close_ticket",
    description: "Close an open or answered ticket. Runs only after the owner confirms.",
    write: true,
    inputSchema: object({ number: { type: "integer" } }, ["number"]),
    schema: z.object({ number: z.number().int().positive() }),
    summary: (args) => `بستن تیکت ${args.number}`,
    async run(args) {
      const ticket = await db.supportTicket.findUnique({ where: { number: Number(args.number) }, select: { id: true } });
      if (!ticket) return { error: "تیکت پیدا نشد." };
      const closed = await db.supportTicket.updateMany({ where: { id: ticket.id, status: { in: ["OPEN", "ANSWERED"] } }, data: { status: "CLOSED", closedAt: new Date() } });
      if (closed.count === 0) return { error: "این تیکت بسته نیست یا قابل بستن نیست." };
      revalidatePath(`/support/${ticket.id}`);
      revalidatePath("/support");
      return { ok: true, message: `تیکت ${args.number} بسته شد.` };
    },
  },
  {
    name: "approve_purchase",
    description: "Approve a PENDING purchase request and activate the feature or package for the site. Runs only after the owner confirms.",
    write: true,
    inputSchema: object({ requestId: { type: "string" } }, ["requestId"]),
    schema: z.object({ requestId: z.string().min(1).max(40) }),
    summary: (args) => `تأیید درخواست خرید ${args.requestId}`,
    async run(args) {
      const request = await db.purchaseRequest.findUnique({ where: { id: String(args.requestId) }, select: { status: true } });
      if (!request) return { error: "درخواست پیدا نشد." };
      if (request.status !== "PENDING") return { error: "این درخواست دیگر در انتظار نیست." };
      await approvePurchaseAction(String(args.requestId));
      return { ok: true, message: "درخواست خرید تأیید شد." };
    },
  },
  {
    name: "approve_topup",
    description: "Approve a PENDING card-to-card wallet top-up and credit the site. Runs only after the owner confirms.",
    write: true,
    inputSchema: object({ topupId: { type: "string" } }, ["topupId"]),
    schema: z.object({ topupId: z.string().min(1).max(40) }),
    summary: (args) => `تأیید شارژ کیف پول ${args.topupId}`,
    async run(args) {
      const approved = await grantTopup(String(args.topupId), "PENDING");
      if (!approved) return { error: "این درخواست شارژ پیدا نشد یا دیگر در انتظار نیست." };
      revalidatePath("/topups");
      return { ok: true, message: "شارژ تأیید شد و کیف پول اعتبار گرفت." };
    },
  },
];

export const mcpTools = tools;
export const findMcpTool = (name: string) => tools.find((tool) => tool.name === name);
