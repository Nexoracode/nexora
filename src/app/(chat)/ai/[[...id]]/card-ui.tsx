import type { ReactNode } from "react";
import { Check, Star, X } from "lucide-react";
import { isStatusWord } from "@/lib/ai-status";
import { StatusChip } from "./status-chip";

export const toman = (value: number) => `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;
export const num = (value: number) => value.toLocaleString("fa-IR");
export const dateTime = (value: string | null | undefined) => (value ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—");
export const date = (value: string | null | undefined) => (value ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium" }).format(new Date(value)) : "—");

/** A status or priority word as the panel's coloured chip; anything else as a neutral chip. */
export function Chip({ value, label }: { value: string; label?: string }) {
  if (isStatusWord(value)) return <StatusChip word={value} />;
  return <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">{label ?? value}</span>;
}

/** Yellow stars, the filled ones solid and the rest grey. */
export function Stars({ value, total = 5 }: { value: number; total?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" role="img" aria-label={`${value} از ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <Star key={index} size={15} aria-hidden className={index < value ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
      ))}
    </span>
  );
}

/** A green tick for what is on / included, a grey cross for what is off. */
export function CheckMark({ on = true }: { on?: boolean }) {
  return on ? (
    <span aria-label="دارد" className="grid size-5 shrink-0 place-items-center rounded-full bg-green-100 text-green-600"><Check size={13} strokeWidth={3} aria-hidden /></span>
  ) : (
    <span aria-label="ندارد" className="grid size-5 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400"><X size={13} strokeWidth={3} aria-hidden /></span>
  );
}

export function Panel({ title, aside, children }: { title?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#dfe2ee] bg-white">
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <h3 className="m-0 text-sm font-bold">{title}</h3>
          {aside && <span className="text-xs text-slate-500">{aside}</span>}
        </header>
      )}
      {children}
    </section>
  );
}

export type Column<T> = { head: string; cell: (row: T) => ReactNode; className?: string };

/** The same table the panel uses for tickets: grey header, a light line between rows. */
export function DataTable<T>({ columns, rows, empty = "موردی پیدا نشد.", footer }: { columns: Column<T>[]; rows: T[]; empty?: string; footer?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#dfe2ee] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>{columns.map((column) => <th key={column.head} className="whitespace-nowrap px-4 py-3 text-start font-medium">{column.head}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">{empty}</td></tr>}
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-slate-100 hover:bg-slate-50">
                {columns.map((column) => <td key={column.head} className={`px-4 py-3 ${column.className ?? ""}`}>{column.cell(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && <p className="m-0 border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">{footer}</p>}
    </div>
  );
}

export const ltr = (text: string) => <bdi dir="ltr" className="inline-block">{text}</bdi>;
