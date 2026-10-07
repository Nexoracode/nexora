import type { ReactNode } from "react";
import { PanelHeader } from "@/components/panel-header";
import { Sidebar } from "@/components/sidebar";
import { requireOwnerPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOnlinePaymentConfig } from "@/lib/payment-config";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireOwnerPage();
  const pendingRequests = await db.purchaseRequest.count({ where: { status: "PENDING" } });
  const payment = getOnlinePaymentConfig();
  const gatewayMode = payment === null ? "off" : payment.sandbox ? "sandbox" : "live";
  return (
    <div className="min-h-screen lg:ps-64">
      <Sidebar pendingRequests={pendingRequests} />
      <PanelHeader pendingRequests={pendingRequests} gatewayMode={gatewayMode} />
      <main className="mx-auto max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
