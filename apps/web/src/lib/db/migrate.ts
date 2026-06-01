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
  add("user_settings", "store_connections_json", "TEXT");
  add("user_settings", "imap_config_json", "TEXT");
  add("user_settings", "last_imap_sync_at", "INTEGER");
  add("user_settings", "last_expiry_notify_at", "INTEGER");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS source_imports (
      content_hash TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      store_id TEXT NOT NULL,
      order_ids_json TEXT,
      imported_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS telegram_link_tokens (
      token TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS telegram_chats (
      chat_id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL DEFAULT 'default',
      display_name TEXT,
      username TEXT,
      notify_expiry INTEGER NOT NULL DEFAULT 1,
      notify_orders INTEGER NOT NULL DEFAULT 1,
      notify_family INTEGER NOT NULL DEFAULT 1,
      linked_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS family_inbox (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL DEFAULT 'default',
      chat_id TEXT NOT NULL,
      uploader_name TEXT,
      file_path TEXT NOT NULL,
      file_name TEXT,
      mime_type TEXT,
      kind TEXT NOT NULL,
      caption TEXT,
      created_at INTEGER NOT NULL
    );
  `);

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
