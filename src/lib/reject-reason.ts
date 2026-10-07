import { z } from "zod";

/** The reason given when a purchase request is rejected; the same cap on the form, the action and the column. */
export const REJECT_REASON_MAX = 500;

export const rejectReasonSchema = z
  .string()
  .trim()
  .min(3, "دلیل رد را بنویسید.")
  .max(REJECT_REASON_MAX, `دلیل رد حداکثر ${REJECT_REASON_MAX} نویسه است.`);
