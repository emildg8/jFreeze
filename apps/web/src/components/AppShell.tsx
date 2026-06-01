"use client";

import type { ReactNode } from "react";
import { AppTopBar } from "./AppTopBar";
import { BottomNav } from "./BottomNav";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";
import { QuickScanFab } from "./QuickScanFab";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell-bg">
      <ServiceWorkerRegister />
      <AppTopBar />
      <main className="mx-auto min-h-[calc(100dvh-var(--nav-height))] w-full max-w-lg flex-1 px-4 pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+4.5rem)] pt-4 md:max-w-2xl lg:max-w-3xl">
        {children}
      </main>
      <QuickScanFab />
      <BottomNav />
    </div>
  );
}
