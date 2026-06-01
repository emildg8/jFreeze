export interface CsvTemplate {
  id: string;
  name: string;
  description: string;
  headers: string;
  sample: string;
}

export const CSV_TEMPLATES: CsvTemplate[] = [
  {
    id: "generic",
    name: "Универсальный",
    description: "name, qty, unit, date",
    headers: "name,qty,unit,date",
    sample: `name,qty,unit,date
Молоко 2.5% 1л,2,шт,2026-05-28
Хлеб белый,1,шт,2026-05-28`,
  },
  {
    id: "receipt",
    name: "Чек (товар, количество, сумма)",
    description: "товар, количество, цена, дата",
    headers: "товар,количество,цена,дата",
    sample: `товар,количество,цена,дата
МОЛОКО 2.5% 1Л,2,89.90,2026-05-28
ХЛЕБ БЕЛЫЙ,1,45.00,2026-05-28`,
  },
  {
    id: "ozon",
    name: "Озон (экспорт)",
    description: "product_name, quantity, order_date",
    headers: "product_name,quantity,order_date",
    sample: `product_name,quantity,order_date
Сыр Российский 200г,1,2026-05-20
Молоко 3.2% 1л,2,2026-05-20`,
  },
  {
    id: "pyaterochka",
    name: "Пятёрочка (выгрузка)",
    description: "Наименование, Кол-во, Дата",
    headers: "Наименование,Кол-во,Дата",
    sample: `Наименование,Кол-во,Дата
Яйца С1 10шт,1,2026-05-15
Бананы,1,2026-05-15`,
  },
];

export function getTemplate(id: string): CsvTemplate | undefined {
  return CSV_TEMPLATES.find((t) => t.id === id);
}
