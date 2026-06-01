"use client";

import { useSession } from "next-auth/react";
import { NavCard } from "@/components/ui/NavCard";
import { accountDisplayName } from "@/lib/auth/profile";

export function MoreAccountCard() {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return (
      <NavCard
        href="/login"
        label="Личный кабинет"
        description="Загрузка…"
        icon="👤"
      />
    );
  }

  if (user) {
    const title = accountDisplayName(user.name, user.phone);
    return (
      <NavCard
        href="/account"
        label="Личный кабинет"
        description={`Вы вошли как ${title}`}
        icon="👤"
      />
    );
  }

  return (
    <NavCard
      href="/login"
      label="Войти в аккаунт"
      description="Телефон, почта, Google или Apple — синхронизация данных"
      icon="👤"
    />
  );
}
