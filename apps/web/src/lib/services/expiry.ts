import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { inventoryItems } from "@/lib/db/schema";
import { getSettingsForUser } from "./settings";
import { GUEST_USER_ID } from "@/lib/auth/scope";

export type ExpiryUrgency = "expired" | "today" | "soon" | "ok";

export interface ExpiryAlert {
  id: string;
  name: string;
  qty: number;
  unit: string | null;
  zone: string;
  expiryAt: Date;
  urgency: ExpiryUrgency;
  daysLeft: number;
}

function classify(daysLeft: number): ExpiryUrgency {
  if (daysLeft < 0) return "expired";
  if (daysLeft === 0) return "today";
  if (daysLeft <= 3) return "soon";
  return "ok";
}

export function listExpiryAlerts(
  withinDays = 7,
  userId: string = GUEST_USER_ID,
): ExpiryAlert[] {
  ensureSeedData();
  if (!getSettingsForUser(userId).expiryRemindersEnabled) return [];

  const db = getDb();
  const profileId = getSettingsForUser(userId).activeProfileId;
  const items = db
    .select()
    .from(inventoryItems)
    .all()
    .filter(
      (i) =>
        (i.userId ?? GUEST_USER_ID) === userId &&
        (i.profileId ?? "default") === profileId &&
        i.expiryAt,
    );

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const alerts: ExpiryAlert[] = [];

  for (const item of items) {
    if (!item.expiryAt) continue;
    const exp = new Date(item.expiryAt);
    exp.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil(
      (exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (daysLeft > withinDays) continue;

    const urgency = classify(daysLeft);
    if (urgency === "ok") continue;

    alerts.push({
      id: item.id,
      name: item.name,
      qty: item.qty,
      unit: item.unit,
      zone: item.zone,
      expiryAt: item.expiryAt,
      urgency,
      daysLeft,
    });
  }

  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function getExpirySummary(userId: string = GUEST_USER_ID): {
  expired: number;
  today: number;
  soon: number;
} {
  const alerts = listExpiryAlerts(30, userId);
  return {
    expired: alerts.filter((a) => a.urgency === "expired").length,
    today: alerts.filter((a) => a.urgency === "today").length,
    soon: alerts.filter((a) => a.urgency === "soon").length,
  };
}
