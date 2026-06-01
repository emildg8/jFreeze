import type { ReactNode } from "react";
import { Panel, type PanelVariant } from "./Panel";

/** Card — обёртка над Panel для совместимости */
export function Card({
  children,
  className = "",
  variant,
}: {
  children: ReactNode;
  className?: string;
  variant?: PanelVariant;
}) {
  return (
    <Panel variant={variant ?? "default"} className={className}>
      {children}
    </Panel>
  );
}
