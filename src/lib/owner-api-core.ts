import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { rejectReasonSchema } from "@/lib/reject-reason";
import { supportLimits } from "@/lib/support-limits";

/** Thrown by an operation to answer with a specific status; anything else becomes a 500. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Constant-time comparison of the presented bearer token with the configured one. */
export function tokenMatches(authorization: string | null, expected: string | undefined): boolean {
  if (!expected || !authorization?.startsWith("Bearer ")) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(authorization.slice(7)), digest(expected));
}

const money = z.coerce.number().int("مبلغ باید عدد صحیح باشد.").min(0).max(999_999_999_999);
const id = z.string().trim().min(1).max(191);
const featureKeys = z.array(z.string().trim().min(1).max(64)).max(200);

export const schemas = {
  siteUpdate: z
    .object({
      status: z.enum(["ACTIVE", "SUSPENDED"]),
      contractPrice: money,
      supportFreeMonths: z.coerce.number().int().min(0).max(supportLimits.freeMonthsMax),
      notes: z.string().trim().max(1000).nullable(),
      addFeatures: featureKeys,
      removeFeatures: featureKeys,
    })
    .partial()
    .strict(),
  walletAdjust: z
    .object({
      direction: z.enum(["credit", "debit"]),
      amount: z.coerce.number().int().min(1).max(999_999_999),
      description: z.string().trim().min(1).max(191),
    })
    .strict(),
  featureUpdate: z
    .object({
      title: z.string().trim().min(1).max(120),
      group: z.string().trim().min(1).max(80),
      description: z.string().trim().max(500).nullable(),
      price: money,
      isActive: z.boolean(),
    })
    .partial()
    .strict(),
  packageCreate: z.object({ name: z.string().trim().min(1).max(120), price: money, featureKeys }).strict(),
  packageUpdate: z.object({ name: z.string().trim().min(1).max(120), price: money, featureKeys }).partial().strict(),
  reject: z.object({ reason: rejectReasonSchema }).strict(),
  reply: z.object({ body: z.string().trim().min(1).max(supportLimits.message) }).strict(),
  listQuery: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).max(100_000).default(0),
    q: z.string().trim().max(100).optional(),
    status: z.string().trim().max(32).optional(),
  }),
};

export type Method = "GET" | "POST" | "PATCH";
export type Route<H> = { method: Method; pattern: RegExp; handler: H };

/** Finds the route for a request path (relative to /api/owner) and returns its captured params. */
export function matchRoute<H>(routes: Route<H>[], method: string, path: string) {
  const clean = "/" + path.replace(/^\/+|\/+$/g, "");
  let pathMatched = false;
  for (const route of routes) {
    const m = route.pattern.exec(clean);
    if (!m) continue;
    pathMatched = true;
    if (route.method === method) return { route, params: m.slice(1).map(decodeURIComponent) } as const;
  }
  return { route: null, pathMatched } as const;
}
