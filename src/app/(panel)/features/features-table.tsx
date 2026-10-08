"use client";

import { Fragment, useState } from "react";
import { Pencil, Power, PowerOff } from "lucide-react";
import { toggleFeatureActiveAction } from "@/app/actions";
import type { FeatureOption } from "@/components/feature-grid";
import { ColumnFilter } from "@/components/column-filter";
import { ConfirmForm } from "@/components/confirm-form";
import { IconButton, IconLink, IconSubmitButton } from "@/components/icon-action";
import { formatToman } from "@/lib/format";
import type { RatingAverage } from "@/lib/ratings";
import { RatingCell } from "@/components/rating-cell";

/** One page of features; a row opens its details below it, the icons edit it or switch it on/off. */
export function FeaturesTable({ features, ratings, groups }: { features: FeatureOption[]; ratings: Record<string, RatingAverage>; groups: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const toggle = (key: string) => setSelected((prev) => (prev === key ? null : key));

  return (
    <div className="card overflow-x-auto !p-0">
      <table className="w-full min-w-[44rem] text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">قابلیت<ColumnFilter param="q" label="قابلیت" /></span></th>
            <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">گروه<ColumnFilter param="group" label="گروه" options={groups.map((group) => ({ value: group, label: group }))} /></span></th>
            <th className="px-4 py-3 text-start font-medium">قیمت</th>
            <th className="px-4 py-3 text-start font-medium">امتیاز</th>
            <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">وضعیت<ColumnFilter param="active" label="وضعیت" options={[{ value: "yes", label: "فعال" }, { value: "no", label: "غیرفعال" }]} /></span></th>
            <th className="px-4 py-3 text-start font-medium">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {features.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">قابلیتی پیدا نشد.</td></tr>
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
                  <td className="px-4 py-3"><RatingCell rating={ratings[feature.key]} /></td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${feature.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{feature.isActive ? "فعال" : "غیرفعال"}</span>
                  </td>
                  {/* Clicks on the icons must not open or close the row. */}
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <IconLink href={`/features/${feature.key}/edit`} label={`ویرایش ${feature.title}`} tip="ویرایش"><Pencil size={17} aria-hidden /></IconLink>
                      {feature.isActive ? (
                        <ConfirmForm
                          action={toggleFeatureActiveAction.bind(null, feature.key)}
                          title={`غیرفعال‌کردن «${feature.title}»`}
                          message="تا فعال‌سازی دوباره، این قابلیت قابل خرید نیست. سایت‌هایی که آن را دارند همچنان استفاده می‌کنند."
                          confirmLabel="غیرفعال شود"
                          trigger={(open) => (
                            <IconButton label={`غیرفعال‌کردن ${feature.title}`} tip="غیرفعال‌کردن" tone="danger" onClick={open}><PowerOff size={17} aria-hidden /></IconButton>
                          )}
                        />
                      ) : (
                        <form action={toggleFeatureActiveAction.bind(null, feature.key)}>
                          <IconSubmitButton label={`فعال‌کردن ${feature.title}`} tip="فعال‌کردن" tone="success"><Power size={17} aria-hidden /></IconSubmitButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-t border-indigo-100 bg-indigo-50/40">
                    <td colSpan={6} className="px-4 py-4">
                      <dl className="m-0 text-sm">
                        <div>
                          <dt className="text-xs text-slate-500">توضیح برای مشتری</dt>
                          <dd className="m-0 mt-1 leading-7">{feature.description || <span className="text-slate-400">توضیحی ثبت نشده است.</span>}</dd>
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
