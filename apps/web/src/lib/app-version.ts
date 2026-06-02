/** Версия из корневого VERSION (см. next.config.ts → NEXT_PUBLIC_APP_VERSION). */
export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "0.2.7-pre-alpha";
