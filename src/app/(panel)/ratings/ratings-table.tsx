"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ColumnFilter } from "@/components/column-filter";
import { Modal } from "@/components/modal";

export type ShopRatings = {
  siteId: string;
  name: string;
  domain: string;
  count: number;
  average: number;
  lastAt: string;
  /** Every rating the shop gave, newest first. */
  items: Array<{ id: string; title: string; kind: string; stars: number; at: string }>;
};

const PREVIEW = 3;
const fa = (value: number, digits = 0) => value.toLocaleString("fa-IR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

function Stars({ value }: { value: number }) {
  return (
    <span dir="ltr" className="inline-flex items-center gap-0.5" role="img" aria-label={`${fa(value)} از ۵`}>
      {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} aria-hidden className={value >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"} />)}
    </span>
  );
}

/** The shops that rate; pressing a row opens everything that shop gave in a dialog, however many it is. */
export function RatingsTable({ shops }: { shops: ShopRatings[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = shops.find((shop) => shop.siteId === selectedId) ?? null;

  return (
    <>
      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">نام سایت<ColumnFilter param="q" label="نام سایت یا دامنه" /></span></th>
              <th className="px-4 py-3 text-start font-medium">دامنه</th>
              <th className="px-4 py-3 text-start font-medium">تعداد امتیاز</th>
              <th className="px-4 py-3 text-start font-medium">میانگین</th>
              <th className="px-4 py-3 text-start font-medium">امتیازها</th>
              <th className="px-4 py-3 text-start font-medium">آخرین امتیاز</th>
            </tr>
          </thead>
          <tbody>
            {shops.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">هنوز هیچ فروشگاهی امتیاز نداده است.</td></tr>}
            {shops.map((shop) => (
              <tr
                key={shop.siteId}
                tabIndex={0}
                onClick={() => setSelectedId(shop.siteId)}
                onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelectedId(shop.siteId); } }}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-bold">{shop.name}</td>
                <td className="px-4 py-3 text-slate-600"><span dir="ltr" className="inline-block">{shop.domain}</span></td>
                <td className="px-4 py-3">{fa(shop.count)}</td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5"><Star size={15} aria-hidden className="fill-amber-400 text-amber-400" /><strong>{fa(shop.average, 1)}</strong></span></td>
                <td className="px-4 py-3">
                  <ul className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
                    {shop.items.slice(0, PREVIEW).map((item) => (
                      <li key={item.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs">
                        {item.title}
                        <span className="inline-flex items-center gap-0.5 font-bold"><Star size={12} aria-hidden className="fill-amber-400 text-amber-400" />{fa(item.stars)}</span>
                      </li>
                    ))}
                    {shop.count > PREVIEW && <li className="text-xs text-slate-500">و {fa(shop.count - PREVIEW)} مورد دیگر</li>}
                  </ul>
                </td>
                <td className="px-4 py-3 text-slate-500">{shop.lastAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={selected !== null} wide title={selected ? selected.name : ""} onClose={() => setSelectedId(null)}>
        {selected && (
          <div className="space-y-4">
            <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span dir="ltr">{selected.domain}</span>
              <span>{fa(selected.count)} امتیاز</span>
              <span className="inline-flex items-center gap-1"><Star size={14} aria-hidden className="fill-amber-400 text-amber-400" />میانگین {fa(selected.average, 1)}</span>
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 text-start font-medium">قابلیت / بسته</th>
                    <th className="px-4 py-2.5 text-start font-medium">نوع</th>
                    <th className="px-4 py-2.5 text-start font-medium">امتیاز</th>
                    <th className="px-4 py-2.5 text-start font-medium">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 font-bold">{item.title}</td>
                      <td className="px-4 py-2.5 text-slate-600">{item.kind}</td>
                      <td className="px-4 py-2.5"><Stars value={item.stars} /></td>
                      <td className="px-4 py-2.5 text-slate-500">{item.at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
