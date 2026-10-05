"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FormState } from "@/app/actions";
import { formatToman, normalizeDigits } from "@/lib/format";
import { FeatureGrid, PackagePicker, type FeatureOption, type PackageOption } from "./feature-grid";
import { JalaliDateField } from "./jalali-date-field";
import { Select } from "./select";
import { PriceInput } from "./price-input";
import { KeyBox } from "./key-box";
import { TabPanel, Tabs } from "./tabs";
import { Field, SubmitButton } from "./ui";

export type SiteDefaults = {
  domain: string;
  clientName: string;
  clientPhone: string;
  status: "ACTIVE" | "SUSPENDED";
  contractPrice: number;
  expiresAt: string;
  notes: string;
  featureKeys: string[];
};

const emptySite: SiteDefaults = { domain: "", clientName: "", clientPhone: "", status: "ACTIVE", contractPrice: 0, expiresAt: "", notes: "", featureKeys: [] };

// Limits mirror siteSchema in src/app/actions.ts and the Site columns in prisma/schema.prisma.
const LIMITS = { domain: 191, clientName: 120, clientPhone: 20, notes: 1000 } as const;

export type ExtraTab = { id: string; label: string; badge?: number; content: ReactNode };

export function SiteEditor({ action, features, packages, site = emptySite, clientNames, mode, extraTabs = [], infoTop }: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  features: FeatureOption[];
  packages: PackageOption[];
  site?: SiteDefaults;
  clientNames: string[];
  mode: "create" | "edit";
  /** Tabs outside the form (history); shown after the editable ones. */
  extraTabs?: ExtraTab[];
  /** Content above the form on the info tab; it holds its own forms, so it cannot live inside this one. */
  infoTop?: ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  const [selected, setSelected] = useState(() => new Set(site.featureKeys));
  const [status, setStatus] = useState<SiteDefaults["status"]>(site.status);
  const [price, setPrice] = useState(String(site.contractPrice || ""));
  const [tab, setTab] = useState("info");
  const errors = state.fieldErrors ?? {};

  // Every validated field lives on the first tab, so a failed save must bring it back into view.
  useEffect(() => {
    if (state.fieldErrors) setTab("info");
  }, [state.fieldErrors]);
  const total = useMemo(() => features.filter((f) => selected.has(f.key)).reduce((sum, f) => sum + f.price, 0), [features, selected]);
  const contract = Number(normalizeDigits(price).replace(/[,٬\s]/g, "")) || 0;

  const invalid = (name: string) => ({ "aria-invalid": errors[name] ? true : undefined, "aria-describedby": `${name}-msg` }) as const;

  const idPrefix = "site";
  const editsForm = tab === "info" || tab === "features";

  return (
    <div className="space-y-5">
      {state.key && (
        <div className="space-y-3">
          <KeyBox licenseKey={state.key} />
          {state.siteId && <Link href={`/sites/${state.siteId}`} className="btn btn-primary">رفتن به صفحه سایت</Link>}
        </div>
      )}
      {!state.key && state.error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{state.error}</p>}
      {state.saved && <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">تغییرات ذخیره شد.</p>}

      <Tabs
        label="بخش‌های سایت"
        idPrefix={idPrefix}
        value={tab}
        onChange={setTab}
        tabs={[{ id: "info", label: "مشخصات" }, { id: "features", label: "قابلیت‌ها", badge: selected.size }, ...extraTabs.map(({ id, label, badge }) => ({ id, label, badge }))]}
      />

      {infoTop && <div hidden={tab !== "info"}>{infoTop}</div>}

      <form action={formAction} className="space-y-5">
        <TabPanel id="info" value={tab} idPrefix={idPrefix}>
          <section className="card grid gap-x-4 sm:grid-cols-2">
            <Field label="دامنه سایت" htmlFor="domain" error={errors.domain} hint="مثلاً shop.example.ir">
              <input id="domain" name="domain" dir="ltr" defaultValue={site.domain} maxLength={LIMITS.domain} className="input text-left" {...invalid("domain")} />
            </Field>
            <Field label="نام مشتری" htmlFor="clientName" error={errors.clientName}>
              <input id="clientName" name="clientName" list="client-names" defaultValue={site.clientName} maxLength={LIMITS.clientName} className="input" {...invalid("clientName")} />
              <datalist id="client-names">{clientNames.map((name) => <option key={name} value={name} />)}</datalist>
            </Field>
            <Field label="شماره تماس" htmlFor="clientPhone" error={errors.clientPhone}>
              <input id="clientPhone" name="clientPhone" dir="ltr" inputMode="tel" defaultValue={site.clientPhone} maxLength={LIMITS.clientPhone} className="input text-left" {...invalid("clientPhone")} />
            </Field>
            <Field label="وضعیت" htmlFor="status">
              <Select id="status" name="status" label="وضعیت" value={status} onChange={(value) => setStatus(value as SiteDefaults["status"])} options={[{ value: "ACTIVE", label: "فعال" }, { value: "SUSPENDED", label: "تعلیق" }]} />
            </Field>
            <Field label="مبلغ قرارداد (تومان)" htmlFor="contractPrice" error={errors.contractPrice}>
              <PriceInput id="contractPrice" name="contractPrice" value={price} onValueChange={setPrice} {...invalid("contractPrice")} />
            </Field>
            <Field label="تاریخ انقضا" htmlFor="expiresAt" hint="خالی یعنی بدون انقضا">
              <JalaliDateField id="expiresAt" name="expiresAt" defaultValue={site.expiresAt} aria-describedby="expiresAt-msg" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="یادداشت" htmlFor="notes" error={errors.notes} hint={`حداکثر ${LIMITS.notes} نویسه`}>
                <textarea id="notes" name="notes" rows={3} defaultValue={site.notes} maxLength={LIMITS.notes} className="input" {...invalid("notes")} />
              </Field>
            </div>
          </section>
        </TabPanel>

        <TabPanel id="features" value={tab} idPrefix={idPrefix}>
          <section className="card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 font-bold">قابلیت‌های فعال</h2>
              <p className="m-0 text-sm">
                جمع قابلیت‌ها: <b>{formatToman(total)}</b>
                {contract > 0 && <span className={contract >= total ? "text-green-700" : "text-amber-700"}> · قرارداد {formatToman(contract)}</span>}
              </p>
            </div>
            <PackagePicker packages={packages} selected={selected} onApply={(pkg) => { setSelected(new Set(pkg.featureKeys)); if (!price) setPrice(String(pkg.price || "")); }} />
            <FeatureGrid features={features} selected={selected} onChange={setSelected} />
          </section>
        </TabPanel>

        <div hidden={!editsForm}>
          <SubmitButton>{mode === "create" ? "ثبت سایت و ساخت کلید" : "ذخیره تغییرات"}</SubmitButton>
        </div>
      </form>

      {extraTabs.map((extra) => (
        <TabPanel key={extra.id} id={extra.id} value={tab} idPrefix={idPrefix}>{extra.content}</TabPanel>
      ))}
    </div>
  );
}
