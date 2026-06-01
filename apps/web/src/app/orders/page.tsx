"use client";

import { useCallback, useMemo, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Screen } from "@/components/ui/Screen";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { LinkButtonInline } from "@/components/ui/LinkButton";
import { ReceiptImportPanel } from "@/components/ReceiptImportPanel";
import { OrdersExportPanel } from "@/components/OrdersExportPanel";
import { apiFetch, importOrders, refreshCart, ApiError } from "@/lib/api/client";
import { getStoreLabel } from "@/lib/constants/stores";

interface OrderItem {
  name: string;
  qty: number;
  unit: string | null;
}

interface Order {
  id: string;
  storeId: string;
  orderedAt: string;
  totalRub: number | null;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState<string | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ orders: Order[] }>("/api/orders");
      setOrders(data.orders ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  const storeIds = useMemo(() => {
    const ids = new Set(orders.map((o) => o.storeId));
    return [...ids].sort((a, b) => getStoreLabel(a).localeCompare(getStoreLabel(b), "ru"));
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (storeFilter !== "all" && o.storeId !== storeFilter) return false;
      if (!q) return true;
      const hay = [
        getStoreLabel(o.storeId),
        ...o.items.map((i) => i.name),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, query, storeFilter]);

  async function importDemo() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await importOrders({ storeId: "demo" });
      await refreshCart();
      setMessage(`Загружено заказов: ${result.imported}`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка импорта");
      setLoading(false);
    }
  }

  useOnMount(load);

  return (
    <Screen>
      <PageHeader
        title="История заказов"
        description="Покупки текущего профиля из подключённых источников"
      />

      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {message && <StatusBanner variant="success">{message}</StatusBanner>}

      <ReceiptImportPanel
        onImported={async () => {
          setMessage("Чек добавлен в заказы");
          await refreshCart();
          await load();
        }}
      />

      {!loading && orders.length === 0 && (
        <EmptyState
          title="Заказов пока нет"
          description="Загрузите чек (фото, PDF, почта) или демо-данные."
          action={
            <div className="flex flex-col gap-2">
              <Button onClick={() => void importDemo()}>Демо-заказы</Button>
              <LinkButtonInline href="/sources">Почта и SMS</LinkButtonInline>
              <LinkButtonInline href="/settings">Импорт CSV</LinkButtonInline>
            </div>
          }
        />
      )}

      {loading && <LoadingBlock />}

      {!loading && orders.length > 0 && (
        <>
          <Panel>
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await apiFetch("/api/orders/repeat-last", { method: "POST" });
                  setMessage("Последний заказ повторён в истории");
                  await refreshCart();
                  await load();
                } catch (e) {
                  setError(
                    e instanceof ApiError ? e.message : "Не удалось повторить",
                  );
                  setLoading(false);
                }
              }}
            >
              Повторить последний заказ
            </Button>
          </Panel>
          <OrdersExportPanel showIntegrations={false} />

          <Panel className="space-y-3">
            <Input
              type="search"
              placeholder="Поиск по товару или магазину…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Поиск заказов"
            />
            <div className="flex flex-wrap gap-2">
              <Chip
                active={storeFilter === "all"}
                onClick={() => setStoreFilter("all")}
              >
                Все ({orders.length})
              </Chip>
              {storeIds.map((id) => (
                <Chip
                  key={id}
                  active={storeFilter === id}
                  onClick={() => setStoreFilter(id)}
                >
                  {getStoreLabel(id)}
                </Chip>
              ))}
            </div>
            {filtered.length !== orders.length && (
              <p className="text-xs text-slate-500">
                Показано {filtered.length} из {orders.length}
              </p>
            )}
          </Panel>
        </>
      )}

      <ul className="space-y-3">
        {filtered.map((order) => (
          <li key={order.id}>
            <Panel>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-800">
                  {getStoreLabel(order.storeId)}
                </span>
                <time className="text-slate-500">
                  {new Date(order.orderedAt).toLocaleDateString("ru-RU")}
                </time>
              </div>
              {order.totalRub != null && (
                <p className="mb-2 text-sm font-medium text-sky-600 tabular-nums">
                  {order.totalRub.toFixed(0)} ₽
                </p>
              )}
              <ul className="space-y-1 border-t border-slate-100 pt-2 text-sm text-slate-700">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{item.name}</span>
                    <span className="shrink-0 tabular-nums text-slate-500">
                      {item.qty} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </li>
        ))}
      </ul>

      {!loading && orders.length > 0 && filtered.length === 0 && (
        <p className="text-center text-sm text-slate-500">Ничего не найдено</p>
      )}
    </Screen>
  );
}
