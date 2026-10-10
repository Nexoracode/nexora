import { db } from "@/lib/db";
import { formatDateTime, formatToman } from "@/lib/format";
import { entryTypeLabel } from "@/lib/support-labels";
import Link from "next/link";

/** The site's wallet: balance and history; a manual change has its own page; shown as a tab on the site page. */
export async function WalletPanel({ siteId }: { siteId: string }) {
  const site = await db.site.findUniqueOrThrow({
    where: { id: siteId },
    select: { walletBalance: true, walletEntries: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  return (
    <div className="space-y-5">
      <section className="card max-w-4xl">
        <p className="m-0 text-sm text-slate-500">موجودی</p>
        <p className="m-0 mt-1 text-xl font-bold">{formatToman(Number(site.walletBalance))}</p>
        <Link href={`/sites/${siteId}/wallet/adjust`} className="btn btn-ghost mt-3">تغییر دستی موجودی</Link>
      </section>

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
