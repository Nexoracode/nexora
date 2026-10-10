import type { ReactNode } from "react";
import { PanelHeader } from "@/components/panel-header";
import { Sidebar } from "@/components/sidebar";
import { requireOwnerPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOnlinePaymentConfig } from "@/lib/payment-config";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireOwnerPage();
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const [pendingRequests, openTickets, pendingTopups, silentSites] = await Promise.all([
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
    // Tickets waiting for the owner, and card-to-card top-ups waiting to be approved.
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.walletTopup.count({ where: { status: "PENDING" } }),
    // Active sites that have not checked in for two days, or never have.
    db.site.count({ where: { status: "ACTIVE", OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: new Date(now - 2 * DAY) } }] } }),
  ]);
  const payment = await getOnlinePaymentConfig();
  const gatewayMode = payment === null ? "off" : payment.sandbox ? "sandbox" : "live";
  return (
    <div className="min-h-screen lg:ps-64">
      <Sidebar pendingRequests={pendingRequests} openTickets={openTickets} pendingTopups={pendingTopups} />
      <PanelHeader pendingRequests={pendingRequests} gatewayMode={gatewayMode} silentSites={silentSites} />
      <main className="mx-auto max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
