/** How a support ticket's status, a top-up's status and a wallet entry read and look wherever they are listed. */
export const ticketStatusLabel = { AWAITING_PAYMENT: "در انتظار پرداخت", OPEN: "باز", ANSWERED: "پاسخ داده شده", CLOSED: "بسته" } as const;
export const ticketStatusClass = { AWAITING_PAYMENT: "bg-slate-100 text-slate-700", OPEN: "bg-amber-100 text-amber-700", ANSWERED: "bg-green-100 text-green-700", CLOSED: "bg-slate-100 text-slate-500" } as const;
export const categoryLabel = { TECHNICAL: "فنی", BILLING: "مالی و پرداخت", LICENSE: "لایسنس و دامنه", FEATURE_REQUEST: "درخواست قابلیت", OTHER: "سایر" } as const;
export const priorityLabel = { LOW: "کم", NORMAL: "عادی", HIGH: "بالا", URGENT: "فوری" } as const;
export const priorityClass = { LOW: "bg-slate-100 text-slate-600", NORMAL: "bg-sky-100 text-sky-700", HIGH: "bg-amber-100 text-amber-800", URGENT: "bg-red-100 text-red-700" } as const;
export const chargeLabel = { FREE: "رایگان", WALLET: "کیف پول", ONLINE: "پرداخت آنلاین" } as const;
export const topupStatusLabel = { AWAITING_PAYMENT: "در انتظار پرداخت", PENDING: "در انتظار", APPROVED: "تأیید شده", REJECTED: "رد شده", FAILED: "ناموفق" } as const;
export const topupStatusClass = { AWAITING_PAYMENT: "bg-slate-100 text-slate-700", PENDING: "bg-amber-100 text-amber-700", APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700", FAILED: "bg-red-100 text-red-700" } as const;
export const entryTypeLabel = { TOPUP: "شارژ", TICKET_FEE: "هزینهٔ تیکت", ADMIN_CREDIT: "افزایش دستی", ADMIN_DEBIT: "کاهش دستی", PURCHASE: "خرید" } as const;
