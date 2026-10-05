"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatToman } from "@/lib/format";

export type FeatureOption = { key: string; title: string; description: string; group: string; price: number; isActive: boolean };
export type PackageOption = { id: string; name: string; price: number; featureKeys: string[] };

/**
 * Grouped checkbox list that submits as repeated `features` fields; reports the selection to its
 * parent. Each group folds away behind a header showing how many of its features are selected.
 * Folded groups stay in the DOM (hidden), so their checkboxes are still submitted.
 */
export function FeatureGrid({ features, selected, onChange }: { features: FeatureOption[]; selected: Set<string>; onChange: (next: Set<string>) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, FeatureOption[]>();
    for (const feature of features) map.set(feature.group, [...(map.get(feature.group) ?? []), feature]);
    return [...map.entries()];
  }, [features]);
  // Groups that already hold a selection start open; with nothing selected, the first one does.
  const [open, setOpen] = useState<Set<string>>(() => {
    const withSelection = groups.filter(([, items]) => items.some((item) => selected.has(item.key))).map(([group]) => group);
    return new Set(withSelection.length ? withSelection : groups.slice(0, 1).map(([group]) => group));
  });

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (!next.delete(key)) next.add(key);
    onChange(next);
  };
  const toggleOpen = (group: string) => setOpen((prev) => {
    const next = new Set(prev);
    if (!next.delete(group)) next.add(group);
    return next;
  });
  const setGroup = (items: FeatureOption[], all: boolean) => {
    const next = new Set(selected);
    for (const item of items) {
      if (all) next.add(item.key);
      else next.delete(item.key);
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {groups.map(([group, items], index) => {
        const count = items.filter((item) => selected.has(item.key)).length;
        const isOpen = open.has(group);
        const panelId = `feature-group-${index}`;
        return (
          <section key={group} className="overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2.5">
              <button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggleOpen(group)} className="flex flex-1 items-center gap-2 text-start text-sm font-bold text-slate-700">
                <ChevronDown size={16} aria-hidden className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                {group}
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${count ? "bg-indigo-100 text-brand" : "bg-slate-200 text-slate-500"}`}>{count.toLocaleString("fa-IR")} از {items.length.toLocaleString("fa-IR")}</span>
              </button>
              <button type="button" onClick={() => setGroup(items, count < items.length)} className="text-xs text-brand">{count < items.length ? "انتخاب همه" : "برداشتن همه"}</button>
            </div>
            <div id={panelId} hidden={!isOpen} className="grid gap-2 p-3 sm:grid-cols-2">
              {items.map((feature) => (
                <label key={feature.key} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${selected.has(feature.key) ? "border-brand bg-indigo-50" : "border-slate-200 bg-white"}`}>
                  <input type="checkbox" name="features" value={feature.key} checked={selected.has(feature.key)} onChange={() => toggle(feature.key)} className="size-4 accent-indigo-600" />
                  <span className="flex-1"><span className="block">{feature.title}{!feature.isActive && <span className="ms-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">غیرفعال</span>}</span>{feature.description && <span className="mt-0.5 block text-xs leading-5 text-slate-500">{feature.description}</span>}</span>
                  <span className="text-xs text-slate-500">{feature.price > 0 ? formatToman(feature.price) : "—"}</span>
                </label>
              ))}
            </div>
          </section>
        );
      })}
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
