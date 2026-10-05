"use client";

import { Fragment, useActionState, useState } from "react";
import { X } from "lucide-react";
import { saveFeatureAction } from "@/app/actions";
import type { FeatureOption } from "@/components/feature-grid";
import { PriceInput } from "@/components/price-input";
import { Field, SubmitButton } from "@/components/ui";
import { formatToman } from "@/lib/format";

// Limits mirror featureRowSchema in src/app/actions.ts and the Feature columns in prisma/schema.prisma.
const LIMITS = { title: 120, description: 500 } as const;

/** Table of features; a row opens its details right below it, and from there the edit form. */
export function FeaturesTable({ features }: { features: FeatureOption[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const toggle = (key: string) => {
    setSelected((prev) => (prev === key ? null : key));
    setEditing(false);
  };

  return (
    <div className="card overflow-x-auto !p-0">
      <table className="w-full min-w-[40rem] text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 text-start font-medium">قابلیت</th>
            <th className="px-4 py-3 text-start font-medium">گروه</th>
            <th className="px-4 py-3 text-start font-medium">کلید</th>
            <th className="px-4 py-3 text-start font-medium">قیمت</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => {
            const isOpen = selected === feature.key;
            return (
              <Fragment key={feature.key}>
                <tr
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => toggle(feature.key)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(feature.key); } }}
                  className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${isOpen ? "bg-indigo-50" : ""}`}
                >
                  <td className="px-4 py-3 font-bold">{feature.title}</td>
                  <td className="px-4 py-3 text-slate-500">{feature.group}</td>
                  <td className="px-4 py-3"><code dir="ltr" className="text-xs">{feature.key}</code></td>
                  <td className="px-4 py-3">{feature.price > 0 ? formatToman(feature.price) : <span className="text-slate-400">تعیین نشده</span>}</td>
                </tr>
                {isOpen && (
                  <tr className="border-t border-indigo-100 bg-indigo-50/40">
                    <td colSpan={4} className="px-4 py-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="m-0 text-sm font-bold">{feature.title}</h2>
                        <div className="flex gap-2">
                          <button type="button" className="btn btn-ghost" onClick={() => setEditing((value) => !value)}>{editing ? "نمایش جزئیات" : "ویرایش"}</button>
                          <button type="button" className="btn btn-ghost !px-2.5" aria-label="بستن جزئیات" onClick={() => toggle(feature.key)}><X size={16} aria-hidden /></button>
                        </div>
                      </div>
                      {editing ? <FeatureEditor key={feature.key} feature={feature} /> : <FeatureDetails feature={feature} />}
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

function FeatureDetails({ feature }: { feature: FeatureOption }) {
  return (
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
  );
}

function FeatureEditor({ feature }: { feature: FeatureOption }) {
  const [state, action] = useActionState(saveFeatureAction.bind(null, feature.key), {});
  const errors = state.fieldErrors ?? {};
  const a11y = (name: string) => ({ "aria-invalid": errors[name] ? true : undefined, "aria-describedby": `${feature.key}-${name}-msg` }) as const;
  const id = (name: string) => `${feature.key}-${name}`;
  return (
    <form action={action} className="space-y-1">
      {state.saved && <p role="status" className="mb-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">ذخیره شد.</p>}
      {state.error && !state.fieldErrors && <p role="alert" className="mb-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{state.error}</p>}
      <div className="grid gap-x-4 sm:grid-cols-[1fr_14rem]">
        <Field label="عنوان" htmlFor={id("title")} error={errors.title}>
          <input id={id("title")} name="title" defaultValue={feature.title} maxLength={LIMITS.title} className="input" {...a11y("title")} />
        </Field>
        <Field label="قیمت" htmlFor={id("price")} error={errors.price}>
          <PriceInput id={id("price")} name="price" defaultValue={feature.price} {...a11y("price")} />
        </Field>
      </div>
      <Field label="توضیح برای مشتری" htmlFor={id("description")} error={errors.description} hint={`حداکثر ${LIMITS.description} نویسه`}>
        <textarea id={id("description")} name="description" rows={3} defaultValue={feature.description} maxLength={LIMITS.description} className="input" {...a11y("description")} />
      </Field>
      <SubmitButton>ذخیره</SubmitButton>
    </form>
  );
}
