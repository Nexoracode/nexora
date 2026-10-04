"use client";

import { useActionState } from "react";
import { saveFeaturesAction } from "@/app/actions";
import type { FeatureOption } from "@/components/feature-grid";
import { SubmitButton } from "@/components/ui";

export function FeaturesForm({ features }: { features: FeatureOption[] }) {
  const [state, action] = useActionState(saveFeaturesAction, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{state.error}</p>}
      {state.saved && <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">ذخیره شد.</p>}
      <div className="card divide-y divide-slate-100">
        {features.map((feature) => (
          <div key={feature.key} className="grid items-center gap-3 py-3 sm:grid-cols-[1fr_1fr_12rem]">
            <div>
              <p className="text-xs text-slate-500">{feature.group}</p>
              <code dir="ltr" className="text-xs">{feature.key}</code>
            </div>
            <input name={`title:${feature.key}`} defaultValue={feature.title} maxLength={120} aria-label={`عنوان ${feature.key}`} className="input" />
            <input name={`price:${feature.key}`} defaultValue={feature.price} inputMode="numeric" maxLength={14} aria-label={`قیمت ${feature.key} (تومان)`} className="input" />
          </div>
        ))}
      </div>
      <SubmitButton>ذخیره</SubmitButton>
    </form>
  );
}
