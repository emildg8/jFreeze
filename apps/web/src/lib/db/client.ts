import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";
import { migrateColumns } from "./migrate";

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  db?: ReturnType<typeof drizzle<typeof schema>>;
  migrated?: boolean;
};

function resolveDbPath(): string {
  const envPath = process.env.DATABASE_URL;
  if (envPath && !envPath.startsWith("file:")) {
    return path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
  }
  if (envPath?.startsWith("file:")) {
    return envPath.replace("file:", "");
  }
  const primary = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "data",
    "jfreeze.db",
  );
  const monorepo = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "apps",
    "web",
    "data",
    "jfreeze.db",
  );
  if (fs.existsSync(primary)) return primary;
  if (fs.existsSync(monorepo)) return monorepo;
  return primary;
}

function ensureDbDirectory(dbPath: string) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export function getDb() {
  if (!globalForDb.db) {
    const dbPath = resolveDbPath();
    ensureDbDirectory(dbPath);
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    globalForDb.sqlite = sqlite;
    globalForDb.db = drizzle(sqlite, { schema });
  }
  if (!globalForDb.migrated) {
    runMigrations();
    globalForDb.migrated = true;
  }
  return globalForDb.db;
}

export function runMigrations() {
  const dbPath = resolveDbPath();
  ensureDbDirectory(dbPath);
  const sqlite = (globalForDb.sqlite ??= new Database(dbPath));
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      availability TEXT NOT NULL DEFAULT 'planned',
      connected_at INTEGER,
      config_json TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      ordered_at INTEGER NOT NULL,
      external_id TEXT,
      total_rub REAL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      qty REAL NOT NULL DEFAULT 1,
      unit TEXT DEFAULT 'шт',
      category TEXT
    );
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      zone TEXT NOT NULL DEFAULT 'fridge',
      qty REAL NOT NULL DEFAULT 1,
      unit TEXT DEFAULT 'шт',
      expiry_at INTEGER,
      source TEXT NOT NULL DEFAULT 'manual',
      photo_id TEXT,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fridge_photos (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      zone TEXT NOT NULL DEFAULT 'fridge',
      detected_items_json TEXT,
      user_confirmed_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cart_suggestions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      suggested_qty REAL NOT NULL,
      unit TEXT DEFAULT 'шт',
      reason TEXT NOT NULL,
      accepted INTEGER,
      generated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      locale TEXT NOT NULL DEFAULT 'ru',
      min_qty_threshold REAL NOT NULL DEFAULT 1,
      history_days INTEGER NOT NULL DEFAULT 90,
      onboarding_done INTEGER NOT NULL DEFAULT 0
    );
  `);
  migrateColumns(sqlite);
}
