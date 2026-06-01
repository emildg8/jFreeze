import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { inventoryItems } from "@/lib/db/schema";
import { normalizeProductName } from "@/lib/orders/normalize";
import type { InventorySnapshot } from "@/lib/cart/engine";
import { getSettings } from "./settings";

export interface InventoryInput {
  name: string;
  qty: number;
  unit?: string;
  zone?: "fridge" | "freezer";
  expiryAt?: Date;
  source?: string;
  photoId?: string;
}

function activeProfileId() {
  return getSettings().activeProfileId;
}

export function listInventory() {
  ensureSeedData();
  const db = getDb();
  const profileId = activeProfileId();
  return db
    .select()
    .from(inventoryItems)
    .all()
    .filter((i) => (i.profileId ?? "default") === profileId);
}

export function getInventorySnapshot(): InventorySnapshot[] {
  return listInventory().map((item) => ({
    normalizedName: item.normalizedName,
    name: item.name,
    qty: item.qty,
    unit: item.unit ?? "шт",
    zone: (item.zone as "fridge" | "freezer") ?? "fridge",
  }));
}

export function upsertInventoryItem(input: InventoryInput) {
  ensureSeedData();
  const db = getDb();
  const profileId = activeProfileId();
  const normalizedName = normalizeProductName(input.name);
  const zone = input.zone ?? "fridge";

  const existing = db
    .select()
    .from(inventoryItems)
    .all()
    .find(
      (i) =>
        (i.profileId ?? "default") === profileId &&
        i.normalizedName === normalizedName &&
        i.zone === zone,
    );

  if (existing) {
    db.update(inventoryItems)
      .set({
        qty: input.qty,
        name: input.name,
        unit: input.unit ?? existing.unit,
        expiryAt: input.expiryAt ?? existing.expiryAt,
        updatedAt: new Date(),
        source: input.source ?? existing.source,
      })
      .where(eq(inventoryItems.id, existing.id))
      .run();
    return existing.id;
  }

  const id = uuid();
  db.insert(inventoryItems)
    .values({
      id,
      profileId,
      name: input.name,
      normalizedName,
      zone,
      qty: input.qty,
      unit: input.unit ?? "шт",
      expiryAt: input.expiryAt,
      source: input.source ?? "manual",
      photoId: input.photoId,
      updatedAt: new Date(),
    })
    .run();
  return id;
}

export function deleteInventoryItem(id: string) {
  ensureSeedData();
  const db = getDb();
  const profileId = activeProfileId();
  const item = db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.id, id))
    .all()[0];
  if (!item || (item.profileId ?? "default") !== profileId) {
    throw new Error("Позиция не найдена");
  }
  db.delete(inventoryItems).where(eq(inventoryItems.id, id)).run();
}
