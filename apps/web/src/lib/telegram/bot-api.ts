import { getTelegramBotToken } from "./config";

const API = "https://api.telegram.org";

async function call<T>(method: string, body?: Record<string, unknown>): Promise<T> {
  const token = getTelegramBotToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан");

  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as { ok: boolean; description?: string; result?: T };
  if (!data.ok) {
    throw new Error(data.description ?? `Telegram API: ${method}`);
  }
  return data.result as T;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  extra?: { parse_mode?: "HTML"; disable_web_page_preview?: boolean },
): Promise<void> {
  await call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: extra?.parse_mode,
    disable_web_page_preview: extra?.disable_web_page_preview ?? true,
  });
}

export async function sendTelegramPhoto(
  chatId: string,
  photoUrl: string,
  caption?: string,
): Promise<void> {
  await call("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption: caption?.slice(0, 1024),
  });
}

interface TgFile {
  file_id: string;
  file_path?: string;
}

export async function downloadTelegramFile(fileId: string): Promise<Buffer> {
  const token = getTelegramBotToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан");

  const file = await call<TgFile>("getFile", { file_id: fileId });
  if (!file.file_path) throw new Error("Telegram: пустой file_path");

  const url = `${API}/file/bot${token}/${file.file_path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Не удалось скачать файл из Telegram");
  return Buffer.from(await res.arrayBuffer());
}

export async function setTelegramWebhook(webhookUrl: string, secret?: string): Promise<void> {
  await call("setWebhook", {
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ["message"],
  });
}
