import NextAuth from "next-auth";
import { SQLiteDrizzleAdapter } from "@/lib/auth/drizzle-sqlite-adapter";
import { authConfig } from "@/auth.config";
import { getDb } from "@/lib/db/client";
import {
  authUsers,
  authAccounts,
  authSessions,
  authVerificationTokens,
} from "@/lib/db/schema";
import { buildAuthProviders } from "@/lib/auth/build-providers";
import { ensureUserWorkspace } from "@/lib/auth/user-setup";
import { applyAuthTokenToSession } from "@/lib/auth/session-token";
import { enrichSessionFromDb } from "@/lib/auth/session-enrichment";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: SQLiteDrizzleAdapter(getDb(), {
    usersTable: authUsers,
    accountsTable: authAccounts,
    sessionsTable: authSessions,
    verificationTokensTable: authVerificationTokens,
  }),
  providers: buildAuthProviders(),
  secret: process.env.AUTH_SECRET,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      applyAuthTokenToSession(session, token);
      return enrichSessionFromDb(session);
    },
    async signIn({ user }) {
      if (user.id) ensureUserWorkspace(user.id);
      return true;
    },
  },
});
