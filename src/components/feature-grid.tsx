"use client";

import { useMemo, useState } from "react";
import { formatToman } from "@/lib/format";

export type FeatureOption = { key: string; title: string; description: string; group: string; price: number; isActive: boolean };
export type PackageOption = { id: string; name: string; price: number; featureKeys: string[] };

/** Grouped checkbox list that submits as repeated `features` fields; reports the selection to its parent. */
export function FeatureGrid({ features, selected, onChange }: { features: FeatureOption[]; selected: Set<string>; onChange: (next: Set<string>) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, FeatureOption[]>();
    for (const feature of features) map.set(feature.group, [...(map.get(feature.group) ?? []), feature]);
    return [...map.entries()];
  }, [features]);

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (!next.delete(key)) next.add(key);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {groups.map(([group, items]) => (
        <fieldset key={group}>
          <legend className="mb-2 text-sm font-bold text-slate-700">{group}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((feature) => (
              <label key={feature.key} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${selected.has(feature.key) ? "border-brand bg-indigo-50" : "border-slate-200 bg-white"}`}>
                <input type="checkbox" name="features" value={feature.key} checked={selected.has(feature.key)} onChange={() => toggle(feature.key)} className="size-4 accent-indigo-600" />
                <span className="flex-1"><span className="block">{feature.title}{!feature.isActive && <span className="ms-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">غیرفعال</span>}</span>{feature.description && <span className="mt-0.5 block text-xs leading-5 text-slate-500">{feature.description}</span>}</span>
                <span className="text-xs text-slate-500">{feature.price > 0 ? formatToman(feature.price) : "—"}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

/** Quick-apply buttons: replace the current selection with a package's features. */
export function PackagePicker({ packages, onApply }: { packages: PackageOption[]; onApply: (pkg: PackageOption) => void }) {
  if (packages.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-600">اعمال بسته:</span>
      {packages.map((pkg) => (
        <button key={pkg.id} type="button" onClick={() => onApply(pkg)} className="btn btn-ghost !px-3 !py-1.5 !text-xs">{pkg.name}</button>
      ))}
    </div>
  );
}
