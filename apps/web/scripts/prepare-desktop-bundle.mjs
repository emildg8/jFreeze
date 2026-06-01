/**
 * Копирует Next.js standalone + static в apps/desktop/server-bundle
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const standaloneSrc = path.join(webRoot, ".next", "standalone");
const staticSrc = path.join(webRoot, ".next", "static");
const dest = path.join(webRoot, "..", "desktop", "server-bundle");

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dst, name);
    if (fs.statSync(s).isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(standaloneSrc)) {
  console.error("Нет .next/standalone — сначала: npm run build --workspace=apps/web");
  process.exit(1);
}

rmrf(dest);
copyRecursive(standaloneSrc, dest);

const staticDest = path.join(dest, "apps", "web", ".next", "static");
fs.mkdirSync(path.dirname(staticDest), { recursive: true });
if (fs.existsSync(staticSrc)) copyRecursive(staticSrc, staticDest);

const publicSrc = path.join(webRoot, "public");
const publicDest = path.join(dest, "apps", "web", "public");
if (fs.existsSync(publicSrc)) copyRecursive(publicSrc, publicDest);

fs.mkdirSync(path.join(dest, "data"), { recursive: true });

console.log("Desktop bundle:", dest);
