import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { readPage } from "@/lib/paging";
import { DEFAULT_SUBSCRIPTION_SETTINGS, periodLabels, periodPrice, type SubscriptionPeriod } from "@/lib/subscription";

const periods: SubscriptionPeriod[] = ["MONTHLY", "QUARTERLY", "YEARLY"];

/** Plan prices per period, worked out from each package's monthly price and the discounts in the subscription settings. */
export default async function PlansPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const where = { monthlyPrice: { not: null } };
  const { page, pageCount, skip, take } = readPage(pageParam, await db.package.count({ where }));
  const [stored, packages] = await Promise.all([
    db.subscriptionSettings.findUnique({ where: { id: "main" } }),
    db.package.findMany({ where, skip, take, orderBy: { monthlyPrice: "asc" }, select: { id: true, name: true, monthlyPrice: true } }),
  ]);
  const settings = {
    quarterlyDiscountPercent: stored?.quarterlyDiscountPercent ?? DEFAULT_SUBSCRIPTION_SETTINGS.quarterlyDiscountPercent,
    yearlyDiscountPercent: stored?.yearlyDiscountPercent ?? DEFAULT_SUBSCRIPTION_SETTINGS.yearlyDiscountPercent,
  };

  return (
    <>
      <PageHeader
        title="پلن‌های اشتراک"
        description={`قیمت ماهانه‌ی هر پلن را در ویرایش بسته تعیین می‌کنید؛ تخفیف سه‌ماهه ${settings.quarterlyDiscountPercent.toLocaleString("fa-IR")}٪ و سالانه ${settings.yearlyDiscountPercent.toLocaleString("fa-IR")}٪ است.`}
        action={<Link href="/subscription" className="btn btn-ghost">تنظیمات اشتراک</Link>}
      />

      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">پلن</th>
              {periods.map((period) => <th key={period} className="px-4 py-3 text-start font-medium">{periodLabels[period]}</th>)}
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">هنوز برای هیچ بسته‌ای قیمت ماهانه ثبت نشده است.</td></tr>}
            {packages.map((pkg) => (
              <tr key={pkg.id} className="relative border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-bold">
                  {/* The overlay opens the package, where its monthly price is set. */}
                  <Link href={`/packages/${pkg.id}`} className="after:absolute after:inset-0">{pkg.name}</Link>
                </td>
                {periods.map((period) => <td key={period} className="px-4 py-3">{formatToman(periodPrice(Number(pkg.monthlyPrice), period, settings))}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} basePath="/plans" />
    </>
  );
}
