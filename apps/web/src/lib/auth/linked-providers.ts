import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { authAccounts, authUsers } from "@/lib/db/schema";

export function getLinkedAuthProviders(userId: string): {
  providers: string[];
  phone: string | null;
} {
  const db = getDb();

  const rows = db
    .select({ provider: authAccounts.provider })
    .from(authAccounts)
    .where(eq(authAccounts.userId, userId))
    .all();

  const providers = [...new Set(rows.map((r) => r.provider))];

  const userRow = db
    .select({ phone: authUsers.phone, email: authUsers.email })
    .from(authUsers)
    .where(eq(authUsers.id, userId))
    .get();

  if (userRow?.phone && !providers.includes("phone")) {
    providers.unshift("phone");
  }
  if (
    userRow?.email &&
    !providers.includes("nodemailer") &&
    !providers.includes("email")
  ) {
    providers.push("email");
  }

  return {
    providers,
    phone: userRow?.phone ?? null,
  };
}
