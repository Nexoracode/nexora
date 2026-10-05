"use client";

import type { KeyboardEvent } from "react";

export type TabItem = { id: string; label: string; badge?: number };

/** Underlined tab strip. Panels stay mounted by the caller (hidden, not removed) so a form spanning tabs submits everything. */
export function Tabs({ tabs, value, onChange, label, idPrefix, bare = false }: { tabs: TabItem[]; value: string; onChange: (id: string) => void; label: string; idPrefix: string; /** No underline of its own: the parent draws one under a wider row. */ bare?: boolean }) {
  const move = (event: KeyboardEvent, index: number) => {
    // Tabs run right-to-left, so the "next" tab is to the left.
    const step = event.key === "ArrowLeft" ? 1 : event.key === "ArrowRight" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length];
    if (next) {
      onChange(next.id);
      document.getElementById(`${idPrefix}-tab-${next.id}`)?.focus();
    }
  };

  return (
    <div role="tablist" aria-label={label} className={`flex gap-1 overflow-x-auto ${bare ? "" : "shadow-[inset_0_-1px_0_#e2e8f0]"}`}>
      {tabs.map((tab, index) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            id={`${idPrefix}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => move(event, index)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${active ? "border-brand font-bold text-brand" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {tab.label}
            {tab.badge !== undefined && <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-indigo-100 text-brand" : "bg-slate-100 text-slate-500"}`}>{tab.badge.toLocaleString("fa-IR")}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Wrapper for one tab's content: hidden unless it is the selected tab. */
export function TabPanel({ id, value, idPrefix, children, className = "" }: { id: string; value: string; idPrefix: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-tab-${id}`} hidden={value !== id} className={className}>
      {children}
    </div>
  );
}
