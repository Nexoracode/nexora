"use client";

import { useActionState } from "react";
import { deleteSiteAction, rotateKeyAction } from "@/app/actions";
import { KeyBox } from "@/components/key-box";
import { ConfirmForm } from "@/components/confirm-form";

/** License key (prefix only, the rest is never stored) with its rotate and delete actions, shown at the top of the info tab. */
export function SiteDangerZone({ siteId, keyPrefix }: { siteId: string; keyPrefix: string }) {
  const [rotated, rotate] = useActionState(() => rotateKeyAction(siteId), {});
  return (
    <section className="card space-y-4" aria-label="کلید لایسنس">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-sm text-slate-500">کلید لایسنس</p>
          <code dir="ltr" className="text-sm">{keyPrefix}…</code>
        </div>
        <div className="flex flex-wrap gap-2">
          <ConfirmForm
            action={rotate}
            tone="warning"
            title="بازتولید کلید لایسنس"
            message="کلید فعلی از کار می‌افتد و سایت مشتری تا گذاشتن کلید جدید، قابلیت‌های اختیاری را از دست می‌دهد. ادامه می‌دهید؟"
            confirmLabel="بازتولید کلید"
            trigger={(open) => <button type="button" className="btn btn-ghost" onClick={open}>بازتولید کلید</button>}
          />
          <ConfirmForm
            action={deleteSiteAction.bind(null, siteId)}
            title="حذف سایت"
            message="سایت، کلید لایسنس و تاریخچه‌اش برای همیشه حذف می‌شود و این کار برگشت‌پذیر نیست."
            confirmLabel="حذف سایت"
            trigger={(open) => <button type="button" className="btn btn-danger" onClick={open}>حذف سایت</button>}
          />
        </div>
      </div>
      {rotated.key && <KeyBox licenseKey={rotated.key} />}
    </section>
  );
}
