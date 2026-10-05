"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Select } from "@/components/select";

const SEARCH_MAX = 100;
const DEBOUNCE_MS = 350;

const statusOptions = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "ACTIVE", label: "فعال" },
  { value: "SUSPENDED", label: "تعلیق" },
];

/** Search and status filter for the sites table. Both apply by themselves: no submit button. */
export function SitesFilters({ initialQuery, initialStatus }: { initialQuery: string; initialStatus: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    // Skip the initial render, which already matches the URL.
    if (first.current) { first.current = false; return; }
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (status) params.set("status", status);
      startTransition(() => router.replace(params.size ? `/?${params}` : "/"));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, status, router]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3" role="search">
      <div className="relative min-w-56 flex-1">
        <Search size={16} aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={SEARCH_MAX}
          placeholder="جستجوی دامنه یا مشتری"
          aria-label="جستجوی دامنه یا مشتری"
          className="input h-11 !ps-10 !pe-10"
        />
        {pending && <Loader2 size={16} aria-hidden className="absolute end-3.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
      </div>
      <Select label="وضعیت" value={status} onChange={setStatus} options={statusOptions} className="w-full sm:w-48" />
    </div>
  );
}
