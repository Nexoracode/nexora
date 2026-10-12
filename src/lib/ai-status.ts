/** Status words the assistant writes in its replies (the raw enum values), with the Persian label and colour the panel uses for each. */
export const statusChips = {
  PENDING: { label: "در انتظار", className: "bg-amber-100 text-amber-700" },
  AWAITING_PAYMENT: { label: "در انتظار پرداخت", className: "bg-slate-100 text-slate-700" },
  APPROVED: { label: "تأیید شده", className: "bg-green-100 text-green-700" },
  REJECTED: { label: "رد شده", className: "bg-red-100 text-red-700" },
  FAILED: { label: "ناموفق", className: "bg-red-100 text-red-700" },
  OPEN: { label: "باز", className: "bg-amber-100 text-amber-700" },
  ANSWERED: { label: "پاسخ داده شده", className: "bg-green-100 text-green-700" },
  CLOSED: { label: "بسته", className: "bg-slate-100 text-slate-500" },
  ACTIVE: { label: "فعال", className: "bg-green-100 text-green-700" },
  SUSPENDED: { label: "تعلیق", className: "bg-red-100 text-red-700" },
  LOW: { label: "کم", className: "bg-slate-100 text-slate-600" },
  NORMAL: { label: "عادی", className: "bg-sky-100 text-sky-700" },
  HIGH: { label: "بالا", className: "bg-amber-100 text-amber-800" },
  URGENT: { label: "فوری", className: "bg-red-100 text-red-700" },
} as const;

export type StatusWord = keyof typeof statusChips;

export const isStatusWord = (text: string): text is StatusWord => Object.hasOwn(statusChips, text);

/** Matches a whole status word; `_` counts as a letter, so AWAITING_PAYMENT is never cut in two. */
export const statusPattern = new RegExp(String.raw`\b(${Object.keys(statusChips).join("|")})\b`, "g");
