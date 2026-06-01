import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { profiles } from "@/lib/db/schema";
import { getSettings, updateSettings } from "./settings";

export function listProfiles() {
  ensureSeedData();
  const db = getDb();
  const list = db.select().from(profiles).all();
  if (list.length === 0) {
    db.insert(profiles)
      .values({ id: "default", name: "Я", createdAt: new Date() })
      .run();
    return db.select().from(profiles).all();
  }
  return list;
}

export function createProfile(name: string) {
  ensureSeedData();
  const db = getDb();
  const id = uuid();
  db.insert(profiles).values({ id, name, createdAt: new Date() }).run();
  return id;
}

export function switchProfile(profileId: string) {
  const list = listProfiles();
  if (!list.some((p) => p.id === profileId)) {
    throw new Error("Профиль не найден");
  }
  updateSettings({ activeProfileId: profileId });
}

export function getActiveProfile() {
  const list = listProfiles();
  const activeId = getSettings().activeProfileId;
  return list.find((p) => p.id === activeId) ?? list[0];
}

export function deleteProfile(profileId: string) {
  if (profileId === "default") {
    throw new Error("Нельзя удалить основной профиль");
  }
  ensureSeedData();
  const db = getDb();
  db.delete(profiles).where(eq(profiles.id, profileId)).run();
  if (getSettings().activeProfileId === profileId) {
    updateSettings({ activeProfileId: "default" });
  }
}
