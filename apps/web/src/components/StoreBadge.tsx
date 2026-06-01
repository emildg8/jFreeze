import type { ConnectorAvailability } from "@/connectors/types";

const labels: Record<ConnectorAvailability, string> = {
  active: "Подключено",
  beta: "Бета",
  planned: "Скоро",
};

const colors: Record<ConnectorAvailability, string> = {
  active: "bg-emerald-100 text-emerald-800",
  beta: "bg-amber-100 text-amber-800",
  planned: "bg-slate-100 text-slate-600",
};

export function StoreBadge({
  availability,
}: {
  availability: ConnectorAvailability | string;
}) {
  const key = (availability in labels
    ? availability
    : "planned") as ConnectorAvailability;
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[key]}`}
    >
      {labels[key]}
    </span>
  );
}
