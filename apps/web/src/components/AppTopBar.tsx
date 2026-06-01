"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getSecondaryMeta,
  isPrimaryRoute,
} from "@/lib/ui/navigation";
import { IconChevronLeft, IconLogo, IconSettings } from "@/components/ui/icons";

export function AppTopBar() {
  const pathname = usePathname();
  const secondary = getSecondaryMeta(pathname);
  const primary = isPrimaryRoute(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-lg items-center gap-2 px-4">
        {secondary ? (
          <Link
            href={secondary.backHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Назад"
          >
            <IconChevronLeft />
          </Link>
        ) : (
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="На главную">
            <IconLogo className="h-8 w-8" />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          {secondary ? (
            <p className="truncate text-sm font-semibold text-slate-900">
              {secondary.title}
            </p>
          ) : (
            <Link href="/" className="truncate text-sm font-semibold text-slate-900">
              jFreeze
            </Link>
          )}
        </div>

        {primary && pathname !== "/settings" && (
          <Link
            href="/settings"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-sky-700"
            aria-label="Настройки"
          >
            <IconSettings />
          </Link>
        )}
      </div>
    </header>
  );
}
