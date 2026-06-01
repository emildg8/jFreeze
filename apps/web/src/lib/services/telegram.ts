import { eq, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import {
  familyInbox,
  telegramChats,
  telegramLinkTokens,
} from "@/lib/db/schema";
import { listProfiles } from "./profiles";
import { getPublicAppUrl } from "@/lib/telegram/config";

const TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TOKEN_TTL_MS = 15 * 60 * 1000;

function randomToken(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)];
  }
  return s;
}

export function createTelegramLinkToken(): { token: string; expiresAt: Date } {
  ensureSeedData();
  const db = getDb();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  db.insert(telegramLinkTokens)
    .values({ token, expiresAt, createdAt: new Date() })
    .run();
  return { token, expiresAt };
}

export function linkTelegramChat(options: {
  token: string;
  chatId: string;
  displayName?: string;
  username?: string;
}): { ok: true; profileId: string } | { ok: false; error: string } {
  ensureSeedData();
  const db = getDb();
  const row = db
    .select()
    .from(telegramLinkTokens)
    .where(eq(telegramLinkTokens.token, options.token.toUpperCase()))
    .all()[0];

  if (!row || row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Код недействителен или истёк. Получите новый в приложении." };
  }

  db.delete(telegramLinkTokens)
    .where(eq(telegramLinkTokens.token, options.token.toUpperCase()))
    .run();

  const profileId = "default";
  const existing = getTelegramChat(options.chatId);
  if (existing) {
    db.update(telegramChats)
      .set({
        displayName: options.displayName,
        username: options.username,
        linkedAt: new Date(),
      })
      .where(eq(telegramChats.chatId, options.chatId))
      .run();
  } else {
    db.insert(telegramChats)
      .values({
        chatId: options.chatId,
        profileId,
        displayName: options.displayName,
        username: options.username,
        notifyExpiry: true,
        notifyOrders: true,
        notifyFamily: true,
        linkedAt: new Date(),
      })
      .run();
  }

  return { ok: true, profileId };
}

export function getTelegramChat(chatId: string) {
  ensureSeedData();
  const db = getDb();
  return db.select().from(telegramChats).where(eq(telegramChats.chatId, chatId)).all()[0];
}

export function listTelegramChats() {
  ensureSeedData();
  const db = getDb();
  return db.select().from(telegramChats).all();
}

export function listTelegramStatus() {
  const chats = listTelegramChats();
  const configured = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
  return {
    configured,
    botUsername: process.env.TELEGRAM_BOT_USERNAME?.trim() || null,
    linkedCount: chats.length,
    chats: chats.map((c) => ({
      chatId: c.chatId,
      displayName: c.displayName,
      username: c.username,
      profileId: c.profileId,
      notifyExpiry: c.notifyExpiry,
      notifyOrders: c.notifyOrders,
      notifyFamily: c.notifyFamily,
      linkedAt: c.linkedAt,
    })),
    appUrl: getPublicAppUrl(),
  };
}

export function setTelegramChatProfile(chatId: string, profileId: string): boolean {
  const profiles = listProfiles();
  if (!profiles.some((p) => p.id === profileId)) return false;
  const db = getDb();
  const chat = getTelegramChat(chatId);
  if (!chat) return false;
  db.update(telegramChats)
    .set({ profileId })
    .where(eq(telegramChats.chatId, chatId))
    .run();
  return true;
}

export function setTelegramNotify(
  chatId: string,
  field: "notifyExpiry" | "notifyOrders" | "notifyFamily",
  value: boolean,
) {
  const db = getDb();
  db.update(telegramChats)
    .set({ [field]: value })
    .where(eq(telegramChats.chatId, chatId))
    .run();
}

export function saveFamilyInboxFile(options: {
  chatId: string;
  profileId: string;
  uploaderName?: string;
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
  kind: "photo" | "document";
  caption?: string;
}) {
  ensureSeedData();
  const dir = path.join(process.cwd(), "data", "telegram", options.profileId);
  fs.mkdirSync(dir, { recursive: true });

  const id = uuid();
  const ext = path.extname(options.fileName) || (options.kind === "photo" ? ".jpg" : "");
  const safeName = `${id}${ext}`;
  const filePath = path.join(dir, safeName);
  fs.writeFileSync(filePath, options.buffer);

  const db = getDb();
  db.insert(familyInbox)
    .values({
      id,
      profileId: options.profileId,
      chatId: options.chatId,
      uploaderName: options.uploaderName,
      filePath,
      fileName: options.fileName,
      mimeType: options.mimeType,
      kind: options.kind,
      caption: options.caption,
      createdAt: new Date(),
    })
    .run();

  return { id, filePath };
}

export function listFamilyInbox(profileId?: string, limit = 30) {
  ensureSeedData();
  const db = getDb();
  let rows = db.select().from(familyInbox).orderBy(desc(familyInbox.createdAt)).all();
  if (profileId) {
    rows = rows.filter((r) => r.profileId === profileId);
  }
  return rows.slice(0, limit);
}

export function getFamilyInboxItem(id: string) {
  ensureSeedData();
  const db = getDb();
  return db.select().from(familyInbox).where(eq(familyInbox.id, id)).all()[0];
}

export function unlinkTelegramChat(chatId: string) {
  const db = getDb();
  db.delete(telegramChats).where(eq(telegramChats.chatId, chatId)).run();
}
