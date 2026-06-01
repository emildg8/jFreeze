"use client";

import { useCallback, useState } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { apiFetch, ApiError } from "@/lib/api/client";
import { Screen } from "@/components/ui/Screen";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { AccountAvatar } from "@/components/auth/AccountAvatar";
import { labelAuthProvider } from "@/lib/auth/labels";
import { accountDisplayName, formatAccountPhone } from "@/lib/auth/profile";
import { useLinkedAccount } from "@/lib/hooks/use-linked-account";

interface AccountStats {
  inventoryCount: number;
  orderCount: number;
  cartCount: number;
}

interface AccountCabinetProps {
  session: Session;
}

export function AccountCabinet({ session }: AccountCabinetProps) {
  const user = session.user;
  const { providers, phone, loading, error } = useLinkedAccount(user.phone);
  const [stats, setStats] = useState<AccountStats | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetch<AccountStats>("/api/stats");
      setStats(data);
    } catch (e) {
      if (e instanceof ApiError) console.error(e.message);
    }
  }, []);

  useOnMount(() => {
    void loadStats();
  });

  const displayPhone = phone ?? user.phone;
  const formattedPhone = formatAccountPhone(displayPhone);
  const title = accountDisplayName(user.name, displayPhone);

  return (
    <Screen>
      <PageHeader
        title="Личный кабинет"
        description="Профиль и способы входа"
        action={
          <Button
            type="button"
            variant="ghost"
            className="text-sm"
            onClick={() => void signOut({ callbackUrl: "/" })}
          >
            Выйти
          </Button>
        }
      />

      <Panel className="flex items-center gap-4">
        <AccountAvatar
          name={user.name}
          email={user.email}
          image={user.image}
          size="md"
        />
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{title}</p>
          {user.email && (
            <p className="truncate text-sm text-slate-500">{user.email}</p>
          )}
          {formattedPhone && title !== formattedPhone && (
            <p className="truncate text-sm text-slate-500">{formattedPhone}</p>
          )}
        </div>
      </Panel>

      {stats && (
        <div className="grid gap-3 grid-cols-3">
          <StatCard
            label="Заказы"
            value={stats.orderCount}
            href="/orders"
            className="!p-3 [&_p:nth-child(2)]:text-2xl"
          />
          <StatCard
            label="В холоде"
            value={stats.inventoryCount}
            href="/fridge"
            className="!p-3 [&_p:nth-child(2)]:text-2xl"
          />
          <StatCard
            label="Корзина"
            value={stats.cartCount}
            tone="brand"
            href="/cart"
            className="!p-3 [&_p:nth-child(2)]:text-2xl"
          />
        </div>
      )}

      <Panel>
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Способы входа</h2>
        {loading ? (
          <LoadingBlock label="Загрузка…" />
        ) : error ? (
          <p className="text-sm text-slate-500">
            Не удалось загрузить список. Обновите страницу.
          </p>
        ) : (providers ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">Способы входа не найдены.</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-slate-600">
            {(providers ?? []).map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="text-emerald-600" aria-hidden>
                  ✓
                </span>
                {labelAuthProvider(p)}
              </li>
            ))}
          </ul>
        )}
        <LinkButton href="/login?callbackUrl=/account" variant="secondary" className="mt-3">
          Добавить способ входа
        </LinkButton>
      </Panel>

      <StatusBanner variant="success">
        Заказы, холодильник, корзина и семейные профили привязаны к этому аккаунту.
        При первом входе данные с гостевого режима переносятся автоматически.
      </StatusBanner>

      <div className="grid gap-2 sm:grid-cols-2">
        <LinkButton href="/">Главная и расходы</LinkButton>
        <LinkButton href="/family" variant="secondary">
          Семья и профили
        </LinkButton>
        <LinkButton href="/sources" variant="secondary">
          Источники заказов
        </LinkButton>
        <LinkButton href="/settings" variant="secondary">
          Настройки
        </LinkButton>
      </div>
    </Screen>
  );
}
