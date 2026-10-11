import { z } from "zod";

/**
 * The tools the panel's AI assistant can call. Each one maps onto an /api/owner operation (see
 * owner-ops.ts), so the panel's own rules apply. Read tools run at once; write tools never run until
 * the owner presses "approve" in the chat. Deliberately absent: license keys, site/package deletion,
 * payment, gateway and SMS settings.
 */
export type Request = { method: "GET" | "POST" | "PATCH"; path: string; query?: Record<string, string | number | undefined>; body?: unknown };

export type ToolDef = {
  name: string;
  /** Persian label shown on the approval card. */
  label: string;
  description: string;
  write: boolean;
  input: z.ZodObject;
  request: (args: never) => Request;
};

const id = (what: string) => z.string().min(1).describe(what);
const paging = { limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional() };
const enc = encodeURIComponent;

function tool<S extends z.ZodObject>(def: { name: string; label: string; description: string; write?: boolean; input: S; request: (args: z.infer<S>) => Request }): ToolDef {
  return { write: false, ...def, request: def.request as ToolDef["request"] };
}

export const tools: ToolDef[] = [
  tool({ name: "nexora_summary", label: "خلاصهٔ وضعیت", description: "Counts: sites, active sites, pending purchases, pending top-ups, open and answered tickets.", input: z.object({}), request: () => ({ method: "GET", path: "/summary" }) }),
  tool({
    name: "list_sites", label: "فهرست سایت‌ها", description: "Customer sites. `q` searches domain and client name.",
    input: z.object({ q: z.string().optional(), status: z.enum(["ACTIVE", "SUSPENDED"]).optional(), ...paging }),
    request: (a) => ({ method: "GET", path: "/sites", query: a }),
  }),
  tool({ name: "get_site", label: "جزئیات سایت", description: "One site with its features and recent events (never the license key).", input: z.object({ site_id: id("Site id") }), request: (a) => ({ method: "GET", path: `/sites/${enc(a.site_id)}` }) }),
  tool({ name: "site_wallet", label: "کیف پول سایت", description: "A site's wallet balance and history.", input: z.object({ site_id: id("Site id"), ...paging }), request: ({ site_id, ...q }) => ({ method: "GET", path: `/sites/${enc(site_id)}/wallet`, query: q }) }),
  tool({ name: "list_features", label: "فهرست قابلیت‌ها", description: "The feature catalog with prices and how many sites own each.", input: z.object({}), request: () => ({ method: "GET", path: "/features" }) }),
  tool({ name: "list_packages", label: "فهرست بسته‌ها", description: "Packages with price and feature keys.", input: z.object({}), request: () => ({ method: "GET", path: "/packages" }) }),
  tool({
    name: "list_purchases", label: "درخواست‌های خرید", description: "Purchase requests; defaults to PENDING.",
    input: z.object({ status: z.enum(["PENDING", "APPROVED", "REJECTED", "AWAITING_PAYMENT", "FAILED"]).optional(), ...paging }),
    request: (a) => ({ method: "GET", path: "/purchases", query: { status: "PENDING", ...a } }),
  }),
  tool({
    name: "list_topups", label: "درخواست‌های شارژ", description: "Wallet top-up requests; defaults to PENDING.",
    input: z.object({ status: z.enum(["AWAITING_PAYMENT", "PENDING", "APPROVED", "REJECTED", "FAILED"]).optional(), ...paging }),
    request: (a) => ({ method: "GET", path: "/topups", query: { status: "PENDING", ...a } }),
  }),
  tool({
    name: "list_tickets", label: "فهرست تیکت‌ها", description: "Support tickets, most recently updated first.",
    input: z.object({ status: z.enum(["OPEN", "ANSWERED", "CLOSED", "AWAITING_PAYMENT"]).optional(), q: z.string().optional(), ...paging }),
    request: (a) => ({ method: "GET", path: "/tickets", query: a }),
  }),
  tool({ name: "get_ticket", label: "خواندن تیکت", description: "A ticket with its whole conversation.", input: z.object({ ticket_id: id("Ticket id") }), request: (a) => ({ method: "GET", path: `/tickets/${enc(a.ticket_id)}` }) }),
  tool({ name: "list_ratings", label: "امتیازها", description: "Star ratings customers gave.", input: z.object({ ...paging }), request: (a) => ({ method: "GET", path: "/ratings", query: a }) }),

  // ---- writes: need the owner's approval in the UI ----
  tool({
    name: "update_site", label: "ویرایش سایت", write: true,
    description: "Change a site: status, contract price (toman), free-support months, notes, features to add/remove. Suspending a site cuts its optional features.",
    input: z.object({
      site_id: id("Site id"),
      status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
      contract_price: z.number().int().min(0).optional(),
      support_free_months: z.number().int().min(0).optional(),
      notes: z.string().nullable().optional(),
      add_features: z.array(z.string()).optional(),
      remove_features: z.array(z.string()).optional(),
    }),
    request: (a) => ({ method: "PATCH", path: `/sites/${enc(a.site_id)}`, body: { status: a.status, contractPrice: a.contract_price, supportFreeMonths: a.support_free_months, notes: a.notes, addFeatures: a.add_features, removeFeatures: a.remove_features } }),
  }),
  tool({
    name: "adjust_wallet", label: "تعدیل کیف پول", write: true,
    description: "Credit or debit a site's wallet by a whole amount in toman, with a reason.",
    input: z.object({ site_id: id("Site id"), direction: z.enum(["credit", "debit"]), amount: z.number().int().min(1), description: z.string().min(1).max(191) }),
    request: ({ site_id, ...body }) => ({ method: "POST", path: `/sites/${enc(site_id)}/wallet`, body }),
  }),
  tool({
    name: "update_feature", label: "ویرایش قابلیت", write: true,
    description: "Edit a catalog feature: title, group, description, price (toman), isActive. Sites that own it keep it.",
    input: z.object({ key: id("Feature key"), title: z.string().optional(), group: z.string().optional(), description: z.string().nullable().optional(), price: z.number().int().min(0).optional(), is_active: z.boolean().optional() }),
    request: ({ key, is_active, ...rest }) => ({ method: "PATCH", path: `/features/${enc(key)}`, body: { ...rest, isActive: is_active } }),
  }),
  tool({
    name: "create_package", label: "ساخت بسته", write: true, description: "Create a package: name, price (toman) and feature keys.",
    input: z.object({ name: z.string().min(1), price: z.number().int().min(0), feature_keys: z.array(z.string()) }),
    request: (a) => ({ method: "POST", path: "/packages", body: { name: a.name, price: a.price, featureKeys: a.feature_keys } }),
  }),
  tool({
    name: "update_package", label: "ویرایش بسته", write: true, description: "Edit a package's name, price or full feature list (feature_keys replaces the list).",
    input: z.object({ package_id: id("Package id"), name: z.string().optional(), price: z.number().int().min(0).optional(), feature_keys: z.array(z.string()).optional() }),
    request: (a) => ({ method: "PATCH", path: `/packages/${enc(a.package_id)}`, body: { name: a.name, price: a.price, featureKeys: a.feature_keys } }),
  }),
  tool({ name: "approve_purchase", label: "تأیید خرید", write: true, description: "Approve a pending purchase request; the feature/package is added to the site.", input: z.object({ purchase_id: id("Purchase request id") }), request: (a) => ({ method: "POST", path: `/purchases/${enc(a.purchase_id)}/approve` }) }),
  tool({ name: "reject_purchase", label: "رد خرید", write: true, description: "Reject a pending purchase request with a reason the buyer reads (3-500 chars).", input: z.object({ purchase_id: id("Purchase request id"), reason: z.string().min(3).max(500) }), request: ({ purchase_id, reason }) => ({ method: "POST", path: `/purchases/${enc(purchase_id)}/reject`, body: { reason } }) }),
  tool({ name: "approve_topup", label: "تأیید شارژ", write: true, description: "Approve a pending wallet top-up; the amount is credited to the site.", input: z.object({ topup_id: id("Top-up id") }), request: (a) => ({ method: "POST", path: `/topups/${enc(a.topup_id)}/approve` }) }),
  tool({ name: "reject_topup", label: "رد شارژ", write: true, description: "Reject a pending wallet top-up with a reason (3-500 chars).", input: z.object({ topup_id: id("Top-up id"), reason: z.string().min(3).max(500) }), request: ({ topup_id, reason }) => ({ method: "POST", path: `/topups/${enc(topup_id)}/reject`, body: { reason } }) }),
  tool({ name: "reply_ticket", label: "پاسخ به تیکت", write: true, description: "Reply to a support ticket as the owner; the customer's site shows this message.", input: z.object({ ticket_id: id("Ticket id"), body: z.string().min(1).max(5000) }), request: ({ ticket_id, body }) => ({ method: "POST", path: `/tickets/${enc(ticket_id)}/reply`, body: { body } }) }),
  tool({ name: "close_ticket", label: "بستن تیکت", write: true, description: "Close an open or answered ticket.", input: z.object({ ticket_id: id("Ticket id") }), request: (a) => ({ method: "POST", path: `/tickets/${enc(a.ticket_id)}/close` }) }),
];

export const toolByName = new Map(tools.map((t) => [t.name, t]));

/** Tool definitions in the shape the Messages API expects. */
export function apiTools() {
  return tools.map((t) => {
    const { $schema: _ignored, ...schema } = z.toJSONSchema(t.input) as Record<string, unknown>;
    return { name: t.name, description: t.description, input_schema: schema as { type: "object"; properties?: Record<string, unknown> } };
  });
}

/** Drops undefined entries so optional arguments the model left out never reach the API. */
export function compact<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}
