"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Tooltip } from "./tooltip";

type Tone = "neutral" | "danger" | "success";

/** Icon only, no border or fill; a soft background appears on hover. */
const base = "inline-flex size-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const tones: Record<Tone, string> = {
  neutral: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  danger: "text-red-500 hover:bg-red-50 hover:text-red-700",
  success: "text-green-600 hover:bg-green-50 hover:text-green-700",
};

/**
 * Link-styled icon action, e.g. "edit". `label` is the full accessible name; `tip` is the short
 * tooltip text and defaults to `label`.
 */
export function IconLink({ href, label, tip = label, tone = "neutral", children }: { href: string; label: string; tip?: string; tone?: Tone; children: ReactNode }) {
  return (
    <Tooltip label={tip}>
      <Link href={href} aria-label={label} className={`${base} ${tones[tone]}`}>{children}</Link>
    </Tooltip>
  );
}

/** Plain icon button (for example the trigger of a confirmation dialog). */
export function IconButton({ label, tip = label, tone = "neutral", children, ...rest }: { label: string; tip?: string; tone?: Tone; children: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "aria-label">) {
  return (
    <Tooltip label={tip}>
      <button type="button" aria-label={label} className={`${base} ${tones[tone]}`} {...rest}>{children}</button>
    </Tooltip>
  );
}

/** Icon submit button for table rows: shows a spinner and stays disabled while the form action runs. */
export function IconSubmitButton({ label, tip = label, tone = "neutral", children }: { label: string; tip?: string; tone?: Tone; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Tooltip label={tip}>
      <button type="submit" disabled={pending} aria-label={label} className={`${base} ${tones[tone]}`}>
        {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : children}
      </button>
    </Tooltip>
  );
}
