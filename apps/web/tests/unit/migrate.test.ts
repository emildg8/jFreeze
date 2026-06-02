import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { migrateColumns } from "@/lib/db/migrate";

describe("migrateColumns", () => {
  it("runs twice without duplicate column error", () => {
    const sqlite = new Database(":memory:");
    sqlite.exec(`
      CREATE TABLE cart_suggestions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        suggested_qty REAL NOT NULL,
        reason TEXT NOT NULL,
        generated_at INTEGER NOT NULL
      );
    `);
    migrateColumns(sqlite);
    expect(() => migrateColumns(sqlite)).not.toThrow();
    const cols = sqlite
      .prepare("PRAGMA table_info(cart_suggestions)")
      .all() as Array<{ name: string }>;
    expect(cols.some((c) => c.name === "category")).toBe(true);
    sqlite.close();
  });
});
