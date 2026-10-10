"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { checkSmsAccountAction, saveSmsSettingsAction, sendSmsSampleAction } from "@/app/settings-actions";
import { toast } from "@/components/toaster";
import { useResultToast } from "@/components/use-result-toast";
import { Field, SubmitButton } from "@/components/ui";
import type { SmsAccount } from "@/lib/faraz";
import { formatToman } from "@/lib/format";
import { smsLimits } from "@/lib/sms-limits";

/** The Faraz SMS connection: API key (never shown again), the sender line, and a look at the account behind them. */
export function SmsForm({ masked, lineNumber, isActive }: { masked: string | null; lineNumber: string; isActive: boolean }) {
  const [state, action] = useActionState(saveSmsSettingsAction, {});
  useResultToast(state, "تنظیمات پیامک ذخیره شد.");
  const [line, setLine] = useState(lineNumber);
  const [account, setAccount] = useState<SmsAccount | null>(null);
  const [checking, startCheck] = useTransition();
  const [testing, startTest] = useTransition();
  const errors = state.fieldErrors ?? {};
  const a11y = (name: string) => ({ "aria-invalid": errors[name] ? true : undefined, "aria-describedby": `${name}-msg` }) as const;

  const check = () => startCheck(async () => {
    const result = await checkSmsAccountAction();
    if ("error" in result) { toast.error(result.error); return; }
    setAccount(result.account);
    for (const warning of result.account.warnings) toast.error(warning);
  });
  const test = () => startTest(async () => {
    const result = await sendSmsSampleAction();
    if (result.saved) toast.success("پیامک آزمایشی به شمارهٔ صاحب حساب ارسال شد.");
    else toast.error(result.error ?? "ارسال انجام نشد.");
  });

  return (
    <div className="space-y-5">
      <form action={action} className="card max-w-4xl space-y-2">
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="کلید API فراز اس‌ام‌اس" htmlFor="apiKey" error={errors.apiKey} hint={masked ? `ذخیره‌شده: ${masked} · برای تغییر، کلید تازه را وارد کنید` : undefined}>
            <input id="apiKey" name="apiKey" type="password" dir="ltr" autoComplete="off" maxLength={smsLimits.apiKey} className="input text-left" {...a11y("apiKey")} />
          </Field>
          <Field label="شمارهٔ خط ارسال" htmlFor="lineNumber" error={errors.lineNumber} hint="با «بررسی حساب» خط‌های حساب را ببینید">
            <input id="lineNumber" name="lineNumber" dir="ltr" inputMode="numeric" value={line} onChange={(event) => setLine(event.target.value)} maxLength={smsLimits.lineNumber} className="input text-left" {...a11y("lineNumber")} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={isActive} />ارسال پیامک فعال باشد</label>
        <div className="flex flex-wrap gap-2 pt-2">
          <SubmitButton>ذخیره</SubmitButton>
          {masked && (
            <>
              <button type="button" className="btn btn-ghost" disabled={checking} onClick={check}>{checking && <Loader2 size={16} className="animate-spin" aria-hidden />}بررسی حساب</button>
              <button type="button" className="btn btn-ghost" disabled={testing} onClick={test}>{testing && <Loader2 size={16} className="animate-spin" aria-hidden />}ارسال پیامک آزمایشی</button>
            </>
          )}
        </div>
      </form>

      {account && (
        <section className="card max-w-4xl" aria-label="حساب فراز اس‌ام‌اس">
          <dl className="m-0 grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-slate-500">اعتبار</dt><dd className="m-0 mt-1 font-bold">{account.balanceToman === null ? "—" : formatToman(account.balanceToman)}</dd></div>
            <div><dt className="text-slate-500">پیامک قابل ارسال</dt><dd className="m-0 mt-1 font-bold">{account.smsCount === null ? "—" : account.smsCount.toLocaleString("fa-IR")}</dd></div>
            <div><dt className="text-slate-500">صاحب حساب</dt><dd className="m-0 mt-1 font-bold">{account.displayName ?? "—"}{account.planTitle ? ` · ${account.planTitle}` : ""}</dd></div>
          </dl>
          {account.lines && account.lines.length > 0 && (
            <div className="mt-4">
              <p className="m-0 mb-2 text-sm text-slate-500">خط‌های حساب (برای انتخاب بزنید)</p>
              <div className="flex flex-wrap gap-2">
                {account.lines.map((item) => (
                  <button key={item.number} type="button" onClick={() => setLine(item.number)} className={`btn ${line === item.number ? "btn-primary" : "btn-ghost"}`}><span dir="ltr">{item.number}</span>{item.title ? ` · ${item.title}` : ""}</button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
