import { db } from "@/lib/db";
import { FeaturesForm } from "./features-form";

export default async function FeaturesPage() {
  const features = await db.feature.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">قابلیت‌ها و قیمت</h1>
      <FeaturesForm features={features.map((f) => ({ key: f.key, title: f.title, description: f.description ?? "", group: f.group, price: Number(f.price) }))} />
    </div>
  );
}
