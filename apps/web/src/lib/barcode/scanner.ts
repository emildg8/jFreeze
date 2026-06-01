"use client";

export interface BarcodeScanResult {
  value: string;
  format?: string;
}

async function getProductFormats() {
  const { BarcodeFormat } = await import("@capacitor-mlkit/barcode-scanning");
  return [
    BarcodeFormat.Ean13,
    BarcodeFormat.Ean8,
    BarcodeFormat.UpcA,
    BarcodeFormat.UpcE,
    BarcodeFormat.Code128,
    BarcodeFormat.Code39,
    BarcodeFormat.Itf,
  ];
}

function pickBarcode(
  barcodes: Array<{ rawValue?: string; format?: string }>,
  productFormatValues: string[],
): BarcodeScanResult | null {
  const product = barcodes.find((b) =>
    productFormatValues.includes(String(b.format)),
  );
  const code = product ?? barcodes[0];
  if (!code?.rawValue) return null;
  return { value: code.rawValue, format: code.format };
}

async function isNativeApp(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function ensureNativeModule() {
  const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");
  const { camera } = await BarcodeScanner.requestPermissions();
  if (camera !== "granted" && camera !== "limited") {
    throw new Error("Нужен доступ к камере");
  }
  const { supported } = await BarcodeScanner.isSupported();
  if (!supported) {
    throw new Error("Сканер штрихкодов не поддерживается на этом устройстве");
  }
  return BarcodeScanner;
}

export async function scanBarcodeWithCamera(): Promise<BarcodeScanResult | null> {
  if (!(await isNativeApp())) {
    return null;
  }

  const BarcodeScanner = await ensureNativeModule();
  const formats = await getProductFormats();
  const formatValues = formats.map(String);

  const google = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!google.available) {
    await BarcodeScanner.installGoogleBarcodeScannerModule();
  }

  const { barcodes } = await BarcodeScanner.scan({ formats });
  return pickBarcode(barcodes, formatValues);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

export const BARCODE_FILE_SCAN_ELEMENT_ID = "jfreeze-barcode-file-scan";

export async function scanBarcodeFromImageFile(
  file: File,
): Promise<BarcodeScanResult | null> {
  const formats = await getProductFormats();
  const formatValues = formats.map(String);

  if (await isNativeApp()) {
    try {
      const BarcodeScanner = await ensureNativeModule();
      const { Filesystem, Directory } = await import("@capacitor/filesystem");

      const base64 = await fileToBase64(file);
      const ext = file.name.split(".").pop() ?? "jpg";
      const saved = await Filesystem.writeFile({
        path: `barcode-scan-${Date.now()}.${ext}`,
        data: base64,
        directory: Directory.Cache,
      });

      const { barcodes } = await BarcodeScanner.readBarcodesFromImage({
        path: saved.uri,
        formats,
      });

      const picked = pickBarcode(barcodes, formatValues);
      if (picked) return picked;
    } catch (e) {
      console.warn("Native barcode from image failed, fallback to web", e);
    }
  }

  return scanBarcodeFromImageWeb(file);
}

async function scanBarcodeFromImageWeb(
  file: File,
): Promise<BarcodeScanResult | null> {
  if (typeof document === "undefined") return null;

  let anchor = document.getElementById(BARCODE_FILE_SCAN_ELEMENT_ID);
  if (!anchor) {
    anchor = document.createElement("div");
    anchor.id = BARCODE_FILE_SCAN_ELEMENT_ID;
    anchor.className = "hidden";
    anchor.setAttribute("aria-hidden", "true");
    document.body.appendChild(anchor);
  }

  const { Html5Qrcode } = await import("html5-qrcode");
  const scanner = new Html5Qrcode(BARCODE_FILE_SCAN_ELEMENT_ID, {
    verbose: false,
  });

  try {
    const decoded = await scanner.scanFile(file, false);
    return { value: decoded };
  } finally {
    try {
      await scanner.clear();
    } catch {
      /* */
    }
  }
}

export async function canUseNativeBarcodeScanner(): Promise<boolean> {
  return isNativeApp();
}
