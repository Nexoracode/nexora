import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { grantPurchaseIn } from "@/lib/purchases";
import { quotePurchase } from "@/lib/purchase-quote";
import { authenticateSite } from "@/lib/site-auth";
import { debitWallet } from "@/lib/support";

const bodySchema = z
  .object({
    licenseKey: z.string().min(8).max(100),
    domain: z.string().min(1).max(191),
    featureKey: z.string().min(1).max(64).optional(),
    packageId: z.string().min(1).max(191).optional(),
  })
  .refine((body) => Boolean(body.featureKey) !== Boolean(body.packageId), { message: "exactly one of featureKey / packageId" });

const fail = (status: number, message: string) => NextResponse.json({ message }, { status });

class InsufficientBalance extends Error {}

/** Buys a feature or package from the site's wallet: the money is taken and the purchase approved in one transaction. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "اطلاعات درخواست نامعتبر است.");
  const { licenseKey, domain, featureKey, packageId } = parsed.data;

  const auth = await authenticateSite(licenseKey, domain);
  if (!auth.ok) return fail(auth.status, "لایسنس نامعتبر است.");
  const { site } = auth;

  const quote = await quotePurchase({ ownedKeys: new Set(site.features.map((f) => f.featureKey)), featureKey, packageId });
  if (!quote.ok) return fail(quote.status, quote.message);

  try {
    await db.$transaction(async (tx) => {
      const purchase = await tx.purchaseRequest.create({
        data: { siteId: site.id, featureKey, packageId, method: "WALLET", status: "AWAITING_PAYMENT", trackingCode: "wallet", amount: quote.amountToman },
        select: { id: true },
      });
      if (!(await debitWallet(tx, { siteId: site.id, amount: quote.amountToman, type: "PURCHASE", description: `خرید «${quote.title}»` }))) throw new InsufficientBalance();
      if (!(await grantPurchaseIn(tx, purchase.id, "AWAITING_PAYMENT", { wallet: true }))) throw new Error("The wallet purchase could not be approved.");
    });
  } catch (error) {
    if (error instanceof InsufficientBalance) return fail(402, "موجودی کیف پول کافی نیست؛ ابتدا آن را شارژ کنید.");
    throw error;
  }
  return NextResponse.json({ ok: true, amount: quote.amountToman });
}
