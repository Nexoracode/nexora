"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { deletePackageAction } from "@/app/actions";
import { ConfirmForm } from "@/components/confirm-form";
import { IconButton, IconLink } from "@/components/icon-action";

/** Icon actions for one package: details page, edit page, and delete behind a confirmation dialog. */
export function PackageRowActions({ id, name, withDetails = true, withEdit = true }: { id: string; name: string; withDetails?: boolean; withEdit?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {withDetails && <IconLink href={`/packages/${id}`} label={`جزئیات ${name}`} tip="جزئیات"><Eye size={17} aria-hidden /></IconLink>}
      {withEdit && <IconLink href={`/packages/${id}/edit`} label={`ویرایش ${name}`} tip="ویرایش"><Pencil size={17} aria-hidden /></IconLink>}
      <ConfirmForm
        action={deletePackageAction.bind(null, id)}
        title={`حذف بستهٔ «${name}»`}
        message="بسته حذف می‌شود. سایت‌هایی که قبلاً با آن ساخته شده‌اند تغییری نمی‌کنند."
        confirmLabel="حذف بسته"
        trigger={(open) => <IconButton label={`حذف ${name}`} tip="حذف" tone="danger" onClick={open}><Trash2 size={17} aria-hidden /></IconButton>}
      />
    </div>
  );
}
