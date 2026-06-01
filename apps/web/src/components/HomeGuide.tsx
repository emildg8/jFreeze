"use client";

import { Panel } from "./ui/Panel";
import { LinkButton } from "./ui/LinkButton";

interface HomeGuideProps {
  orderCount: number;
  inventoryCount: number;
  cartCount: number;
  onboardingDone: boolean;
  /** Гость с данными — подсказка про аккаунт */
  suggestAccount?: boolean;
}

interface GuideCard {
  id: string;
  emoji: string;
  title: string;
  text: string;
  href: string;
  cta: string;
  variant?: "primary" | "secondary";
}

function buildCards(props: HomeGuideProps): GuideCard[] {
  const cards: GuideCard[] = [];

  if (props.orderCount === 0) {
    cards.push({
      id: "receipt",
      emoji: "🧾",
      title: "С чего начать",
      text: "Отсканируйте QR с кассового чека или загрузите демо — так появится история покупок и расходы по категориям.",
      href: "/orders",
      cta: "Добавить чек",
      variant: "primary",
    });
  }

  if (props.orderCount > 0 && props.inventoryCount === 0) {
    cards.push({
      id: "fridge",
      emoji: "🧊",
      title: "Что есть дома",
      text: "Добавьте продукты в холодильник или сфотографируйте полки — корзина не предложит лишнее.",
      href: "/fridge",
      cta: "Открыть холодильник",
      variant: props.orderCount > 0 && cards.length === 0 ? "primary" : "secondary",
    });
  }

  if (
    props.orderCount > 0 &&
    props.inventoryCount > 0 &&
    props.cartCount === 0
  ) {
    cards.push({
      id: "cart",
      emoji: "🛒",
      title: "Пора в магазин",
      text: "Соберите умную корзину: учтём ваши привычки, запасы и приоритет (цена / качество / здоровье).",
      href: "/cart",
      cta: "Собрать корзину",
      variant: "primary",
    });
  }

  if (props.orderCount > 0 && cards.length < 2) {
    cards.push({
      id: "sources",
      emoji: "📬",
      title: "Автоимпорт заказов",
      text: "Подключите почту (IMAP) или перешлите SMS — меньше ручного ввода с Ozon и др.",
      href: "/sources",
      cta: "Источники",
      variant: "secondary",
    });
  }

  if (
    props.suggestAccount &&
    props.orderCount + props.inventoryCount > 0 &&
    cards.length < 2
  ) {
    cards.push({
      id: "account",
      emoji: "👤",
      title: "На всех устройствах",
      text: "Войдите в аккаунт — те же заказы и холодильник на телефоне, ПК и в Telegram-боте.",
      href: "/login?callbackUrl=/",
      cta: "Войти",
      variant: "secondary",
    });
  }

  return cards.slice(0, 2);
}

export function HomeGuide(props: HomeGuideProps) {
  if (!props.onboardingDone) return null;

  const cards = buildCards(props);
  if (!cards.length) return null;

  return (
    <div className="space-y-2">
      {cards.map((card) => (
        <Panel
          key={card.id}
          variant={card.variant === "primary" ? "accent" : "muted"}
          className="text-sm"
        >
          <p className="font-medium text-slate-800">
            <span className="mr-1.5" aria-hidden>
              {card.emoji}
            </span>
            {card.title}
          </p>
          <p className="mt-1 leading-relaxed text-slate-600">{card.text}</p>
          <LinkButton
            href={card.href}
            variant={card.variant === "primary" ? "primary" : "secondary"}
            className="mt-3 w-full sm:w-auto"
          >
            {card.cta}
          </LinkButton>
        </Panel>
      ))}
    </div>
  );
}
