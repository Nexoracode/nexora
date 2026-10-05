"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { CalendarDays, X } from "lucide-react";

/** `yyyy-mm-dd` from a JS Date's local parts, so picking a day never shifts it through a timezone. */
const toIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const toJalali = (iso: string) => new DateObject({ date: new Date(`${iso}T00:00:00`), calendar: persian, locale: persian_fa });

/**
 * Date field in the Jalali calendar. What the user sees and picks is Jalali; what the form
 * submits (`name`) is the Gregorian `yyyy-mm-dd`, so the server schema stays as it was.
 * An empty value means "no date".
 */
export function JalaliDateField({ id, name, defaultValue = "", placeholder = "انتخاب تاریخ", ...aria }: {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [iso, setIso] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={iso} />
      <div className="relative">
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="input flex h-11 items-center justify-between gap-3 text-start"
          {...aria}
        >
          <span className={iso ? "" : "text-slate-400"}>{iso ? toJalali(iso).format("YYYY/MM/DD") : placeholder}</span>
          <CalendarDays size={16} aria-hidden className="shrink-0 text-slate-400" />
        </button>
        {iso && (
          <button type="button" aria-label="حذف تاریخ" onClick={() => setIso("")} className="absolute end-10 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={14} aria-hidden />
          </button>
        )}
      </div>
      {open && (
        <div role="dialog" aria-label="انتخاب تاریخ" className="absolute start-0 top-full z-20 mt-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-lg" dir="rtl">
          <Calendar
            calendar={persian}
            locale={persian_fa}
            value={iso ? toJalali(iso) : undefined}
            onChange={(date) => {
              if (!date || Array.isArray(date)) return;
              setIso(toIso(date.toDate()));
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
