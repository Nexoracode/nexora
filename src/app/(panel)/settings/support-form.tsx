"use client";

import { useActionState } from "react";
import { saveSupportSettingsAction } from "@/app/actions";
import { PriceInput } from "@/components/price-input";
import { useResultToast } from "@/components/use-result-toast";
import { Field, SubmitButton } from "@/components/ui";

/** The fee of one support ticket; the free months are set on each site. */
export function SupportForm({ ticketPrice }: { ticketPrice: number }) {
  const [state, action] = useActionState(saveSupportSettingsAction, {});
  useResultToast(state, "هزینهٔ تیکت ذخیره شد.");
  const error = state.fieldErrors?.ticketPrice;
  return (
    <form action={action} className="card max-w-4xl">
      <div className="max-w-sm">
        <Field label="هزینهٔ هر تیکت (تومان)" htmlFor="ticketPrice" error={error} hint="۰ یعنی تیکت‌ها رایگان است">
          <PriceInput id="ticketPrice" name="ticketPrice" defaultValue={ticketPrice || ""} aria-invalid={error ? true : undefined} aria-describedby="ticketPrice-msg" />
        </Field>
      </div>
      <SubmitButton>ذخیره</SubmitButton>
    </form>
  );
}
