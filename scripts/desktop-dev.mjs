import { spawn } from "child_process";

const env = {
  ...process.env,
  JFREEZE_DEV_URL: process.env.JFREEZE_DEV_URL || "http://127.0.0.1:3000",
};

const child = spawn("npm", ["run", "start", "--workspace=apps/desktop"], {
  env,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
