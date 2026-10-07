"use client";

import { useActionState, useState } from "react";
import { saveSubscriptionSettingsAction } from "@/app/actions";
import { Select } from "@/components/select";
import { Field, SubmitButton } from "@/components/ui";
import { useResultToast } from "@/components/use-result-toast";
import { lockLabels, subscriptionLimits, type SubscriptionSettingsValues } from "@/lib/subscription";

const digitsLength = (max: number) => String(max).length;

/** The subscription rules: every number and choice the panel applies to sites' subscriptions. */
export function SubscriptionForm({ defaults }: { defaults: SubscriptionSettingsValues }) {
  const [state, action] = useActionState(saveSubscriptionSettingsAction, {});
  useResultToast(state, "تنظیمات اشتراک ذخیره شد.");
  const [lock, setLock] = useState<string>(defaults.lockAfterGrace);
  const errors = state.fieldErrors ?? {};
  const a11y = (name: string) => ({ "aria-invalid": errors[name] ? true : undefined, "aria-describedby": `${name}-msg` }) as const;
  const number = (name: "quarterlyDiscountPercent" | "yearlyDiscountPercent" | "graceDays" | "retentionDays", label: string, max: number, hint: string) => (
    <Field label={label} htmlFor={name} error={errors[name]} hint={hint}>
      <input id={name} name={name} dir="ltr" inputMode="numeric" defaultValue={String(defaults[name])} maxLength={digitsLength(max)} className={`input text-left ${errors[name] ? "!border-red-500" : ""}`} {...a11y(name)} />
    </Field>
  );

  return (
    <form action={action} className="card space-y-2">
      <div className="grid gap-x-4 sm:grid-cols-2">
        {number("quarterlyDiscountPercent", "تخفیف دوره‌ی سه‌ماهه (درصد)", subscriptionLimits.discountMax, "نسبت به سه برابر قیمت ماهانه")}
        {number("yearlyDiscountPercent", "تخفیف دوره‌ی سالانه (درصد)", subscriptionLimits.discountMax, "نسبت به دوازده برابر قیمت ماهانه")}
        {number("graceDays", "مهلت پس از پایان اشتراک (روز)", subscriptionLimits.graceDaysMax, "تا این مدت فروشگاه مثل قبل کار می‌کند؛ ۰ یعنی بدون مهلت")}
        {number("retentionDays", "نگه‌داری داده پس از تعلیق (روز)", subscriptionLimits.retentionDaysMax, "بعد از این مدت داده‌ی فروشگاه قابل حذف است")}
        <Field label="بعد از پایان مهلت" htmlFor="lockAfterGrace" error={errors.lockAfterGrace} hint="تعیین می‌کند چه بخشی بسته شود">
          <Select id="lockAfterGrace" name="lockAfterGrace" label="بعد از پایان مهلت" value={lock} onChange={setLock} options={Object.entries(lockLabels).map(([value, label]) => ({ value, label }))} />
        </Field>
        <Field label="یادآوری پیش از پایان (روز)" htmlFor="reminderDays" error={errors.reminderDays} hint="چند روز مانده به پایان یادآوری شود؛ با ویرگول جدا کنید">
          <input id="reminderDays" name="reminderDays" dir="ltr" defaultValue={defaults.reminderDays} maxLength={subscriptionLimits.reminderTextMax} className={`input text-left ${errors.reminderDays ? "!border-red-500" : ""}`} {...a11y("reminderDays")} />
        </Field>
      </div>
      <SubmitButton>ذخیره</SubmitButton>
    </form>
  );
}
