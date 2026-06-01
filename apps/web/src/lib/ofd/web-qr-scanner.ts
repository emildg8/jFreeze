"use client";

import { Html5QrcodeSupportedFormats } from "html5-qrcode";

const QR_FORMATS = [Html5QrcodeSupportedFormats.QR_CODE];

export type WebQrScannerHandle = {
  stop: () => Promise<void>;
};

/** Live-сканер QR (ОФД на кассовом чеке). */
export async function startWebQrScanner(
  elementId: string,
  onDetected: (payload: string) => void,
): Promise<WebQrScannerHandle> {
  const { Html5Qrcode } = await import("html5-qrcode");
  const scanner = new Html5Qrcode(elementId, { verbose: false, formatsToSupport: QR_FORMATS });

  let stopped = false;

  await scanner.start(
    { facingMode: "environment" },
    {
      fps: 8,
      qrbox: { width: 260, height: 260 },
      aspectRatio: 1,
    },
    (decoded) => {
      if (stopped) return;
      stopped = true;
      void scanner.stop().then(() => onDetected(decoded));
    },
    () => undefined,
  );

  return {
    stop: async () => {
      stopped = true;
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        /* */
      }
    },
  };
}
