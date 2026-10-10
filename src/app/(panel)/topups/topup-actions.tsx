"use client";

import { useActionState, useState } from "react";
import { type FormState } from "@/app/actions";
import { approveTopupAction, rejectTopupAction } from "@/app/support-actions";
import { Field, SubmitButton } from "@/components/ui";
import { useResultToast } from "@/components/use-result-toast";
import { REJECT_REASON_MAX } from "@/lib/reject-reason";

/** Approve credits the wallet at once; reject asks for the reason first. */
export function TopupActions({ topupId }: { topupId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(rejectTopupAction.bind(null, topupId), {});
  useResultToast(state, "درخواست رد شد.");
  const error = state.fieldErrors?.reason;

  if (open) {
    return (
      <form action={action} className="w-64 space-y-1">
        <Field label="دلیل رد" htmlFor={`reason-${topupId}`} error={error}>
          <textarea id={`reason-${topupId}`} name="reason" rows={3} maxLength={REJECT_REASON_MAX} required aria-invalid={error ? true : undefined} aria-describedby={`reason-${topupId}-msg`} className={`input ${error ? "!border-red-500" : ""}`} />
        </Field>
        <div className="flex gap-2">
          <SubmitButton variant="danger">ثبت رد</SubmitButton>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>انصراف</button>
        </div>
      </form>
    );
  }
  return (
    <div className="flex gap-2">
      <form action={approveTopupAction.bind(null, topupId)}><SubmitButton>تأیید</SubmitButton></form>
      <button type="button" className="btn btn-danger" onClick={() => setOpen(true)}>رد</button>
    </div>
  );
}
