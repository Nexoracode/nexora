"use client";

import { useActionState } from "react";
import { deleteSiteAction, rotateKeyAction } from "@/app/actions";
import { KeyBox } from "@/components/key-box";
import { SubmitButton } from "@/components/ui";

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
          <form action={rotate} onSubmit={(e) => { if (!confirm("کلید فعلی از کار می‌افتد و سایت باید کلید جدید را بگیرد. ادامه می‌دهید؟")) e.preventDefault(); }}>
            <SubmitButton variant="ghost">بازتولید کلید</SubmitButton>
          </form>
          <form action={deleteSiteAction.bind(null, siteId)} onSubmit={(e) => { if (!confirm("سایت و تاریخچه‌اش حذف می‌شود. ادامه می‌دهید؟")) e.preventDefault(); }}>
            <SubmitButton variant="danger">حذف سایت</SubmitButton>
          </form>
        </div>
      </div>
      {rotated.key && <KeyBox licenseKey={rotated.key} />}
    </section>
  );
}
