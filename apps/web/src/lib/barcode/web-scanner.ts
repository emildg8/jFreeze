"use client";

import { Html5QrcodeSupportedFormats } from "html5-qrcode";

const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
];

export type WebScannerHandle = {
  stop: () => Promise<void>;
};

/** Встроенный сканер в div (PWA / браузер на телефоне). */
export async function startWebBarcodeScanner(
  elementId: string,
  onDetected: (code: string) => void,
): Promise<WebScannerHandle> {
  const { Html5Qrcode } = await import("html5-qrcode");
  const scanner = new Html5Qrcode(elementId, { verbose: false });

  let stopped = false;

  await scanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 280, height: 120 },
      aspectRatio: 1.5,
    },
    (decoded) => {
      if (stopped) return;
      stopped = true;
      void scanner.stop().then(() => {
        onDetected(decoded);
      });
    },
    () => {
      /* ignore frame errors */
    },
  );

  await scanner.applyVideoConstraints({
    advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
  }).catch(() => undefined);

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

export { FORMATS as WEB_BARCODE_FORMATS };
