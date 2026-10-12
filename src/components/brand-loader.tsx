import { Logo } from "@/components/logo";

/**
 * The full loading screen: the N with its turning ring, EXORA fading in beside it so the two read as one
 * name, a band of light sweeping across the letters, and the status line underneath.
 */
export function BrandLoader({ size = 44, label = "در حال آماده‌سازی…" }: { size?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-5">
      {/* The wordmark is Latin, so it reads left to right whatever the page direction is. */}
      <div dir="ltr" className="flex items-center" style={{ gap: size * 0.42 }}>
        <Logo size={size} spinning ringInset={34} />
        <span aria-hidden className="brand-wordmark select-none uppercase leading-none" style={{ fontSize: size * 1.12, letterSpacing: size * 0.02 }}>
          EXORA
        </span>
        <span className="sr-only">Nexora</span>
      </div>
      <p className="m-0 animate-pulse text-sm text-[#7a8196]">{label}</p>
    </div>
  );
}
