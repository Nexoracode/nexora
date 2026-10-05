import { PageHeader } from "@/components/page-header";
import { getFeatureOptions } from "@/lib/catalog-queries";
import { FeaturesTable } from "./features-table";

export default async function FeaturesPage() {
  const features = await getFeatureOptions();
  return (
    <>
      <PageHeader title="قابلیت‌ها و قیمت" description="روی هر قابلیت بزنید تا توضیح و قیمتش را ببینید و ویرایش کنید." />
      <FeaturesTable features={features} />
    </>
  );
}
