import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  if (!title && !description && !action) return null;

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {title && (
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
        )}
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}
