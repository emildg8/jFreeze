import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { inventoryItems } from "@/lib/db/schema";
import { normalizeProductName } from "@/lib/orders/normalize";
import type { InventorySnapshot } from "@/lib/cart/engine";
import { getSettingsForUser } from "./settings";
import { GUEST_USER_ID } from "@/lib/auth/scope";

export interface InventoryInput {
  name: string;
  qty: number;
  unit?: string;
  zone?: "fridge" | "freezer";
  expiryAt?: Date;
  source?: string;
  photoId?: string;
  barcode?: string;
}

function scope(userId: string = GUEST_USER_ID) {
  const profileId = getSettingsForUser(userId).activeProfileId;
  return { userId, profileId };
}

export function listInventory(userId: string = GUEST_USER_ID) {
  ensureSeedData();
  const db = getDb();
  const { userId: uid, profileId } = scope(userId);
  return db
    .select()
    .from(inventoryItems)
    .all()
    .filter(
      (i) =>
        (i.userId ?? GUEST_USER_ID) === uid &&
        (i.profileId ?? "default") === profileId,
    );
}

export function getInventorySnapshot(
  userId: string = GUEST_USER_ID,
): InventorySnapshot[] {
  return listInventory(userId).map((item) => ({
    normalizedName: item.normalizedName,
    name: item.name,
    qty: item.qty,
    unit: item.unit ?? "шт",
    zone: (item.zone as "fridge" | "freezer") ?? "fridge",
  }));
}

export function upsertInventoryItem(
  input: InventoryInput,
  userId: string = GUEST_USER_ID,
) {
  ensureSeedData();
  const db = getDb();
  const { userId: uid, profileId } = scope(userId);
  const normalizedName = normalizeProductName(input.name);
  const zone = input.zone ?? "fridge";

  const existing = db
    .select()
    .from(inventoryItems)
    .all()
    .find(
      (i) =>
        (i.userId ?? GUEST_USER_ID) === uid &&
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
        barcode: input.barcode ?? existing.barcode,
      })
      .where(eq(inventoryItems.id, existing.id))
      .run();
    return existing.id;
  }

  const id = uuid();
  db.insert(inventoryItems)
    .values({
      id,
      userId: uid,
      profileId,
      name: input.name,
      normalizedName,
      zone,
      qty: input.qty,
      unit: input.unit ?? "шт",
      expiryAt: input.expiryAt,
      source: input.source ?? "manual",
      photoId: input.photoId,
      barcode: input.barcode ?? null,
      updatedAt: new Date(),
    })
    .run();
  return id;
}

export function deleteInventoryItem(id: string, userId: string = GUEST_USER_ID) {
  ensureSeedData();
  const db = getDb();
  const { userId: uid, profileId } = scope(userId);
  const item = db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.id, id))
    .all()[0];
  if (
    !item ||
    (item.userId ?? GUEST_USER_ID) !== uid ||
    (item.profileId ?? "default") !== profileId
  ) {
    throw new Error("Позиция не найдена");
  }
  db.delete(inventoryItems).where(eq(inventoryItems.id, id)).run();
}
