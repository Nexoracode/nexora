import type { CSSProperties } from "react";
import { Logo } from "@/components/logo";

const LETTERS = ["E", "X", "O", "R", "A"];
// Where each letter starts, in em, counted from the first letter's left edge (the face's rough advance widths).
const STARTS = [0, 0.63, 1.35, 2.17, 2.9];
const WORD_WIDTH = 3.9;

/**
 * The full loading screen: the N with its turning ring, then E-X-O-R-A sliding out from behind the N one after
 * the other into place so the two read as one name, a band of light sweeping across the letters, and the
 * status line underneath.
 */
export function BrandLoader({ size = 44, label = "در حال آماده‌سازی…" }: { size?: number; label?: string }) {
  const fontSize = size * 1.12;
  const gap = size * 0.42;
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-5">
      {/* The wordmark is Latin, so it reads left to right whatever the page direction is. */}
      <div dir="ltr" className="flex items-center" style={{ gap }}>
        {/* Above the letters, so they come out from behind it. */}
        <Logo size={size} spinning ringInset={34} className="z-10" />
        <span aria-hidden className="brand-wordmark relative z-0 select-none uppercase leading-none" style={{ fontSize, letterSpacing: size * 0.02 }}>
          {LETTERS.map((letter, index) => (
            // --from: how far back (behind the N) the letter starts. --s / --w: the letter's offset in the word and the
            // word's width, so every letter paints its own slice of one shared gradient and one shared sweep of light.
            <span key={letter} className="brand-letter" style={{ "--i": index, "--from": `${STARTS[index] * fontSize + gap + size * 0.55}px`, "--s": `${STARTS[index] * fontSize}px`, "--w": `${WORD_WIDTH * fontSize}px` } as CSSProperties}>{letter}</span>
          ))}
        </span>
        <span className="sr-only">Nexora</span>
      </div>
      <p className="m-0 animate-pulse text-sm text-[#7a8196]">{label}</p>
    </div>
  );
}
