import Link from "next/link";
import type { ReactNode } from "react";
import { Boxes, Globe, LogOut, Package, SlidersHorizontal } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { requireOwnerPage } from "@/lib/auth";
import { SubmitButton } from "@/components/ui";

export const dynamic = "force-dynamic";

const links = [
  { href: "/", label: "سایت‌ها", icon: Globe },
  { href: "/features", label: "قابلیت‌ها و قیمت", icon: SlidersHorizontal },
  { href: "/packages", label: "بسته‌ها", icon: Package },
];

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireOwnerPage();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-bold"><Boxes size={22} className="text-brand" aria-hidden /> نکسورا</div>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm hover:bg-white"><Icon size={16} aria-hidden />{label}</Link>
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
