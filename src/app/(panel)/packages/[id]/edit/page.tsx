import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getFeatureOptions, getPackageOptions } from "@/lib/catalog-queries";
import { PackageForm } from "../../package-form";

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [features, packages] = await Promise.all([getFeatureOptions(), getPackageOptions()]);
  const pkg = packages.find((item) => item.id === id);
  if (!pkg) notFound();

  return (
    <>
      <Link href={`/packages/${pkg.id}`} className="mb-3 inline-block text-sm text-brand">← بازگشت به جزئیات بسته</Link>
      <PageHeader title={`ویرایش بستهٔ «${pkg.name}»`} description="نام، قیمت و قابلیت‌های بسته را تغییر دهید. سایت‌هایی که قبلاً با این بسته ساخته شده‌اند تغییری نمی‌کنند." />
      <PackageForm pkg={pkg} features={features} />
    </>
  );
}
