"use client";

import { useActionState } from "react";
import { saveZarinpalAction } from "@/app/settings-actions";
import { useResultToast } from "@/components/use-result-toast";
import { Field, SubmitButton } from "@/components/ui";
import { ConnectionHeader, StatusBadge } from "./status-badge";

/** The Zarinpal gateway: the merchant id is stored encrypted and never shown again, only its tail. */
export function GatewayForm({ masked, isSandbox, isActive }: { masked: string | null; isSandbox: boolean; isActive: boolean }) {
  const [state, action] = useActionState(saveZarinpalAction, {});
  useResultToast(state, "درگاه ذخیره شد.");
  const error = state.fieldErrors?.merchantId;
  return (
    <form action={action} className="card">
      <ConnectionHeader
        mark={/* eslint-disable-next-line @next/next/no-img-element -- a small fixed brand mark */ <img src="/logos/zarinpal.png" alt="" width={40} height={40} />}
        title="زرین‌پال"
        description="پرداخت آنلاین خرید قابلیت، تیکت و شارژ کیف پول"
        state={!masked ? "missing" : isActive ? "active" : "inactive"}
        extra={masked ? <StatusBadge state={isSandbox ? "missing" : "active"}>{isSandbox ? "آزمایشی" : "زنده"}</StatusBadge> : undefined}
      />
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Merchant ID" htmlFor="merchantId" error={error} hint={masked ? `ذخیره‌شده: ${masked} · برای تغییر، مقدار تازه را وارد کنید` : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}>
          <input id="merchantId" name="merchantId" dir="ltr" autoComplete="off" maxLength={36} className="input text-left" aria-invalid={error ? true : undefined} aria-describedby="merchantId-msg" />
        </Field>
        <div className="grid content-start gap-3 pt-7 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={masked ? isActive : true} />درگاه فعال باشد</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="isSandbox" defaultChecked={isSandbox} />محیط آزمایشی (Sandbox)</label>
        </div>
      </div>
      <div className="pt-2"><SubmitButton>ذخیره</SubmitButton></div>
    </form>
  );
}
