"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { savePackageAction } from "@/app/actions";
import { FeatureGrid, type FeatureOption, type PackageOption } from "@/components/feature-grid";
import { PriceInput } from "@/components/price-input";
import { Field, SubmitButton } from "@/components/ui";
import { useResultToast } from "@/components/use-result-toast";

// Mirrors packageSchema in src/app/actions.ts and Package.name in prisma/schema.prisma.
const NAME_MAX = 120;

/** Create (`pkg = null`) or edit a package: name, price and the features it contains. */
export function PackageForm({ pkg, features }: { pkg: PackageOption | null; features: FeatureOption[] }) {
  const [state, action] = useActionState(savePackageAction.bind(null, pkg?.id ?? null), {});
  useResultToast(state, "بسته ذخیره شد.");
  const [selected, setSelected] = useState(() => new Set(pkg?.featureKeys ?? []));
  const errors = state.fieldErrors ?? {};
  const a11y = (name: string) => ({ "aria-invalid": errors[name] ? true : undefined, "aria-describedby": `${name}-msg` }) as const;

  return (
    <form action={action} className="space-y-5">
      <section className="card grid max-w-4xl gap-x-4 sm:grid-cols-2">
        <Field label="نام بسته" htmlFor="name" error={errors.name}>
          <input id="name" name="name" defaultValue={pkg?.name} maxLength={NAME_MAX} className="input" {...a11y("name")} />
        </Field>
        <Field label="قیمت بسته" htmlFor="price" error={errors.price}>
          <PriceInput id="price" name="price" defaultValue={pkg?.price || ""} {...a11y("price")} />
        </Field>
      </section>

      <section className="card space-y-3 @container">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 font-bold">قابلیت‌های بسته</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{selected.size.toLocaleString("fa-IR")} قابلیت انتخاب شده</span>
        </div>
        <FeatureGrid features={features} selected={selected} onChange={setSelected} />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{pkg ? "ذخیره بسته" : "افزودن بسته"}</SubmitButton>
        <Link href="/packages" className="btn btn-ghost">بازگشت</Link>
      </div>
    </form>
  );
}
