import { downloadTelegramFile, sendTelegramMessage } from "./bot-api";
import { getPublicAppUrl, isTelegramConfigured } from "./config";
import type { TelegramMessage, TelegramUpdate } from "./types";
import {
  getTelegramChat,
  linkTelegramChat,
  listFamilyInbox,
  saveFamilyInboxFile,
  setTelegramChatProfile,
  setTelegramNotify,
  unlinkTelegramChat,
} from "@/lib/services/telegram";
import { listProfiles } from "@/lib/services/profiles";
import { listExpiryAlerts, getExpirySummary } from "@/lib/services/expiry";
import { listOrdersWithItems } from "@/lib/services/orders";
import { getStoreLabel } from "@/lib/constants/stores";
import { notifyTelegramFamilyUpload } from "./notify";

function chatIdStr(msg: TelegramMessage): string {
  return String(msg.chat.id);
}

function userLabel(msg: TelegramMessage): string {
  const u = msg.from;
  if (!u) return msg.chat.first_name ?? "Участник";
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "Участник";
}

function parseCommand(text: string): { cmd: string; args: string } {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return { cmd: "", args: "" };
  const [first, ...rest] = trimmed.split(/\s+/);
  const cmd = first.split("@")[0].toLowerCase();
  return { cmd, args: rest.join(" ").trim() };
}

async function reply(chatId: string, text: string) {
  await sendTelegramMessage(chatId, text);
}

async function handleCommand(msg: TelegramMessage) {
  const chatId = chatIdStr(msg);
  const text = msg.text ?? "";
  const { cmd, args } = parseCommand(text);
  const linked = getTelegramChat(chatId);

  if (cmd === "/start" || cmd === "/help") {
    const appUrl = getPublicAppUrl();
    await reply(
      chatId,
      `❄️ jFreeze — бот семьи\n\n` +
        `1) В приложении: Семья → Telegram → «Получить код»\n` +
        `2) Отправьте: /link КОД\n\n` +
        `Команды:\n` +
        `/link КОД — привязка\n` +
        `/fridge — сроки годности\n` +
        `/orders — последние заказы\n` +
        `/files — лента фото и файлов\n` +
        `/profile — профиль холодильника\n` +
        `/notify — настройки уведомлений\n` +
        `/unlink — отвязать чат\n\n` +
        `Отправьте фото или документ — попадёт в семейную ленту.\n` +
        `Приложение: ${appUrl}`,
    );
    return;
  }

  if (cmd === "/link") {
    if (!args) {
      await reply(chatId, "Укажите код: /link AB12CD\nКод берётся в приложении jFreeze → Семья.");
      return;
    }
    const result = linkTelegramChat({
      token: args,
      chatId,
      displayName: userLabel(msg),
      username: msg.from?.username,
    });
    if (!result.ok) {
      await reply(chatId, result.error);
      return;
    }
    await reply(
      chatId,
      `✅ Чат привязан к jFreeze.\nПрофиль: ${result.profileId}\n\n` +
        `Пришлите фото холодильника или чека — сохраним в семейную ленту.\n` +
        `/notify — что присылать в Telegram`,
    );
    return;
  }

  if (!linked) {
    await reply(chatId, "Сначала привяжите чат: /link КОД из приложения jFreeze.");
    return;
  }

  if (cmd === "/unlink") {
    unlinkTelegramChat(chatId);
    await reply(chatId, "Чат отвязан. Чтобы снова подключиться — /link КОД");
    return;
  }

  if (cmd === "/profile") {
    const profiles = listProfiles();
    if (!args) {
      const lines = profiles.map(
        (p) => `• ${p.name} (${p.id})${p.id === linked.profileId ? " ← активен" : ""}`,
      );
      await reply(
        chatId,
        `Профили:\n${lines.join("\n")}\n\nПереключить: /profile id\nНапример: /profile default`,
      );
      return;
    }
    if (setTelegramChatProfile(chatId, args)) {
      await reply(chatId, `Профиль для этого чата: ${args}`);
    } else {
      await reply(chatId, "Неизвестный профиль. /profile — список");
    }
    return;
  }

  if (cmd === "/notify") {
    if (!args) {
      await reply(
        chatId,
        `Уведомления:\n` +
          `Срок годности: ${linked.notifyExpiry ? "вкл" : "выкл"}\n` +
          `Новые заказы: ${linked.notifyOrders ? "вкл" : "выкл"}\n` +
          `Семейная лента: ${linked.notifyFamily ? "вкл" : "выкл"}\n\n` +
          `Изменить:\n/notify expiry on|off\n/notify orders on|off\n/notify family on|off`,
      );
      return;
    }
    const [topic, state] = args.toLowerCase().split(/\s+/);
    const on = state === "on" || state === "1" || state === "да";
    const off = state === "off" || state === "0" || state === "нет";
    if (!on && !off) {
      await reply(chatId, "Пример: /notify expiry on");
      return;
    }
    const value = on;
    if (topic === "expiry" || topic === "срок") {
      setTelegramNotify(chatId, "notifyExpiry", value);
    } else if (topic === "orders" || topic === "заказы") {
      setTelegramNotify(chatId, "notifyOrders", value);
    } else if (topic === "family" || topic === "семья") {
      setTelegramNotify(chatId, "notifyFamily", value);
    } else {
      await reply(chatId, "Тема: expiry | orders | family");
      return;
    }
    await reply(chatId, `Готово: ${topic} → ${value ? "вкл" : "выкл"}`);
    return;
  }

  if (cmd === "/fridge") {
    const summary = getExpirySummary();
    const alerts = listExpiryAlerts(5);
    if (alerts.length === 0) {
      await reply(
        chatId,
        `❄️ Скоро истекающих продуктов нет.\n(Просрочено: ${summary.expired}, сегодня: ${summary.today})`,
      );
      return;
    }
    const lines = alerts.map((a) => `• ${a.name} — ${a.urgency}`);
    await reply(chatId, `❄️ Внимание:\n${lines.join("\n")}`);
    return;
  }

  if (cmd === "/orders") {
    const orders = (await listOrdersWithItems()).slice(0, 5);
    if (orders.length === 0) {
      await reply(chatId, "Заказов пока нет в приложении.");
      return;
    }
    const lines = orders.map((o) => {
      const d = o.orderedAt.toLocaleDateString("ru-RU");
      const store = getStoreLabel(o.storeId);
      const n = o.items.length;
      return `• ${d} — ${store} (${n} поз.)`;
    });
    await reply(chatId, `🛒 Последние заказы:\n${lines.join("\n")}`);
    return;
  }

  if (cmd === "/files") {
    const items = listFamilyInbox(linked.profileId, 8);
    if (items.length === 0) {
      await reply(chatId, "Лента пуста. Отправьте фото или файл в этот чат.");
      return;
    }
    const lines = items.map((i) => {
      const d = i.createdAt.toLocaleDateString("ru-RU");
      const who = i.uploaderName ?? "Семья";
      return `• ${d} — ${who}: ${i.kind}${i.caption ? ` (${i.caption.slice(0, 40)})` : ""}`;
    });
    await reply(
      chatId,
      `📎 Семейная лента:\n${lines.join("\n")}\n\nПолный список: ${getPublicAppUrl()}/family`,
    );
    return;
  }

  if (cmd === "/ping") {
    await reply(chatId, "pong");
  }
}

async function handleMedia(msg: TelegramMessage) {
  const chatId = chatIdStr(msg);
  const linked = getTelegramChat(chatId);
  if (!linked) {
    await reply(chatId, "Привяжите чат командой /link КОД из приложения.");
    return;
  }

  let fileId: string | undefined;
  let fileName = "file";
  let mimeType: string | undefined;
  let kind: "photo" | "document" = "document";

  if (msg.photo?.length) {
    const largest = msg.photo[msg.photo.length - 1];
    fileId = largest.file_id;
    fileName = `photo-${msg.message_id}.jpg`;
    mimeType = "image/jpeg";
    kind = "photo";
  } else if (msg.document) {
    fileId = msg.document.file_id;
    fileName = msg.document.file_name ?? `doc-${msg.message_id}`;
    mimeType = msg.document.mime_type;
    kind = "document";
  }

  if (!fileId) return;

  const buffer = await downloadTelegramFile(fileId);
  const caption = msg.caption?.trim();
  const uploader = userLabel(msg);

  const saved = saveFamilyInboxFile({
    chatId,
    profileId: linked.profileId,
    uploaderName: uploader,
    buffer,
    fileName,
    mimeType,
    kind,
    caption,
  });

  await reply(
    chatId,
    `✅ ${kind === "photo" ? "Фото" : "Файл"} сохранён в семейную ленту (${linked.profileId}).\n` +
      `ID: ${saved.id}\n` +
      `Откройте в приложении: ${getPublicAppUrl()}/family`,
  );

  await notifyTelegramFamilyUpload({
    uploaderName: uploader,
    profileId: linked.profileId,
    kind,
    itemId: saved.id,
    excludeChatId: chatId,
  });
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  if (!isTelegramConfigured()) return;

  const msg = update.message;
  if (!msg) return;

  try {
    if (msg.text?.startsWith("/")) {
      await handleCommand(msg);
      return;
    }
    if (msg.photo?.length || msg.document) {
      await handleMedia(msg);
      return;
    }
    if (msg.text) {
      const chatId = chatIdStr(msg);
      const linked = getTelegramChat(chatId);
      if (linked) {
        await reply(
          chatId,
          "Отправьте /help или фото/документ для семейной ленты.",
        );
      }
    }
  } catch (e) {
    console.error("Telegram handler error", e);
    try {
      await reply(chatIdStr(msg), "Произошла ошибка. Попробуйте позже или /help");
    } catch {
      /* ignore */
    }
  }
}
