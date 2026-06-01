import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let version = "?";
try {
  version = readFileSync(join(root, "VERSION"), "utf8").trim();
} catch {
  /* */
}
console.log(`jFreeze ${version} — verify-release\n`);

const steps = [
  ["Lint", "npm", ["run", "lint"]],
  ["Unit tests", "npm", ["run", "test"]],
  ["Production build", "npm", ["run", "build"]],
  ["E2E smoke", "npm", ["run", "test:e2e"], { CI: "1" }],
];

let failed = false;

for (const step of steps) {
  const [name, cmd, args, extraEnv] = step;
  process.stdout.write(`\n▶ ${name}…\n`);
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  if (r.status !== 0) {
    console.error(`✗ ${name} failed`);
    failed = true;
    break;
  }
  console.log(`✓ ${name}`);
}

if (failed) process.exit(1);
console.log(`\n✓ verify-release: ${version} — все проверки пройдены`);
