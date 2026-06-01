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
        <p className="font-semibold text-slate-800">jFreeze pre-alpha 0.1</p>
        <p className="mt-1 leading-relaxed">
          Умная корзина · холодильник · AI · семейные профили · PWA
        </p>
      </Panel>
    </Screen>
  );
}
