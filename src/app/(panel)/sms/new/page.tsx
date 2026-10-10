import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { SendForm } from "./send-form";

export default async function NewSmsPage() {
  const [settings, sites] = await Promise.all([
    db.smsSettings.findUnique({ where: { id: "main" }, select: { isActive: true, lineNumber: true } }),
    db.site.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, domain: true, client: { select: { name: true, phone: true } } } }),
  ]);
  const ready = Boolean(settings?.isActive && settings.lineNumber);

  return (
    <>
      <Link href="/sms" className="mb-3 inline-block text-sm text-brand">← بازگشت به سابقه</Link>
      <PageHeader title="پیامک جدید" />
      {!ready && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          پیامک فعال نیست. ابتدا <Link href="/settings" className="font-bold underline">در تنظیمات</Link> کلید فراز اس‌ام‌اس و شمارهٔ خط را وارد و فعال کنید.
        </p>
      )}
      <SendForm sites={sites.map((site) => ({ id: site.id, label: `${site.client.name} · ${site.domain}`, hasPhone: Boolean(site.client.phone) }))} disabled={!ready} />
    </>
  );
}
