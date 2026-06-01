import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { fridgePhotos } from "@/lib/db/schema";
import { getVisionProvider, getFridgeVisionContextForUser } from "@/lib/fridge/vision";
import type { FridgeRecognitionMode } from "@/lib/fridge/vision";
import { getDemoVisionItems } from "@/lib/fridge/demo-items";
import { resolveUserScope, GUEST_USER_ID } from "@/lib/auth/scope";
import { getSettingsForUser, resolveOpenAiApiKeyForUser } from "./settings";
import { defaultExpiryDate } from "@/lib/cart/product-knowledge";
import { normalizeProductName } from "@/lib/orders/normalize";
import { upsertInventoryItem } from "./inventory";

export function savePhotoFile(buffer: Buffer, ext: string): string {
  const uploadsDir = path.join(process.cwd(), "data", "uploads");
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch {
    /* dir exists */
  }
  const filename = `${uuid()}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export async function processPhotoUpload(
  buffer: Buffer,
  zone: "fridge" | "freezer",
  ext = ".jpg",
  userId?: string,
) {
  ensureSeedData();
  const uid = userId ?? (await resolveUserScope());
  const filePath = savePhotoFile(buffer, ext);
  const context = getFridgeVisionContextForUser(uid);
  const vision = getVisionProvider(uid);
  const detected = await vision.detectFromImage(buffer, zone, context);

  const photoId = uuid();
  const db = getDb();
  db.insert(fridgePhotos)
    .values({
      id: photoId,
      filePath,
      zone,
      detectedItemsJson: JSON.stringify(detected),
      createdAt: new Date(),
    })
    .run();

  const hasOpenAiKey = Boolean(resolveOpenAiApiKeyForUser(uid));
  const recognition: {
    mode: FridgeRecognitionMode;
    modelLabel: string;
    photoHint: string;
    needsOpenAiKey: boolean;
    hasOpenAiKey: boolean;
  } = {
    mode: vision.mode,
    modelLabel: context.model.label,
    photoHint: context.model.photoHint,
    needsOpenAiKey: !hasOpenAiKey,
    hasOpenAiKey,
  };

  const demoTemplate =
    vision.mode === "demo" && detected.length === 0
      ? getDemoVisionItems(zone)
      : undefined;

  return { photoId, detected, filePath, recognition, demoTemplate };
}

export function confirmPhotoInventory(
  photoId: string,
  items: Array<{ name: string; qty: number; unit: string }>,
  zone: "fridge" | "freezer",
  userId: string = GUEST_USER_ID,
) {
  ensureSeedData();
  const db = getDb();
  for (const item of items) {
    const normalizedName = normalizeProductName(item.name);
    upsertInventoryItem(
      {
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        zone,
        expiryAt: defaultExpiryDate(normalizedName),
        source: "photo",
        photoId,
      },
      userId,
    );
  }
  db.update(fridgePhotos)
    .set({ userConfirmedAt: new Date() })
    .where(eq(fridgePhotos.id, photoId))
    .run();
}

export function getPhoto(photoId: string) {
  ensureSeedData();
  const db = getDb();
  return db
    .select()
    .from(fridgePhotos)
    .where(eq(fridgePhotos.id, photoId))
    .all()[0];
}

export function getFridgeModelForUser(userId: string = GUEST_USER_ID) {
  return getSettingsForUser(userId).fridgeModel;
}
