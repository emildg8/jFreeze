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

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<Stats>("/api/stats");
      setStats(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    }
  }, []);

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
      />

      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {showOnboarding && <Onboarding onDone={load} />}

      <ExpiryAlerts />

      <div className="grid gap-3 grid-cols-2">
        <StatCard
          label="В холодильнике"
          value={stats ? stats.inventoryCount : "…"}
          hint="позиций"
          className={!stats ? "animate-pulse opacity-70" : undefined}
        />
        <StatCard
          label="Купить"
          value={stats ? stats.cartCount : "…"}
          hint="в корзине"
          tone="brand"
          className={!stats ? "animate-pulse opacity-70" : undefined}
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
          <LinkButton href="/fridge" className="flex-1">
            Холодильник
          </LinkButton>
          <LinkButton href="/cart" variant="secondary" className="flex-1">
            Умная корзина
          </LinkButton>
          <LinkButton href="/sources" variant="secondary" className="flex-1">
            Почта и SMS
          </LinkButton>
        </ActionBar>
      </Section>

      <Section title="Магазины" description="Подключение и импорт заказов">
        <StoreChips />
      </Section>
    </Screen>
  );
}
