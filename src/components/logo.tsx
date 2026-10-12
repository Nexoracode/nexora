/**
 * The Nexora "N". With `spinning`, an open ring (not a full circle) fades in around it and turns,
 * to show that something is working. The ring sits outside the box, so the layout never moves.
 */
export function Logo({ size = 28, spinning = false, className = "" }: { size?: number; spinning?: boolean; className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a small fixed brand mark */}
      <img src="/logo.png" alt="" width={size} height={size} className="block" />
      <svg aria-hidden viewBox="0 0 100 100" className={`logo-ring pointer-events-none absolute -inset-[34%] size-[168%] transition-opacity duration-300 ${spinning ? "opacity-100" : "opacity-0"}`} style={{ animationPlayState: spinning ? "running" : "paused" }}>
        <defs>
          <linearGradient id="logo-ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22e8ff" />
            <stop offset="0.55" stopColor="#3b6bff" />
            <stop offset="1" stopColor="#9b4dff" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#logo-ring-gradient)" strokeWidth="5" strokeLinecap="round" strokeDasharray="95 195" />
      </svg>
    </span>
  );
}
