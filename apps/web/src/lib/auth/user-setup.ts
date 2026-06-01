import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { userSettings, orders, inventoryItems, cartSuggestions, profiles } from "@/lib/db/schema";

const GUEST_ID = "default";

/** Создаёт настройки для нового пользователя и переносит гостевые данные при первом входе. */
export function ensureUserWorkspace(userId: string) {
  const db = getDb();
  const existing = db
    .select()
    .from(userSettings)
    .where(eq(userSettings.id, userId))
    .get();

  if (!existing) {
    const guest = db
      .select()
      .from(userSettings)
      .where(eq(userSettings.id, GUEST_ID))
      .get();

    db.insert(userSettings)
      .values({
        id: userId,
        locale: guest?.locale ?? "ru",
        minQtyThreshold: guest?.minQtyThreshold ?? 1,
        historyDays: guest?.historyDays ?? 90,
        onboardingDone: guest?.onboardingDone ?? false,
        plan: guest?.plan ?? "free",
        activeProfileId: guest?.activeProfileId ?? "default",
        cartPreferencesJson: guest?.cartPreferencesJson ?? null,
        imapConfigJson: guest?.imapConfigJson ?? null,
        storeConnectionsJson: guest?.storeConnectionsJson ?? null,
      })
      .run();

    db.update(orders).set({ userId }).where(eq(orders.userId, GUEST_ID)).run();
    db.update(inventoryItems)
      .set({ userId })
      .where(eq(inventoryItems.userId, GUEST_ID))
      .run();
    db.update(cartSuggestions)
      .set({ userId })
      .where(eq(cartSuggestions.userId, GUEST_ID))
      .run();
    db.update(profiles).set({ userId }).where(eq(profiles.userId, GUEST_ID)).run();
  }
}
