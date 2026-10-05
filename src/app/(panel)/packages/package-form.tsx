"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { savePackageAction } from "@/app/actions";
import { FeatureGrid, SelectionSummary, type FeatureOption, type PackageOption } from "@/components/feature-grid";
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
  const baseline = useMemo(() => new Set(pkg?.featureKeys ?? []), [pkg]);
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

      {/* Same layout as the features tab of a site: the live selection card docks on the right. */}
      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <SelectionSummary features={features} selected={selected} baseline={baseline} currentPrice={pkg ? pkg.price : null} applied={null} />
        <section className="card space-y-3 @container">
          <h2 className="m-0 font-bold">قابلیت‌های بسته</h2>
          <FeatureGrid features={features} selected={selected} onChange={setSelected} />
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{pkg ? "ذخیره بسته" : "افزودن بسته"}</SubmitButton>
        <Link href="/packages" className="btn btn-ghost">بازگشت</Link>
      </div>
    </form>
  );
}
