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
import { apiFetch, refreshCart, ApiError } from "@/lib/api/client";

interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  unit: string | null;
  zone: string;
  expiryAt?: string | null;
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

  async function addManual() {
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
        }),
      });
      setName("");
      setQty("1");
      setExpiry("");
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
    <Screen>
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

      <Section title="Добавить вручную">
      <Panel>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Название продукта"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Кол-во"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <Input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              aria-label="Срок годности"
            />
          </div>
          <Button onClick={() => void addManual()}>Добавить</Button>
        </div>
      </Panel>
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

      <ul className="mt-4 space-y-2">
        {filtered.map((item) => (
          <li key={item.id}>
            <Panel className="flex items-center justify-between gap-2 !py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-xs text-slate-500 tabular-nums">
                  {item.qty} {item.unit}
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
