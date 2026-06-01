import { parseReceiptText } from "./text-parser";
import type { ConnectorOrder } from "@/connectors/types";

export async function parseReceiptPdf(buffer: Buffer): Promise<ConnectorOrder[]> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  const text = result.text?.trim() ?? "";
  if (!text) {
    throw new Error("PDF: не удалось извлечь текст. Сохраните чек как фото или CSV.");
  }
  const orders = parseReceiptText(text);
  if (orders.length === 0) {
    throw new Error(
      "PDF: текст найден, но позиции не распознаны. Попробуйте фото чека или вставьте текст вручную.",
    );
  }
  return orders;
}
