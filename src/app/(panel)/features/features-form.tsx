"use client";

import { useActionState } from "react";
import { saveFeaturesAction } from "@/app/actions";
import type { FeatureOption } from "@/components/feature-grid";
import { SubmitButton } from "@/components/ui";

// Limits mirror featureRowSchema in src/app/actions.ts and the Feature columns in prisma/schema.prisma.
const LIMITS = { title: 120, description: 500 } as const;

export function FeaturesForm({ features }: { features: FeatureOption[] }) {
  const [state, action] = useActionState(saveFeaturesAction, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{state.error}</p>}
      {state.saved && <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">ذخیره شد.</p>}
      <div className="card divide-y divide-slate-100">
        {features.map((feature) => (
          <div key={feature.key} className="grid items-start gap-3 py-4 sm:grid-cols-[10rem_1fr_12rem]">
            <div>
              <p className="text-xs text-slate-500">{feature.group}</p>
              <code dir="ltr" className="text-xs">{feature.key}</code>
            </div>
            <div className="space-y-2">
              <input name={`title:${feature.key}`} defaultValue={feature.title} maxLength={LIMITS.title} aria-label={`عنوان ${feature.key}`} className="input" />
              <textarea name={`description:${feature.key}`} defaultValue={feature.description} maxLength={LIMITS.description} rows={3} placeholder="توضیح برای مشتری" aria-label={`توضیح ${feature.key}`} className="input" />
            </div>
            <input name={`price:${feature.key}`} defaultValue={feature.price} inputMode="numeric" maxLength={14} aria-label={`قیمت ${feature.key} (تومان)`} className="input" />
          </div>
        ))}
      </div>
      <SubmitButton>ذخیره</SubmitButton>
    </form>
  );
}
