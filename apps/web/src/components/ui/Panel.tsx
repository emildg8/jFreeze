import type { ReactNode } from "react";

export type PanelVariant =
  | "default"
  | "accent"
  | "ai"
  | "storage"
  | "warning"
  | "muted";

const variants: Record<PanelVariant, string> = {
  default: "border-[var(--border)] bg-[var(--surface)] shadow-sm shadow-slate-200/40",
  accent:
    "border-sky-200/80 bg-gradient-to-b from-white to-sky-50/50 shadow-sm shadow-sky-100/50",
  ai: "border-violet-200/80 bg-gradient-to-b from-white to-violet-50/40 shadow-sm shadow-violet-100/40",
  storage:
    "border-emerald-200/70 bg-gradient-to-b from-white to-emerald-50/30 shadow-sm shadow-emerald-100/30",
  warning: "border-amber-200/90 bg-amber-50/90 shadow-sm shadow-amber-100/40",
  muted: "border-slate-200/60 bg-slate-50/80 shadow-none",
};

export function Panel({
  children,
  variant = "default",
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  variant?: PanelVariant;
  className?: string;
  as?: "div" | "article" | "section";
}) {
  return (
    <Tag
      className={`rounded-[var(--radius)] border p-4 ${variants[variant]} ${className}`}
    >
      {children}
    </Tag>
  );
}
