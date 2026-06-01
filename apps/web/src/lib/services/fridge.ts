import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { fridgePhotos } from "@/lib/db/schema";
import { getVisionProvider } from "@/lib/fridge/vision";
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
) {
  ensureSeedData();
  const filePath = savePhotoFile(buffer, ext);
  const vision = getVisionProvider();
  const detected = await vision.detectFromImage(buffer, zone);

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

  return { photoId, detected, filePath };
}

export function confirmPhotoInventory(
  photoId: string,
  items: Array<{ name: string; qty: number; unit: string }>,
  zone: "fridge" | "freezer",
) {
  ensureSeedData();
  const db = getDb();
  for (const item of items) {
    upsertInventoryItem({
      name: item.name,
      qty: item.qty,
      unit: item.unit,
      zone,
      source: "photo",
      photoId,
    });
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
