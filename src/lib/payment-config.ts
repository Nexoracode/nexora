import { env } from "@/lib/env";

/** Online-payment settings, or null when no merchant id is configured. Sandbox in every environment but production. */
export function getOnlinePaymentConfig() {
  if (!env.ZARINPAL_MERCHANT_ID) return null;
  return { merchantId: env.ZARINPAL_MERCHANT_ID, sandbox: env.ZARINPAL_SANDBOX ? env.ZARINPAL_SANDBOX === "true" : env.NODE_ENV !== "production" };
}
