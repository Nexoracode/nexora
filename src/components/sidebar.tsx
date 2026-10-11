"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Boxes, Globe, Inbox, LifeBuoy, LogOut, MessageSquare, Menu, Package, SlidersHorizontal, Star, Wallet, X } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui";

const groups = [
  {
    title: "فروش",
    links: [
      { href: "/", label: "سایت‌ها", icon: Globe },
      { href: "/requests", label: "درخواست‌های خرید", icon: Inbox },
      { href: "/ratings", label: "امتیازها", icon: Star },
    ],
  },
  {
    title: "پشتیبانی",
    links: [
      { href: "/support", label: "تیکت‌ها", icon: LifeBuoy },
      { href: "/topups", label: "شارژ کیف پول", icon: Wallet },
      { href: "/sms", label: "ارسال پیامک", icon: MessageSquare },
    ],
  },
  {
    title: "کاتالوگ",
    links: [
      { href: "/features", label: "قابلیت‌ها و قیمت", icon: SlidersHorizontal },
      { href: "/packages", label: "بسته‌ها", icon: Package },
    ],
  },
  {
    title: "تنظیمات",
    links: [
      { href: "/settings", label: "تنظیمات", icon: Wallet },
    ],
  },
] as const;

const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/sites") : pathname.startsWith(href));

/** Fixed menu on the start (right) edge on desktop; a slide-over drawer behind a top bar on mobile. */
export function Sidebar({ pendingRequests, openTickets, pendingTopups }: { pendingRequests: number; openTickets: number; pendingTopups: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2 font-bold"><Boxes size={20} className="text-brand" aria-hidden />نکسورا</span>
        <button type="button" aria-label={open ? "بستن منو" : "باز کردن منو"} aria-expanded={open} className="btn btn-ghost !px-2.5" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        </button>
      </header>

      {open && <button type="button" aria-label="بستن منو" className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 end-auto start-0 z-40 flex w-64 flex-col border-e border-slate-200 bg-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "max-lg:translate-x-full"}`}
        aria-label="منوی اصلی"
      >
        <div className="flex items-center gap-2 px-5 py-5 text-lg font-bold"><Boxes size={22} className="text-brand" aria-hidden />نکسورا</div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-3">
          {groups.map((group) => (
            <div key={group.title} role="group" aria-label={group.title} className="space-y-1">
              <p className="m-0 px-3 pb-1 text-xs font-medium text-slate-400">{group.title}</p>
              {group.links.map(({ href, label, icon: Icon }) => {
                const active = isActive(href, pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-indigo-50 font-bold text-brand" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Icon size={18} aria-hidden />
                    <span className="flex-1">{label}</span>
                    {(() => {
                      const badge = href === "/requests" ? pendingRequests : href === "/support" ? openTickets : href === "/topups" ? pendingTopups : 0;
                      return badge > 0 && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">{badge.toLocaleString("fa-IR")}</span>;
                    })()}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <form action={logoutAction} className="border-t border-slate-100 p-3">
          <SubmitButton variant="ghost"><LogOut size={16} aria-hidden />خروج</SubmitButton>
        </form>
      </aside>
    </>
  );
}
