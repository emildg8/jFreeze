"use client";

import { useSession } from "next-auth/react";
import { Panel } from "@/components/ui/Panel";
import { LinkButton } from "@/components/ui/LinkButton";

interface HomeAccountPromptProps {
  orderCount: number;
  inventoryCount: number;
}

/** Напоминание гостю сохранить данные в аккаунте (идея продукта: один профиль на всех устройствах). */
export function HomeAccountPrompt({
  orderCount,
  inventoryCount,
}: HomeAccountPromptProps) {
  const { status } = useSession();

  if (status !== "unauthenticated") return null;
  if (orderCount === 0 && inventoryCount === 0) return null;

  return (
    <Panel variant="accent" className="text-sm">
      <p className="font-medium text-slate-800">Сохраните прогресс в аккаунте</p>
      <p className="mt-1 leading-relaxed text-slate-600">
        Сейчас данные только на этом устройстве. Войдите по телефону или почте — заказы,
        холодильник и корзина перенесутся в ваш профиль.
      </p>
      <LinkButton href="/login?callbackUrl=/" className="mt-3 w-full sm:w-auto">
        Войти или зарегистрироваться
      </LinkButton>
    </Panel>
  );
}
