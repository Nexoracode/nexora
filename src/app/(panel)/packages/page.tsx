import { getFeatureOptions, getPackageOptions } from "@/lib/catalog-queries";
import { PackagesBoard } from "./packages-board";

export default async function PackagesPage() {
  const [features, packages] = await Promise.all([getFeatureOptions(), getPackageOptions()]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">بسته‌ها</h1>
      <p className="text-sm text-slate-500">روی هر بسته بزنید تا قابلیت‌هایش را ببینید. بسته هنگام ثبت سایت با یک کلیک اعمال می‌شود.</p>
      <PackagesBoard packages={packages} features={features} />
    </div>
  );
}
