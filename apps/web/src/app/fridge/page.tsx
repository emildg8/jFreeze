"use client";

import { useCallback, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { Panel } from "@/components/ui/Panel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UploadZone } from "@/components/UploadZone";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { FridgeLayoutPanel } from "@/components/FridgeLayoutPanel";
import { BarcodeScannerPanel } from "@/components/BarcodeScannerPanel";
import { apiFetch, refreshCart, ApiError } from "@/lib/api/client";
import { StickyFormBar } from "@/components/StickyFormBar";

interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  unit: string | null;
  zone: string;
  expiryAt?: string | null;
  barcode?: string | null;
}

interface PendingItem {
  name: string;
  qty: number;
  unit: string;
}

export default function FridgePage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [zone, setZone] = useState<"fridge" | "freezer">("fridge");
  const [pending, setPending] = useState<{
    photoId: string;
    items: PendingItem[];
  } | null>(null);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [expiry, setExpiry] = useState("");
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ items: InventoryItem[] }>("/api/inventory");
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useOnMount(load);

  async function addManual(e?: { preventDefault?: () => void }) {
    e?.preventDefault?.();
    if (!name.trim()) return;
    setError(null);
    try {
      await apiFetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          qty: parseFloat(qty) || 1,
          zone,
          expiryAt: expiry || undefined,
          barcode: barcode.trim() || undefined,
          source: barcode ? "barcode" : undefined,
        }),
      });
      setName("");
      setQty("1");
      setExpiry("");
      setBarcode("");
      await load();
      await refreshCart();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка сохранения");
    }
  }

  async function remove(id: string) {
    try {
      await apiFetch(`/api/inventory?id=${id}`, { method: "DELETE" });
      await load();
      await refreshCart();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка удаления");
    }
  }

  async function confirmPhoto() {
    if (!pending) return;
    setError(null);
    try {
      await apiFetch("/api/fridge/photo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId: pending.photoId,
          items: pending.items,
          zone,
        }),
      });
      setPending(null);
      await load();
      await refreshCart();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка");
    }
  }

  const filtered = items.filter((i) => i.zone === zone);

  return (
    <Screen className="pb-28">
      <PageHeader
        title="Холодильник"
        description="Фото, вручную и план расстановки · сроки для напоминаний"
      />

      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      <SegmentedControl
        options={[
          { value: "fridge", label: "Холодильник" },
          { value: "freezer", label: "Морозилка" },
        ]}
        value={zone}
        onChange={setZone}
      />

      <BarcodeScannerPanel
        onDetected={(payload) => {
          setBarcode(payload.barcode);
          if (payload.productName) {
            setName(payload.productName);
          }
          setError(null);
        }}
      />

      <UploadZone
        zone={zone}
        onComplete={(data) =>
          setPending({ photoId: data.photoId, items: data.detected })
        }
      />

      {pending && (
        <Panel className="mt-2">
          <h2 className="mb-2 font-semibold">Подтвердите продукты</h2>
          <ul className="mb-3 space-y-2">
            {pending.items.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <Input
                  className="flex-1"
                  value={item.name}
                  onChange={(e) => {
                    const next = [...pending.items];
                    next[idx] = { ...item, name: e.target.value };
                    setPending({ ...pending, items: next });
                  }}
                />
                <Input
                  className="w-20"
                  type="number"
                  value={item.qty}
                  onChange={(e) => {
                    const next = [...pending.items];
                    next[idx] = {
                      ...item,
                      qty: parseFloat(e.target.value) || 1,
                    };
                    setPending({ ...pending, items: next });
                  }}
                />
              </li>
            ))}
          </ul>
          <Button className="w-full" onClick={() => void confirmPhoto()}>
            Сохранить в инвентарь
          </Button>
        </Panel>
      )}

      <Section title="Срок годности">
        <div className="flex flex-wrap gap-2">
          {[
            { label: "+3 дн.", days: 3 },
            { label: "+7 дн.", days: 7 },
            { label: "+14 дн.", days: 14 },
            { label: "+30 дн.", days: 30 },
          ].map(({ label, days }) => (
            <button
              key={days}
              type="button"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-sky-200"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + days);
                setExpiry(d.toISOString().slice(0, 10));
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <FridgeLayoutPanel />

      {loading && <LoadingBlock />}

      {!loading && filtered.length === 0 && (
        <div className="mt-4">
          <EmptyState
            title="Пусто"
            description="Добавьте продукты или загрузите фото."
          />
        </div>
      )}

      <StickyFormBar onSubmit={(e) => void addManual(e)}>
        {barcode && (
          <p className="text-xs text-slate-500 tabular-nums">Штрихкод: {barcode}</p>
        )}
        <Input
          placeholder="Название — Enter для добавления"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Input
            placeholder="Кол-во"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputMode="decimal"
          />
          <Button type="submit" className="px-6">
            Добавить
          </Button>
        </div>
        <Input
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          aria-label="Срок годности"
          className="text-sm"
        />
      </StickyFormBar>

      <ul className="mt-4 space-y-2">
        {filtered.map((item) => (
          <li key={item.id}>
            <Panel className="flex items-center justify-between gap-2 !py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-xs text-slate-500 tabular-nums">
                  {item.qty} {item.unit}
                  {item.barcode && ` · ${item.barcode}`}
                  {item.expiryAt &&
                    ` · до ${new Date(item.expiryAt).toLocaleDateString("ru-RU")}`}
                </p>
              </div>
              <Button
                variant="ghost"
                className="shrink-0 py-1 text-xs text-red-600"
                onClick={() => void remove(item.id)}
              >
                Удалить
              </Button>
            </Panel>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
