import fs from "fs";
import path from "path";
import { getFamilyInboxItem } from "./telegram";
import { processPhotoUpload } from "./fridge";
import { extractOfdQrFromText, resolveOfdReceipt } from "@/lib/receipt/ofd-qr";
import { persistConnectorOrders } from "./orders";
import { resolveProverkaChekaTokenForUser } from "./settings";
import { validateFridgeImage } from "@/lib/fridge/image-utils";

export async function importFamilyInboxToFridge(
  inboxId: string,
  zone: "fridge" | "freezer",
  userId: string,
) {
  const item = getFamilyInboxItem(inboxId);
  if (!item) throw new Error("Запись не найдена");
  if (item.kind !== "photo") {
    throw new Error("В холодильник можно импортировать только фото");
  }
  if (!fs.existsSync(item.filePath)) {
    throw new Error("Файл на диске отсутствует");
  }

  const buffer = fs.readFileSync(item.filePath);
  const check = validateFridgeImage(buffer, item.fileName ?? "photo.jpg");
  if (!check.ok) throw new Error(check.error);

  return processPhotoUpload(buffer, zone, check.ext, userId);
}

export async function importFamilyInboxToReceipt(inboxId: string, userId: string) {
  const item = getFamilyInboxItem(inboxId);
  if (!item) throw new Error("Запись не найдена");

  const caption = item.caption?.trim();
  if (!caption) {
    throw new Error(
      "Добавьте к фото в Telegram подпись с QR чека (ссылка или t=, fn=, fp=)",
    );
  }

  const qr = extractOfdQrFromText(caption);
  if (!qr) {
    throw new Error("В подписи не найден QR чека ОФД");
  }

  const token = resolveProverkaChekaTokenForUser(userId);
  const result = await resolveOfdReceipt(qr, token);
  const created = await persistConnectorOrders("receipt", result.orders, {
    userId,
    notifyTelegram: true,
  });

  return {
    kind: "ofd" as const,
    imported: created.length,
    source: result.source,
    verifyUrl: result.verifyUrl,
    itemCount: result.orders[0]?.items.length ?? 0,
  };
}

export function familyInboxPreviewUrl(inboxId: string): string {
  return `/api/telegram/inbox/${inboxId}`;
}

export function familyInboxFileExt(item: { fileName?: string | null; kind: string }): string {
  const ext = item.fileName ? path.extname(item.fileName) : "";
  return ext || (item.kind === "photo" ? ".jpg" : "");
}
