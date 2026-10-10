import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { formatDateTime, formatToman } from "@/lib/format";
import { entryTypeLabel } from "@/lib/support-labels";
import { AdjustForm } from "./adjust-form";

export default async function SiteWalletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await db.site.findUnique({
    where: { id },
    select: { id: true, domain: true, walletBalance: true, walletEntries: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  if (!site) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/sites/${site.id}`} className="mb-3 inline-block text-sm text-brand">← بازگشت به سایت</Link>
        <PageHeader title="کیف پول" description={`${site.domain} · موجودی: ${formatToman(Number(site.walletBalance))}`} />
      </div>

      <AdjustForm siteId={site.id} />

      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">نوع</th>
              <th className="px-4 py-3 text-start font-medium">مبلغ</th>
              <th className="px-4 py-3 text-start font-medium">موجودی پس از آن</th>
              <th className="px-4 py-3 text-start font-medium">توضیح</th>
              <th className="px-4 py-3 text-start font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {site.walletEntries.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">تراکنشی ثبت نشده است.</td></tr>}
            {site.walletEntries.map((entry) => (
              <tr key={entry.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{entryTypeLabel[entry.type]}</td>
                <td className={`px-4 py-3 font-medium ${Number(entry.amount) < 0 ? "text-red-700" : "text-green-700"}`}><span dir="ltr" className="inline-block">{Number(entry.amount).toLocaleString("fa-IR")}</span></td>
                <td className="px-4 py-3">{formatToman(Number(entry.balanceAfter))}</td>
                <td className="px-4 py-3 text-slate-600">{entry.description}</td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(entry.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
