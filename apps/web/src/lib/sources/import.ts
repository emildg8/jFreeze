import { createHash } from "crypto";
import type { StoreId } from "@/connectors/types";
import { parseEmailContent } from "./parse-email";
import { parseSmsBatch } from "./parse-sms";
import type { ParsedSourceImport, SourceChannel } from "./types";

export function contentHash(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex").slice(0, 32);
}

export function importFromEmail(options: {
  raw?: string;
  eml?: string;
  forcedStoreId?: StoreId;
}): ParsedSourceImport {
  return parseEmailContent(options);
}

export function importFromSms(
  text: string,
  forcedStoreId?: StoreId,
): ParsedSourceImport[] {
  return parseSmsBatch(text, forcedStoreId);
}

export function summarizeImports(imports: ParsedSourceImport[]) {
  const orders = imports.flatMap((i) => i.orders);
  const warnings = imports.flatMap((i) => i.warnings ?? []);
  const stores = [...new Set(imports.map((i) => i.storeName))];
  return { orders, warnings, stores, imports };
}

export type { ParsedSourceImport, SourceChannel };
