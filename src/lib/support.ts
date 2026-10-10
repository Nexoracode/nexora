import { db } from "@/lib/db";

/** Bounds shared by the site's form, the license API and the panel's forms. */
export const supportLimits = { subject: 191, message: 5000, trackingCode: 60, freeMonthsMax: 60, topupMin: 1_000, topupMax: 100_000_000 } as const;

/** `date` moved forward by whole calendar months (UTC); a day that does not exist in the target month lands on its last day. */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return target;
}

/** What a new ticket costs this site right now: nothing while its free support runs, else the owner's ticket price. */
export function ticketFee(input: { freeUntil: Date | null; ticketPrice: number; now?: Date }): number {
  if (input.freeUntil && input.freeUntil.getTime() >= (input.now ?? new Date()).getTime()) return 0;
  return input.ticketPrice;
}

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/** Adds `amount` (toman, positive) to a site's wallet and records it. */
export async function creditWallet(tx: Tx, input: { siteId: string; amount: number; type: "TOPUP" | "ADMIN_CREDIT"; description: string; topupId?: string }) {
  const site = await tx.site.update({ where: { id: input.siteId }, data: { walletBalance: { increment: input.amount } }, select: { walletBalance: true } });
  await tx.walletEntry.create({ data: { siteId: input.siteId, amount: input.amount, balanceAfter: site.walletBalance, type: input.type, description: input.description.slice(0, 191), topupId: input.topupId }, select: { id: true } });
}

/** Takes `amount` from a site's wallet only if the balance covers it; false when it does not. */
export async function debitWallet(tx: Tx, input: { siteId: string; amount: number; type: "TICKET_FEE" | "ADMIN_DEBIT"; description: string; ticketId?: string }) {
  const taken = await tx.site.updateMany({ where: { id: input.siteId, walletBalance: { gte: input.amount } }, data: { walletBalance: { decrement: input.amount } } });
  if (taken.count === 0) return false;
  const site = await tx.site.findUniqueOrThrow({ where: { id: input.siteId }, select: { walletBalance: true } });
  await tx.walletEntry.create({ data: { siteId: input.siteId, amount: -input.amount, balanceAfter: site.walletBalance, type: input.type, description: input.description.slice(0, 191), ticketId: input.ticketId }, select: { id: true } });
  return true;
}

/**
 * Approves a wallet top-up and credits the site. Safe to call twice (a gateway callback can arrive
 * more than once): only the call that flips the status credits the wallet.
 */
export async function grantTopup(topupId: string, from: "PENDING" | "AWAITING_PAYMENT", extra: { refId?: string } = {}) {
  const topup = await db.walletTopup.findUnique({ where: { id: topupId }, select: { siteId: true, amount: true } });
  if (!topup) return false;
  return db.$transaction(async (tx) => {
    const flipped = await tx.walletTopup.updateMany({ where: { id: topupId, status: from }, data: { status: "APPROVED", resolvedAt: new Date(), ...(extra.refId ? { refId: extra.refId } : {}) } });
    if (flipped.count === 0) return false;
    await creditWallet(tx, { siteId: topup.siteId, amount: Number(topup.amount), type: "TOPUP", description: extra.refId ? "شارژ با پرداخت آنلاین" : "شارژ کارت‌به‌کارت", topupId });
    return true;
  });
}

/** Opens a ticket whose gateway payment was verified. Safe to call twice. */
export async function openPaidTicket(ticketId: string, refId: string) {
  const flipped = await db.supportTicket.updateMany({ where: { id: ticketId, status: "AWAITING_PAYMENT" }, data: { status: "OPEN", refId } });
  return flipped.count > 0;
}
