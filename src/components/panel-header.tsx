"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Plus, Search } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui";

export type GatewayMode = "off" | "sandbox" | "live";

const SEARCH_MAX = 100;

const titles: Array<[prefix: string, title: string]> = [
  ["/sites/new", "سایت جدید"],
  ["/sites", "ویرایش سایت"],
  ["/features", "قابلیت‌ها و قیمت"],
  ["/packages/new", "بستهٔ جدید"],
  ["/packages", "بسته‌ها"],
  ["/requests", "درخواست‌های خرید"],
  ["/settings", "اطلاعات حساب"],
];

const gateway: Record<GatewayMode, { label: string; className: string }> = {
  off: { label: "درگاه آنلاین: خاموش", className: "bg-slate-100 text-slate-600" },
  sandbox: { label: "درگاه آنلاین: آزمایشی", className: "bg-amber-100 text-amber-800" },
  live: { label: "درگاه آنلاین: زنده", className: "bg-emerald-100 text-emerald-800" },
};

const titleFor = (pathname: string) => titles.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? "سایت‌ها";

/** The desktop top bar: where you are, a search over sites, quick add, pending purchases, the payment mode and logout. */
export function PanelHeader({ pendingRequests, gatewayMode }: { pendingRequests: number; gatewayMode: GatewayMode }) {
  const pathname = usePathname();
  const mode = gateway[gatewayMode];

  return (
    <header className="sticky top-0 z-20 hidden h-14 items-center gap-4 border-b border-slate-200 bg-white px-8 lg:flex">
      <h2 className="m-0 min-w-0 flex-none text-[15px] font-bold">{titleFor(pathname)}</h2>

      {/* Sends the search to the sites list, which already filters by domain and client name. */}
      <form action="/" role="search" className="relative mx-auto w-full max-w-md">
        <Search size={16} aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input name="q" type="search" maxLength={SEARCH_MAX} aria-label="جستجوی سایت" placeholder="جستجوی سایت یا مشتری…" className="input !ps-10" />
      </form>

      <span className={`flex-none rounded-full px-3 py-1 text-xs font-medium ${mode.className}`}>{mode.label}</span>

      <Link href="/sites/new" className="btn btn-primary flex-none"><Plus size={16} aria-hidden />سایت جدید</Link>

      <Link
        href="/requests"
        aria-label={pendingRequests > 0 ? `درخواست‌های خرید؛ ${pendingRequests.toLocaleString("fa-IR")} مورد در انتظار` : "درخواست‌های خرید"}
        className="btn btn-ghost relative flex-none !px-2.5"
      >
        <Bell size={18} aria-hidden />
        {pendingRequests > 0 && <span className="absolute -end-0.5 -top-0.5 rounded-full bg-amber-500 px-1.5 text-[10px] font-medium leading-4 text-white">{pendingRequests.toLocaleString("fa-IR")}</span>}
      </Link>

      <form action={logoutAction} className="flex-none">
        <SubmitButton variant="ghost"><LogOut size={16} aria-hidden />خروج</SubmitButton>
      </form>
    </header>
  );
}
