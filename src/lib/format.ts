const DIGIT_MAP: Record<string, string> = { "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9", "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };

/** Converts Persian and Arabic-Indic digits to ASCII so keyboard layout never causes a validation error. */
export function normalizeDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => DIGIT_MAP[digit] ?? digit);
}

export const formatToman = (value: number) => `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;

export const formatDate = (value: Date | null) => (value ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium" }).format(value) : "—");

export const formatDateTime = (value: Date | null) => (value ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium", timeStyle: "short" }).format(value) : "هرگز");
