"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV, isNavActive } from "@/lib/ui/navigation";
import { NavIcon } from "@/components/ui/icons";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Основная навигация"
    >
      <ul className="mx-auto flex h-[var(--nav-height)] max-w-lg items-stretch justify-around px-1">
        {BOTTOM_NAV.map((link) => {
          const active = isNavActive(pathname, link.href);
          return (
            <li key={link.href} className="flex flex-1">
              <Link
                href={link.href}
                className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors ${
                  active ? "text-[var(--brand)]" : "text-slate-500"
                }`}
              >
                {active && (
                  <span
                    className="absolute inset-x-2 top-1 bottom-1 rounded-xl bg-sky-50"
                    aria-hidden
                  />
                )}
                <span className="relative">
                  <NavIcon name={link.icon} />
                </span>
                <span className="relative">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
