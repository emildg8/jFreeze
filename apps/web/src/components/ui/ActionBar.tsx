import type { ReactNode } from "react";

export function ActionBar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>{children}</div>
  );
}
