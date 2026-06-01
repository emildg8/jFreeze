import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { NavCard } from "@/components/ui/NavCard";
import { Panel } from "@/components/ui/Panel";
import { PageHeader } from "@/components/ui/PageHeader";

const links = [
  {
    href: "/storage",
    label: "Гайд по хранению",
    description: "Температура, полки, сроки",
    icon: "📖",
  },
  {
    href: "/family",
    label: "Семья",
    description: "Профили холодильника",
    icon: "👨‍👩‍👧",
  },
  {
    href: "/pro",
    label: "jFreeze Pro",
    description: "Подписка и AI",
    icon: "⭐",
  },
  {
    href: "/sources",
    label: "Источники заказов",
    description: "Почта, SMS, магазины РФ",
    icon: "📬",
  },
  {
    href: "/platforms",
    label: "Все платформы",
    description: "Web, Windows, Android, iOS, Telegram, Chrome",
    icon: "📲",
  },
  {
    href: "/orders",
    label: "Расширение для браузера",
    description: "Чеки из Gmail и Ozon — см. docs/BROWSER_EXTENSION.md",
    icon: "🧩",
  },
  {
    href: "/export",
    label: "Экспорт и интеграции",
    description: "Excel, CSV, JSON для других приложений",
    icon: "📊",
  },
  {
    href: "/settings",
    label: "Настройки",
    description: "Магазины, импорт, ключи",
    icon: "⚙️",
  },
];

export default function MorePage() {
  return (
    <Screen>
      <PageHeader title="Ещё" description="Разделы и справочники" />

      <Section>
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <NavCard
                href={link.href}
                label={link.label}
                description={link.description}
                icon={link.icon}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Panel variant="muted" className="text-sm text-slate-500">
        <p className="font-semibold text-slate-800">jFreeze 0.2.1-pre-alpha</p>
        <p className="mt-1 leading-relaxed">
          IMAP · QR ОФД · расходы по категориям · Telegram · расширение Chrome · BYOK AI
        </p>
      </Panel>
    </Screen>
  );
}
