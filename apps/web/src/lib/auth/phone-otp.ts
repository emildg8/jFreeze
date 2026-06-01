import { createHash, randomInt } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { phoneOtps, authUsers, authAccounts } from "@/lib/db/schema";
import {
  formatPhoneInput,
  normalizePhone,
} from "@/lib/auth/phone-normalize";
import { OTP_MAX_ATTEMPTS, OTP_TTL_MS, PHONE_OTP_RESEND_SEC } from "@/lib/auth/constants";
import { v4 as uuid } from "uuid";

const RESEND_COOLDOWN_MS = PHONE_OTP_RESEND_SEC * 1000;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function otpCode(): string {
  return String(randomInt(100000, 999999));
}

function linkPhoneAccount(userId: string, phone: string) {
  getDb()
    .insert(authAccounts)
    .values({
      userId,
      type: "oidc",
      provider: "phone",
      providerAccountId: phone,
    })
    .onConflictDoNothing()
    .run();
}

export function sendPhoneOtp(rawPhone: string):
  | { ok: true; phone: string; devCode?: string }
  | { ok: false; error: string } {
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return { ok: false, error: "Введите номер в формате +7 и 10 цифр" };
  }

  const db = getDb();
  const existing = db.select().from(phoneOtps).where(eq(phoneOtps.phone, phone)).get();
  if (existing) {
    const age = Date.now() - existing.createdAt.getTime();
    if (age < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        error: `Подождите ${Math.ceil((RESEND_COOLDOWN_MS - age) / 1000)} сек.`,
      };
    }
  }

  const code = otpCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  db.insert(phoneOtps)
    .values({
      phone,
      codeHash: hashCode(code),
      expiresAt,
      createdAt: now,
      failedAttempts: 0,
    })
    .onConflictDoUpdate({
      target: phoneOtps.phone,
      set: {
        codeHash: hashCode(code),
        expiresAt,
        createdAt: now,
        failedAttempts: 0,
      },
    })
    .run();

  const devExpose =
    process.env.NODE_ENV !== "production" || process.env.AUTH_DEV_OTP === "1";

  if (process.env.SMS_WEBHOOK_URL?.trim()) {
    void fetch(process.env.SMS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    }).catch((e) => console.error("SMS webhook", e));
  }

  return {
    ok: true,
    phone,
    devCode: devExpose ? code : undefined,
  };
}

export function verifyPhoneOtp(
  rawPhone: string,
  code: string,
):
  | {
      ok: true;
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        phone: string | null;
      };
    }
  | { ok: false; error: string } {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "Неверный номер" };

  const db = getDb();
  const row = db.select().from(phoneOtps).where(eq(phoneOtps.phone, phone)).get();
  if (!row || row.expiresAt < new Date()) {
    return { ok: false, error: "Код истёк. Запросите новый." };
  }

  if (row.codeHash !== hashCode(code.trim())) {
    const attempts = (row.failedAttempts ?? 0) + 1;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      db.delete(phoneOtps).where(eq(phoneOtps.phone, phone)).run();
      return {
        ok: false,
        error: "Слишком много попыток. Запросите новый код.",
      };
    }
    db.update(phoneOtps)
      .set({ failedAttempts: attempts })
      .where(eq(phoneOtps.phone, phone))
      .run();
    return { ok: false, error: "Неверный код" };
  }

  db.delete(phoneOtps).where(eq(phoneOtps.phone, phone)).run();

  const displayName = formatPhoneInput(phone);
  let user = db.select().from(authUsers).where(eq(authUsers.phone, phone)).get();
  if (!user) {
    const id = uuid();
    db.insert(authUsers)
      .values({
        id,
        phone,
        name: displayName,
        email: null,
        image: null,
      })
      .run();
    user = {
      id,
      phone,
      name: displayName,
      email: null,
      image: null,
      emailVerified: null,
    };
  }

  linkPhoneAccount(user.id, phone);
  return { ok: true, user };
}
