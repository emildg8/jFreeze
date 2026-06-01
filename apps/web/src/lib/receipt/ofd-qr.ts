import type { ConnectorOrder, ConnectorOrderItem } from "@/connectors/types";
import { parseReceiptText } from "./text-parser";

export interface OfdQrData {
  orderedAt: Date;
  totalRub: number;
  fn: string;
  fd: string;
  fp: string;
  n?: string;
  verifyUrl: string;
  /** Исходная query-строка QR (для запросов к ОФД) */
  queryString: string;
}

function parseOfdTimestamp(raw: string): Date {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?/);
  if (m) {
    return new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
      parseInt(m[4], 10),
      parseInt(m[5], 10),
      m[6] ? parseInt(m[6], 10) : 0,
    );
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/** Разбор строки QR кассового чека (ФН, ФД, ФП, сумма, дата) */
export function parseOfdQr(input: string): OfdQrData | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let query = trimmed;
  if (trimmed.includes("?")) {
    query = trimmed.slice(trimmed.indexOf("?") + 1);
  } else if (!/[=;&]/.test(trimmed)) {
    return null;
  }

  const params = new URLSearchParams(query.replace(/^&/, ""));
  const t = params.get("t");
  const s = params.get("s");
  const fn = params.get("fn");
  const fd = params.get("i") ?? params.get("fd");
  const fp = params.get("fp");
  const n = params.get("n") ?? undefined;

  if (!t || !s || !fn || !fd || !fp) return null;

  const totalRub = parseFloat(s.replace(",", "."));
  if (!Number.isFinite(totalRub) || totalRub <= 0) return null;

  const orderedAt = parseOfdTimestamp(t);
  const verifyUrl =
    trimmed.startsWith("http") && trimmed.includes("?")
      ? trimmed
      : `https://consumer.1-ofd.ru/v1?${query}`;

  return {
    orderedAt,
    totalRub,
    fn,
    fd,
    fp,
    n: n ?? undefined,
    verifyUrl,
    queryString: query,
  };
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .replace(/ ([\d.,]+)\s*₽/g, "\n$1 ₽\n");
}

async function fetchOfdHtml(data: OfdQrData): Promise<string | null> {
  const urls = [data.verifyUrl, `https://consumer.1-ofd.ru/v1?${data.queryString}`];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "text/html", "User-Agent": "jFreeze/0.1" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      if (html.length > 500) return html;
    } catch {
      /* next */
    }
  }
  return null;
}

async function fetchItemsViaProverka(data: OfdQrData): Promise<ConnectorOrderItem[]> {
  const token = process.env.PROVERKA_CHEKA_TOKEN?.trim();
  if (!token) return [];

  const tParam = data.orderedAt
    .toISOString()
    .replace(/[-:]/g, "")
    .slice(0, 13)
    .replace("T", "T");

  const qs = new URLSearchParams({
    fn: data.fn,
    fd: data.fd,
    fp: data.fp,
    t: tParam,
    s: String(data.totalRub),
    n: data.n ?? "1",
    token,
  });

  try {
    const res = await fetch(
      `https://proverkacheka.com/api/v1/check/get?${qs}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { json?: { items?: Array<{ name?: string; quantity?: number; sum?: number }> } };
    };
    const rows = json.data?.json?.items ?? [];
    return rows
      .map((row) => ({
        name: String(row.name ?? "").trim(),
        qty: Number(row.quantity) || 1,
        unit: "шт" as const,
      }))
      .filter((i) => i.name.length > 1);
  } catch {
    return [];
  }
}

export async function resolveOfdReceipt(qrInput: string): Promise<{
  orders: ConnectorOrder[];
  ofd: OfdQrData;
  source: "api" | "html" | "qr-only";
  verifyUrl: string;
}> {
  const ofd = parseOfdQr(qrInput);
  if (!ofd) {
    throw new Error(
      "Не похоже на QR чека ОФД. Вставьте строку с t=, s=, fn=, i=, fp= или ссылку с чека.",
    );
  }

  let items: ConnectorOrderItem[] = await fetchItemsViaProverka(ofd);
  let source: "api" | "html" | "qr-only" = items.length > 0 ? "api" : "qr-only";

  if (items.length === 0) {
    const html = await fetchOfdHtml(ofd);
    if (html) {
      const text = htmlToPlainText(html);
      const parsed = parseReceiptText(text);
      items = parsed[0]?.items ?? [];
      if (items.length > 0) source = "html";
    }
  }

  if (items.length === 0) {
    items = [
      {
        name: `Покупка по чеку ОФД · ${ofd.totalRub.toFixed(2)} ₽`,
        qty: 1,
        unit: "шт",
      },
    ];
  }

  const externalId = `ofd-${ofd.fn}-${ofd.fd}-${ofd.fp}`;

  return {
    ofd,
    source,
    verifyUrl: ofd.verifyUrl,
    orders: [
      {
        externalId,
        orderedAt: ofd.orderedAt,
        totalRub: ofd.totalRub,
        items,
      },
    ],
  };
}
