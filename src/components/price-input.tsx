"use client";

import { useState, type InputHTMLAttributes } from "react";
import { normalizeDigits } from "@/lib/format";

const digitsOf = (value: string | number) => normalizeDigits(String(value)).replace(/\D/g, "");

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type" | "maxLength"> & {
  value?: string;
  defaultValue?: string | number;
  /** Receives the plain digits (no separators) on every change. */
  onValueChange?: (digits: string) => void;
  /** Cap on the number of digits; mirrors the server schema (`priceField` in src/app/actions.ts). */
  maxDigits?: number;
};

/**
 * Money field in toman. Shows thousands separators while typing, accepts Persian and Arabic digits
 * and pasted text, and refuses anything beyond `maxDigits`. The submitted value carries the
 * separators; the server strips them before validating.
 */
export function PriceInput({ value, defaultValue = "", onValueChange, maxDigits = 12, className = "", ...rest }: Props) {
  const [inner, setInner] = useState(() => digitsOf(defaultValue));
  const digits = value !== undefined ? digitsOf(value) : inner;
  const shown = digits ? Number(digits).toLocaleString("en-US") : "";

  return (
    <div className="relative">
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        dir="ltr"
        value={shown}
        onChange={(event) => {
          const next = digitsOf(event.target.value).slice(0, maxDigits);
          setInner(next);
          onValueChange?.(next);
        }}
        className={`input !pe-16 text-left ${className}`.trim()}
      />
      <span aria-hidden className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">تومان</span>
    </div>
  );
}
