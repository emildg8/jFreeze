import type { Session } from "next-auth";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { authUsers } from "@/lib/db/schema";

/** Только Node.js — обогащение сессии из SQLite. */
export function enrichSessionFromDb(session: Session): Session {
  if (!session.user?.id) return session;

  const profile = getDb()
    .select({
      phone: authUsers.phone,
      email: authUsers.email,
      name: authUsers.name,
      image: authUsers.image,
    })
    .from(authUsers)
    .where(eq(authUsers.id, session.user.id))
    .get();

  if (!profile) return session;

  if (profile.phone) session.user.phone = profile.phone;
  if (profile.email) session.user.email = profile.email;
  if (profile.name) session.user.name = profile.name;
  if (profile.image) session.user.image = profile.image;

  return session;
}
