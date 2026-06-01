import type { ReactNode } from "react";

type Variant = "info" | "success" | "error" | "warning";

const styles: Record<Variant, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

export function StatusBanner({
  variant = "info",
  children,
  onDismiss,
}: {
  variant?: Variant;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div
      className={`mb-4 flex items-start justify-between gap-2 rounded-xl border px-4 py-3 text-sm ${styles[variant]}`}
      role="status"
    >
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 opacity-60 hover:opacity-100"
          aria-label="Закрыть"
        >
          ×
        </button>
      )}
    </div>
  );
}
