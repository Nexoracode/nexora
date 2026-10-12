/** Status words the assistant writes in its replies (the raw enum values), with the Persian label and colour the panel uses for each. */
export const statusChips = {
  PENDING: { label: "در انتظار", className: "bg-amber-200 text-amber-900" },
  AWAITING_PAYMENT: { label: "در انتظار پرداخت", className: "bg-slate-200 text-slate-700" },
  APPROVED: { label: "تأیید شده", className: "bg-green-200 text-green-900" },
  REJECTED: { label: "رد شده", className: "bg-red-200 text-red-900" },
  FAILED: { label: "ناموفق", className: "bg-red-200 text-red-900" },
  OPEN: { label: "باز", className: "bg-amber-200 text-amber-900" },
  ANSWERED: { label: "پاسخ داده شده", className: "bg-green-200 text-green-900" },
  CLOSED: { label: "بسته", className: "bg-slate-200 text-slate-700" },
  ACTIVE: { label: "فعال", className: "bg-green-200 text-green-900" },
  SUSPENDED: { label: "تعلیق", className: "bg-red-200 text-red-900" },
  LOW: { label: "کم", className: "bg-slate-200 text-slate-700" },
  NORMAL: { label: "عادی", className: "bg-sky-200 text-sky-900" },
  HIGH: { label: "بالا", className: "bg-amber-200 text-amber-900" },
  URGENT: { label: "فوری", className: "bg-red-200 text-red-900" },
} as const;

export type StatusWord = keyof typeof statusChips;

export const isStatusWord = (text: string): text is StatusWord => Object.hasOwn(statusChips, text);

/** Matches a whole status word; `_` counts as a letter, so AWAITING_PAYMENT is never cut in two. */
export const statusPattern = new RegExp(String.raw`\b(${Object.keys(statusChips).join("|")})\b`, "g");
