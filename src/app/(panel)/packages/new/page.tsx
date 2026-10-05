import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getFeatureOptions } from "@/lib/catalog-queries";
import { PackageForm } from "../package-form";

export default async function NewPackagePage() {
  const features = await getFeatureOptions();
  return (
    <>
      <Link href="/packages" className="mb-3 inline-block text-sm text-brand">← بازگشت به بسته‌ها</Link>
      <PageHeader title="بسته جدید" description="نام و قیمت را بنویسید و قابلیت‌های داخل بسته را انتخاب کنید." />
      <PackageForm pkg={null} features={features} />
    </>
  );
}
