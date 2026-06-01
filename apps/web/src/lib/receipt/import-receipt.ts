import { parseReceiptCsv } from "@/connectors/receipt-csv";
import { parseCsvOrders } from "@/connectors/csv-import";
import type { ConnectorOrder } from "@/connectors/types";
import { extractTextFromEml, normalizeEmailPaste } from "./eml-parser";
import { parseReceiptImage } from "./image-parser";
import { parseReceiptPdf } from "./pdf-parser";
import { parseReceiptText } from "./text-parser";

export type ReceiptInputKind =
  | "csv"
  | "text"
  | "pdf"
  | "image"
  | "eml"
  | "email-paste";

export interface ReceiptParseResult {
  orders: ConnectorOrder[];
  kind: ReceiptInputKind;
  preview?: string;
}

function extOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i).toLowerCase() : "";
}

function mimeFromName(filename: string): string {
  const ext = extOf(filename);
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".pdf": "application/pdf",
  };
  return map[ext] ?? "application/octet-stream";
}

function parseCsvBuffer(text: string): ConnectorOrder[] {
  try {
    const r = parseReceiptCsv(text);
    if (r.length > 0) return r;
  } catch {
    /* */
  }
  return parseCsvOrders(text);
}

export async function parseReceiptInput(options: {
  buffer?: Buffer;
  filename?: string;
  mimeType?: string;
  text?: string;
}): Promise<ReceiptParseResult> {
  const { buffer, filename = "", mimeType, text } = options;

  if (text?.trim()) {
    const normalized = normalizeEmailPaste(text);
    const orders = parseReceiptText(normalized);
    if (orders.length === 0) {
      throw new Error(
        "Не удалось разобрать текст. Проверьте, что вставлен чек с названиями товаров.",
      );
    }
    return {
      orders,
      kind: "email-paste",
      preview: normalized.slice(0, 500),
    };
  }

  if (!buffer?.length) {
    throw new Error("Файл или текст не переданы");
  }

  const ext = extOf(filename);
  const mime = mimeType ?? mimeFromName(filename);

  if (ext === ".csv" || mime === "text/csv") {
    const csvText = buffer.toString("utf-8");
    return {
      orders: parseCsvBuffer(csvText),
      kind: "csv",
      preview: csvText.slice(0, 300),
    };
  }

  if (ext === ".txt" || mime.startsWith("text/")) {
    const raw = buffer.toString("utf-8");
    const orders = parseReceiptText(raw);
    if (orders.length === 0) {
      throw new Error("TXT: позиции не найдены. Попробуйте CSV или фото чека.");
    }
    return { orders, kind: "text", preview: raw.slice(0, 500) };
  }

  if (ext === ".eml" || mime === "message/rfc822") {
    const emlText = extractTextFromEml(buffer.toString("utf-8"));
    const orders = parseReceiptText(emlText);
    if (orders.length === 0) {
      throw new Error(
        "Письмо получено, но позиции не найдены. Вставьте текст чека вручную или приложите CSV.",
      );
    }
    return { orders, kind: "eml", preview: emlText.slice(0, 500) };
  }

  if (ext === ".pdf" || mime === "application/pdf") {
    const orders = await parseReceiptPdf(buffer);
    return { orders, kind: "pdf" };
  }

  if (mime.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp", ".heic"].includes(ext)) {
    const orders = await parseReceiptImage(buffer, mime.startsWith("image/") ? mime : "image/jpeg");
    return { orders, kind: "image" };
  }

  throw new Error(
    `Формат не поддержан (${ext || mime}). Используйте: фото, PDF, CSV, TXT, EML или вставку текста.`,
  );
}
