import { sendTelegramMessage } from "./bot-api";
import { listTelegramChats } from "@/lib/services/telegram";
import { listExpiryAlerts } from "@/lib/services/expiry";
import { getStoreLabel } from "@/lib/constants/stores";
import { listProfiles } from "@/lib/services/profiles";

export async function broadcastToTelegram(
  text: string,
  filter?: (chat: ReturnType<typeof listTelegramChats>[number]) => boolean,
) {
  const chats = listTelegramChats();
  for (const chat of chats) {
    if (filter && !filter(chat)) continue;
    try {
      await sendTelegramMessage(chat.chatId, text);
    } catch (e) {
      console.error("Telegram send failed", chat.chatId, e);
    }
  }
}

/** Напоминания по активному профилю (как в приложении) */
export async function notifyTelegramExpiryForActiveProfile() {
  const alerts = listExpiryAlerts(3);
  if (alerts.length === 0) return;

  const lines = alerts.slice(0, 8).map((a) => {
    const label =
      a.urgency === "expired"
        ? "просрочено"
        : a.urgency === "today"
          ? "сегодня"
          : `через ${a.daysLeft} дн.`;
    return `• ${a.name} (${label})`;
  });

  const text = `❄️ jFreeze — срок годности:\n${lines.join("\n")}${
    alerts.length > 8 ? `\n…и ещё ${alerts.length - 8}` : ""
  }`;

  await broadcastToTelegram(text, (c) => c.notifyExpiry);
}

export async function notifyTelegramNewOrders(count: number, storeId: string) {
  if (count <= 0) return;
  const store = getStoreLabel(storeId);
  const text = `🛒 jFreeze: импортировано заказов: ${count} (${store})`;
  await broadcastToTelegram(text, (c) => c.notifyOrders);
}

export async function notifyTelegramFamilyUpload(options: {
  uploaderName: string;
  profileId: string;
  kind: string;
  itemId: string;
  excludeChatId?: string;
}) {
  const profiles = listProfiles();
  const profileName =
    profiles.find((p) => p.id === options.profileId)?.name ?? options.profileId;
  const kindLabel = options.kind === "photo" ? "фото" : "файл";
  const text = `📎 ${options.uploaderName} добавил ${kindLabel} в семейную ленту (${profileName}).\nОткройте jFreeze → Семья → Telegram.`;

  await broadcastToTelegram(text, (c) => {
    if (options.excludeChatId && c.chatId === options.excludeChatId) return false;
    return c.notifyFamily;
  });
}
