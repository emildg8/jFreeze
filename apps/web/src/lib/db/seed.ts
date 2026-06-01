import { getDb, runMigrations } from "./client";
import { stores, userSettings, profiles } from "./schema";

const DEFAULT_STORES = [
  { id: "demo", displayName: "Демо-магазин", availability: "active" },
  { id: "manual", displayName: "Ручной ввод", availability: "active" },
  { id: "csv", displayName: "CSV / JSON", availability: "active" },
  { id: "ozon", displayName: "Озон", availability: "beta" },
  { id: "samokat", displayName: "Самокат", availability: "beta" },
  { id: "pyaterochka", displayName: "Пятёрочка", availability: "beta" },
  { id: "perekrestok", displayName: "Перекрёсток", availability: "beta" },
] as const;

export function ensureSeedData() {
  runMigrations();
  const db = getDb();
  for (const store of DEFAULT_STORES) {
    db.insert(stores)
      .values({
        id: store.id,
        displayName: store.displayName,
        availability: store.availability,
      })
      .onConflictDoNothing()
      .run();
  }
  db.insert(userSettings)
    .values({ id: "default" })
    .onConflictDoNothing()
    .run();
  db.insert(profiles)
    .values({ id: "default", name: "Я", createdAt: new Date() })
    .onConflictDoNothing()
    .run();
}
