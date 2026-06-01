"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_ROUTES } from "@/lib/ui/navigation";

/** Плавающая кнопка «Сканировать чек» — всегда под рукой на основных вкладках. */
export function QuickScanFab() {
  const pathname = usePathname();

  const onPrimary = PRIMARY_ROUTES.some((r) =>
    r === "/" ? pathname === "/" : pathname === r || pathname.startsWith(`${r}/`),
  );
  if (
    !onPrimary ||
    pathname.startsWith("/orders") ||
    pathname === "/fridge" ||
    pathname === "/cart"
  ) {
    return null;
  }

  return (
    <Link
      href="/orders?scan=1"
      className="fixed z-[45] flex h-14 items-center gap-2 rounded-full bg-[var(--brand)] px-5 text-sm font-semibold text-white shadow-lg shadow-sky-900/20 transition active:scale-95 hover:bg-[var(--brand-hover)] right-4 bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom)+0.75rem)]"
      aria-label="Сканировать чек"
    >
      <span className="text-lg leading-none" aria-hidden>
        📷
      </span>
      <span>Чек</span>
    </Link>
  );
}
