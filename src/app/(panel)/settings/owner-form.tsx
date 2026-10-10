"use client";

import { useActionState } from "react";
import { saveOwnerSettingsAction } from "@/app/actions";
import { useResultToast } from "@/components/use-result-toast";
import { Field, SubmitButton } from "@/components/ui";

type Defaults = { holderName: string; cardNumber: string; sheba: string; bankName: string; contactPhone: string; note: string };

// Limits mirror ownerSchema in src/app/actions.ts and the OwnerSettings columns in prisma/schema.prisma.
const LIMITS = { holderName: 120, cardNumber: 19, sheba: 26, bankName: 60, contactPhone: 11, note: 500 } as const;

/** Where customers send a card-to-card payment, and what they read beside it. */
export function OwnerForm({ defaults }: { defaults: Defaults }) {
  const [state, action] = useActionState(saveOwnerSettingsAction, {});
  useResultToast(state, "اطلاعات ذخیره شد.");
  const errors = state.fieldErrors ?? {};
  const a11y = (name: string) => ({ "aria-invalid": errors[name] ? true : undefined, "aria-describedby": `${name}-msg` }) as const;
  return (
    <form action={action} className="space-y-5">
      <section className="card max-w-4xl">
        <h2 className="m-0 mb-4 text-base font-bold">حساب بانکی</h2>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="نام صاحب حساب" htmlFor="holderName" error={errors.holderName}>
            <input id="holderName" name="holderName" defaultValue={defaults.holderName} maxLength={LIMITS.holderName} className="input" {...a11y("holderName")} />
          </Field>
          <Field label="نام بانک" htmlFor="bankName" error={errors.bankName}>
            <input id="bankName" name="bankName" defaultValue={defaults.bankName} maxLength={LIMITS.bankName} className="input" {...a11y("bankName")} />
          </Field>
          <Field label="شماره کارت" htmlFor="cardNumber" error={errors.cardNumber} hint="۱۶ رقم">
            <input id="cardNumber" name="cardNumber" dir="ltr" inputMode="numeric" defaultValue={defaults.cardNumber} maxLength={LIMITS.cardNumber} className="input text-left" {...a11y("cardNumber")} />
          </Field>
          <Field label="شماره شبا" htmlFor="sheba" error={errors.sheba} hint="با IR شروع می‌شود">
            <input id="sheba" name="sheba" dir="ltr" defaultValue={defaults.sheba} maxLength={LIMITS.sheba} className="input text-left" {...a11y("sheba")} />
          </Field>
        </div>
      </section>

      <section className="card max-w-4xl">
        <h2 className="m-0 mb-4 text-base font-bold">پیام به مشتری</h2>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="شماره تماس" htmlFor="contactPhone" error={errors.contactPhone} hint="09xxxxxxxxx">
            <input id="contactPhone" name="contactPhone" dir="ltr" inputMode="tel" defaultValue={defaults.contactPhone} maxLength={LIMITS.contactPhone} className="input text-left" {...a11y("contactPhone")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="توضیح" htmlFor="note" error={errors.note} hint={`حداکثر ${LIMITS.note} نویسه`}>
              <textarea id="note" name="note" rows={3} defaultValue={defaults.note} maxLength={LIMITS.note} className="input" {...a11y("note")} />
            </Field>
          </div>
        </div>
      </section>

      <SubmitButton>ذخیره</SubmitButton>
    </form>
  );
}
