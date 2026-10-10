import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { normalizeDomain } from "@/lib/license-token";
import { getOnlinePaymentConfig } from "@/lib/payment-config";
import { tomanToRials } from "@/lib/pricing";
import { debitWallet, supportLimits, ticketFee } from "@/lib/support";
import { authenticateSite } from "@/lib/site-auth";
import { requestPayment } from "@/lib/zarinpal";

const auth = { licenseKey: z.string().min(8).max(100), domain: z.string().min(1).max(191) };
const text = (max: number, label: string) => z.string().trim().min(1, `${label} را وارد کنید.`).max(max, `${label} حداکثر ${max} نویسه است.`);

const bodySchema = z.discriminatedUnion("action", [
  z.object({ ...auth, action: z.literal("overview") }),
  z.object({ ...auth, action: z.literal("get"), ticketId: z.string().min(1).max(191) }),
  z.object({ ...auth, action: z.literal("create"), subject: text(supportLimits.subject, "موضوع"), body: text(supportLimits.message, "متن پیام"), payWith: z.enum(["wallet", "online"]), returnUrl: z.url().max(500).optional() }),
  z.object({ ...auth, action: z.literal("reply"), ticketId: z.string().min(1).max(191), body: text(supportLimits.message, "متن پیام") }),
  z.object({ ...auth, action: z.literal("close"), ticketId: z.string().min(1).max(191) }),
  z.object({
    ...auth,
    action: z.literal("topup"),
    amount: z.number().int().min(supportLimits.topupMin, "حداقل مبلغ شارژ ۱٬۰۰۰ تومان است.").max(supportLimits.topupMax, "مبلغ شارژ بیش از حد مجاز است."),
    method: z.enum(["online", "card"]),
    returnUrl: z.url().max(500).optional(),
    trackingCode: z.string().trim().max(supportLimits.trackingCode).optional(),
  }),
]);

const fail = (status: number, message: string) => NextResponse.json({ message }, { status });

/** One endpoint for everything a site's admin does with paid support: read it, open and answer tickets, charge the wallet. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "اطلاعات درخواست نامعتبر است.");
  const input = parsed.data;

  const authed = await authenticateSite(input.licenseKey, input.domain);
  if (!authed.ok) return fail(authed.status, "لایسنس نامعتبر است.");
  const siteId = authed.site.id;
  const siteDomain = authed.site.domain;
  const ownTicket = (ticketId: string) => db.supportTicket.findFirst({ where: { id: ticketId, siteId } });
  const sameDomain = (url: string) => normalizeDomain(new URL(url).host) === normalizeDomain(siteDomain);

  switch (input.action) {
    case "overview": {
      const [site, owner, tickets, entries, topups] = await Promise.all([
        db.site.findUniqueOrThrow({ where: { id: siteId }, select: { walletBalance: true, supportFreeUntil: true } }),
        db.ownerSettings.findUnique({ where: { id: "main" }, select: { ticketPrice: true, holderName: true, cardNumber: true, sheba: true, bankName: true, contactPhone: true, note: true } }),
        db.supportTicket.findMany({ where: { siteId }, orderBy: { updatedAt: "desc" }, take: 100, select: { id: true, subject: true, status: true, charge: true, fee: true, createdAt: true, updatedAt: true } }),
        db.walletEntry.findMany({ where: { siteId }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, amount: true, balanceAfter: true, type: true, description: true, createdAt: true } }),
        db.walletTopup.findMany({ where: { siteId, status: { in: ["PENDING", "REJECTED"] } }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, amount: true, status: true, rejectReason: true, createdAt: true } }),
      ]);
      const fee = ticketFee({ freeUntil: site.supportFreeUntil, ticketPrice: Number(owner?.ticketPrice ?? 0) });
      return NextResponse.json({
        fee,
        freeUntil: site.supportFreeUntil?.toISOString() ?? null,
        walletBalance: Number(site.walletBalance),
        onlineEnabled: getOnlinePaymentConfig() !== null,
        owner: owner ? { holderName: owner.holderName, cardNumber: owner.cardNumber, sheba: owner.sheba, bankName: owner.bankName, contactPhone: owner.contactPhone, note: owner.note } : null,
        tickets: tickets.map((t) => ({ id: t.id, subject: t.subject, status: t.status, charge: t.charge, fee: Number(t.fee), createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })),
        entries: entries.map((e) => ({ id: e.id, amount: Number(e.amount), balanceAfter: Number(e.balanceAfter), type: e.type, description: e.description, createdAt: e.createdAt.toISOString() })),
        topups: topups.map((t) => ({ id: t.id, amount: Number(t.amount), status: t.status, rejectReason: t.rejectReason, createdAt: t.createdAt.toISOString() })),
      });
    }

    case "get": {
      const ticket = await ownTicket(input.ticketId);
      if (!ticket) return fail(404, "تیکت پیدا نشد.");
      const messages = await db.supportMessage.findMany({ where: { ticketId: ticket.id }, orderBy: { createdAt: "asc" }, select: { id: true, fromOwner: true, body: true, createdAt: true } });
      return NextResponse.json({
        ticket: { id: ticket.id, subject: ticket.subject, status: ticket.status, charge: ticket.charge, fee: Number(ticket.fee), createdAt: ticket.createdAt.toISOString(), closedAt: ticket.closedAt?.toISOString() ?? null },
        messages: messages.map((m) => ({ id: m.id, fromOwner: m.fromOwner, body: m.body, createdAt: m.createdAt.toISOString() })),
      });
    }

    case "create": {
      const [site, owner] = await Promise.all([
        db.site.findUniqueOrThrow({ where: { id: siteId }, select: { supportFreeUntil: true } }),
        db.ownerSettings.findUnique({ where: { id: "main" }, select: { ticketPrice: true } }),
      ]);
      const fee = ticketFee({ freeUntil: site.supportFreeUntil, ticketPrice: Number(owner?.ticketPrice ?? 0) });
      const data = { siteId, subject: input.subject, fee, messages: { create: { body: input.body } } };

      if (fee === 0) {
        const ticket = await db.supportTicket.create({ data: { ...data, charge: "FREE", status: "OPEN" }, select: { id: true } });
        return NextResponse.json({ ticketId: ticket.id });
      }

      if (input.payWith === "wallet") {
        const ticketId = await db.$transaction(async (tx) => {
          const ticket = await tx.supportTicket.create({ data: { ...data, charge: "WALLET", status: "OPEN" }, select: { id: true } });
          const paid = await debitWallet(tx, { siteId, amount: fee, type: "TICKET_FEE", description: `هزینهٔ تیکت «${input.subject}»`, ticketId: ticket.id });
          if (!paid) throw new Error("INSUFFICIENT");
          return ticket.id;
        }).catch((error: unknown) => (error instanceof Error && error.message === "INSUFFICIENT" ? null : Promise.reject(error)));
        if (!ticketId) return fail(402, "موجودی کیف پول کافی نیست؛ ابتدا آن را شارژ کنید.");
        return NextResponse.json({ ticketId });
      }

      const payment = getOnlinePaymentConfig();
      if (!payment) return fail(409, "پرداخت آنلاین فعال نیست؛ از کیف پول استفاده کنید.");
      if (!input.returnUrl || !sameDomain(input.returnUrl)) return fail(400, "آدرس بازگشت نامعتبر است.");
      const ticket = await db.supportTicket.create({ data: { ...data, charge: "ONLINE", status: "AWAITING_PAYMENT", returnUrl: input.returnUrl }, select: { id: true } });
      try {
        const gateway = await requestPayment(payment, { amountRials: tomanToRials(fee), callbackUrl: `${env.APP_URL.replace(/\/$/, "")}/api/pay/support?k=ticket&r=${ticket.id}`, description: "هزینهٔ تیکت پشتیبانی" });
        await db.supportTicket.update({ where: { id: ticket.id }, data: { authority: gateway.authority }, select: { id: true } });
        return NextResponse.json({ ticketId: ticket.id, redirectUrl: gateway.redirectUrl });
      } catch (error) {
        console.error("Ticket payment could not be started:", error instanceof Error ? error.message : error);
        await db.supportTicket.delete({ where: { id: ticket.id }, select: { id: true } });
        return fail(502, "اتصال به درگاه پرداخت برقرار نشد؛ دوباره تلاش کنید.");
      }
    }

    case "reply": {
      const ticket = await ownTicket(input.ticketId);
      if (!ticket) return fail(404, "تیکت پیدا نشد.");
      if (ticket.status === "CLOSED") return fail(409, "این تیکت بسته شده است.");
      if (ticket.status === "AWAITING_PAYMENT") return fail(409, "پرداخت این تیکت هنوز کامل نشده است.");
      await db.$transaction([
        db.supportMessage.create({ data: { ticketId: ticket.id, body: input.body }, select: { id: true } }),
        db.supportTicket.update({ where: { id: ticket.id }, data: { status: "OPEN" }, select: { id: true } }),
      ]);
      return NextResponse.json({ ok: true });
    }

    case "close": {
      const ticket = await ownTicket(input.ticketId);
      if (!ticket) return fail(404, "تیکت پیدا نشد.");
      if (ticket.status === "AWAITING_PAYMENT") return fail(409, "پرداخت این تیکت هنوز کامل نشده است.");
      await db.supportTicket.update({ where: { id: ticket.id }, data: { status: "CLOSED", closedAt: new Date() }, select: { id: true } });
      return NextResponse.json({ ok: true });
    }

    case "topup": {
      if (input.method === "online") {
        const payment = getOnlinePaymentConfig();
        if (!payment) return fail(409, "پرداخت آنلاین فعال نیست؛ از کارت‌به‌کارت استفاده کنید.");
        if (!input.returnUrl || !sameDomain(input.returnUrl)) return fail(400, "آدرس بازگشت نامعتبر است.");
        const topup = await db.walletTopup.create({ data: { siteId, amount: input.amount, method: "ONLINE", status: "AWAITING_PAYMENT", returnUrl: input.returnUrl }, select: { id: true } });
        try {
          const gateway = await requestPayment(payment, { amountRials: tomanToRials(input.amount), callbackUrl: `${env.APP_URL.replace(/\/$/, "")}/api/pay/support?k=topup&r=${topup.id}`, description: "شارژ کیف پول" });
          await db.walletTopup.update({ where: { id: topup.id }, data: { authority: gateway.authority }, select: { id: true } });
          return NextResponse.json({ redirectUrl: gateway.redirectUrl });
        } catch (error) {
          console.error("Wallet top-up could not be started:", error instanceof Error ? error.message : error);
          await db.walletTopup.update({ where: { id: topup.id }, data: { status: "FAILED", resolvedAt: new Date() }, select: { id: true } });
          return fail(502, "اتصال به درگاه پرداخت برقرار نشد؛ دوباره تلاش کنید.");
        }
      }
      if (!input.trackingCode) return fail(400, "کد پیگیری پرداخت را وارد کنید.");
      await db.walletTopup.create({ data: { siteId, amount: input.amount, method: "CARD_TO_CARD", status: "PENDING", trackingCode: input.trackingCode }, select: { id: true } });
      return NextResponse.json({ ok: true });
    }
  }
}
