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
import { SpendByCategoryPanel } from "@/components/SpendByCategoryPanel";
import { HomeGuide } from "@/components/HomeGuide";

interface Stats {
  inventoryCount: number;
  orderCount: number;
  cartCount: number;
  weekly?: {
    totalRub: number;
    orderCount: number;
    byCategory?: Array<{ category: string; totalRub: number; itemCount: number }>;
  };
  expiry?: { expired: number; today: number; soon: number };
  settings: { onboardingDone: boolean; plan?: string };
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<Stats>("/api/stats");
      setStats(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useOnMount(() => {
    void load();
  });

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
        onRefresh={() => void refresh()}
        refreshing={refreshing}
      />

      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {showOnboarding && <Onboarding onDone={load} />}

      {stats && stats.settings?.onboardingDone && (
        <HomeGuide
          orderCount={stats.orderCount}
          inventoryCount={stats.inventoryCount}
          cartCount={stats.cartCount}
          onboardingDone
        />
      )}

      <ExpiryAlerts />

      <div className="grid gap-3 grid-cols-2">
        <StatCard
          label="В холодильнике"
          value={stats ? stats.inventoryCount : "…"}
          hint="позиций"
          href="/fridge"
          className={!stats ? "animate-pulse opacity-70" : undefined}
        />
        <StatCard
          label="Купить"
          value={stats ? stats.cartCount : "…"}
          hint="в корзине"
          tone="brand"
          href="/cart"
          className={!stats ? "animate-pulse opacity-70" : undefined}
        />
      </div>

      <StatCard
        label="Заказов в истории"
        value={stats?.orderCount ?? 0}
        hint="нажмите для списка"
        href="/orders"
      />

      {stats &&
        stats.settings?.onboardingDone &&
        stats.orderCount > 0 &&
        (!stats.weekly || stats.weekly.orderCount === 0) && (
          <Panel variant="muted" className="text-sm text-slate-600">
            Расходы за неделю появятся, когда в истории будут заказы с суммой за
            последние 7 дней. Добавьте чек с датой и итогом.
          </Panel>
        )}

      {stats && stats.weekly && stats.weekly.orderCount > 0 && (
        <>
          <Panel className="text-sm">
            <p className="font-medium text-slate-800">За 7 дней</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--brand)]">
              {stats.weekly.totalRub.toLocaleString("ru-RU", {
                maximumFractionDigits: 0,
              })}{" "}
              ₽
            </p>
            <p className="text-xs text-slate-500">
              {stats.weekly.orderCount} заказ(ов) · см.{" "}
              <a href="/orders" className="font-medium text-sky-600 underline">
                историю
              </a>
            </p>
          </Panel>
          {stats.weekly.byCategory && stats.weekly.byCategory.length > 0 && (
            <SpendByCategoryPanel
              totalRub={stats.weekly.totalRub}
              byCategory={stats.weekly.byCategory}
            />
          )}
        </>
      )}

      <Section title="Быстрые действия">
        <ActionBar className="flex-col sm:flex-row">
          <LinkButton href="/orders" className="flex-1">
            Сканировать чек
          </LinkButton>
          <LinkButton href="/fridge" variant="secondary" className="flex-1">
            Холодильник
          </LinkButton>
          <LinkButton href="/cart" variant="secondary" className="flex-1">
            Корзина
          </LinkButton>
        </ActionBar>
      </Section>

      <Section title="Магазины" description="Подключение и импорт заказов">
        <StoreChips />
      </Section>
    </Screen>
  );
}
