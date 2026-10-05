"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Disables itself and shows a spinner while the surrounding form action runs. A form submitted through
 * `useSubmitWithoutReset` is not a form action, so it passes its own `pending` flag instead.
 */
export function SubmitButton({ children, variant = "primary", pending: pendingOverride }: { children: ReactNode; variant?: "primary" | "danger" | "ghost"; pending?: boolean }) {
  const status = useFormStatus();
  const pending = pendingOverride ?? status.pending;
  return (
    <button type="submit" disabled={pending} className={`btn btn-${variant}`}>
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
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
