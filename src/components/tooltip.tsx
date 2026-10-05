"use client";

import { useState, type ReactNode } from "react";

/**
 * Small dark label that appears above its child on hover or keyboard focus. It replaces the
 * browser's `title` tooltip, which is slow, unstyled and cannot follow the app's look. The label is
 * decorative (`aria-hidden`): the control it wraps keeps its own `aria-label`.
 * It is `fixed`, so a scrolling table container never clips it.
 */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);

  const show = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setAt({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  return (
    <span
      className="inline-flex"
      onMouseEnter={(event) => show(event.currentTarget)}
      onMouseLeave={() => setAt(null)}
      onFocus={(event) => show(event.currentTarget)}
      onBlur={() => setAt(null)}
    >
      {children}
      {at && (
        <span
          aria-hidden
          style={{ left: at.x, top: at.y }}
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
        >
          {label}
        </span>
      )}
    </span>
  );
}
