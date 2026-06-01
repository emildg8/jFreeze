import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { profiles } from "@/lib/db/schema";
import { GUEST_USER_ID } from "@/lib/auth/scope";
import { getSettingsForUser, updateSettingsForUser } from "./settings";

function filterByUser(userId: string) {
  ensureSeedData();
  const db = getDb();
  return db
    .select()
    .from(profiles)
    .all()
    .filter((p) => (p.userId ?? GUEST_USER_ID) === userId);
}

export function listProfiles(userId: string = GUEST_USER_ID) {
  let list = filterByUser(userId);
  if (list.length === 0) {
    const db = getDb();
    db.insert(profiles)
      .values({ id: "default", userId, name: "Я", createdAt: new Date() })
      .run();
    list = filterByUser(userId);
  }
  return list;
}

export function createProfile(name: string, userId: string = GUEST_USER_ID) {
  ensureSeedData();
  const db = getDb();
  const id = uuid();
  db.insert(profiles)
    .values({ id, userId, name, createdAt: new Date() })
    .run();
  return id;
}

export function switchProfile(profileId: string, userId: string = GUEST_USER_ID) {
  const list = listProfiles(userId);
  if (!list.some((p) => p.id === profileId)) {
    throw new Error("Профиль не найден");
  }
  updateSettingsForUser(userId, { activeProfileId: profileId });
}

export function getActiveProfile(userId: string = GUEST_USER_ID) {
  const list = listProfiles(userId);
  const activeId = getSettingsForUser(userId).activeProfileId;
  return list.find((p) => p.id === activeId) ?? list[0];
}

export function deleteProfile(profileId: string, userId: string = GUEST_USER_ID) {
  if (profileId === "default") {
    throw new Error("Нельзя удалить основной профиль");
  }
  const list = listProfiles(userId);
  if (!list.some((p) => p.id === profileId)) {
    throw new Error("Профиль не найден");
  }
  ensureSeedData();
  const db = getDb();
  db.delete(profiles).where(eq(profiles.id, profileId)).run();
  if (getSettingsForUser(userId).activeProfileId === profileId) {
    updateSettingsForUser(userId, { activeProfileId: "default" });
  }
}
