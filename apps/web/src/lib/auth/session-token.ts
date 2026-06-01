import type { Session } from "next-auth";

/** Без БД — безопасно для Edge middleware. */
export function applyAuthTokenToSession(
  session: Session,
  token: { sub?: string; phone?: string },
) {
  if (session.user && token.sub) {
    session.user.id = token.sub;
  }
  if (token.phone && session.user) {
    session.user.phone = token.phone;
  }
  return session;
}
