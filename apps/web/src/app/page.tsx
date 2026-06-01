"use client";

import { useCallback, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { StatCard } from "@/components/ui/StatCard";
import { Panel } from "@/components/ui/Panel";
import { ActionBar } from "@/components/ui/ActionBar";
import { LinkButton } from "@/components/ui/LinkButton";
import { Onboarding } from "@/components/Onboarding";
import { ExpiryAlerts } from "@/components/ExpiryAlerts";
import { StoreChips } from "@/components/StoreChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiFetch, ApiError } from "@/lib/api/client";
import { StatusBanner } from "@/components/ui/StatusBanner";

interface Stats {
  inventoryCount: number;
  orderCount: number;
  cartCount: number;
  expiry?: { expired: number; today: number; soon: number };
  settings: { onboardingDone: boolean; plan?: string };
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<Stats>("/api/stats");
      setStats(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    }
  }, []);

  useOnMount(load);

  const showOnboarding = stats && !stats.settings?.onboardingDone;
  const isPro = stats?.settings?.plan === "pro";

  return (
    <Screen>
      <PageHeader
        title="Главная"
        description={
          isPro
            ? "Pro · холодильник и умные покупки"
            : "Запасы, заказы и корзина в одном месте"
        }
      />

      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {showOnboarding && <Onboarding onDone={load} />}

      <ExpiryAlerts />

      <div className="grid gap-3 grid-cols-2">
        <StatCard
          label="В холодильнике"
          value={stats?.inventoryCount ?? "—"}
          hint="позиций"
        />
        <StatCard
          label="Купить"
          value={stats?.cartCount ?? "—"}
          hint="в корзине"
          tone="brand"
        />
      </div>

      {stats?.expiry &&
        (stats.expiry.expired > 0 ||
          stats.expiry.today > 0 ||
          stats.expiry.soon > 0) && (
          <Panel variant="warning" className="text-sm">
            <span className="font-medium">Срок годности: </span>
            {stats.expiry.expired > 0 && `${stats.expiry.expired} просроч. `}
            {stats.expiry.today > 0 && `${stats.expiry.today} сегодня `}
            {stats.expiry.soon > 0 && `${stats.expiry.soon} скоро`}
          </Panel>
        )}

      <StatCard label="Заказов в истории" value={stats?.orderCount ?? 0} />

      <Section title="Быстрые действия">
        <ActionBar className="flex-col sm:flex-row">
          <LinkButton href="/fridge" className="flex-1">
            Холодильник
          </LinkButton>
          <LinkButton href="/cart" variant="secondary" className="flex-1">
            Умная корзина
          </LinkButton>
        </ActionBar>
      </Section>

      <Section title="Магазины" description="Подключение и импорт заказов">
        <StoreChips />
      </Section>
    </Screen>
  );
}
