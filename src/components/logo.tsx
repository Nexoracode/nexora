/**
 * The Nexora "N". With `spinning`, an open ring (not a full circle) fades in around it and turns,
 * to show that something is working. The ring carries the N's own colours (cyan, blue, violet), with a tail that
 * fades out, and sits outside the box (`ringInset` is how far, in % of the size), so the layout never moves.
 */
export function Logo({ size = 28, spinning = false, ringInset = 34, className = "" }: { size?: number; spinning?: boolean; ringInset?: number; className?: string }) {
  const thickness = Math.max(2, size * 0.06);
  // A ring cut out of a conic gradient: transparent tail, then cyan -> blue -> violet at the head.
  const ring = `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px), #000 calc(100% - 0.5px), transparent 100%)`;
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a small fixed brand mark */}
      <img src="/logo.png" alt="" width={size} height={size} className="block" />
      <span
        aria-hidden
        className={`logo-ring pointer-events-none absolute rounded-full transition-opacity duration-300 ${spinning ? "opacity-100" : "opacity-0"}`}
        style={{
          inset: `${-ringInset}%`,
          background: "conic-gradient(from 0deg, transparent 0deg 170deg, #22e8ff 205deg, #2f86ff 260deg, #5a64ff 310deg, #a45bff 358deg, transparent 360deg)",
          WebkitMaskImage: ring,
          maskImage: ring,
          animationPlayState: spinning ? "running" : "paused",
        }}
      />
    </span>
  );
}
