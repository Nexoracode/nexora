import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { FeatureForm } from "./feature-form";

export default async function EditFeaturePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const [feature, groups] = await Promise.all([
    db.feature.findUnique({ where: { key } }),
    db.feature.findMany({ distinct: ["group"], select: { group: true }, orderBy: { group: "asc" } }),
  ]);
  if (!feature) notFound();

  return (
    <>
      <Link href="/features" className="mb-3 inline-block text-sm text-brand">← بازگشت به قابلیت‌ها</Link>
      <PageHeader title={`ویرایش «${feature.title}»`} description={`کلید فنی: ${feature.key}`} />
      <FeatureForm
        featureKey={feature.key}
        groups={groups.map((g) => g.group)}
        defaults={{ title: feature.title, group: feature.group, description: feature.description ?? "", price: Number(feature.price), isActive: feature.isActive }}
      />
    </>
  );
}
