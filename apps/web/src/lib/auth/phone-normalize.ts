/** Нормализация номера в E.164 (+7… для РФ). */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith("7")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+7${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}

/** Читаемый формат для поля ввода (РФ). */
export function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  let national = digits;
  if (national.startsWith("8") && national.length <= 11) {
    national = `7${national.slice(1)}`;
  }
  if (!national.startsWith("7")) {
    return raw.replace(/[^\d+()-\s]/g, "").trim();
  }

  const rest = national.slice(1, 11);
  let out = "+7";
  if (rest.length > 0) out += ` ${rest.slice(0, 3)}`;
  if (rest.length > 3) out += ` ${rest.slice(3, 6)}`;
  if (rest.length > 6) out += `-${rest.slice(6, 8)}`;
  if (rest.length > 8) out += `-${rest.slice(8, 10)}`;
  return out;
}

export function isPhoneComplete(raw: string): boolean {
  const phone = normalizePhone(raw);
  return phone !== null && phone.length >= 11;
}

/** Парсит «Подождите N сек.» из ответа OTP API. */
export function parseOtpCooldownSec(message: string): number | null {
  const match = message.match(/Подождите (\d+) сек/);
  return match ? Number(match[1]) : null;
}
