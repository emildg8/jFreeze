export const PRIMARY_ROUTES = [
  "/",
  "/orders",
  "/fridge",
  "/cart",
  "/more",
] as const;

export type PrimaryRoute = (typeof PRIMARY_ROUTES)[number];

export const BOTTOM_NAV = [
  { href: "/", label: "Главная", icon: "home" as const },
  { href: "/orders", label: "Заказы", icon: "orders" as const },
  { href: "/fridge", label: "Холод", icon: "fridge" as const },
  { href: "/cart", label: "Корзина", icon: "cart" as const },
  { href: "/more", label: "Ещё", icon: "more" as const },
] as const;

export type NavIconName = (typeof BOTTOM_NAV)[number]["icon"];

export const SECONDARY_ROUTES: Record<
  string,
  { title: string; backHref: string }
> = {
  "/settings": { title: "Настройки", backHref: "/more" },
  "/sources": { title: "Источники", backHref: "/more" },
  "/export": { title: "Экспорт", backHref: "/more" },
  "/platforms": { title: "Платформы", backHref: "/more" },
  "/storage": { title: "Хранение", backHref: "/more" },
  "/family": { title: "Семья", backHref: "/more" },
  "/pro": { title: "Pro", backHref: "/more" },
};

export function isPrimaryRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return PRIMARY_ROUTES.filter((r) => r !== "/").some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
}

export function getSecondaryMeta(pathname: string) {
  if (SECONDARY_ROUTES[pathname]) return SECONDARY_ROUTES[pathname];
  return null;
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
