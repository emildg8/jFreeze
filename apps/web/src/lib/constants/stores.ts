export const STORE_LABELS: Record<string, string> = {
  demo: "Демо-магазин",
  manual: "Ручной ввод",
  csv: "CSV / JSON",
  receipt: "Чек",
  ozon: "Озон",
  samokat: "Самокат",
  pyaterochka: "Пятёрочка",
  perekrestok: "Перекрёсток",
};

export function getStoreLabel(storeId: string): string {
  return STORE_LABELS[storeId] ?? storeId;
}
