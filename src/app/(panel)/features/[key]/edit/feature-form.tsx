"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveFeatureAction } from "@/app/actions";
import { PriceInput } from "@/components/price-input";
import { SuggestInput } from "@/components/suggest-input";
import { Field, SubmitButton } from "@/components/ui";

type Defaults = { title: string; group: string; description: string; price: number; isActive: boolean };

// Limits mirror featureRowSchema in src/app/actions.ts and the Feature columns in prisma/schema.prisma.
const LIMITS = { title: 120, group: 80, description: 500 } as const;

export function FeatureForm({ featureKey, groups, defaults }: { featureKey: string; groups: string[]; defaults: Defaults }) {
  const [state, action] = useActionState(saveFeatureAction.bind(null, featureKey), {});
  const errors = state.fieldErrors ?? {};
  const a11y = (name: string) => ({ "aria-invalid": errors[name] ? true : undefined, "aria-describedby": `${name}-msg` }) as const;

  return (
    <form action={action} className="card space-y-2">
      {state.saved && <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">ذخیره شد.</p>}
      {state.error && !state.fieldErrors && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{state.error}</p>}
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="عنوان" htmlFor="title" error={errors.title}>
          <input id="title" name="title" defaultValue={defaults.title} maxLength={LIMITS.title} className="input" {...a11y("title")} />
        </Field>
        <Field label="گروه" htmlFor="group" error={errors.group} hint="برای دسته‌بندی در فهرست‌ها">
          <SuggestInput id="group" name="group" suggestions={groups} defaultValue={defaults.group} maxLength={LIMITS.group} {...a11y("group")} />
        </Field>
        <Field label="قیمت" htmlFor="price" error={errors.price}>
          <PriceInput id="price" name="price" defaultValue={defaults.price} {...a11y("price")} />
        </Field>
        <label className="mb-4 flex items-center gap-2 self-center text-sm">
          <input type="checkbox" name="isActive" defaultChecked={defaults.isActive} className="size-4 accent-indigo-600" />
          فعال (قابل خرید)
        </label>
      </div>
      <Field label="توضیح برای مشتری" htmlFor="description" error={errors.description} hint={`حداکثر ${LIMITS.description} نویسه`}>
        <textarea id="description" name="description" rows={5} defaultValue={defaults.description} maxLength={LIMITS.description} className="input" {...a11y("description")} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>ذخیره</SubmitButton>
        <Link href="/features" className="btn btn-ghost">بازگشت</Link>
      </div>
    </form>
  );
}
