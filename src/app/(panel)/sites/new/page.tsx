import Link from "next/link";
import { createSiteAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { SiteEditor } from "@/components/site-editor";
import { getClientNames, getFeatureOptions, getPackageOptions } from "@/lib/catalog-queries";

export default async function NewSitePage() {
  const [features, packages, clientNames] = await Promise.all([getFeatureOptions(), getPackageOptions(), getClientNames()]);
  return (
    <>
      <Link href="/" className="mb-3 inline-block text-sm text-brand">← بازگشت به سایت‌ها</Link>
      <PageHeader title="سایت جدید" description="مشخصات سایت را وارد و قابلیت‌ها را انتخاب کنید؛ کلید لایسنس پس از ثبت نمایش داده می‌شود." />
      <SiteEditor mode="create" action={createSiteAction} features={features} packages={packages} clientNames={clientNames} />
    </>
  );
}
