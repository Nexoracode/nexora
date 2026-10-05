"use client";

import { useActionState, useState } from "react";
import { deletePackageAction, savePackageAction } from "@/app/actions";
import { FeatureGrid, type FeatureOption, type PackageOption } from "@/components/feature-grid";
import { ConfirmForm } from "@/components/confirm-form";
import { useResultToast } from "@/components/use-result-toast";
import { PriceInput } from "@/components/price-input";
import { Field, SubmitButton } from "@/components/ui";

// Mirrors packageSchema in src/app/actions.ts and Package.name in prisma/schema.prisma.
const NAME_MAX = 120;

/** One card per package; `pkg = null` renders the "new package" form. */
export function PackageCard({ pkg, features }: { pkg: PackageOption | null; features: FeatureOption[] }) {
  const [state, action] = useActionState(savePackageAction.bind(null, pkg?.id ?? null), {});
  useResultToast(state, "بسته ذخیره شد.");
  const [selected, setSelected] = useState(() => new Set(pkg?.featureKeys ?? []));
  const id = pkg?.id ?? "new";

  return (
    <section className="card space-y-4">
      <h2 className="font-bold">{pkg ? pkg.name : "بسته جدید"}</h2>
      <form action={action} className="space-y-4">
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="نام بسته" htmlFor={`name-${id}`}>
            <input id={`name-${id}`} name="name" defaultValue={pkg?.name} maxLength={NAME_MAX} className="input" />
          </Field>
          <Field label="قیمت بسته (تومان)" htmlFor={`price-${id}`}>
            <PriceInput id={`price-${id}`} name="price" defaultValue={pkg?.price || ""} />
          </Field>
        </div>
        <FeatureGrid features={features} selected={selected} onChange={setSelected} />
        <SubmitButton>{pkg ? "ذخیره بسته" : "افزودن بسته"}</SubmitButton>
      </form>
      {pkg && (
        <ConfirmForm
          action={deletePackageAction.bind(null, pkg.id)}
          title={`حذف بستهٔ «${pkg.name}»`}
          message="بسته حذف می‌شود. سایت‌هایی که قبلاً با آن ساخته شده‌اند تغییری نمی‌کنند."
          confirmLabel="حذف بسته"
          trigger={(open) => <button type="button" className="btn btn-danger" onClick={open}>حذف بسته</button>}
        />
      )}
    </section>
  );
}
