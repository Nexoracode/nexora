"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

/** "New site" from anywhere, except on the pages that already carry that button themselves. */
export function QuickAddSite() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/sites")) return null;
  return <Link href="/sites/new" className="btn btn-primary"><Plus size={16} aria-hidden />سایت جدید</Link>;
}
