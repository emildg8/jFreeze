"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { Section } from "./ui/Section";
import { apiFetch } from "@/lib/api/client";
import {
  scanBarcodeWithCamera,
  scanBarcodeFromImageFile,
  canUseNativeBarcodeScanner,
} from "@/lib/barcode/scanner";
import { startWebBarcodeScanner } from "@/lib/barcode/web-scanner";

export interface BarcodeDetectedPayload {
  barcode: string;
  productName?: string;
  brand?: string;
}

interface BarcodeScannerPanelProps {
  onDetected: (payload: BarcodeDetectedPayload) => void;
  className?: string;
}

export function BarcodeScannerPanel({
  onDetected,
  className = "",
}: BarcodeScannerPanelProps) {
  const scanRegionId = useId().replace(/:/g, "");
  const fileRef = useRef<HTMLInputElement>(null);
  const webScannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [webScanOpen, setWebScanOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);

  useEffect(() => {
    void canUseNativeBarcodeScanner().then(setNativeAvailable);
    return () => {
      void webScannerRef.current?.stop();
    };
  }, []);

  const resolveProduct = useCallback(async (barcode: string) => {
    try {
      const data = await apiFetch<{
        found: boolean;
        product?: { name: string; brand?: string };
      }>(`/api/barcode/lookup?code=${encodeURIComponent(barcode)}`);
      if (data.found && data.product) {
        return { name: data.product.name, brand: data.product.brand };
      }
    } catch {
      /* lookup optional */
    }
    return null;
  }, []);

  const finishScan = useCallback(
    async (code: string) => {
      setLastCode(code);
      setLoading(true);
      setError(null);
      try {
        const info = await resolveProduct(code);
        onDetected({
          barcode: code,
          productName: info?.name,
          brand: info?.brand,
        });
      } finally {
        setLoading(false);
        setWebScanOpen(false);
      }
    },
    [onDetected, resolveProduct],
  );

  async function handleNativeScan() {
    setLoading(true);
    setError(null);
    try {
      const result = await scanBarcodeWithCamera();
      if (!result) {
        setError("Сканирование отменено");
        return;
      }
      await finishScan(result.value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сканера");
    } finally {
      setLoading(false);
    }
  }

  async function handleWebScanStart() {
    setError(null);
    setWebScanOpen(true);
    await new Promise((r) => setTimeout(r, 100));

    try {
      webScannerRef.current = await startWebBarcodeScanner(scanRegionId, (code) => {
        void finishScan(code);
      });
    } catch (e) {
      setWebScanOpen(false);
      setError(
        e instanceof Error
          ? e.message
          : "Не удалось открыть камеру. Разрешите доступ или используйте фото.",
      );
    }
  }

  async function handleWebScanStop() {
    await webScannerRef.current?.stop();
    webScannerRef.current = null;
    setWebScanOpen(false);
  }

  async function handleImageFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const result = await scanBarcodeFromImageFile(file);
      if (!result) {
        setError("Штрихкод на фото не найден");
        return;
      }
      await finishScan(result.value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка чтения фото");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section
      title="Штрихкод"
      description={
        nativeAvailable
          ? "Сканер камеры (Android) или фото · EAN/UPC"
          : "Камера в браузере или фото · EAN/UPC"
      }
      className={className}
    >
      <Panel variant="accent">
        <div className="flex flex-col gap-2">
          {nativeAvailable ? (
            <Button
              type="button"
              disabled={loading || webScanOpen}
              onClick={() => void handleNativeScan()}
            >
              {loading ? "…" : "Сканировать камерой"}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={loading || webScanOpen}
              onClick={() => void (webScanOpen ? handleWebScanStop() : handleWebScanStart())}
            >
              {webScanOpen ? "Остановить сканер" : "Сканировать камерой"}
            </Button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImageFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={loading || webScanOpen}
            onClick={() => fileRef.current?.click()}
          >
            Штрихкод с фото
          </Button>
        </div>

        {webScanOpen && !nativeAvailable && (
          <div className="mt-3 overflow-hidden rounded-xl bg-black">
            <div id={scanRegionId} className="min-h-[220px] w-full" />
            <p className="bg-black/80 px-2 py-1 text-center text-xs text-white">
              Наведите на штрихкод EAN
            </p>
          </div>
        )}

        {lastCode && !loading && (
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            Последний код: {lastCode}
          </p>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          В APK (Capacitor) используется ML Kit. В браузере — камера или фото.
          Название подставляется из Open Food Facts, если товар есть в базе.
        </p>
      </Panel>
    </Section>
  );
}
