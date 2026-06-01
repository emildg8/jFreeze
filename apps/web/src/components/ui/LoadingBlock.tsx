export function LoadingBlock({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-6 text-sm text-slate-500">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600"
        aria-hidden
      />
      {label}
    </div>
  );
}
