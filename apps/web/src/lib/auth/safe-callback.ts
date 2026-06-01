const ALLOWED_CALLBACKS = new Set([
  "/account",
  "/orders",
  "/settings",
  "/fridge",
  "/cart",
  "/",
]);

/** Только относительные пути приложения — защита от open redirect. */
export function safeCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return "/account";
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/account";
  const base = path.split("?")[0]?.split("#")[0] ?? "/account";
  if (ALLOWED_CALLBACKS.has(base)) return path;
  if (
    base.startsWith("/orders") ||
    base.startsWith("/settings") ||
    base.startsWith("/fridge")
  ) {
    return path;
  }
  return "/account";
}
