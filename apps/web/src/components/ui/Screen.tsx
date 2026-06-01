import type { ReactNode } from "react";

export function Screen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`space-y-4 pb-2 ${className}`}>{children}</div>;
}
