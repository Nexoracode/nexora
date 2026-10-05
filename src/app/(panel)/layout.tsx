import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { requireOwnerPage } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireOwnerPage();
  const pendingRequests = await db.purchaseRequest.count({ where: { status: "PENDING" } });
  return (
    <div className="min-h-screen lg:ps-64">
      <Sidebar pendingRequests={pendingRequests} />
      <main className="mx-auto max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
