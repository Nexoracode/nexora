import { createPrivateKey, sign } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const NOTIFY_TIMEOUT_MS = 3000;

/** Signature over `refresh:<ts>`, checked by the site with the public key. Short-lived by design (the site rejects old timestamps). */
function signRefresh(ts: number) {
  const key = createPrivateKey(env.LICENSE_PRIVATE_KEY.replace(/\\n/g, "\n"));
  return sign(null, Buffer.from(`refresh:${ts}`), key).toString("base64url");
}

/**
 * Tells sites to re-read their license right now. `siteId` limits it to one site; without it every
 * site that registered a callback address is told (feature prices, availability and packages are
 * shown on all of them). A site that cannot be reached is skipped: it still catches up by itself
 * on its next periodic check, so this is only about speed and never blocks a save.
 */
export async function notifySites(siteId?: string) {
  if (!env.LICENSE_PRIVATE_KEY) return;
  const sites = await db.site.findMany({
    where: { callbackUrl: { not: null }, ...(siteId ? { id: siteId } : {}) },
    select: { callbackUrl: true },
  });
  if (sites.length === 0) return;
  const ts = Date.now();
  const body = JSON.stringify({ ts, signature: signRefresh(ts) });
  await Promise.allSettled(
    sites.map((site) =>
      fetch(new URL("/api/license/refresh", site.callbackUrl!), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
        cache: "no-store",
      }),
    ),
  );
}
