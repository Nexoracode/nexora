import Link from "next/link";
import type { ReactNode } from "react";
import { Boxes, Globe, Inbox, LogOut, Package, SlidersHorizontal, Wallet } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { requireOwnerPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubmitButton } from "@/components/ui";

export const dynamic = "force-dynamic";

const links = [
  { href: "/", label: "سایت‌ها", icon: Globe },
  { href: "/features", label: "قابلیت‌ها و قیمت", icon: SlidersHorizontal },
  { href: "/packages", label: "بسته‌ها", icon: Package },
  { href: "/requests", label: "درخواست‌های خرید", icon: Inbox },
  { href: "/settings", label: "اطلاعات حساب", icon: Wallet },
];

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireOwnerPage();
  const pendingRequests = await db.purchaseRequest.count({ where: { status: "PENDING" } });
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-bold"><Boxes size={22} className="text-brand" aria-hidden /> نکسورا</div>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm hover:bg-white">
              <Icon size={16} aria-hidden />{label}
              {href === "/requests" && pendingRequests > 0 && <span className="rounded-full bg-amber-500 px-1.5 text-xs text-white">{pendingRequests.toLocaleString("fa-IR")}</span>}
            </Link>
          ))}
          <form action={logoutAction}>
            <SubmitButton variant="ghost"><LogOut size={16} aria-hidden />خروج</SubmitButton>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
