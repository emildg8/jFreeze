import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
/** Единый корень monorepo для standalone-трейсинга и Turbopack */
const monorepoRoot = path.resolve(appDir, "../..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  serverExternalPackages: ["better-sqlite3", "pdf-parse", "imapflow"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
