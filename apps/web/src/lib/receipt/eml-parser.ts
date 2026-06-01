/** Извлекает читаемый текст из .eml / вставки письма (без платных API). */

function decodeQuotedPrintable(input: string): string {
  return input
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+\n/g, "\n")
    .trim();
}

function extractMimePart(raw: string, contentType: string): string | null {
  const typeEsc = contentType.replace("/", "\\/");
  const re = new RegExp(
    `Content-Type:\\s*${typeEsc}[^\\n]*\\n(?:[^\\n]*\\n)*?\\n([\\s\\S]*?)(?=\\n--|$)`,
    "i",
  );
  const m = raw.match(re);
  if (!m) return null;
  let body = m[1];
  if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(m[0])) {
    body = decodeQuotedPrintable(body);
  }
  return body.trim();
}

export function extractTextFromEml(raw: string): string {
  const decoded = raw.includes("=\r\n") ? decodeQuotedPrintable(raw) : raw;

  const plain =
    extractMimePart(decoded, "text/plain") ??
    extractMimePart(decoded, "text/plain; charset=utf-8");
  if (plain) return plain;

  const html =
    extractMimePart(decoded, "text/html") ??
    extractMimePart(decoded, "text/html; charset=utf-8");
  if (html) return stripHtml(html);

  const afterHeaders = decoded.split(/\r?\n\r?\n/);
  if (afterHeaders.length > 1) {
    const body = afterHeaders.slice(1).join("\n\n");
    if (body.includes("<html") || body.includes("<body")) {
      return stripHtml(body);
    }
    return body.trim();
  }

  return decoded.trim();
}

/** Текст из вставки «как из Gmail/Outlook» */
export function normalizeEmailPaste(text: string): string {
  return text.replace(/\u00a0/g, " ").trim();
}
