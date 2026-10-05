"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
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

type AppliedPackage = { pkg: PackageOption; added: string[]; removed: string[] };

/**
 * Ready-made packages, behind a checkbox: the list only shows once "start from a package" is on.
 * Choosing a card ticks exactly its features in one go and opens a side card that lists what the
 * package selected (and what it added or removed compared with before), since the grouped
 * checkboxes below may be folded. The card that matches the current selection stays highlighted;
 * when nothing matches the selection reads as "custom".
 * `onUndo` (when given) puts the selection back to how it was before the first package was applied;
 * it runs from the button and also when the checkbox is switched off.
 */
export function PackagePicker({ packages, features, selected, onApply, onUndo }: { packages: PackageOption[]; features: FeatureOption[]; selected: ReadonlySet<string>; onApply: (pkg: PackageOption) => void; onUndo?: () => void }) {
  const [enabled, setEnabled] = useState(false);
  const [applied, setApplied] = useState<AppliedPackage | null>(null);
  const titleByKey = useMemo(() => new Map(features.map((feature) => [feature.key, feature.title])), [features]);

  useEffect(() => {
    if (!applied) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setApplied(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [applied]);

  if (packages.length === 0) return null;
  const matches = (pkg: PackageOption) => pkg.featureKeys.length === selected.size && pkg.featureKeys.every((key) => selected.has(key));
  const current = packages.find(matches);

  const apply = (pkg: PackageOption) => {
    const next = new Set(pkg.featureKeys);
    setApplied({ pkg, added: pkg.featureKeys.filter((key) => !selected.has(key)), removed: [...selected].filter((key) => !next.has(key)) });
    onApply(pkg);
  };
  const undo = () => {
    setApplied(null);
    onUndo?.();
  };
  const title = (key: string) => titleByKey.get(key) ?? key;

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => {
              setEnabled(event.target.checked);
              // Turning the option off drops whatever the packages changed.
              if (!event.target.checked) undo();
            }}
            className="mt-1 size-4 accent-indigo-600"
          />
          <span>
            <span className="block text-sm font-bold">شروع با یک بسته آماده</span>
            <span className="block text-xs text-slate-500">با انتخاب بسته، قابلیت‌های آن یک‌جا تیک می‌خورد. بعد می‌توانید دستی کم و زیاد کنید.</span>
          </span>
        </label>
        {onUndo && (
          <button type="button" onClick={undo} className="btn btn-ghost !px-3 !py-1.5 !text-xs">بازگرداندن به حالت قبل</button>
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
                  onClick={() => apply(pkg)}
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

      {enabled && applied && (
        <aside
          aria-label={`قابلیت‌های بستهٔ ${applied.pkg.name}`}
          // Physical right edge: the menu sits on the right too, so on desktop the card opens just beside it.
          className="slide-in-right fixed right-4 top-20 z-30 flex max-h-[calc(100vh-7rem)] w-80 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-slate-200 bg-white shadow-xl lg:right-[18rem]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
            <div className="min-w-0">
              <h3 className="m-0 truncate text-sm font-bold">بستهٔ {applied.pkg.name}</h3>
              <p className="m-0 mt-1 text-xs text-slate-500">{applied.pkg.featureKeys.length.toLocaleString("fa-IR")} قابلیت انتخاب شد · {formatToman(applied.pkg.price)}</p>
            </div>
            <button type="button" aria-label="بستن" onClick={() => setApplied(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16} aria-hidden /></button>
          </header>
          <div className="space-y-4 overflow-y-auto p-4">
            <ul className="m-0 list-none space-y-1.5 p-0 text-sm">
              {applied.pkg.featureKeys.map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <Check size={14} aria-hidden className="shrink-0 text-green-600" />
                  <span className="flex-1">{title(key)}</span>
                  {applied.added.includes(key) && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-brand">جدید</span>}
                </li>
              ))}
            </ul>
            {applied.removed.length > 0 && (
              <div>
                <p className="m-0 mb-1.5 text-xs font-bold text-slate-500">برداشته شد ({applied.removed.length.toLocaleString("fa-IR")})</p>
                <ul className="m-0 list-none space-y-1 p-0 text-xs text-slate-400 line-through">
                  {applied.removed.map((key) => <li key={key}>{title(key)}</li>)}
                </ul>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
