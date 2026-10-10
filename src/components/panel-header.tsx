import Link from "next/link";
import { Bell, WifiOff } from "lucide-react";
import { QuickAddSite } from "@/components/quick-add-site";

export type GatewayMode = "off" | "sandbox" | "live";

const gateway: Record<GatewayMode, { label: string; className: string }> = {
  off: { label: "درگاه آنلاین: خاموش", className: "bg-slate-100 text-slate-600" },
  sandbox: { label: "درگاه آنلاین: آزمایشی", className: "bg-amber-100 text-amber-800" },
  live: { label: "درگاه آنلاین: زنده", className: "bg-emerald-100 text-emerald-800" },
};

const chip = "inline-flex flex-none items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium";

/**
 * The desktop top bar. It carries only what no page shows by itself: the payment mode, sites that stopped checking in, pending purchases, and a quick add.
 */
export function PanelHeader({ pendingRequests, gatewayMode, silentSites }: { pendingRequests: number; gatewayMode: GatewayMode; silentSites: number }) {
  const mode = gateway[gatewayMode];
  const count = (value: number) => value.toLocaleString("fa-IR");

  return (
    <header className="sticky top-0 z-20 hidden h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 lg:flex">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className={`${chip} ${mode.className}`}>{mode.label}</span>
        {silentSites > 0 && (
          <Link href="/" className={`${chip} bg-slate-100 text-slate-700`}><WifiOff size={14} aria-hidden />{count(silentSites)} سایت بدون اتصال اخیر</Link>
        )}
      </div>

      <div className="flex flex-none items-center gap-2">
        <Link
          href="/requests"
          aria-label={pendingRequests > 0 ? `درخواست‌های خرید؛ ${count(pendingRequests)} مورد در انتظار` : "درخواست‌های خرید"}
          className="btn btn-ghost relative !px-2.5"
        >
          <Bell size={18} aria-hidden />
          {pendingRequests > 0 && <span className="absolute -end-0.5 -top-0.5 rounded-full bg-amber-500 px-1.5 text-[10px] font-medium leading-4 text-white">{count(pendingRequests)}</span>}
        </Link>
        <QuickAddSite />
      </div>
    </header>
  );
}
