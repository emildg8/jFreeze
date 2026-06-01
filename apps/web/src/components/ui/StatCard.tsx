import { Panel } from "./Panel";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "brand";
}) {
  return (
    <Panel className="!p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1.5 text-3xl font-bold tabular-nums tracking-tight ${
          tone === "brand" ? "text-[var(--brand)]" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </Panel>
  );
}
