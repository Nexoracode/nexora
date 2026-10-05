"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string };

/**
 * Custom dropdown that replaces the native `<select>`: same height as `.input`, the chevron sits at
 * the end edge with proper padding, and the menu is a rounded list. Keyboard: arrows move, Enter or
 * Space picks, Escape closes. With `name` it also submits its value inside a form.
 */
export function Select({ value, onChange, options, label, name, id, className = "" }: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Accessible name when there is no visible label. */
  label: string;
  name?: string;
  id?: string;
  className?: string;
}) {
  const generated = useId();
  const listId = `${generated}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const openMenu = () => {
    setActive(selectedIndex);
    setOpen(true);
  };
  const pick = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") { setOpen(false); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) { openMenu(); return; }
      setActive((index) => (event.key === "ArrowDown" ? Math.min(options.length - 1, index + 1) : Math.max(0, index - 1)));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) pick(active);
      else openMenu();
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className="input flex h-11 items-center justify-between gap-3 text-start"
      >
        <span className="truncate">{options[selectedIndex]?.label}</span>
        <ChevronDown size={16} aria-hidden className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul id={listId} role="listbox" aria-label={label} className="absolute inset-x-0 top-full z-20 mt-1.5 m-0 list-none rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => { event.preventDefault(); pick(index); }}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${index === active ? "bg-slate-100" : ""} ${option.value === value ? "font-bold text-brand" : ""}`}
            >
              {option.label}
              {option.value === value && <Check size={15} aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
