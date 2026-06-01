import catalog from "@/data/store-sources.ru.json";
import type { StoreSourceCatalogEntry } from "./types";

const ENTRIES = catalog as StoreSourceCatalogEntry[];

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ");
}

export function getSourceCatalog(): StoreSourceCatalogEntry[] {
  return ENTRIES;
}

export function detectFromEmail(meta: {
  from?: string;
  subject?: string;
  body: string;
}): StoreSourceCatalogEntry | null {
  const from = norm(meta.from ?? "");
  const subject = norm(meta.subject ?? "");
  const body = norm(meta.body.slice(0, 4000));

  let best: { entry: StoreSourceCatalogEntry; score: number } | null = null;

  for (const entry of ENTRIES) {
    let score = 0;
    for (const f of entry.emailFrom) {
      if (from.includes(norm(f))) score += 3;
    }
    for (const s of entry.emailSubject) {
      if (subject.includes(norm(s))) score += 2;
      if (body.includes(norm(s))) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score };
    }
  }

  return best && best.score >= 2 ? best.entry : null;
}

export function detectFromSms(text: string): StoreSourceCatalogEntry | null {
  const t = norm(text);
  let best: { entry: StoreSourceCatalogEntry; score: number } | null = null;

  for (const entry of ENTRIES) {
    let score = 0;
    for (const kw of entry.smsKeywords) {
      if (t.includes(norm(kw))) score += 2;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score };
    }
  }

  return best?.entry ?? null;
}

export function getCatalogEntry(id: string): StoreSourceCatalogEntry | undefined {
  return ENTRIES.find((e) => e.id === id);
}
