"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendSmsAction } from "@/app/settings-actions";
import { useResultToast } from "@/components/use-result-toast";
import { Field, SubmitButton } from "@/components/ui";
import { smsLimits } from "@/lib/sms-limits";

export type SmsSite = { id: string; label: string; hasPhone: boolean };

/** One message to the chosen clients (their phone from the site's client) and to any extra numbers typed in. */
export function SendForm({ sites, disabled }: { sites: SmsSite[]; disabled: boolean }) {
  const [state, action] = useActionState(sendSmsAction, {});
  const [length, setLength] = useState(0);
  const router = useRouter();
  useResultToast(state, "پیامک ارسال شد.");
  useEffect(() => {
    if (state.saved) router.push("/sms");
  }, [state, router]);
  const errors = state.fieldErrors ?? {};
  const a11y = (name: string) => ({ "aria-invalid": errors[name] ? true : undefined, "aria-describedby": `${name}-msg` }) as const;

  return (
    <form action={action} className="card max-w-4xl space-y-2">
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-1.5 p-0 text-sm font-medium">گیرنده‌ها</legend>
        <div className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
          {sites.length === 0 && <p className="m-0 px-4 py-3 text-sm text-slate-500">سایتی ثبت نشده است.</p>}
          {sites.map((site) => (
            <label key={site.id} className={`flex items-center gap-2 px-4 py-2 text-sm ${site.hasPhone ? "" : "text-slate-400"}`}>
              <input type="checkbox" name="siteIds" value={site.id} disabled={!site.hasPhone} />
              <span>{site.label}</span>
              {!site.hasPhone && <span className="text-xs">بدون شماره</span>}
            </label>
          ))}
        </div>
        <p className="m-0 mt-1.5 min-h-5 text-xs text-slate-500">فقط مشتری‌هایی که شمارهٔ تماس دارند قابل انتخاب‌اند</p>
      </fieldset>
      <Field label="شماره‌های دیگر" htmlFor="phones" error={errors.phones} hint="جداشده با فاصله یا ویرگول">
        <textarea id="phones" name="phones" rows={2} dir="ltr" maxLength={smsLimits.phones} className="input text-left" {...a11y("phones")} />
      </Field>
      <Field label="متن پیامک" htmlFor="text" error={errors.text} hint={`${(smsLimits.text - length).toLocaleString("fa-IR")} نویسه باقی مانده`}>
        <textarea id="text" name="text" rows={4} maxLength={smsLimits.text} onChange={(event) => setLength(event.target.value.length)} className="input" {...a11y("text")} />
      </Field>
      <SubmitButton>{disabled ? "ارسال (پیامک فعال نیست)" : "ارسال"}</SubmitButton>
    </form>
  );
}
