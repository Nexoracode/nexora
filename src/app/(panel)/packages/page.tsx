import { PageHeader } from "@/components/page-header";
import { getFeatureOptions, getPackageOptions } from "@/lib/catalog-queries";
import { PackagesBoard } from "./packages-board";

export default async function PackagesPage() {
  const [features, packages] = await Promise.all([getFeatureOptions(), getPackageOptions()]);
  return (
    <>
      <PageHeader title="بسته‌ها" description="روی هر بسته بزنید تا قابلیت‌هایش را ببینید. بسته هنگام ثبت سایت با یک کلیک اعمال می‌شود." />
      <PackagesBoard packages={packages} features={features} />
    </>
  );
}
