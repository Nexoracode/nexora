import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { decryptSecret } from "@/lib/secret";

export type OnlinePaymentConfig = { merchantId: string; sandbox: boolean };

/**
 * Online-payment settings, or null when no gateway is set up. The Zarinpal gateway saved in the panel
 * wins; the ZARINPAL_MERCHANT_ID environment variable is only the fallback for an install that never
 * opened the settings page. A gateway switched off in the panel turns online payment off.
 */
export async function getOnlinePaymentConfig(): Promise<OnlinePaymentConfig | null> {
  const saved = await db.gatewaySetting.findUnique({ where: { provider: "ZARINPAL" } });
  if (saved) {
    if (!saved.isActive) return null;
    try {
      return { merchantId: decryptSecret(saved.credentialEncrypted), sandbox: saved.isSandbox };
    } catch {
      return null;
    }
  }
  if (!env.ZARINPAL_MERCHANT_ID) return null;
  return { merchantId: env.ZARINPAL_MERCHANT_ID, sandbox: env.ZARINPAL_SANDBOX ? env.ZARINPAL_SANDBOX === "true" : env.NODE_ENV !== "production" };
}
