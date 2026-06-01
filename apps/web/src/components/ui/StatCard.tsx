import Link from "next/link";
import { Panel } from "./Panel";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  href,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "brand";
  href?: string;
  className?: string;
}) {
  const content = (
    <Panel
      className={`!p-4 transition-colors ${href ? "hover:border-sky-200 hover:bg-sky-50/40 active:scale-[0.98]" : ""} ${className}`}
    >
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
      {hint && (
        <p className="mt-0.5 text-xs text-slate-400">
          {hint}
          {href && <span className="text-sky-600"> →</span>}
        </p>
      )}
    </Panel>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
        {content}
      </Link>
    );
  }

  return content;
}
