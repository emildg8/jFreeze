import type { ImapConfig } from "./types";

export type ImapPresetId = "gmail" | "yandex" | "mailru";

export const IMAP_PRESETS: Record<
  ImapPresetId,
  { label: string; host: string; port: number; tls: boolean; hint: string }
> = {
  gmail: {
    label: "Gmail",
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    hint: "Пароль приложения: Google Аккаунт → Безопасность",
  },
  yandex: {
    label: "Яндекс",
    host: "imap.yandex.ru",
    port: 993,
    tls: true,
    hint: "Пароль приложения: id.yandex.ru → Пароли приложений",
  },
  mailru: {
    label: "Mail.ru",
    host: "imap.mail.ru",
    port: 993,
    tls: true,
    hint: "Пароль для внешних приложений в настройках почты",
  },
};

export function applyImapPreset(
  current: ImapConfig,
  presetId: ImapPresetId,
): ImapConfig {
  const p = IMAP_PRESETS[presetId];
  return {
    ...current,
    host: p.host,
    port: p.port,
    tls: p.tls,
    enabled: true,
  };
}
