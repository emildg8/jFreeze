const serverUrl =
  process.env.CAPACITOR_SERVER_URL || process.env.CAPACITOR_PRODUCTION_URL;

/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: "ru.jfreeze.app",
  appName: "jFreeze",
  webDir: "public",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: String(serverUrl).startsWith("http://"),
          androidScheme: "http",
        },
      }
    : {}),
  ios: {
    contentInset: "automatic",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    BarcodeScanner: {
      formats: ["EAN_13", "EAN_8", "UPC_A", "UPC_E", "CODE_128"],
    },
  },
};

export default config;
