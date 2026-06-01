"use client";

import { useCallback, useState } from "react";
import { Screen } from "@/components/ui/Screen";
import { PageHeader } from "@/components/ui/PageHeader";
import { StoreSourcesPanel } from "@/components/StoreSourcesPanel";
import { Panel } from "@/components/ui/Panel";
import { LinkButtonInline } from "@/components/ui/LinkButton";

export default function SourcesPage() {
  const [, setTick] = useState(0);
  const onImported = useCallback(() => setTick((t) => t + 1), []);

  return (
    <Screen>
      <PageHeader
        title="Источники"
        description="Автоподключение магазинов через почту и SMS (РФ)"
      />

      <StoreSourcesPanel onImported={onImported} />

      <Panel variant="muted" className="mt-4 text-sm text-slate-600 leading-relaxed">
        <p>
          Официальные API Озон, Самокат и сетей недоступны для личных кабинетов — мы используем
          бесплатный разбор писем, SMS и CSV. Чеки OFD и фото — на странице{" "}
          <LinkButtonInline href="/orders">Заказы</LinkButtonInline>.
        </p>
      </Panel>
    </Screen>
  );
}
