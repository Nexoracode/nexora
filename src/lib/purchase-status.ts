/** How a purchase request's status reads and looks wherever it is listed. */
export const statusLabel = { PENDING: "در انتظار", APPROVED: "تأیید شده", REJECTED: "رد شده", AWAITING_PAYMENT: "در انتظار پرداخت", FAILED: "ناموفق" } as const;
export const statusClass = { PENDING: "bg-amber-100 text-amber-700", APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700", AWAITING_PAYMENT: "bg-slate-100 text-slate-700", FAILED: "bg-red-100 text-red-700" } as const;
