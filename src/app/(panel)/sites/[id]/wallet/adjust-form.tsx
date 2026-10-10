"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { type FormState } from "@/app/actions";
import { adjustWalletAction } from "@/app/support-actions";
import { PriceInput } from "@/components/price-input";
import { Select } from "@/components/select";
import { Field, SubmitButton } from "@/components/ui";
import { useResultToast } from "@/components/use-result-toast";

// Limits mirror adjustSchema in src/app/support-actions.ts.
const LIMITS = { amountDigits: 9, description: 191 } as const;

/** A manual raise or cut of the wallet, always with its reason. */
export function AdjustForm({ siteId }: { siteId: string }) {
  const [state, action] = useActionState<FormState, FormData>(adjustWalletAction.bind(null, siteId), {});
  const [direction, setDirection] = useState("credit");
  const formRef = useRef<HTMLFormElement>(null);
  useResultToast(state, "موجودی کیف پول تغییر کرد.");
  useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state]);
  const errors = state.fieldErrors ?? {};
  const a11y = (name: string) => ({ "aria-invalid": errors[name] ? true : undefined, "aria-describedby": `${name}-msg` }) as const;

  return (
    <form ref={formRef} action={action} className="card grid max-w-4xl gap-x-4 sm:grid-cols-3">
      <Field label="تغییر" htmlFor="direction">
        <Select id="direction" name="direction" label="تغییر" value={direction} onChange={setDirection} options={[{ value: "credit", label: "افزایش موجودی" }, { value: "debit", label: "کاهش موجودی" }]} />
      </Field>
      <Field label="مبلغ (تومان)" htmlFor="amount" error={errors.amount}>
        <PriceInput id="amount" name="amount" maxDigits={LIMITS.amountDigits} {...a11y("amount")} />
      </Field>
      <Field label="توضیح" htmlFor="description" error={errors.description}>
        <input id="description" name="description" maxLength={LIMITS.description} className="input" {...a11y("description")} />
      </Field>
      <div className="sm:col-span-3"><SubmitButton>ثبت</SubmitButton></div>
    </form>
  );
}
