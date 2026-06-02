import type { NextConfig } from "next";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
/** Единый корень monorepo для standalone-трейсинга и Turbopack */
const monorepoRoot = path.resolve(appDir, "../..");
const appVersion = fs
  .readFileSync(path.join(monorepoRoot, "VERSION"), "utf8")
  .trim();
const drizzleOrmRoot = path.resolve(appDir, "node_modules/drizzle-orm");
const drizzleSqliteAdapter = path.resolve(
  monorepoRoot,
  "node_modules/@auth/drizzle-adapter/lib/sqlite.js",
);

const webpackAliases = {
  "drizzle-orm": drizzleOrmRoot,
  "drizzle-orm/sqlite-core": path.join(drizzleOrmRoot, "sqlite-core"),
  "@auth/drizzle-adapter/sqlite": drizzleSqliteAdapter,
} as const;
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  serverExternalPackages: ["better-sqlite3", "pdf-parse", "imapflow"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: monorepoRoot,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...webpackAliases,
    };
    return config;
  },
};

export default nextConfig;
