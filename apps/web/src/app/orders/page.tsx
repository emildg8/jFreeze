"use client";

import { useCallback, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Screen } from "@/components/ui/Screen";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { LinkButtonInline } from "@/components/ui/LinkButton";
import { ReceiptImportPanel } from "@/components/ReceiptImportPanel";
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
              <LinkButtonInline href="/settings">Импорт CSV</LinkButtonInline>
            </div>
          }
        />
      )}

      {loading && <LoadingBlock />}

      <ul className="space-y-3">
        {orders.map((order) => (
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
    </Screen>
  );
}
