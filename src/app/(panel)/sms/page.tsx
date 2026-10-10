import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { readPage } from "@/lib/paging";
import { SendForm } from "./send-form";

type SearchParams = Promise<{ page?: string; size?: string }>;

export default async function SmsPage({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageParam, size: sizeParam } = await searchParams;
  const total = await db.smsLog.count();
  const { page, pageCount, skip, take, size } = readPage(pageParam, total, sizeParam);
  const [settings, sites, logs] = await Promise.all([
    db.smsSettings.findUnique({ where: { id: "main" }, select: { isActive: true, lineNumber: true } }),
    db.site.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, domain: true, client: { select: { name: true, phone: true } } } }),
    db.smsLog.findMany({ orderBy: { createdAt: "desc" }, skip, take }),
  ]);
  const ready = Boolean(settings?.isActive && settings.lineNumber);

  return (
    <>
      <PageHeader title="ارسال پیامک" />
      {!ready && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          پیامک فعال نیست. ابتدا <Link href="/settings" className="font-bold underline">در تنظیمات</Link> کلید فراز اس‌ام‌اس و شمارهٔ خط را وارد و فعال کنید.
        </p>
      )}
      <SendForm sites={sites.map((site) => ({ id: site.id, label: `${site.client.name} · ${site.domain}`, hasPhone: Boolean(site.client.phone) }))} disabled={!ready} />

      <h2 className="mb-3 mt-8 text-base font-bold">سابقه</h2>
      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">گیرنده</th>
              <th className="px-4 py-3 text-start font-medium">متن</th>
              <th className="px-4 py-3 text-start font-medium">وضعیت</th>
              <th className="px-4 py-3 text-start font-medium">زمان</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">هنوز پیامکی ارسال نشده است.</td></tr>}
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3"><code dir="ltr">{log.phone}</code></td>
                <td className="px-4 py-3 text-slate-600">{log.text}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${log.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{log.ok ? "ارسال شد" : "ناموفق"}</span>
                  {log.error && <p className="m-0 mt-1.5 text-xs text-red-700">{log.error}</p>}
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} basePath="/sms" params={{}} size={size} total={total} />
    </>
  );
}
