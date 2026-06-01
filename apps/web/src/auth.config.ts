import type { NextAuthConfig } from "next-auth";
import { applyAuthTokenToSession } from "@/lib/auth/session-token";

/** Конфиг без БД — для Edge middleware. */
export const authConfig = {
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
    error: "/login",
  },
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      if (user && "phone" in user && user.phone) {
        token.phone = user.phone as string;
      }
      return token;
    },
    async session({ session, token }) {
      return applyAuthTokenToSession(session, token);
    },
  },
  providers: [],
} satisfies NextAuthConfig;
