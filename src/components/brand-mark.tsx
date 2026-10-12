import { Logo } from "@/components/logo";

/** The static logo lockup: the N with EXORA right beside it (the loading screen's wordmark, without the ring or motion). */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    // The wordmark is Latin, so it reads left to right whatever the page direction is.
    <span dir="ltr" role="img" aria-label="Nexora" className="inline-flex items-center" style={{ gap: size * 0.1 }}>
      <Logo size={size} />
      <span aria-hidden className="brand-wordmark-static select-none uppercase leading-none" style={{ fontSize: size * 1.12, letterSpacing: size * 0.02 }}>EXORA</span>
    </span>
  );
}
