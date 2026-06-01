/** Человекочитаемые названия провайдеров Auth.js. */
export const AUTH_PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  nodemailer: "Почта",
  email: "Почта",
  phone: "Телефон",
};

export function labelAuthProvider(id: string): string {
  return AUTH_PROVIDER_LABELS[id] ?? id;
}
