"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";
import { Field, SubmitButton } from "@/components/ui";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, {});
  return (
    <form action={action}>
      <Field label="رمز عبور" htmlFor="password" error={state.error}>
        <input id="password" name="password" type="password" autoComplete="current-password" autoFocus maxLength={200} className="input" aria-invalid={state.error ? true : undefined} aria-describedby="password-msg" dir="ltr" />
      </Field>
      <div className="[&>button]:w-full">
        <SubmitButton>ورود</SubmitButton>
      </div>
    </form>
  );
}
