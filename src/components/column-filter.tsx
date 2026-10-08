"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ListFilter } from "lucide-react";

export type FilterOption = { value: string; label: string };

const PANEL_WIDTH = 256;

/**
 * A filter icon for a table header. Pressing it opens a small panel: a list of values for a
 * column with a few fixed values, or a text field for a column that is searched. The choice goes
 * into the address (`param`), the table goes back to its first page, and the other filters and
 * the page size stay as they were. A filtered column's icon is coloured.
 */
export function ColumnFilter({ param, label, options }: { param: string; label: string; /** Fixed values to pick from; leave out for a text search. */ options?: FilterOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const current = search.get(param) ?? "";
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(current);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const apply = (value: string) => {
    const next = new URLSearchParams(search.toString());
    if (value.trim()) next.set(param, value.trim());
    else next.delete(param);
    next.delete("page");
    router.push(next.size ? `${pathname}?${next}` : pathname);
    setOpen(false);
  };

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      // Centred under the icon, kept inside the window.
      const left = Math.min(Math.max(8, rect.left + rect.width / 2 - PANEL_WIDTH / 2), window.innerWidth - PANEL_WIDTH - 8);
      setPosition({ top: rect.bottom + 6, left });
    }
    setText(current);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); buttonRef.current?.focus(); } };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    // The panel is fixed under the icon, so a scroll or resize would leave it behind.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`فیلتر ${label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
        className={`relative inline-flex size-6 items-center justify-center rounded-md border-0 bg-transparent p-0 transition-colors hover:bg-slate-200/70 ${current ? "text-brand" : "text-slate-400"}`}
      >
        <ListFilter size={14} aria-hidden />
        {current && <span aria-hidden className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-brand" />}
      </button>

      {open && position && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={`فیلتر ${label}`}
          dir="rtl"
          style={{ top: position.top, left: position.left, width: PANEL_WIDTH }}
          className="fixed z-50 rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal text-slate-700 shadow-lg"
        >
          <p className="m-0 mb-2 text-xs text-slate-500">فیلتر {label}</p>
          {options ? (
            <ul className="m-0 grid list-none gap-0.5 p-0">
              {[{ value: "", label: "همه" }, ...options].map((option) => (
                <li key={option.value || "all"}>
                  <button
                    type="button"
                    onClick={() => apply(option.value)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border-0 bg-transparent px-3 py-2 text-start text-sm hover:bg-slate-100 ${option.value === current ? "font-bold text-brand" : ""}`}
                  >
                    {option.label}
                    {option.value === current && <Check size={15} aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); apply(text); }} className="grid gap-2">
              <input
                autoFocus
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={100}
                aria-label={`جستجو در ${label}`}
                placeholder="جستجو…"
                className="input !h-9 text-sm"
              />
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1 !py-1.5 text-sm">اعمال</button>
                {current && <button type="button" className="btn btn-ghost !py-1.5 text-sm" onClick={() => apply("")}>پاک‌کردن</button>}
              </div>
            </form>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
