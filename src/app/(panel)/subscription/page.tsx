import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { DEFAULT_SUBSCRIPTION_SETTINGS, periodLabels, periodPrice, type SubscriptionPeriod } from "@/lib/subscription";
import { SubscriptionForm } from "./subscription-form";

const periods: SubscriptionPeriod[] = ["MONTHLY", "QUARTERLY", "YEARLY"];

export default async function SubscriptionSettingsPage() {
  const [stored, packages] = await Promise.all([
    db.subscriptionSettings.findUnique({ where: { id: "main" } }),
    db.package.findMany({ where: { monthlyPrice: { not: null } }, orderBy: { monthlyPrice: "asc" }, select: { id: true, name: true, monthlyPrice: true } }),
  ]);
  const settings = {
    quarterlyDiscountPercent: stored?.quarterlyDiscountPercent ?? DEFAULT_SUBSCRIPTION_SETTINGS.quarterlyDiscountPercent,
    yearlyDiscountPercent: stored?.yearlyDiscountPercent ?? DEFAULT_SUBSCRIPTION_SETTINGS.yearlyDiscountPercent,
    graceDays: stored?.graceDays ?? DEFAULT_SUBSCRIPTION_SETTINGS.graceDays,
    retentionDays: stored?.retentionDays ?? DEFAULT_SUBSCRIPTION_SETTINGS.retentionDays,
    lockAfterGrace: stored?.lockAfterGrace ?? DEFAULT_SUBSCRIPTION_SETTINGS.lockAfterGrace,
    reminderDays: stored?.reminderDays ?? DEFAULT_SUBSCRIPTION_SETTINGS.reminderDays,
  };

  return (
    <>
      <PageHeader title="تنظیمات اشتراک" description="تخفیف دوره‌های بلندتر، مهلت پس از پایان، نگه‌داری داده و اینکه بعد از مهلت چه چیزی قفل شود." />
      <SubscriptionForm defaults={settings} />

      <section className="card mt-5 !p-0">
        <h2 className="m-0 border-b border-slate-100 px-5 py-4 text-base font-bold">قیمت پلن‌ها در هر دوره</h2>
        <p className="m-0 px-5 pt-3 text-sm text-slate-500">قیمت ماهانه‌ی هر پلن را در صفحه‌ی ویرایش بسته تعیین می‌کنید؛ قیمت‌های زیر با تخفیف‌های بالا خودکار حساب می‌شود.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="px-5 py-3 text-start font-medium">پلن</th>
                {periods.map((period) => <th key={period} className="px-5 py-3 text-start font-medium">{periodLabels[period]}</th>)}
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">هنوز برای هیچ بسته‌ای قیمت ماهانه ثبت نشده است.</td></tr>}
              {packages.map((pkg) => (
                <tr key={pkg.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-bold">{pkg.name}</td>
                  {periods.map((period) => <td key={period} className="px-5 py-3">{formatToman(periodPrice(Number(pkg.monthlyPrice), period, settings))}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
