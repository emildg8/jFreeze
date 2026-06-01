/** Относительное время для UI (ru) */
export function formatRelativeRu(date: Date, now = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "скоро";

  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин. назад`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн. назад`;

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}
