import { after, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifySites } from "@/lib/notify-sites";
import { getOnlinePaymentConfig } from "@/lib/payment-config";
import { grantPurchase } from "@/lib/purchases";
import { tomanToRials } from "@/lib/pricing";
import { verifyPayment } from "@/lib/zarinpal";

function backTo(returnUrl: string, outcome: "success" | "failed") {
  const url = new URL(returnUrl);
  url.searchParams.set("payment", outcome);
  return NextResponse.redirect(url);
}

/**
 * The gateway sends the buyer here after paying. The result is never taken from the query string:
 * the payment is verified with the gateway for the amount stored on the request, and only then
 * is the purchase approved. A repeated callback does nothing a second time.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestId = params.get("r") ?? "";
  const authority = params.get("Authority") ?? "";

  const purchase = await db.purchaseRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, authority: true, amount: true, returnUrl: true, site: { select: { id: true } } },
  });
  if (!purchase?.returnUrl) return NextResponse.json({ message: "درخواست پیدا نشد." }, { status: 404 });
  if (purchase.status === "APPROVED") return backTo(purchase.returnUrl, "success");
  if (purchase.status !== "AWAITING_PAYMENT") return backTo(purchase.returnUrl, "failed");

  const fail = async () => {
    await db.purchaseRequest.updateMany({ where: { id: purchase.id, status: "AWAITING_PAYMENT" }, data: { status: "FAILED", resolvedAt: new Date() } });
    return backTo(purchase.returnUrl!, "failed");
  };
  if (params.get("Status") !== "OK" || !authority || authority !== purchase.authority || purchase.amount === null) return fail();

  const payment = await getOnlinePaymentConfig();
  if (!payment) return fail();
  try {
    const { refId } = await verifyPayment(payment, { amountRials: tomanToRials(Number(purchase.amount)), authority });
    await grantPurchase(purchase.id, "AWAITING_PAYMENT", { refId });
    after(() => notifySites(purchase.site.id));
    return backTo(purchase.returnUrl, "success");
  } catch {
    return fail();
  }
}
