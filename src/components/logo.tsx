/** The Nexora mark (a round logo with its own dark background), used at a fixed small size. */
export function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- a small fixed brand mark
  return <img src="/logo.png" alt="" width={size} height={size} className={`shrink-0 rounded-full ${className}`} />;
}
