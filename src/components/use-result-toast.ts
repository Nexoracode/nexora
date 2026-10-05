"use client";

import { useEffect } from "react";
import type { FormState } from "@/app/actions";
import { toast } from "./toaster";

/**
 * Turns the result of a form action into a toast: a success message when it saved, the error text
 * when it failed for a reason that is not tied to one field (field errors stay under their input).
 */
export function useResultToast(state: FormState, successMessage: string) {
  useEffect(() => {
    if (state.saved) toast.success(successMessage);
    else if (state.error && !state.fieldErrors && !state.key) toast.error(state.error);
  }, [state, successMessage]);
}
