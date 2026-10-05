import type { ReactNode } from "react";

/** Title, one-line description and an optional action, the same on every page. */
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="m-0 text-xl font-bold">{title}</h1>
        {description && <p className="m-0 mt-1.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </header>
  );
}
