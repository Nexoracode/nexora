"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/** Disables itself and shows a spinner for the whole time the surrounding form action runs. */
export function SubmitButton({ children, variant = "primary" }: { children: ReactNode; variant?: "primary" | "danger" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`btn btn-${variant}`}>
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/** Icon-only submit button for table rows: needs an accessible label, shows a spinner while the action runs. */
export function IconSubmitButton({ label, children, variant = "ghost" }: { label: string; children: ReactNode; variant?: "ghost" | "danger" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-label={label} title={label} className={`btn btn-${variant} !px-2.5 !py-2`}>
      {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : children}
    </button>
  );
}

/**
 * Label + control + one reserved message line. The line always occupies the same height, so an
 * error appearing never shifts the rest of the form; a hint and an error share that line.
 */
export function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      <p id={`${htmlFor}-msg`} className={`mt-1.5 min-h-5 text-xs ${error ? "text-red-600" : "text-slate-500"}`}>{error ?? hint ?? ""}</p>
    </div>
  );
}
