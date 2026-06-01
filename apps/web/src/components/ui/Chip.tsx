export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const className = active
    ? "bg-[var(--brand)] text-white border-[var(--brand)]"
    : "bg-white text-slate-600 border-slate-200 hover:border-sky-200";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}
