import { db } from "@/lib/db";
import type { FeatureOption, PackageOption } from "@/components/feature-grid";

export async function getFeatureOptions(): Promise<FeatureOption[]> {
  const features = await db.feature.findMany({ orderBy: { sortOrder: "asc" } });
  return features.map((f) => ({ key: f.key, title: f.title, description: f.description ?? "", group: f.group, price: Number(f.price), isActive: f.isActive }));
}

export async function getPackageOptions(): Promise<PackageOption[]> {
  const packages = await db.package.findMany({ orderBy: { createdAt: "asc" }, include: { features: { select: { featureKey: true } } } });
  return packages.map((p) => ({ id: p.id, name: p.name, price: Number(p.price), featureKeys: p.features.map((f) => f.featureKey) }));
}

export async function getClientNames() {
  return (await db.client.findMany({ select: { name: true }, orderBy: { name: "asc" } })).map((c) => c.name);
}
