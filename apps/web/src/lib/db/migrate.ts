import type Database from "better-sqlite3";

export function migrateColumns(sqlite: Database.Database) {
  const add = (table: string, column: string, definition: string) => {
    const cols = sqlite
      .prepare(`PRAGMA table_info(${table})`)
      .all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === column)) {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  };

  add("user_settings", "openai_api_key", "TEXT");
  add("user_settings", "expiry_reminders_enabled", "INTEGER NOT NULL DEFAULT 1");
  add("user_settings", "push_enabled", "INTEGER NOT NULL DEFAULT 0");
  add("user_settings", "active_profile_id", "TEXT DEFAULT 'default'");
  add("user_settings", "plan", "TEXT NOT NULL DEFAULT 'free'");
  add("user_settings", "smart_fridge_url", "TEXT");
  add("user_settings", "smart_fridge_token", "TEXT");
  add("orders", "profile_id", "TEXT DEFAULT 'default'");
  add("inventory_items", "profile_id", "TEXT DEFAULT 'default'");
  add("cart_suggestions", "profile_id", "TEXT DEFAULT 'default'");
  add("user_settings", "cart_preferences_json", "TEXT");
  add("cart_suggestions", "category", "TEXT");
  add("cart_suggestions", "score", "REAL");
  add("cart_suggestions", "est_price_rub", "REAL");
  add("cart_suggestions", "composition_tip", "TEXT");
  add("cart_suggestions", "quality_tip", "TEXT");
  add("inventory_items", "barcode", "TEXT");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      endpoint TEXT NOT NULL,
      keys_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}
