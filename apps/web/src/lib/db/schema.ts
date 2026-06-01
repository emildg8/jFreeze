import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const stores = sqliteTable("stores", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  availability: text("availability").notNull().default("planned"),
  connectedAt: integer("connected_at", { mode: "timestamp" }),
  configJson: text("config_json"),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  storeId: text("store_id").notNull(),
  profileId: text("profile_id").default("default"),
  orderedAt: integer("ordered_at", { mode: "timestamp" }).notNull(),
  externalId: text("external_id"),
  totalRub: real("total_rub"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  qty: real("qty").notNull().default(1),
  unit: text("unit").default("шт"),
  category: text("category"),
});

export const inventoryItems = sqliteTable("inventory_items", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").default("default"),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  zone: text("zone").notNull().default("fridge"),
  qty: real("qty").notNull().default(1),
  unit: text("unit").default("шт"),
  expiryAt: integer("expiry_at", { mode: "timestamp" }),
  source: text("source").notNull().default("manual"),
  photoId: text("photo_id"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const fridgePhotos = sqliteTable("fridge_photos", {
  id: text("id").primaryKey(),
  filePath: text("file_path").notNull(),
  zone: text("zone").notNull().default("fridge"),
  detectedItemsJson: text("detected_items_json"),
  userConfirmedAt: integer("user_confirmed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const cartSuggestions = sqliteTable("cart_suggestions", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").default("default"),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  suggestedQty: real("suggested_qty").notNull(),
  unit: text("unit").default("шт"),
  reason: text("reason").notNull(),
  category: text("category"),
  score: real("score"),
  estPriceRub: real("est_price_rub"),
  compositionTip: text("composition_tip"),
  qualityTip: text("quality_tip"),
  accepted: integer("accepted", { mode: "boolean" }),
  generatedAt: integer("generated_at", { mode: "timestamp" }).notNull(),
});

export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey().default("default"),
  locale: text("locale").notNull().default("ru"),
  minQtyThreshold: real("min_qty_threshold").notNull().default(1),
  historyDays: integer("history_days").notNull().default(90),
  onboardingDone: integer("onboarding_done", { mode: "boolean" }).notNull().default(false),
  openaiApiKey: text("openai_api_key"),
  expiryRemindersEnabled: integer("expiry_reminders_enabled", { mode: "boolean" }).default(true),
  pushEnabled: integer("push_enabled", { mode: "boolean" }).default(false),
  activeProfileId: text("active_profile_id").default("default"),
  plan: text("plan").notNull().default("free"),
  smartFridgeUrl: text("smart_fridge_url"),
  smartFridgeToken: text("smart_fridge_token"),
  cartPreferencesJson: text("cart_preferences_json"),
});

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  keysJson: text("keys_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Store = typeof stores.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type CartSuggestion = typeof cartSuggestions.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
