"use client";

import { useActionState, useState } from "react";
import { deletePackageAction, savePackageAction } from "@/app/actions";
import { FeatureGrid, type FeatureOption, type PackageOption } from "@/components/feature-grid";
import { Field, SubmitButton } from "@/components/ui";

// Mirrors packageSchema in src/app/actions.ts and Package.name in prisma/schema.prisma.
const NAME_MAX = 120;

/** One card per package; `pkg = null` renders the "new package" form. */
export function PackageCard({ pkg, features }: { pkg: PackageOption | null; features: FeatureOption[] }) {
  const [state, action] = useActionState(savePackageAction.bind(null, pkg?.id ?? null), {});
  const [selected, setSelected] = useState(() => new Set(pkg?.featureKeys ?? []));
  const id = pkg?.id ?? "new";

  return (
    <section className="card space-y-4">
      <h2 className="font-bold">{pkg ? pkg.name : "بسته جدید"}</h2>
      <form action={action} className="space-y-4">
        {state.error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{state.error}</p>}
        {state.saved && <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">ذخیره شد.</p>}
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="نام بسته" htmlFor={`name-${id}`}>
            <input id={`name-${id}`} name="name" defaultValue={pkg?.name} maxLength={NAME_MAX} className="input" />
          </Field>
          <Field label="قیمت بسته (تومان)" htmlFor={`price-${id}`}>
            <input id={`price-${id}`} name="price" defaultValue={pkg?.price || ""} inputMode="numeric" maxLength={14} className="input" />
          </Field>
        </div>
        <FeatureGrid features={features} selected={selected} onChange={setSelected} />
        <SubmitButton>{pkg ? "ذخیره بسته" : "افزودن بسته"}</SubmitButton>
      </form>
      {pkg && (
        <form action={deletePackageAction.bind(null, pkg.id)} onSubmit={(e) => { if (!confirm("این بسته حذف شود؟ سایت‌هایی که قبلاً با آن ساخته شده‌اند تغییری نمی‌کنند.")) e.preventDefault(); }}>
          <SubmitButton variant="danger">حذف بسته</SubmitButton>
        </form>
      )}
    </section>
  );
}
