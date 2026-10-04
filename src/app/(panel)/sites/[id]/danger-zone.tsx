"use client";

import { useActionState } from "react";
import { deleteSiteAction, rotateKeyAction } from "@/app/actions";
import { KeyBox } from "@/components/key-box";
import { SubmitButton } from "@/components/ui";

export function SiteDangerZone({ siteId }: { siteId: string }) {
  const [rotated, rotate] = useActionState(() => rotateKeyAction(siteId), {});
  return (
    <section className="card space-y-4">
      <h2 className="font-bold">کلید و حذف</h2>
      {rotated.key && <KeyBox licenseKey={rotated.key} />}
      <div className="flex flex-wrap gap-3">
        <form action={rotate} onSubmit={(e) => { if (!confirm("کلید فعلی از کار می‌افتد و سایت باید کلید جدید را بگیرد. ادامه می‌دهید؟")) e.preventDefault(); }}>
          <SubmitButton variant="ghost">بازتولید کلید</SubmitButton>
        </form>
        <form action={deleteSiteAction.bind(null, siteId)} onSubmit={(e) => { if (!confirm("سایت و تاریخچه‌اش حذف می‌شود. ادامه می‌دهید؟")) e.preventDefault(); }}>
          <SubmitButton variant="danger">حذف سایت</SubmitButton>
        </form>
      </div>
    </section>
  );
}
