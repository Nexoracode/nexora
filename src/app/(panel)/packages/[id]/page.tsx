import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getFeatureOptions, getPackageOptions } from "@/lib/catalog-queries";
import { formatToman } from "@/lib/format";
import { PackageRowActions } from "../package-actions";

export default async function PackageDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [features, packages] = await Promise.all([getFeatureOptions(), getPackageOptions()]);
  const pkg = packages.find((item) => item.id === id);
  if (!pkg) notFound();

  const included = new Set(pkg.featureKeys);
  const items = features.filter((feature) => included.has(feature.key));
  const sum = items.reduce((total, feature) => total + feature.price, 0);
  const saving = Math.max(0, sum - pkg.price);
  const groups = new Map<string, typeof items>();
  for (const feature of items) groups.set(feature.group, [...(groups.get(feature.group) ?? []), feature]);

  const stats = [
    { label: "قیمت بسته", value: formatToman(pkg.price) },
    { label: "تعداد قابلیت", value: items.length.toLocaleString("fa-IR") },
    { label: "جمع تک‌تک قابلیت‌ها", value: formatToman(sum) },
    { label: "صرفه‌جویی مشتری", value: saving > 0 ? formatToman(saving) : "—" },
  ];

  return (
    <>
      <Link href="/packages" className="mb-3 inline-block text-sm text-brand">← بازگشت به بسته‌ها</Link>
      <PageHeader
        title={`بستهٔ «${pkg.name}»`}
        description="قابلیت‌هایی که با این بسته به سایت داده می‌شود."
        action={
          <div className="flex items-center gap-2">
            <Link href={`/packages/${pkg.id}/edit`} className="btn btn-primary"><Pencil size={16} aria-hidden />ویرایش</Link>
            <PackageRowActions id={pkg.id} name={pkg.name} withDetails={false} />
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <p className="m-0 text-sm text-slate-500">{stat.label}</p>
            <p className="m-0 mt-1 text-lg font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="card text-center text-slate-500">این بسته هنوز قابلیتی ندارد.</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {[...groups.entries()].map(([group, list]) => (
            <section key={group} className="card">
              <h2 className="m-0 mb-3 text-sm font-bold text-slate-700">{group}</h2>
              <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                {list.map((feature) => (
                  <li key={feature.key} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium">{feature.title}</span>
                      <span className="shrink-0 text-xs text-slate-500">{feature.price > 0 ? formatToman(feature.price) : "—"}</span>
                    </div>
                    {feature.description && <p className="m-0 mt-1 text-xs leading-6 text-slate-500">{feature.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
