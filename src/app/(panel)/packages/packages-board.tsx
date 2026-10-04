"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import type { FeatureOption, PackageOption } from "@/components/feature-grid";
import { formatToman } from "@/lib/format";
import { PackageCard } from "./package-card";

type Selection = string | "new" | null;

/** Table of packages; clicking a row opens its details, and from there the edit form. */
export function PackagesBoard({ packages, features }: { packages: PackageOption[]; features: FeatureOption[] }) {
  const [selected, setSelected] = useState<Selection>(null);
  const [editing, setEditing] = useState(false);
  const priceByKey = useMemo(() => new Map(features.map((f) => [f.key, f.price])), [features]);
  const current = packages.find((p) => p.id === selected) ?? null;

  const open = (id: Selection) => {
    setSelected((prev) => (prev === id ? null : id));
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" className="btn btn-primary" onClick={() => open("new")}><Plus size={16} aria-hidden />بسته جدید</button>
      </div>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">بسته</th>
              <th className="px-4 py-3 text-start font-medium">قیمت</th>
              <th className="px-4 py-3 text-start font-medium">تعداد قابلیت</th>
              <th className="px-4 py-3 text-start font-medium">جمع تک‌تک قابلیت‌ها</th>
              <th className="px-4 py-3 text-start font-medium">صرفه‌جویی مشتری</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">هنوز بسته‌ای ساخته نشده است.</td></tr>
            )}
            {packages.map((pkg) => {
              const sum = pkg.featureKeys.reduce((total, key) => total + (priceByKey.get(key) ?? 0), 0);
              const saving = Math.max(0, sum - pkg.price);
              const isOpen = selected === pkg.id;
              return (
                <tr
                  key={pkg.id}
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => open(pkg.id)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(pkg.id); } }}
                  className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${isOpen ? "bg-indigo-50" : ""}`}
                >
                  <td className="px-4 py-3 font-bold">{pkg.name}</td>
                  <td className="px-4 py-3">{formatToman(pkg.price)}</td>
                  <td className="px-4 py-3">{pkg.featureKeys.length.toLocaleString("fa-IR")}</td>
                  <td className="px-4 py-3 text-slate-500">{formatToman(sum)}</td>
                  <td className="px-4 py-3 text-green-700">{saving > 0 ? formatToman(saving) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected === "new" && (
        <div className="space-y-3">
          <div className="flex justify-end"><button type="button" className="btn btn-ghost" onClick={() => open(null)}><X size={16} aria-hidden />بستن</button></div>
          <PackageCard pkg={null} features={features} />
        </div>
      )}

      {current && (
        <section className="card space-y-4" aria-label={`جزئیات بسته ${current.name}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">{current.name} · {formatToman(current.price)}</h2>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing((value) => !value)}>{editing ? "نمایش جزئیات" : "ویرایش"}</button>
              <button type="button" className="btn btn-ghost" aria-label="بستن جزئیات" onClick={() => open(null)}><X size={16} aria-hidden /></button>
            </div>
          </div>
          {editing ? (
            <PackageCard key={current.id} pkg={current} features={features} />
          ) : (
            <PackageDetails pkg={current} features={features} />
          )}
        </section>
      )}
    </div>
  );
}

function PackageDetails({ pkg, features }: { pkg: PackageOption; features: FeatureOption[] }) {
  const included = new Set(pkg.featureKeys);
  const groups = new Map<string, FeatureOption[]>();
  for (const feature of features) groups.set(feature.group, [...(groups.get(feature.group) ?? []), feature]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[...groups.entries()].map(([group, items]) => (
        <div key={group}>
          <h3 className="mb-2 text-sm font-bold text-slate-700">{group}</h3>
          <ul className="space-y-1.5 text-sm">
            {items.map((feature) => (
              <li key={feature.key} className={`flex items-center justify-between gap-3 rounded-md px-3 py-1.5 ${included.has(feature.key) ? "bg-green-50 text-green-800" : "text-slate-400 line-through"}`}>
                <span>{feature.title}</span>
                <span className="text-xs">{formatToman(feature.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
