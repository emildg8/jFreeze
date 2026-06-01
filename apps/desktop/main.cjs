const { app, BrowserWindow, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const net = require("net");
const fs = require("fs");

const PORT = Number(process.env.JFREEZE_PORT || 3847);
const HOST = "127.0.0.1";

let serverProcess = null;
let mainWindow = null;

function getServerRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "server");
  }
  return path.join(__dirname, "server-bundle");
}

function getServerEntry() {
  const root = getServerRoot();
  const candidates = [
    path.join(root, "apps", "web", "server.js"),
    path.join(root, "server.js"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

function waitForPort(port, timeoutMs = 120000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.connect(port, HOST, () => {
        socket.end();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Сервер не ответил на порту ${port}`));
          return;
        }
        setTimeout(tryConnect, 400);
      });
    };
    tryConnect();
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const entry = getServerEntry();
    const cwd = path.dirname(entry);
    if (!fs.existsSync(entry)) {
      reject(
        new Error(
          `Не найден сервер. Сначала: npm run build:desktop (из корня репозитория)`,
        ),
      );
      return;
    }

    const env = {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: HOST,
      DATABASE_URL: path.join(app.getPath("userData"), "jfreeze.db"),
    };

    serverProcess = spawn(
      process.execPath,
      [entry],
      {
        cwd,
        env: { ...env, ELECTRON_RUN_AS_NODE: "1" },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    );

    serverProcess.stdout?.on("data", (d) => console.log("[jfreeze]", d.toString()));
    serverProcess.stderr?.on("data", (d) => console.error("[jfreeze]", d.toString()));
    serverProcess.on("error", reject);
    serverProcess.on("exit", (code) => {
      if (code !== null && code !== 0) {
        console.error("Сервер завершился с кодом", code);
      }
    });

    waitForPort(PORT).then(resolve).catch(reject);
  });
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
  serverProcess = null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 360,
    minHeight: 600,
    title: "jFreeze",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://${HOST}:${PORT}`);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(async () => {
  try {
    fs.mkdirSync(path.join(app.getPath("userData")), { recursive: true });

    const devUrl = process.env.JFREEZE_DEV_URL;
    if (devUrl) {
      mainWindow = new BrowserWindow({
        width: 1280,
        height: 840,
        title: "jFreeze (dev)",
        webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true },
      });
      mainWindow.loadURL(devUrl);
      return;
    }

    await startServer();
    createWindow();
  } catch (e) {
    console.error(e);
    app.exit(1);
  }
});

app.on("window-all-closed", () => {
  stopServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => stopServer());
