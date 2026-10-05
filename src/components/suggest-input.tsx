"use client";

import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from "react";

const MAX_SUGGESTIONS = 6;

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "list"> & {
  defaultValue?: string;
  suggestions: string[];
};

/**
 * Text input that offers matching earlier values while typing. It replaces the browser's own
 * `<datalist>`, which draws a native dropdown arrow and cannot be styled. Typing anything new is
 * still fine; suggestions only save retyping.
 */
export function SuggestInput({ defaultValue = "", suggestions, className = "", ...rest }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const needle = value.trim().toLowerCase();
  const matches = suggestions.filter((item) => item.toLowerCase() !== needle && (needle === "" || item.toLowerCase().includes(needle))).slice(0, MAX_SUGGESTIONS);
  const visible = open && matches.length > 0;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const pick = (index: number) => {
    const item = matches[index];
    if (item !== undefined) setValue(item);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <input
        {...rest}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        className={`input ${className}`.trim()}
        onFocus={() => setOpen(true)}
        onChange={(event) => { setValue(event.target.value); setOpen(true); setActive(0); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          else if (event.key === "ArrowDown" && matches.length) { event.preventDefault(); setOpen(true); setActive((index) => Math.min(matches.length - 1, index + 1)); }
          else if (event.key === "ArrowUp" && matches.length) { event.preventDefault(); setActive((index) => Math.max(0, index - 1)); }
          else if (event.key === "Enter" && visible) { event.preventDefault(); pick(active); }
        }}
      />
      {visible && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1.5 m-0 list-none rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {matches.map((item, index) => (
            <li
              key={item}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => { event.preventDefault(); pick(index); }}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${index === active ? "bg-slate-100" : ""}`}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
