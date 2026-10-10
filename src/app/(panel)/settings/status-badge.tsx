import type { ReactNode } from "react";
import { CheckCircle2, CircleDashed, CircleOff } from "lucide-react";

export type ConnectionState = "active" | "inactive" | "missing";

const states = {
  active: { label: "فعال", className: "bg-green-100 text-green-700", Icon: CheckCircle2 },
  inactive: { label: "غیرفعال", className: "bg-slate-100 text-slate-600", Icon: CircleOff },
  missing: { label: "تنظیم نشده", className: "bg-amber-100 text-amber-800", Icon: CircleDashed },
} as const;

/** Whether a connection (gateway, SMS) is in use right now, readable at a glance. */
export function StatusBadge({ state, children }: { state: ConnectionState; children?: ReactNode }) {
  const { label, className, Icon } = states[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      <Icon size={14} aria-hidden />
      {children ?? label}
    </span>
  );
}

/** The top of a connection card: its mark, its name, what it is for, and where it stands. */
export function ConnectionHeader({ mark, title, description, state, extra }: { mark: ReactNode; title: string; description: string; state: ConnectionState; extra?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-center gap-4 border-b border-slate-100 pb-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-50">{mark}</span>
      <div className="min-w-0 flex-1">
        <h2 className="m-0 text-base font-bold">{title}</h2>
        <p className="m-0 mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {extra}
        <StatusBadge state={state} />
      </div>
    </header>
  );
}
