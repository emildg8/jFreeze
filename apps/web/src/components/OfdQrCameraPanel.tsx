"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { startWebQrScanner } from "@/lib/ofd/web-qr-scanner";

interface OfdQrCameraPanelProps {
  disabled?: boolean;
  onScanned: (qrPayload: string) => void;
}

export function OfdQrCameraPanel({ disabled, onScanned }: OfdQrCameraPanelProps) {
  const regionId = useId().replace(/:/g, "");
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(async () => {
    await scannerRef.current?.stop();
    scannerRef.current = null;
    setOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      void scannerRef.current?.stop();
    };
  }, []);

  async function start() {
    setError(null);
    setOpen(true);
    await new Promise((r) => setTimeout(r, 120));
    try {
      scannerRef.current = await startWebQrScanner(regionId, (payload) => {
        void stop();
        onScanned(payload);
      });
    } catch (e) {
      setOpen(false);
      setError(
        e instanceof Error
          ? e.message
          : "Камера недоступна. Разрешите доступ или вставьте QR вручную.",
      );
    }
  }

  return (
    <div className="mt-2">
      {!open ? (
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => void start()}
        >
          Сканировать QR камерой
        </Button>
      ) : (
        <Panel variant="accent" className="overflow-hidden p-0">
          <div id={regionId} className="min-h-[240px] w-full bg-black" />
          <div className="flex gap-2 border-t border-slate-200 p-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => void stop()}>
              Отмена
            </Button>
          </div>
        </Panel>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
