import { getFeatureOptions, getPackageOptions } from "@/lib/catalog-queries";
import { PackageCard } from "./package-card";

export default async function PackagesPage() {
  const [features, packages] = await Promise.all([getFeatureOptions(), getPackageOptions()]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">بسته‌ها</h1>
      <p className="text-sm text-slate-500">بسته، مجموعه‌ای آماده از قابلیت‌هاست که هنگام ثبت سایت با یک کلیک اعمال می‌شود.</p>
      {packages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} features={features} />)}
      <PackageCard pkg={null} features={features} />
    </div>
  );
}
