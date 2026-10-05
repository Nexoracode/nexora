"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

type Tone = "success" | "error";
type Item = { id: number; tone: Tone; message: string; closing: boolean };

const VISIBLE_MS = 3500;
const EXIT_MS = 200;
const MAX_ITEMS = 3;

let nextId = 1;
const listeners = new Set<(item: Item) => void>();

function push(tone: Tone, message: string) {
  const item: Item = { id: nextId++, tone, message, closing: false };
  listeners.forEach((listener) => listener(item));
}

/** Fire-and-forget notifications, callable from any client component. */
export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
};

/**
 * Renders the toasts, stacked in the top-right corner of the screen. Mount it once in the root
 * layout. Each toast slides in, stays a few seconds, then plays the entrance backwards and goes.
 */
export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const add = (item: Item) => setItems((prev) => [...prev.slice(-(MAX_ITEMS - 1)), item]);
    listeners.add(add);
    return () => { listeners.delete(add); };
  }, []);

  const close = (id: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, closing: true } : item)));
    setTimeout(() => setItems((prev) => prev.filter((item) => item.id !== id)), EXIT_MS);
  };

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2" dir="rtl">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onClose={() => close(item.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onClose }: { item: Item; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, VISIBLE_MS);
    return () => clearTimeout(timer);
    // The timer must start once per toast, not each time the parent re-renders with a new callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const success = item.tone === "success";
  return (
    <div
      role={success ? "status" : "alert"}
      className={`${item.closing ? "slide-out-right" : "slide-in-right"} pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg ${success ? "border-green-200" : "border-red-200"}`}
    >
      {success ? <CheckCircle2 size={20} aria-hidden className="mt-0.5 shrink-0 text-green-600" /> : <XCircle size={20} aria-hidden className="mt-0.5 shrink-0 text-red-600" />}
      <p className="m-0 flex-1 text-sm leading-6">{item.message}</p>
      <button type="button" aria-label="بستن" onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={14} aria-hidden /></button>
    </div>
  );
}
