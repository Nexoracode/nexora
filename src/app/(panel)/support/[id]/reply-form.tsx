"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { type FormState } from "@/app/actions";
import { closeTicketAction, replyTicketAction } from "@/app/support-actions";
import { Field, SubmitButton } from "@/components/ui";
import { useResultToast } from "@/components/use-result-toast";
import { supportLimits } from "@/lib/support-limits";

/** Answer box under a ticket's thread, and the button that closes it. */
export function ReplyForm({ ticketId }: { ticketId: string }) {
  const [state, action] = useActionState<FormState, FormData>(replyTicketAction.bind(null, ticketId), {});
  const [length, setLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  useResultToast(state, "پاسخ ثبت شد.");

  useEffect(() => {
    if (state.saved) {
      formRef.current?.reset();
      setLength(0);
    }
  }, [state]);

  const error = state.fieldErrors?.body;
  return (
    <div className="card space-y-2">
      <form ref={formRef} action={action}>
        <Field label="پاسخ" htmlFor="body" error={error} hint={`${(supportLimits.message - length).toLocaleString("fa-IR")} نویسه باقی مانده`}>
          <textarea id="body" name="body" rows={4} maxLength={supportLimits.message} onChange={(event) => setLength(event.target.value.length)} aria-invalid={error ? true : undefined} aria-describedby="body-msg" className={`input ${error ? "!border-red-500" : ""}`} />
        </Field>
        <SubmitButton>ارسال پاسخ</SubmitButton>
      </form>
      <form action={closeTicketAction.bind(null, ticketId)}><SubmitButton variant="ghost">بستن تیکت</SubmitButton></form>
    </div>
  );
}
