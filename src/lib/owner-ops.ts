import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { ApiError, matchRoute, schemas, type Method, type Route } from "@/lib/owner-api-core";
import { notifySites } from "@/lib/notify-sites";
import { grantPurchase } from "@/lib/purchases";
import { addMonths, creditWallet, debitWallet, grantTopup } from "@/lib/support";

/**
 * Operations behind /api/owner/*, the owner's API for tools such as the MCP server. Each one mirrors
 * a panel action and reuses the same lib functions, so the rules stay in one place. Deliberately left
 * out: creating, deleting and re-keying sites (license keys must not travel through a chat), deleting
 * packages, payment/gateway/SMS settings and sending SMS.
 */
type Ctx = { params: string[]; query: URLSearchParams; body: unknown };
type Handler = (ctx: Ctx) => Promise<unknown>;

const num = (value: unknown) => Number(value ?? 0);
const parse = <T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } }, value: unknown): T => {
  const result = schema.safeParse(value ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new ApiError(400, `${issue.path.join(".") || "body"}: ${issue.message}`);
  }
  return result.data;
};
const oneOf = <T extends string>(value: string | undefined, allowed: readonly T[], name: string): T | undefined => {
  if (!value) return undefined;
  if (!(allowed as readonly string[]).includes(value)) throw new ApiError(400, `${name} must be one of: ${allowed.join(", ")}`);
  return value as T;
};
const list = (query: URLSearchParams) => parse(schemas.listQuery, Object.fromEntries(query));

const PURCHASE_STATUSES = ["PENDING", "APPROVED", "REJECTED", "AWAITING_PAYMENT", "FAILED"] as const;
const TOPUP_STATUSES = ["AWAITING_PAYMENT", "PENDING", "APPROVED", "REJECTED", "FAILED"] as const;
const TICKET_STATUSES = ["AWAITING_PAYMENT", "OPEN", "ANSWERED", "CLOSED"] as const;
const SITE_STATUSES = ["ACTIVE", "SUSPENDED"] as const;

function refreshLayout() {
  // The layout carries the sidebar badge and header counts, so the whole tree is refreshed.
  revalidatePath("/", "layout");
}

async function unknownFeatureKeys(keys: string[]) {
  if (keys.length === 0) return [];
  const known = new Set((await db.feature.findMany({ where: { key: { in: keys } }, select: { key: true } })).map((f) => f.key));
  return keys.filter((k) => !known.has(k));
}

const summary: Handler = async () => {
  const [sites, activeSites, pendingPurchases, pendingTopups, openTickets, answeredTickets] = await Promise.all([
    db.site.count(),
    db.site.count({ where: { status: "ACTIVE" } }),
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
    db.walletTopup.count({ where: { status: "PENDING" } }),
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.supportTicket.count({ where: { status: "ANSWERED" } }),
  ]);
  return { sites, activeSites, pendingPurchases, pendingTopups, openTickets, answeredTickets };
};

const listSites: Handler = async ({ query }) => {
  const { limit, offset, q, status } = list(query);
  const statusFilter = oneOf(status, SITE_STATUSES, "status");
  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q ? { OR: [{ domain: { contains: q } }, { client: { name: { contains: q } } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    db.site.count({ where }),
    db.site.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, domain: true, status: true, contractPrice: true, walletBalance: true, supportFreeUntil: true, lastSeenAt: true, client: { select: { name: true, phone: true } }, _count: { select: { features: true } } },
    }),
  ]);
  return {
    total,
    sites: rows.map(({ client, _count, contractPrice, walletBalance, ...s }) => ({ ...s, clientName: client.name, clientPhone: client.phone, contractPrice: num(contractPrice), walletBalance: num(walletBalance), featureCount: _count.features })),
  };
};

const getSite: Handler = async ({ params: [id] }) => {
  const site = await db.site.findUnique({
    where: { id },
    select: {
      id: true, domain: true, status: true, keyPrefix: true, contractPrice: true, walletBalance: true, notes: true, supportFreeMonths: true, supportFreeUntil: true, lastSeenAt: true, createdAt: true,
      client: { select: { name: true, phone: true } },
      features: { select: { feature: { select: { key: true, title: true } } } },
      events: { orderBy: { createdAt: "desc" }, take: 15, select: { type: true, message: true, createdAt: true } },
      _count: { select: { tickets: true, purchaseRequests: true } },
    },
  });
  if (!site) throw new ApiError(404, "سایت پیدا نشد.");
  const { client, features, contractPrice, walletBalance, _count, ...rest } = site;
  return { ...rest, clientName: client.name, clientPhone: client.phone, contractPrice: num(contractPrice), walletBalance: num(walletBalance), features: features.map((f) => f.feature), ticketCount: _count.tickets, purchaseRequestCount: _count.purchaseRequests };
};

const updateSite: Handler = async ({ params: [id], body }) => {
  const input = parse(schemas.siteUpdate, body);
  if (Object.keys(input).length === 0) throw new ApiError(400, "حداقل یک فیلد برای تغییر لازم است.");
  const current = await db.site.findUnique({ where: { id }, select: { status: true, supportFreeMonths: true, features: { select: { featureKey: true } } } });
  if (!current) throw new ApiError(404, "سایت پیدا نشد.");

  const owned = new Set(current.features.map((f) => f.featureKey));
  const unknown = await unknownFeatureKeys([...(input.addFeatures ?? []), ...(input.removeFeatures ?? [])]);
  if (unknown.length) throw new ApiError(400, `قابلیت ناشناخته: ${unknown.join(", ")}`);
  const add = [...new Set(input.addFeatures ?? [])].filter((k) => !owned.has(k));
  const remove = [...new Set(input.removeFeatures ?? [])].filter((k) => owned.has(k));
  if (add.some((k) => remove.includes(k))) throw new ApiError(400, "یک قابلیت نمی‌تواند هم اضافه و هم حذف شود.");

  const events = [
    ...(add.length || remove.length ? [{ type: "FEATURES_CHANGED" as const, message: `قابلیت‌ها: ${add.length} افزوده، ${remove.length} حذف (جمعاً ${owned.size + add.length - remove.length}).` }] : []),
    ...(input.status && input.status !== current.status ? [{ type: "STATUS_CHANGED" as const, message: input.status === "ACTIVE" ? "سایت فعال شد." : "سایت تعلیق شد." }] : []),
  ];
  await db.site.update({
    where: { id },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.contractPrice !== undefined ? { contractPrice: input.contractPrice } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      // The free period restarts from today only when the number of months was changed.
      ...(input.supportFreeMonths !== undefined && input.supportFreeMonths !== current.supportFreeMonths
        ? { supportFreeMonths: input.supportFreeMonths, supportFreeUntil: input.supportFreeMonths > 0 ? addMonths(new Date(), input.supportFreeMonths) : null }
        : {}),
      ...(add.length || remove.length ? { features: { create: add.map((featureKey) => ({ featureKey })), deleteMany: { featureKey: { in: remove } } } } : {}),
      ...(events.length ? { events: { create: events } } : {}),
    },
    select: { id: true },
  });
  refreshLayout();
  revalidatePath(`/sites/${id}`);
  after(() => notifySites(id));
  return getSite({ params: [id], query: new URLSearchParams(), body: null });
};

const siteWallet: Handler = async ({ params: [id], query }) => {
  const { limit, offset } = list(query);
  const site = await db.site.findUnique({ where: { id }, select: { domain: true, walletBalance: true } });
  if (!site) throw new ApiError(404, "سایت پیدا نشد.");
  const entries = await db.walletEntry.findMany({ where: { siteId: id }, orderBy: { createdAt: "desc" }, skip: offset, take: limit, select: { type: true, amount: true, balanceAfter: true, description: true, createdAt: true } });
  return { domain: site.domain, balance: num(site.walletBalance), entries: entries.map((e) => ({ ...e, amount: num(e.amount), balanceAfter: num(e.balanceAfter) })) };
};

const adjustWallet: Handler = async ({ params: [siteId], body }) => {
  const { direction, amount, description } = parse(schemas.walletAdjust, body);
  if (!(await db.site.findUnique({ where: { id: siteId }, select: { id: true } }))) throw new ApiError(404, "سایت پیدا نشد.");
  const ok = await db.$transaction(async (tx) => {
    if (direction === "credit") {
      await creditWallet(tx, { siteId, amount, type: "ADMIN_CREDIT", description });
      return true;
    }
    return debitWallet(tx, { siteId, amount, type: "ADMIN_DEBIT", description });
  });
  if (!ok) throw new ApiError(409, "موجودی کیف پول برای این کسر کافی نیست.");
  revalidatePath(`/sites/${siteId}/wallet`);
  return siteWallet({ params: [siteId], query: new URLSearchParams({ limit: "5" }), body: null });
};

const listFeatures: Handler = async () => {
  const rows = await db.feature.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }], select: { key: true, title: true, group: true, description: true, price: true, isActive: true, _count: { select: { siteFeatures: true } } } });
  return { features: rows.map(({ price, _count, ...f }) => ({ ...f, price: num(price), ownedBySites: _count.siteFeatures })) };
};

const updateFeature: Handler = async ({ params: [key], body }) => {
  const input = parse(schemas.featureUpdate, body);
  if (Object.keys(input).length === 0) throw new ApiError(400, "حداقل یک فیلد برای تغییر لازم است.");
  if (!(await db.feature.findUnique({ where: { key }, select: { key: true } }))) throw new ApiError(404, "قابلیت پیدا نشد.");
  await db.feature.update({ where: { key }, data: input, select: { key: true } });
  revalidatePath("/features");
  after(() => notifySites());
  return (await listFeatures({ params: [], query: new URLSearchParams(), body: null }) as { features: { key: string }[] }).features.find((f) => f.key === key);
};

const listPackages: Handler = async () => {
  const rows = await db.package.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, price: true, features: { select: { featureKey: true, feature: { select: { title: true } } } } } });
  return { packages: rows.map(({ price, features, ...p }) => ({ ...p, price: num(price), featureKeys: features.map((f) => f.featureKey), features: features.map((f) => ({ key: f.featureKey, title: f.feature.title })) })) };
};

const createPackage: Handler = async ({ body }) => {
  const input = parse(schemas.packageCreate, body);
  const unknown = await unknownFeatureKeys(input.featureKeys);
  if (unknown.length) throw new ApiError(400, `قابلیت ناشناخته: ${unknown.join(", ")}`);
  const created = await db.package.create({ data: { name: input.name, price: input.price, features: { create: [...new Set(input.featureKeys)].map((featureKey) => ({ featureKey })) } }, select: { id: true } });
  revalidatePath("/packages");
  after(() => notifySites());
  return { id: created.id };
};

const updatePackage: Handler = async ({ params: [id], body }) => {
  const input = parse(schemas.packageUpdate, body);
  if (Object.keys(input).length === 0) throw new ApiError(400, "حداقل یک فیلد برای تغییر لازم است.");
  if (!(await db.package.findUnique({ where: { id }, select: { id: true } }))) throw new ApiError(404, "بسته پیدا نشد.");
  const unknown = await unknownFeatureKeys(input.featureKeys ?? []);
  if (unknown.length) throw new ApiError(400, `قابلیت ناشناخته: ${unknown.join(", ")}`);
  await db.package.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.featureKeys ? { features: { deleteMany: {}, create: [...new Set(input.featureKeys)].map((featureKey) => ({ featureKey })) } } : {}),
    },
    select: { id: true },
  });
  revalidatePath("/packages");
  revalidatePath(`/packages/${id}`);
  after(() => notifySites());
  return (await listPackages({ params: [], query: new URLSearchParams(), body: null }) as { packages: { id: string }[] }).packages.find((p) => p.id === id);
};

const listPurchases: Handler = async ({ query }) => {
  const { limit, offset, status } = list(query);
  const statusFilter = oneOf(status, PURCHASE_STATUSES, "status");
  const where = statusFilter ? { status: statusFilter } : {};
  const [total, rows] = await Promise.all([
    db.purchaseRequest.count({ where }),
    db.purchaseRequest.findMany({
      where, skip: offset, take: limit, orderBy: { createdAt: "desc" },
      select: { id: true, status: true, method: true, trackingCode: true, note: true, rejectReason: true, amount: true, createdAt: true, resolvedAt: true, site: { select: { id: true, domain: true } }, feature: { select: { key: true, title: true } }, package: { select: { id: true, name: true } } },
    }),
  ]);
  return { total, purchases: rows.map(({ amount, ...r }) => ({ ...r, amount: amount === null ? null : num(amount) })) };
};

async function afterPurchaseResolved(id: string) {
  revalidatePath("/requests");
  refreshLayout();
  const request = await db.purchaseRequest.findUnique({ where: { id }, select: { siteId: true } });
  if (request) after(() => notifySites(request.siteId));
}

const approvePurchase: Handler = async ({ params: [id] }) => {
  const request = await db.purchaseRequest.findUnique({ where: { id }, select: { status: true } });
  if (!request) throw new ApiError(404, "درخواست پیدا نشد.");
  if (!(await grantPurchase(id, "PENDING"))) throw new ApiError(409, `این درخواست در انتظار نیست (وضعیت: ${request.status}).`);
  await afterPurchaseResolved(id);
  return { id, status: "APPROVED" };
};

const rejectPurchase: Handler = async ({ params: [id], body }) => {
  const { reason } = parse(schemas.reject, body);
  const request = await db.purchaseRequest.findUnique({ where: { id }, include: { feature: { select: { title: true } }, package: { select: { name: true } } } });
  if (!request) throw new ApiError(404, "درخواست پیدا نشد.");
  if (request.status !== "PENDING") throw new ApiError(409, `این درخواست در انتظار نیست (وضعیت: ${request.status}).`);
  const title = request.feature?.title ?? (request.package ? `بستهٔ ${request.package.name}` : "قابلیت");
  await db.$transaction([
    db.purchaseRequest.update({ where: { id }, data: { status: "REJECTED", resolvedAt: new Date(), rejectReason: reason }, select: { id: true } }),
    db.licenseEvent.create({ data: { siteId: request.siteId, type: "PURCHASE_RESOLVED", message: `خرید «${title}» رد شد: ${reason}`.slice(0, 255) } }),
  ]);
  await afterPurchaseResolved(id);
  return { id, status: "REJECTED" };
};

const listTopups: Handler = async ({ query }) => {
  const { limit, offset, status } = list(query);
  const statusFilter = oneOf(status, TOPUP_STATUSES, "status");
  const where = statusFilter ? { status: statusFilter } : {};
  const [total, rows] = await Promise.all([
    db.walletTopup.count({ where }),
    db.walletTopup.findMany({ where, skip: offset, take: limit, orderBy: { createdAt: "desc" }, select: { id: true, amount: true, method: true, status: true, trackingCode: true, rejectReason: true, createdAt: true, resolvedAt: true, site: { select: { id: true, domain: true } } } }),
  ]);
  return { total, topups: rows.map(({ amount, ...t }) => ({ ...t, amount: num(amount) })) };
};

const approveTopup: Handler = async ({ params: [id] }) => {
  const topup = await db.walletTopup.findUnique({ where: { id }, select: { status: true } });
  if (!topup) throw new ApiError(404, "درخواست شارژ پیدا نشد.");
  if (!(await grantTopup(id, "PENDING"))) throw new ApiError(409, `این درخواست در انتظار نیست (وضعیت: ${topup.status}).`);
  revalidatePath("/topups");
  return { id, status: "APPROVED" };
};

const rejectTopup: Handler = async ({ params: [id], body }) => {
  const { reason } = parse(schemas.reject, body);
  if (!(await db.walletTopup.findUnique({ where: { id }, select: { id: true } }))) throw new ApiError(404, "درخواست شارژ پیدا نشد.");
  const flipped = await db.walletTopup.updateMany({ where: { id, status: "PENDING" }, data: { status: "REJECTED", resolvedAt: new Date(), rejectReason: reason } });
  if (flipped.count === 0) throw new ApiError(409, "این درخواست دیگر در انتظار نیست.");
  revalidatePath("/topups");
  return { id, status: "REJECTED" };
};

const listTickets: Handler = async ({ query }) => {
  const { limit, offset, status, q } = list(query);
  const statusFilter = oneOf(status, TICKET_STATUSES, "status");
  const where = { ...(statusFilter ? { status: statusFilter } : {}), ...(q ? { subject: { contains: q } } : {}) };
  const [total, rows] = await Promise.all([
    db.supportTicket.count({ where }),
    db.supportTicket.findMany({ where, skip: offset, take: limit, orderBy: { updatedAt: "desc" }, select: { id: true, number: true, subject: true, status: true, category: true, priority: true, charge: true, fee: true, createdAt: true, updatedAt: true, site: { select: { id: true, domain: true } }, _count: { select: { messages: true } } } }),
  ]);
  return { total, tickets: rows.map(({ fee, _count, ...t }) => ({ ...t, fee: num(fee), messageCount: _count.messages })) };
};

const getTicket: Handler = async ({ params: [id] }) => {
  const ticket = await db.supportTicket.findUnique({
    where: { id },
    select: { id: true, number: true, subject: true, status: true, category: true, priority: true, charge: true, fee: true, createdAt: true, closedAt: true, site: { select: { id: true, domain: true } }, messages: { orderBy: { createdAt: "asc" }, select: { fromOwner: true, body: true, createdAt: true } } },
  });
  if (!ticket) throw new ApiError(404, "تیکت پیدا نشد.");
  return { ...ticket, fee: num(ticket.fee) };
};

const replyTicket: Handler = async ({ params: [id], body }) => {
  const { body: text } = parse(schemas.reply, body);
  const ticket = await db.supportTicket.findUnique({ where: { id }, select: { status: true } });
  if (!ticket) throw new ApiError(404, "تیکت پیدا نشد.");
  if (ticket.status === "CLOSED" || ticket.status === "AWAITING_PAYMENT") throw new ApiError(409, "به این تیکت نمی‌شود پاسخ داد.");
  await db.$transaction([
    db.supportMessage.create({ data: { ticketId: id, fromOwner: true, body: text }, select: { id: true } }),
    db.supportTicket.update({ where: { id }, data: { status: "ANSWERED" }, select: { id: true } }),
  ]);
  revalidatePath(`/support/${id}`);
  revalidatePath("/support");
  return { id, status: "ANSWERED" };
};

const closeTicket: Handler = async ({ params: [id] }) => {
  const ticket = await db.supportTicket.findUnique({ where: { id }, select: { status: true } });
  if (!ticket) throw new ApiError(404, "تیکت پیدا نشد.");
  const closed = await db.supportTicket.updateMany({ where: { id, status: { in: ["OPEN", "ANSWERED"] } }, data: { status: "CLOSED", closedAt: new Date() } });
  if (closed.count === 0) throw new ApiError(409, `این تیکت قابل بستن نیست (وضعیت: ${ticket.status}).`);
  revalidatePath(`/support/${id}`);
  revalidatePath("/support");
  return { id, status: "CLOSED" };
};

const listRatings: Handler = async ({ query }) => {
  const { limit, offset } = list(query);
  const rows = await db.rating.findMany({ orderBy: { updatedAt: "desc" }, skip: offset, take: limit, select: { stars: true, updatedAt: true, site: { select: { domain: true } }, feature: { select: { key: true, title: true } }, package: { select: { id: true, name: true } } } });
  return { ratings: rows };
};

const r = (method: Method, pattern: string, handler: Handler): Route<Handler> => ({ method, pattern: new RegExp(`^${pattern}$`), handler });
const ID = "([^/]+)";

export const ownerRoutes: Route<Handler>[] = [
  r("GET", "/summary", summary),
  r("GET", "/sites", listSites),
  r("GET", `/sites/${ID}`, getSite),
  r("PATCH", `/sites/${ID}`, updateSite),
  r("GET", `/sites/${ID}/wallet`, siteWallet),
  r("POST", `/sites/${ID}/wallet`, adjustWallet),
  r("GET", "/features", listFeatures),
  r("PATCH", `/features/${ID}`, updateFeature),
  r("GET", "/packages", listPackages),
  r("POST", "/packages", createPackage),
  r("PATCH", `/packages/${ID}`, updatePackage),
  r("GET", "/purchases", listPurchases),
  r("POST", `/purchases/${ID}/approve`, approvePurchase),
  r("POST", `/purchases/${ID}/reject`, rejectPurchase),
  r("GET", "/topups", listTopups),
  r("POST", `/topups/${ID}/approve`, approveTopup),
  r("POST", `/topups/${ID}/reject`, rejectTopup),
  r("GET", "/tickets", listTickets),
  r("GET", `/tickets/${ID}`, getTicket),
  r("POST", `/tickets/${ID}/reply`, replyTicket),
  r("POST", `/tickets/${ID}/close`, closeTicket),
  r("GET", "/ratings", listRatings),
];

export { matchRoute };
