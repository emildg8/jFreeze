export type AuthProviderKey = "phone" | "email" | "google" | "apple";

export type LoginTab = AuthProviderKey | "social";

export type AuthProvidersStatus = Record<AuthProviderKey, boolean>;

/** Какие способы входа реально настроены на сервере. */
export function getAuthProvidersStatus(): AuthProvidersStatus {
  return {
    phone: true,
    email: Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim()),
    google: Boolean(
      process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim(),
    ),
    apple: Boolean(
      process.env.AUTH_APPLE_ID?.trim() && process.env.AUTH_APPLE_SECRET?.trim(),
    ),
  };
}

export function defaultAuthTab(status: AuthProvidersStatus): LoginTab {
  if (status.phone) return "phone";
  if (status.email) return "email";
  return "social";
}

export function buildLoginTabOptions(status: AuthProvidersStatus) {
  return [
    { value: "phone" as const, label: "Телефон" },
    ...(status.email ? [{ value: "email" as const, label: "Почта" }] : []),
    ...(status.google || status.apple
      ? [{ value: "social" as const, label: "Google / Apple" }]
      : []),
  ];
}

export function resolveLoginTab(tab: LoginTab, options: ReturnType<typeof buildLoginTabOptions>) {
  return options.some((o) => o.value === tab) ? tab : (options[0]?.value ?? "phone");
}
