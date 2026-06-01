import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
  onRefresh,
  refreshing,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  if (!title && !description && !action && !onRefresh) return null;

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
      <div className="flex shrink-0 items-center gap-1">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Обновить"
            title="Обновить"
          >
            <span className={refreshing ? "inline-block animate-spin" : ""}>↻</span>
          </button>
        )}
        {action}
      </div>
    </header>
  );
}
