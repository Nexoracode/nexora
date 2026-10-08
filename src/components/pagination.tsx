"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "@/components/select";
import { PAGE_SIZE, PAGE_SIZES } from "@/lib/paging";

const fa = (value: number) => value.toLocaleString("fa-IR");

/**
 * The footer under a table: which rows are shown (right), and on the left how many rows per page
 * and the previous / next arrows. The other search params of the list (filters) stay on every link.
 */
export function Pagination({ page, pageCount, basePath, params = {}, size, total }: {
  page: number;
  pageCount: number;
  basePath: string;
  /** Other search params of the list, kept on every link. */
  params?: Record<string, string>;
  size: number;
  total: number;
}) {
  const router = useRouter();
  // Nothing to page through, and no reason to offer a bigger page.
  if (total <= PAGE_SIZE) return null;

  const href = (target: number, rows = size) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
    if (rows !== PAGE_SIZE) query.set("size", String(rows));
    if (target > 1) query.set("page", String(target));
    return query.size ? `${basePath}?${query}` : basePath;
  };
  const from = (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  const arrow = "inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white";

  return (
    <nav aria-label="صفحه‌بندی" className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <span>نمایش {fa(from)} تا {fa(to)} از {fa(total)}</span>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span>در هر صفحه</span>
          <Select
            compact
            menuAbove
            label="تعداد نمایش در صفحه"
            className="w-20"
            value={String(size)}
            onChange={(value) => router.push(href(1, Number(value)))}
            options={PAGE_SIZES.map((rows) => ({ value: String(rows), label: fa(rows) }))}
          />
        </div>

        <div className="flex items-center gap-2">
          {page > 1
            ? <Link href={href(page - 1)} aria-label="صفحهٔ قبل" className={`${arrow} hover:bg-slate-50`}><ChevronRight size={16} aria-hidden /></Link>
            : <span aria-hidden className={`${arrow} opacity-40`}><ChevronRight size={16} /></span>}
          <span className="min-w-14 text-center text-slate-700" aria-current="page">{fa(page)} از {fa(pageCount)}</span>
          {page < pageCount
            ? <Link href={href(page + 1)} aria-label="صفحهٔ بعد" className={`${arrow} hover:bg-slate-50`}><ChevronLeft size={16} aria-hidden /></Link>
            : <span aria-hidden className={`${arrow} opacity-40`}><ChevronLeft size={16} /></span>}
        </div>
      </div>
    </nav>
  );
}
