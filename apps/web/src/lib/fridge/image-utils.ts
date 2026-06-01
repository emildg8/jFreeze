const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export function pathExtFromName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : ".jpg";
}

export function validateFridgeImage(
  buffer: Buffer,
  fileName: string,
): { ok: true; ext: string } | { ok: false; error: string } {
  if (buffer.length === 0) {
    return { ok: false, error: "Пустой файл" };
  }
  if (buffer.length > MAX_BYTES) {
    return { ok: false, error: "Фото больше 8 МБ — сожмите или выберите другое" };
  }
  const ext = pathExtFromName(fileName);
  if (!ALLOWED_EXT.has(ext)) {
    return { ok: false, error: "Формат: JPG, PNG или WebP" };
  }
  return { ok: true, ext };
}
