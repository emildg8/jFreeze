"use client";

import { useCallback, useState } from "react";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";

interface UserTipProps {
  id: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

function storageKey(id: string) {
  return `jfreeze-tip-dismissed:${id}`;
}

export function UserTip({ id, title, children, className = "" }: UserTipProps) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(storageKey(id)) !== "1";
  });

  const dismiss = useCallback(() => {
    localStorage.setItem(storageKey(id), "1");
    setVisible(false);
  }, [id]);

  if (!visible) return null;

  return (
    <Panel variant="muted" className={`text-sm text-slate-600 ${className}`}>
      {title && (
        <p className="mb-1 font-medium text-slate-800">{title}</p>
      )}
      <div className="leading-relaxed">{children}</div>
      <Button
        type="button"
        variant="ghost"
        className="mt-2 h-8 px-2 text-xs text-slate-500"
        onClick={dismiss}
      >
        Понятно, скрыть
      </Button>
    </Panel>
  );
}
