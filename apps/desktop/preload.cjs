const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("jfreezeDesktop", {
  platform: "windows",
  version: "0.2.0-pre-alpha",
});
