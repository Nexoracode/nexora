"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { type FormState } from "@/app/actions";
import { closeTicketAction, replyTicketAction } from "@/app/support-actions";
import { Field, SubmitButton } from "@/components/ui";
import { useResultToast } from "@/components/use-result-toast";
import { supportLimits } from "@/lib/support-limits";

/** Answer box under a ticket's thread; sending and closing sit side by side. */
export function ReplyForm({ ticketId }: { ticketId: string }) {
  const [state, action] = useActionState<FormState, FormData>(replyTicketAction.bind(null, ticketId), {});
  const [length, setLength] = useState(0);
  const [closing, startClose] = useTransition();
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
    <form ref={formRef} action={action} className="card space-y-2">
      <Field label="پاسخ" htmlFor="body" error={error} hint={`${(supportLimits.message - length).toLocaleString("fa-IR")} نویسه باقی مانده`}>
        <textarea id="body" name="body" rows={4} maxLength={supportLimits.message} onChange={(event) => setLength(event.target.value.length)} aria-invalid={error ? true : undefined} aria-describedby="body-msg" className={`input ${error ? "!border-red-500" : ""}`} />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton>ارسال پاسخ</SubmitButton>
        <button type="button" className="btn btn-ghost" disabled={closing} onClick={() => startClose(async () => { await closeTicketAction(ticketId); })}>
          {closing && <Loader2 size={16} className="animate-spin" aria-hidden />}بستن تیکت
        </button>
      </div>
    </form>
  );
}
