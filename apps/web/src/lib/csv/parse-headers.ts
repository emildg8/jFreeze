/** Находит индексы колонок в CSV-заголовке (RU/EN). */
export function parseCsvHeader(headerLine: string) {
  const header = headerLine.split(",").map((h) => h.trim().toLowerCase());

  const nameIdx = header.findIndex(
    (h) =>
      h.includes("name") ||
      h.includes("товар") ||
      h.includes("наименование") ||
      h.includes("product"),
  );
  const qtyIdx = header.findIndex(
    (h) =>
      h.includes("qty") ||
      h.includes("quantity") ||
      h.includes("кол") ||
      h === "кол-во",
  );
  const dateIdx = header.findIndex(
    (h) => h.includes("date") || h.includes("дата"),
  );
  const unitIdx = header.findIndex(
    (h) => h.includes("unit") || h.includes("ед"),
  );
  const priceIdx = header.findIndex(
    (h) => h.includes("цена") || h.includes("price") || h.includes("sum"),
  );

  return { nameIdx, qtyIdx, dateIdx, unitIdx, priceIdx, header };
}
