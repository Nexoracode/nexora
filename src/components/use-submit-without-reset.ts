"use client";

import { useTransition, type FormEvent } from "react";

/**
 * Submit handler for forms whose fields are controlled by React state (feature checkboxes, price
 * inputs, and so on).
 *
 * React 19 resets a form after a `<form action>` finishes, and a controlled field is put back to the
 * value it had when it first rendered, while its state still holds what the user picked. The screen
 * then shows something different from what was saved, and the next save would send the screen's
 * stale values. Submitting through `onSubmit` with `FormData` keeps the fields exactly as they are.
 *
 * Pass the `dispatch` function from `useActionState`; use its `pending` flag for the submit button.
 */
export function useSubmitWithoutReset(dispatch: (payload: FormData) => void) {
  const [, startTransition] = useTransition();
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The submitter is included so a named submit button still ends up in the data, as in a native submit.
    const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    startTransition(() => dispatch(data));
  };
}
