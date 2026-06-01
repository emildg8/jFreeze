import Link from "next/link";
import { Panel } from "./Panel";

export function NavCard({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link href={href} className="block group">
      <Panel className="flex items-center gap-3 py-3 transition-all group-hover:border-sky-200 group-hover:shadow-md group-active:scale-[0.99]">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-lg text-sky-700">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <span className="font-medium text-slate-900 group-hover:text-sky-800">
            {label}
          </span>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
        <span className="text-slate-300 group-hover:text-sky-400" aria-hidden>
          ›
        </span>
      </Panel>
    </Link>
  );
}
