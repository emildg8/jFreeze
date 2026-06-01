import type { ReactNode } from "react";
import type { NavIconName } from "@/lib/ui/navigation";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <rect x="4" y="6" width="24" height="22" rx="4" className="fill-sky-100" />
      <path
        d="M10 14h12M10 18h8"
        className="stroke-sky-600"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="10" r="3" className="fill-sky-500" />
    </svg>
  );
}

function NavSvg({ children }: { children: ReactNode }) {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden>
      {children}
    </svg>
  );
}

const NAV_PATHS: Record<NavIconName, ReactNode> = {
  home: (
    <NavSvg>
      <path {...stroke} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
    </NavSvg>
  ),
  orders: (
    <NavSvg>
      <path {...stroke} d="M5 7h14l-1.5 11H7.5L6 7zm3-3h8l1 3H7l1-3z" />
    </NavSvg>
  ),
  fridge: (
    <NavSvg>
      <rect {...stroke} x="5" y="3" width="14" height="18" rx="2" />
      <path {...stroke} d="M9 8h6M9 12h4" />
    </NavSvg>
  ),
  cart: (
    <NavSvg>
      <path {...stroke} d="M6 6h15l-1.5 9H8L6 6zm3 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
    </NavSvg>
  ),
  more: (
    <NavSvg>
      <circle fill="currentColor" cx="6" cy="12" r="1.5" />
      <circle fill="currentColor" cx="12" cy="12" r="1.5" />
      <circle fill="currentColor" cx="18" cy="12" r="1.5" />
    </NavSvg>
  ),
};

export function NavIcon({ name }: { name: NavIconName }) {
  return NAV_PATHS[name];
}

export function IconChevronLeft({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path {...stroke} d="M14 6l-6 6 6 6" />
    </svg>
  );
}

export function IconSettings({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        {...stroke}
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm8.5-3.5a7.2 7.2 0 0 0-.1-1l2-1.5-2-3.5-2.3 1a7.5 7.5 0 0 0-1.7-1L14.5 2h-5L9.6 6a7.5 7.5 0 0 0-1.7 1l-2.3-1-2 3.5 2 1.5a7.2 7.2 0 0 0-.1 1 7.2 7.2 0 0 0 .1 1l-2 1.5 2 3.5 2.3-1a7.5 7.5 0 0 0 1.7 1L9.5 22h5l.9-4a7.5 7.5 0 0 0 1.7-1l2.3 1 2-3.5-2-1.5c.07-.33.1-.66.1-1z"
      />
    </svg>
  );
}
