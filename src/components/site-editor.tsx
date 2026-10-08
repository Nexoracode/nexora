"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FormState } from "@/app/actions";
import { formatToman, normalizeDigits } from "@/lib/format";
import { FeatureGrid, PackagePicker, SelectionSummary, type AppliedPackage, type FeatureOption, type PackageOption } from "./feature-grid";
import { JalaliDateField } from "./jalali-date-field";
import { Select } from "./select";
import { SuggestInput } from "./suggest-input";
import { PriceInput } from "./price-input";
import { KeyBox } from "./key-box";
import { Loader2 } from "lucide-react";
import { useResultToast } from "@/components/use-result-toast";
import { TabPanel, Tabs } from "./tabs";
import { useSubmitWithoutReset } from "./use-submit-without-reset";
import { Field } from "./ui";

export type SiteDefaults = {
  domain: string;
  clientName: string;
  clientPhone: string;
  status: "ACTIVE" | "SUSPENDED";
  contractPrice: number;
  expiresAt: string;
  planId: string;
  period: "" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  notes: string;
  featureKeys: string[];
};

const emptySite: SiteDefaults = { domain: "", clientName: "", clientPhone: "", status: "ACTIVE", contractPrice: 0, expiresAt: "", planId: "", period: "", notes: "", featureKeys: [] };

// Limits mirror siteSchema in src/app/actions.ts and the Site columns in prisma/schema.prisma.
const LIMITS = { domain: 191, clientName: 120, clientPhone: 20, notes: 1000 } as const;

export type ExtraTab = { id: string; label: string; badge?: number; content: ReactNode };

export function SiteEditor({ action, features, packages, site = emptySite, clientNames, mode, extraTabs = [], infoTop, infoAside }: {
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
  /** Display-only card shown beside the info form (the site history). */
  infoAside?: ReactNode;
}) {
  const [state, formAction, saving] = useActionState(action, {});
  const submit = useSubmitWithoutReset(formAction);
  useResultToast(state, "تغییرات ذخیره شد.");
  const [selected, setSelected] = useState(() => new Set(site.featureKeys));
  // The saved selection: the card measures what was added or removed against it.
  const baseline = useMemo(() => new Set(site.featureKeys), [site.featureKeys]);
  const [status, setStatus] = useState<SiteDefaults["status"]>(site.status);
  const [planId, setPlanId] = useState(site.planId);
  const [period, setPeriod] = useState<string>(site.period);
  const plans = packages.filter((pkg) => pkg.monthlyPrice !== null);
  const [price, setPrice] = useState(String(site.contractPrice || ""));
  // How things were before the first package was applied, so one click can bring them back.
  const [beforePackage, setBeforePackage] = useState<{ selected: Set<string>; price: string } | null>(null);
  const [applied, setApplied] = useState<AppliedPackage | null>(null);
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

      {/* Tabs and the save button share one row that stays at the top while the page scrolls (desktop). */}
      <div className="flex items-center justify-between gap-4 bg-[#f6f7fb] shadow-[inset_0_-1px_0_#e2e8f0] lg:sticky lg:top-0 lg:z-20">
        <Tabs
          bare
          label="بخش‌های سایت"
          idPrefix={idPrefix}
          value={tab}
          onChange={setTab}
          tabs={[{ id: "info", label: "مشخصات" }, { id: "features", label: "قابلیت‌ها", badge: selected.size }, ...extraTabs.map(({ id, label, badge }) => ({ id, label, badge }))]}
        />
        <button type="submit" form="site-form" disabled={saving} hidden={!editsForm} className="btn btn-primary my-1.5 shrink-0">
          {saving && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {mode === "create" ? "ثبت سایت و ساخت کلید" : "ذخیره تغییرات"}
        </button>
      </div>

      {infoTop && <div hidden={tab !== "info"}>{infoTop}</div>}

      <form id="site-form" onSubmit={submit} className="space-y-5">
        <TabPanel id="info" value={tab} idPrefix={idPrefix}>
          <div className={infoAside ? "grid gap-5 xl:grid-cols-[minmax(0,52rem)_minmax(20rem,1fr)]" : ""}>
          <section className="card grid max-w-4xl gap-x-4 sm:grid-cols-2">
            <Field label="دامنه سایت" htmlFor="domain" error={errors.domain} hint="مثلاً shop.example.ir">
              <input id="domain" name="domain" dir="ltr" defaultValue={site.domain} maxLength={LIMITS.domain} className="input text-left" {...invalid("domain")} />
            </Field>
            <Field label="نام مشتری" htmlFor="clientName" error={errors.clientName}>
              <SuggestInput id="clientName" name="clientName" suggestions={clientNames} defaultValue={site.clientName} maxLength={LIMITS.clientName} {...invalid("clientName")} />
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
            <Field label="پلن اشتراک" htmlFor="planId" error={errors.planId} hint="خالی یعنی سایت پلن اشتراک ندارد">
              <Select id="planId" name="planId" label="پلن اشتراک" value={planId} onChange={setPlanId} options={[{ value: "", label: "بدون پلن" }, ...plans.map((plan) => ({ value: plan.id, label: plan.name }))]} />
            </Field>
            <Field label="دوره‌ی اشتراک" htmlFor="period" error={errors.period}>
              <Select id="period" name="period" label="دوره‌ی اشتراک" value={period} onChange={setPeriod} options={[{ value: "", label: "بدون دوره" }, { value: "MONTHLY", label: "ماهانه" }, { value: "QUARTERLY", label: "سه‌ماهه" }, { value: "YEARLY", label: "سالانه" }]} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="یادداشت" htmlFor="notes" error={errors.notes} hint={`حداکثر ${LIMITS.notes} نویسه`}>
                <textarea id="notes" name="notes" rows={3} defaultValue={site.notes} maxLength={LIMITS.notes} className="input" {...invalid("notes")} />
              </Field>
            </div>
          </section>
          {/* A wrapper with a single child: a server-made element next to siblings makes React ask for a key. */}
          {infoAside && <div className="contents">{infoAside}</div>}
          </div>
        </TabPanel>

        <TabPanel id="features" value={tab} idPrefix={idPrefix}>
          <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
            {/* First in the markup, so it docks on the right in this right-to-left layout. */}
            <SelectionSummary features={features} selected={selected} baseline={baseline} currentPrice={mode === "edit" ? site.contractPrice : null} applied={applied} />
          <section className="card @container space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 font-bold">قابلیت‌های فعال</h2>
              <p className="m-0 text-sm">
                جمع قابلیت‌ها: <b>{formatToman(total)}</b>
                {contract > 0 && <span className={contract >= total ? "text-green-700" : "text-amber-700"}> · قرارداد {formatToman(contract)}</span>}
              </p>
            </div>
            <PackagePicker packages={packages} selected={selected} onAppliedChange={setApplied} onApply={(pkg) => {
              setBeforePackage((prev) => prev ?? { selected: new Set(selected), price });
              setSelected(new Set(pkg.featureKeys));
              if (!price) setPrice(String(pkg.price || ""));
            }}
            onUndo={beforePackage ? () => { setSelected(beforePackage.selected); setPrice(beforePackage.price); setBeforePackage(null); } : undefined}
          />
            <FeatureGrid features={features} selected={selected} onChange={setSelected} />
          </section>
          </div>
        </TabPanel>

      </form>

      {extraTabs.map((extra) => (
        <TabPanel key={extra.id} id={extra.id} value={tab} idPrefix={idPrefix}>{extra.content}</TabPanel>
      ))}
    </div>
  );
}
