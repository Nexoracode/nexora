import Link from "next/link";
import { createSiteAction } from "@/app/actions";
import { SiteEditor } from "@/components/site-editor";
import { getClientNames, getFeatureOptions, getPackageOptions } from "@/lib/catalog-queries";

export default async function NewSitePage() {
  const [features, packages, clientNames] = await Promise.all([getFeatureOptions(), getPackageOptions(), getClientNames()]);
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-brand">← بازگشت به سایت‌ها</Link>
      <h1 className="text-xl font-bold">سایت جدید</h1>
      <SiteEditor mode="create" action={createSiteAction} features={features} packages={packages} clientNames={clientNames} />
    </div>
  );
}
