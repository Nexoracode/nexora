import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WINDOW = 2;

/** Page links for a server-rendered list; the current page lives in the `page` search param. */
export function Pagination({ page, pageCount, basePath, params = {} }: { page: number; pageCount: number; basePath: string; /** Other search params of the list (filters), kept on every page link. */ params?: Record<string, string> }) {
  if (pageCount <= 1) return null;
  const href = (target: number) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
    if (target > 1) query.set("page", String(target));
    return query.size ? `${basePath}?${query}` : basePath;
  };
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((value) => value === 1 || value === pageCount || Math.abs(value - page) <= WINDOW);

  // The base carries no colours: the idle and the current-page looks each bring their own, so they never fight over the background.
  const base = "inline-flex size-9 items-center justify-center rounded-lg border text-sm";
  const idle = "border-slate-200 bg-white";
  const edge = `${base} ${idle}`;
  return (
    <nav aria-label="صفحه‌بندی" className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? <Link href={href(page - 1)} aria-label="صفحهٔ قبل" className={`${edge} hover:bg-slate-50`}><ChevronRight size={16} aria-hidden /></Link> : <span aria-hidden className={`${edge} opacity-40`}><ChevronRight size={16} /></span>}
      {pages.map((value, index) => (
        <span key={value} className="flex items-center gap-1.5">
          {index > 0 && value - pages[index - 1]! > 1 && <span className="px-1 text-slate-400">…</span>}
          <Link href={href(value)} aria-current={value === page ? "page" : undefined} className={`${base} ${value === page ? "border-brand bg-brand font-bold text-white" : `${idle} hover:bg-slate-50`}`}>{value.toLocaleString("fa-IR")}</Link>
        </span>
      ))}
      {page < pageCount ? <Link href={href(page + 1)} aria-label="صفحهٔ بعد" className={`${edge} hover:bg-slate-50`}><ChevronLeft size={16} aria-hidden /></Link> : <span aria-hidden className={`${edge} opacity-40`}><ChevronLeft size={16} /></span>}
    </nav>
  );
}
