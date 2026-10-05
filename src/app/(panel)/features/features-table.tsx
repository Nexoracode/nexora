"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { Pencil, Power, PowerOff, X } from "lucide-react";
import { toggleFeatureActiveAction } from "@/app/actions";
import type { FeatureOption } from "@/components/feature-grid";
import { ConfirmForm } from "@/components/confirm-form";
import { IconSubmitButton } from "@/components/ui";
import { formatToman } from "@/lib/format";

/** One page of features; a row opens its details below it, the icons edit it or switch it on/off. */
export function FeaturesTable({ features }: { features: FeatureOption[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const toggle = (key: string) => setSelected((prev) => (prev === key ? null : key));

  return (
    <div className="card overflow-x-auto !p-0">
      <table className="w-full min-w-[44rem] text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 text-start font-medium">قابلیت</th>
            <th className="px-4 py-3 text-start font-medium">گروه</th>
            <th className="px-4 py-3 text-start font-medium">قیمت</th>
            <th className="px-4 py-3 text-start font-medium">وضعیت</th>
            <th className="px-4 py-3 text-start font-medium">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {features.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">قابلیتی پیدا نشد.</td></tr>
          )}
          {features.map((feature) => {
            const isOpen = selected === feature.key;
            return (
              <Fragment key={feature.key}>
                <tr
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => toggle(feature.key)}
                  onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); toggle(feature.key); } }}
                  className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${isOpen ? "bg-indigo-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <p className="m-0 font-bold">{feature.title}</p>
                    <code dir="ltr" className="text-xs text-slate-500">{feature.key}</code>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{feature.group}</td>
                  <td className="px-4 py-3">{feature.price > 0 ? formatToman(feature.price) : <span className="text-slate-400">تعیین نشده</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${feature.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{feature.isActive ? "فعال" : "غیرفعال"}</span>
                  </td>
                  {/* Clicks on the icons must not open or close the row. */}
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/features/${feature.key}/edit`} aria-label={`ویرایش ${feature.title}`} title="ویرایش" className="btn btn-ghost !px-2.5 !py-2"><Pencil size={16} aria-hidden /></Link>
                      {feature.isActive ? (
                        <ConfirmForm
                          action={toggleFeatureActiveAction.bind(null, feature.key)}
                          title={`غیرفعال‌کردن «${feature.title}»`}
                          message="تا فعال‌سازی دوباره، این قابلیت قابل خرید نیست. سایت‌هایی که آن را دارند همچنان استفاده می‌کنند."
                          confirmLabel="غیرفعال شود"
                          trigger={(open) => (
                            <button type="button" onClick={open} aria-label={`غیرفعال‌کردن ${feature.title}`} title="غیرفعال‌کردن" className="btn btn-danger !px-2.5 !py-2"><PowerOff size={16} aria-hidden /></button>
                          )}
                        />
                      ) : (
                        <form action={toggleFeatureActiveAction.bind(null, feature.key)}>
                          <IconSubmitButton label={`فعال‌کردن ${feature.title}`}><Power size={16} aria-hidden /></IconSubmitButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-t border-indigo-100 bg-indigo-50/40">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h2 className="m-0 text-sm font-bold">{feature.title}</h2>
                        <button type="button" className="btn btn-ghost !px-2.5" aria-label="بستن جزئیات" onClick={() => toggle(feature.key)}><X size={16} aria-hidden /></button>
                      </div>
                      <dl className="m-0 grid gap-4 text-sm sm:grid-cols-[1fr_auto]">
                        <div>
                          <dt className="text-xs text-slate-500">توضیح برای مشتری</dt>
                          <dd className="m-0 mt-1 leading-7">{feature.description || <span className="text-slate-400">توضیحی ثبت نشده است.</span>}</dd>
                        </div>
                        <div className="sm:text-end">
                          <dt className="text-xs text-slate-500">قیمت</dt>
                          <dd className="m-0 mt-1 font-bold">{feature.price > 0 ? formatToman(feature.price) : "تعیین نشده"}</dd>
                        </div>
                      </dl>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
