"use client";

import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { Screen } from "@/components/ui/Screen";
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

interface AccountCabinetProps {
  session: Session;
}

export function AccountCabinet({ session }: AccountCabinetProps) {
  const user = session.user;
  const { providers, phone, loading, error } = useLinkedAccount(user.phone);

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
        Заказы, холодильник и настройки привязаны к этому аккаунту на сервере.
      </StatusBanner>

      <div className="grid gap-2 sm:grid-cols-2">
        <LinkButton href="/orders">Мои заказы</LinkButton>
        <LinkButton href="/fridge" variant="secondary">
          Холодильник
        </LinkButton>
        <LinkButton href="/settings" variant="secondary">
          Настройки
        </LinkButton>
        <LinkButton href="/" variant="secondary">
          На главную
        </LinkButton>
      </div>
    </Screen>
  );
}
