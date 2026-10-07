"use client";

import { useActionState, useState } from "react";
import { rejectPurchaseAction, type FormState } from "@/app/actions";
import { Field, SubmitButton } from "@/components/ui";
import { REJECT_REASON_MAX } from "@/lib/reject-reason";
import { useResultToast } from "@/components/use-result-toast";

/** "Reject" asks for the reason first; the buyer sees it on the site next to the feature they tried to buy. */
export function RejectForm({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(rejectPurchaseAction.bind(null, requestId), {});
  const [length, setLength] = useState(0);
  useResultToast(state, "درخواست رد شد.");

  if (!open) return <button type="button" className="btn btn-danger" onClick={() => setOpen(true)}>رد</button>;

  return (
    <form action={action} className="w-full max-w-xl space-y-1">
      <Field label="دلیل رد" htmlFor={`reason-${requestId}`} error={state.fieldErrors?.reason} hint={`${(REJECT_REASON_MAX - length).toLocaleString("fa-IR")} نویسه باقی مانده`}>
        <textarea
          id={`reason-${requestId}`}
          name="reason"
          rows={3}
          maxLength={REJECT_REASON_MAX}
          required
          aria-invalid={state.fieldErrors?.reason ? true : undefined}
          aria-describedby={`reason-${requestId}-msg`}
          className={`input ${state.fieldErrors?.reason ? "!border-red-500" : ""}`}
          onChange={(event) => setLength(event.target.value.length)}
        />
      </Field>
      <div className="flex gap-2">
        <SubmitButton variant="danger">ثبت رد</SubmitButton>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>انصراف</button>
      </div>
    </form>
  );
}
