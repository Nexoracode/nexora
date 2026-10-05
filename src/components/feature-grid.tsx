"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatToman } from "@/lib/format";

export type FeatureOption = { key: string; title: string; description: string; group: string; price: number; isActive: boolean };
export type PackageOption = { id: string; name: string; price: number; featureKeys: string[] };

/**
 * Grouped checkbox list that submits as repeated `features` fields; reports the selection to its
 * parent. Each group folds away behind a header showing how many of its features are selected;
 * only the first starts open.
 * Folded groups stay in the DOM (hidden), so their checkboxes are still submitted.
 */
export function FeatureGrid({ features, selected, onChange }: { features: FeatureOption[]; selected: Set<string>; onChange: (next: Set<string>) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, FeatureOption[]>();
    for (const feature of features) map.set(feature.group, [...(map.get(feature.group) ?? []), feature]);
    return [...map.entries()];
  }, [features]);
  // Only the first group starts open.
  const [open, setOpen] = useState<Set<string>>(() => new Set(groups.slice(0, 1).map(([group]) => group)));

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

/**
 * Ready-made packages, behind a checkbox: the list only shows once "start from a package" is on.
 * Choosing a card ticks exactly its features in one go; the card that matches the current
 * selection stays highlighted, and when nothing matches the selection reads as "custom".
 * `onUndo` (when given) puts the selection back to how it was before the first package was applied;
 * it runs from the button and also when the checkbox is switched off.
 */
export function PackagePicker({ packages, selected, onApply, onUndo }: { packages: PackageOption[]; selected: ReadonlySet<string>; onApply: (pkg: PackageOption) => void; onUndo?: () => void }) {
  const [enabled, setEnabled] = useState(false);
  if (packages.length === 0) return null;
  const matches = (pkg: PackageOption) => pkg.featureKeys.length === selected.size && pkg.featureKeys.every((key) => selected.has(key));
  const current = packages.find(matches);

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={enabled} onChange={(event) => {
              setEnabled(event.target.checked);
              // Turning the option off drops whatever the packages changed.
              if (!event.target.checked) onUndo?.();
            }} className="mt-1 size-4 accent-indigo-600" />
          <span>
            <span className="block text-sm font-bold">شروع با یک بسته آماده</span>
            <span className="block text-xs text-slate-500">با انتخاب بسته، قابلیت‌های آن یک‌جا تیک می‌خورد. بعد می‌توانید دستی کم و زیاد کنید.</span>
          </span>
        </label>
        {onUndo && (
          <button type="button" onClick={onUndo} className="btn btn-ghost !px-3 !py-1.5 !text-xs">بازگرداندن به حالت قبل</button>
        )}
      </div>

      {enabled && (
        <div className="mt-4 space-y-3">
          <span className="inline-block rounded-full bg-white px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
            {current ? `بستهٔ ${current.name}` : `سفارشی · ${selected.size.toLocaleString("fa-IR")} قابلیت`}
          </span>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const active = current?.id === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onApply(pkg)}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-start transition-colors ${active ? "border-brand bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{pkg.name}</span>
                    <span className="block text-xs text-slate-500">{pkg.featureKeys.length.toLocaleString("fa-IR")} قابلیت</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-slate-700">{formatToman(pkg.price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
