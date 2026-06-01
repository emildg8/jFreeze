"use client";

import { Screen } from "@/components/ui/Screen";
import { PageHeader } from "@/components/ui/PageHeader";
import { NavCard } from "@/components/ui/NavCard";
import { Section } from "@/components/ui/Section";
import { Panel } from "@/components/ui/Panel";

const PLATFORMS = [
  {
    id: "web",
    label: "Веб и PWA",
    description: "Полная версия в браузере, установка на планшет",
    icon: "🌐",
    href: "/",
  },
  {
    id: "win",
    label: "Windows",
    description: "Программа с локальной базой — npm run build:desktop",
    icon: "🖥️",
    href: "/more",
  },
  {
    id: "android",
    label: "Android",
    description: "Телефон и планшет — Capacitor, см. docs/PLATFORMS.md",
    icon: "🤖",
    href: "/settings",
  },
  {
    id: "ios",
    label: "iPhone / iPad",
    description: "Capacitor iOS — Xcode на Mac",
    icon: "📱",
    href: "/settings",
  },
  {
    id: "tg",
    label: "Telegram-бот",
    description: "Уведомления и семейная лента файлов",
    icon: "✈️",
    href: "/family",
  },
  {
    id: "ext",
    label: "Расширение Chrome",
    description: "Чеки из почты и маркетплейсов — extensions/browser",
    icon: "🧩",
    href: "/orders",
  },
] as const;

export default function PlatformsPage() {
  return (
    <Screen>
      <PageHeader description="Шесть способов пользоваться jFreeze" />

      <Section title="Клиенты">
        <ul className="space-y-2">
          {PLATFORMS.map((p) => (
            <li key={p.id}>
              <NavCard href={p.href} label={p.label} description={p.description} icon={p.icon} />
            </li>
          ))}
        </ul>
      </Section>

      <Panel variant="muted" className="text-sm text-slate-600 leading-relaxed">
        <p>
          Мобильные приложения подключаются к серверу jFreeze (ПК в Wi‑Fi или VPS). Настройте адрес
          в <strong>Настройки → Сервер jFreeze</strong>.
        </p>
        <p className="mt-2">
          Полная инструкция для команды: <code className="text-xs">docs/PLATFORMS.md</code> в
          репозитории.
        </p>
      </Panel>
    </Screen>
  );
}
