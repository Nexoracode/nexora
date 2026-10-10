"use client";

import { useActionState } from "react";
import { saveZarinpalAction } from "@/app/settings-actions";
import { useResultToast } from "@/components/use-result-toast";
import { Field, SubmitButton } from "@/components/ui";

/** The Zarinpal gateway: the merchant id is stored encrypted and never shown again, only its tail. */
export function GatewayForm({ masked, isSandbox, isActive }: { masked: string | null; isSandbox: boolean; isActive: boolean }) {
  const [state, action] = useActionState(saveZarinpalAction, {});
  useResultToast(state, "درگاه ذخیره شد.");
  const error = state.fieldErrors?.merchantId;
  return (
    <form action={action} className="card max-w-4xl space-y-2">
      <div className="mb-2 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- a small fixed brand mark */}
        <img src="/logos/zarinpal.png" alt="" width={40} height={40} className="rounded-lg" />
        <h2 className="m-0 text-base font-bold">زرین‌پال</h2>
      </div>
      <div className="max-w-xl">
        <Field label="Merchant ID" htmlFor="merchantId" error={error} hint={masked ? `ذخیره‌شده: ${masked} · برای تغییر، مقدار تازه را وارد کنید` : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}>
          <input id="merchantId" name="merchantId" dir="ltr" autoComplete="off" maxLength={36} className="input text-left" aria-invalid={error ? true : undefined} aria-describedby="merchantId-msg" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isSandbox" defaultChecked={isSandbox} />محیط آزمایشی (Sandbox)</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={masked ? isActive : true} />فعال</label>
      <div className="pt-2"><SubmitButton>ذخیره</SubmitButton></div>
    </form>
  );
}
