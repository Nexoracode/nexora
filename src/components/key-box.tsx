"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Shows a freshly generated license key once; only its hash is stored, so it cannot be shown again. */
export function KeyBox({ licenseKey }: { licenseKey: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="mb-2 text-sm font-medium">کلید لایسنس را همین حالا کپی کنید؛ دوباره نمایش داده نمی‌شود.</p>
      <div className="flex items-center gap-2">
        <code dir="ltr" className="flex-1 overflow-x-auto rounded-md bg-white px-3 py-2 text-left text-sm">{licenseKey}</code>
        <button
          type="button"
          aria-label="کپی کلید"
          className="btn btn-ghost !px-3"
          onClick={async () => {
            await navigator.clipboard.writeText(licenseKey);
            setCopied(true);
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
