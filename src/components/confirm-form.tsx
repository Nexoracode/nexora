"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";

type Tone = "danger" | "warning";

/**
 * A form whose action first asks for confirmation in a modal. Use it for every destructive or
 * hard-to-undo action instead of `window.confirm`. `trigger` receives the function that opens the
 * dialog; the confirm button inside is the form's submit button, so it shows a spinner and stays
 * disabled while the action runs, and the dialog closes by itself when the action finishes.
 */
export function ConfirmForm({ action, title, message, confirmLabel, tone = "danger", trigger }: {
  action: (formData: FormData) => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: Tone;
  trigger: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  return (
    <form id={formId} action={action}>
      {trigger(() => setOpen(true))}
      {/* Drawn on document.body: inside a transformed parent (a sliding sidebar) `fixed` would centre on that parent instead of the page. */}
      {open && typeof document !== "undefined" && createPortal(<ConfirmDialog formId={formId} title={title} message={message} confirmLabel={confirmLabel} tone={tone} onClose={() => setOpen(false)} />, document.body)}
    </form>
  );
}

function ConfirmDialog({ formId, title, message, confirmLabel, tone, onClose }: { formId: string; title: string; message: string; confirmLabel: string; tone: Tone; onClose: () => void }) {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Close once the action that was running has finished.
  useEffect(() => {
    if (pending) wasPending.current = true;
    else if (wasPending.current) onClose();
  }, [pending, onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !pending) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pending, onClose]);

  const iconTone = tone === "danger" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" dir="rtl">
      <div aria-hidden className="absolute inset-0 bg-slate-900/40" onClick={() => { if (!pending) onClose(); }} />
      <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId} className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <span className={`grid size-11 shrink-0 place-items-center rounded-full ${iconTone}`}><AlertTriangle size={22} aria-hidden /></span>
          <div className="min-w-0">
            <h2 id={titleId} className="m-0 text-base font-bold">{title}</h2>
            <p id={messageId} className="m-0 mt-2 text-sm leading-7 text-slate-600">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button ref={cancelRef} type="button" disabled={pending} onClick={onClose} className="btn btn-ghost">انصراف</button>
          <button type="submit" form={formId} disabled={pending} className={`btn ${tone === "danger" ? "bg-red-600 text-white hover:bg-red-700" : "btn-primary"}`}>
            {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
