"use client";

import { useCallback, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Screen } from "@/components/ui/Screen";
import { PageHeader } from "@/components/ui/PageHeader";
import { OrdersExportPanel } from "@/components/OrdersExportPanel";
import { Panel } from "@/components/ui/Panel";
import { apiFetch, ApiError } from "@/lib/api/client";

export default function ExportPage() {
  const [historyDays, setHistoryDays] = useState<number | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ settings: { historyDays: number } }>("/api/settings");
      setHistoryDays(data.settings?.historyDays ?? 90);
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError) setHistoryDays(90);
    }
  }, []);

  useOnMount(load);

  return (
    <Screen>
      <PageHeader description="Выгрузка истории покупок и подключение к другим сервисам" />

      <OrdersExportPanel sinceDays={historyDays} showIntegrations />

      <Panel variant="muted" className="text-sm text-slate-600 leading-relaxed">
        <p className="font-medium text-slate-800">Обратный импорт</p>
        <p className="mt-1">
          Чтобы загрузить заказы обратно в jFreeze, используйте CSV в{" "}
          <a href="/settings" className="text-[var(--brand)] underline">
            настройках
          </a>{" "}
          или раздел{" "}
          <a href="/sources" className="text-[var(--brand)] underline">
            Источники
          </a>{" "}
          (почта, SMS, чеки).
        </p>
      </Panel>
    </Screen>
  );
}
