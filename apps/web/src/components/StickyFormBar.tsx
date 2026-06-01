"use client";

import type { FormEvent, ReactNode } from "react";

/** Форма, закреплённая над нижней навигацией (удобно на телефоне). */
export function StickyFormBar({
  onSubmit,
  children,
  className = "",
}: {
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={`fixed left-0 right-0 z-[45] border-t border-slate-200/90 bg-white/95 px-4 py-3 shadow-[0_-8px_32px_rgba(15,23,42,0.08)] backdrop-blur-md bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom))] ${className}`}
    >
      <div className="mx-auto flex max-w-lg flex-col gap-2 md:max-w-2xl lg:max-w-3xl">
        {children}
      </div>
    </form>
  );
}
