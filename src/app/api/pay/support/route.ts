import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOnlinePaymentConfig } from "@/lib/payment-config";
import { tomanToRials } from "@/lib/pricing";
import { grantTopup, openPaidTicket } from "@/lib/support";
import { verifyPayment } from "@/lib/zarinpal";

function backTo(returnUrl: string, kind: string, outcome: "success" | "failed") {
  const url = new URL(returnUrl);
  url.searchParams.set("payment", outcome);
  url.searchParams.set("for", kind);
  return NextResponse.redirect(url);
}

/**
 * The gateway sends the buyer here after paying for a support ticket or a wallet top-up. As with
 * purchases, the result is never taken from the query string: the payment is verified with the
 * gateway for the amount stored here, and a repeated callback does nothing a second time.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const kind = params.get("k") === "topup" ? "topup" : "ticket";
  const id = params.get("r") ?? "";
  const authority = params.get("Authority") ?? "";

  const record = kind === "topup"
    ? await db.walletTopup.findUnique({ where: { id }, select: { status: true, authority: true, amount: true, returnUrl: true } })
    : await db.supportTicket.findUnique({ where: { id }, select: { status: true, authority: true, fee: true, returnUrl: true } });
  if (!record?.returnUrl) return NextResponse.json({ message: "درخواست پیدا نشد." }, { status: 404 });
  const amount = Number("amount" in record ? record.amount : record.fee);
  const done = record.status === "APPROVED" || record.status === "OPEN" || record.status === "ANSWERED" || record.status === "CLOSED";
  if (done) return backTo(record.returnUrl, kind, "success");
  if (record.status !== "AWAITING_PAYMENT") return backTo(record.returnUrl, kind, "failed");

  const fail = async () => {
    if (kind === "topup") await db.walletTopup.updateMany({ where: { id, status: "AWAITING_PAYMENT" }, data: { status: "FAILED", resolvedAt: new Date() } });
    else await db.supportTicket.deleteMany({ where: { id, status: "AWAITING_PAYMENT" } });
    return backTo(record.returnUrl!, kind, "failed");
  };
  if (params.get("Status") !== "OK" || !authority || authority !== record.authority) return fail();

  const payment = await getOnlinePaymentConfig();
  if (!payment) return fail();
  try {
    const { refId } = await verifyPayment(payment, { amountRials: tomanToRials(amount), authority });
    if (kind === "topup") await grantTopup(id, "AWAITING_PAYMENT", { refId });
    else await openPaidTicket(id, refId);
    return backTo(record.returnUrl, kind, "success");
  } catch {
    return fail();
  }
}
