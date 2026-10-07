import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getFeatureOptions, getPackageOptions } from "@/lib/catalog-queries";
import { formatToman } from "@/lib/format";
import { loadRatingAverages } from "@/lib/ratings";
import { RatingCell } from "@/components/rating-cell";
import { PackageRowActions } from "./package-actions";

export default async function PackagesPage() {
  const [features, packages] = await Promise.all([getFeatureOptions(), getPackageOptions()]);
  const ratings = (await loadRatingAverages()).packages;
  const priceByKey = new Map(features.map((feature) => [feature.key, feature.price]));

  return (
    <>
      <PageHeader
        title="بسته‌ها"
        description="مجموعه‌های آماده از قابلیت‌ها که هنگام ثبت سایت با یک کلیک اعمال می‌شوند."
        action={<Link href="/packages/new" className="btn btn-primary"><Plus size={16} aria-hidden />بسته جدید</Link>}
      />

      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">بسته</th>
              <th className="px-4 py-3 text-start font-medium">قیمت</th>
              <th className="px-4 py-3 text-start font-medium">قابلیت‌ها</th>
              <th className="px-4 py-3 text-start font-medium">جمع تک‌تک قابلیت‌ها</th>
              <th className="px-4 py-3 text-start font-medium">صرفه‌جویی مشتری</th>
              <th className="px-4 py-3 text-start font-medium">امتیاز</th>
              <th className="px-4 py-3 text-start font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">هنوز بسته‌ای ساخته نشده است.</td></tr>
            )}
            {packages.map((pkg) => {
              const sum = pkg.featureKeys.reduce((total, key) => total + (priceByKey.get(key) ?? 0), 0);
              const saving = Math.max(0, sum - pkg.price);
              return (
                <tr key={pkg.id} className="relative border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold">
                    {/* The overlay makes the whole row open the details page; the action icons sit above it. */}
                    <Link href={`/packages/${pkg.id}`} className="after:absolute after:inset-0">{pkg.name}</Link>
                  </td>
                  <td className="px-4 py-3">{formatToman(pkg.price)}</td>
                  <td className="px-4 py-3">{pkg.featureKeys.length.toLocaleString("fa-IR")}</td>
                  <td className="px-4 py-3 text-slate-500">{formatToman(sum)}</td>
                  <td className="px-4 py-3 text-green-700">{saving > 0 ? formatToman(saving) : "—"}</td>
                  <td className="px-4 py-3"><RatingCell rating={ratings[pkg.id]} /></td>
                  <td className="relative z-10 px-4 py-3"><PackageRowActions id={pkg.id} name={pkg.name} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
