"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/app/actions";
import { requireOwnerAction } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeDigits } from "@/lib/format";
import { rejectReasonSchema } from "@/lib/reject-reason";
import { creditWallet, debitWallet, grantTopup, supportLimits } from "@/lib/support";

const formError = (fieldErrors: Record<string, string>): FormState => ({ fieldErrors, error: "فرم دارای خطاست." });

const replySchema = z.string().trim().min(1, "متن پاسخ را وارد کنید.").max(supportLimits.message, `پاسخ حداکثر ${supportLimits.message} نویسه است.`);

/** The owner answers a ticket; it moves to "answered" until the site writes again. */
export async function replyTicketAction(ticketId: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireOwnerAction();
  const parsed = replySchema.safeParse(formData.get("body") ?? "");
  if (!parsed.success) return formError({ body: parsed.error.issues[0].message });
  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId }, select: { status: true } });
  if (!ticket) return { error: "تیکت پیدا نشد." };
  if (ticket.status === "CLOSED" || ticket.status === "AWAITING_PAYMENT") return { error: "به این تیکت نمی‌شود پاسخ داد." };
  await db.$transaction([
    db.supportMessage.create({ data: { ticketId, fromOwner: true, body: parsed.data }, select: { id: true } }),
    db.supportTicket.update({ where: { id: ticketId }, data: { status: "ANSWERED" }, select: { id: true } }),
  ]);
  revalidatePath(`/support/${ticketId}`);
  revalidatePath("/support");
  return { saved: true };
}

export async function closeTicketAction(ticketId: string) {
  await requireOwnerAction();
  await db.supportTicket.updateMany({ where: { id: ticketId, status: { in: ["OPEN", "ANSWERED"] } }, data: { status: "CLOSED", closedAt: new Date() } });
  revalidatePath(`/support/${ticketId}`);
  revalidatePath("/support");
}

export async function approveTopupAction(topupId: string) {
  await requireOwnerAction();
  await grantTopup(topupId, "PENDING");
  revalidatePath("/topups");
}

export async function rejectTopupAction(topupId: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireOwnerAction();
  const parsed = rejectReasonSchema.safeParse(formData.get("reason") ?? "");
  if (!parsed.success) return formError({ reason: parsed.error.issues[0].message });
  const flipped = await db.walletTopup.updateMany({ where: { id: topupId, status: "PENDING" }, data: { status: "REJECTED", resolvedAt: new Date(), rejectReason: parsed.data } });
  if (flipped.count === 0) return { error: "این درخواست دیگر در انتظار نیست." };
  revalidatePath("/topups");
  return { saved: true };
}

const adjustSchema = z.object({
  direction: z.enum(["credit", "debit"]),
  amount: z.preprocess((v) => normalizeDigits(String(v ?? "")).replace(/[,٬\s]/g, ""), z.string().regex(/^\d{1,9}$/, "مبلغ را به‌صورت عدد صحیح وارد کنید.").transform(Number).pipe(z.number().min(1, "مبلغ باید بیشتر از صفر باشد."))),
  description: z.string().trim().min(1, "توضیح را وارد کنید.").max(191, "توضیح حداکثر ۱۹۱ نویسه است."),
});

/** A manual change of a site's wallet; it is always recorded with its reason. */
export async function adjustWalletAction(siteId: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireOwnerAction();
  const parsed = adjustSchema.safeParse({ direction: formData.get("direction"), amount: formData.get("amount"), description: formData.get("description") });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return formError(fieldErrors);
  }
  const { direction, amount, description } = parsed.data;
  const ok = await db.$transaction(async (tx) => {
    if (direction === "credit") {
      await creditWallet(tx, { siteId, amount, type: "ADMIN_CREDIT", description });
      return true;
    }
    return debitWallet(tx, { siteId, amount, type: "ADMIN_DEBIT", description });
  });
  if (!ok) return formError({ amount: "موجودی کیف پول برای این کسر کافی نیست." });
  revalidatePath(`/sites/${siteId}/wallet`);
  return { saved: true };
}
