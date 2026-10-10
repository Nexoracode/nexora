/** The categories and priorities a ticket can carry; the same lists in the license API, the store and the panel. */
export const TICKET_CATEGORIES = ["TECHNICAL", "BILLING", "LICENSE", "FEATURE_REQUEST", "OTHER"] as const;
export const TICKET_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

/** Bounds shared by the site's form, the license API and the panel's forms; free of the database so client components can import it. */
export const supportLimits = { subject: 191, message: 5000, trackingCode: 60, freeMonthsMax: 60, topupMin: 1_000, topupMax: 100_000_000 } as const;
