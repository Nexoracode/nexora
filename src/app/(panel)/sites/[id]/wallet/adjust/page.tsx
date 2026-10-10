import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { AdjustForm } from "./adjust-form";

export default async function AdjustWalletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await db.site.findUnique({ where: { id }, select: { id: true, domain: true, walletBalance: true } });
  if (!site) notFound();
  return (
    <>
      <Link href={`/sites/${site.id}?tab=wallet`} className="mb-3 inline-block text-sm text-brand">← بازگشت به کیف پول</Link>
      <PageHeader title="تغییر دستی موجودی" description={`${site.domain} · موجودی: ${formatToman(Number(site.walletBalance))}`} />
      <AdjustForm siteId={site.id} />
    </>
  );
}
