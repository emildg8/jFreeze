import { APP_VERSION } from "@/lib/app-version";
import { getStoreLabel } from "@/lib/constants/stores";
import type { listOrdersWithItems } from "@/lib/services/orders";

export type OrderWithItems = Awaited<
  ReturnType<typeof listOrdersWithItems>
>[number];

export interface OrderExportRow {
  orderId: string;
  externalId: string;
  orderedAt: string;
  storeId: string;
  storeName: string;
  orderTotalRub: string;
  itemName: string;
  normalizedName: string;
  qty: number;
  unit: string;
  category: string;
}

const HEADERS: (keyof OrderExportRow)[] = [
  "orderId",
  "externalId",
  "orderedAt",
  "storeId",
  "storeName",
  "orderTotalRub",
  "itemName",
  "normalizedName",
  "qty",
  "unit",
  "category",
];

const HEADER_LABELS: Record<keyof OrderExportRow, string> = {
  orderId: "ID заказа",
  externalId: "Внешний ID",
  orderedAt: "Дата",
  storeId: "Код магазина",
  storeName: "Магазин",
  orderTotalRub: "Сумма заказа, ₽",
  itemName: "Товар",
  normalizedName: "Нормализованное имя",
  qty: "Количество",
  unit: "Ед.",
  category: "Категория",
};

export function flattenOrdersForExport(orders: OrderWithItems[]): OrderExportRow[] {
  const rows: OrderExportRow[] = [];

  for (const order of orders) {
    const base = {
      orderId: order.id,
      externalId: order.externalId ?? "",
      orderedAt: order.orderedAt.toISOString().slice(0, 10),
      storeId: order.storeId,
      storeName: getStoreLabel(order.storeId),
      orderTotalRub:
        order.totalRub != null ? String(order.totalRub) : "",
    };

    if (order.items.length === 0) {
      rows.push({
        ...base,
        itemName: "",
        normalizedName: "",
        qty: 0,
        unit: "",
        category: "",
      });
      continue;
    }

    for (const item of order.items) {
      rows.push({
        ...base,
        itemName: item.name,
        normalizedName: item.normalizedName,
        qty: item.qty,
        unit: item.unit ?? "шт",
        category: item.category ?? "",
      });
    }
  }

  return rows;
}

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function ordersToCsv(rows: OrderExportRow[]): string {
  const headerLine = HEADERS.map((h) => escapeCsvCell(HEADER_LABELS[h])).join(";");
  const body = rows.map((row) =>
    HEADERS.map((h) => escapeCsvCell(row[h])).join(";"),
  );
  return [headerLine, ...body].join("\r\n");
}

/** UTF-8 BOM — Excel в Windows корректно открывает кириллицу */
export function ordersToCsvBlob(rows: OrderExportRow[]): Blob {
  const bom = "\uFEFF";
  return new Blob([bom + ordersToCsv(rows)], {
    type: "text/csv;charset=utf-8",
  });
}

export function ordersToJson(orders: OrderWithItems[]): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "jFreeze",
    version: APP_VERSION,
    orders: orders.map((o) => ({
      id: o.id,
      storeId: o.storeId,
      storeName: getStoreLabel(o.storeId),
      externalId: o.externalId,
      orderedAt: o.orderedAt.toISOString(),
      totalRub: o.totalRub,
      items: o.items.map((i) => ({
        name: i.name,
        normalizedName: i.normalizedName,
        qty: i.qty,
        unit: i.unit,
        category: i.category,
      })),
    })),
  };
  return JSON.stringify(payload, null, 2);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** SpreadsheetML — открывается в Excel без npm-пакетов */
export function ordersToExcelXml(rows: OrderExportRow[]): string {
  const headerCells = HEADERS.map(
    (h) =>
      `<Cell><Data ss:Type="String">${escapeXml(HEADER_LABELS[h])}</Data></Cell>`,
  ).join("");

  const dataRows = rows
    .map((row) => {
      const cells = HEADERS.map((h) => {
        const val = row[h];
        const isNumber = h === "qty" && typeof val === "number";
        const type = isNumber ? "Number" : "String";
        const data = isNumber ? String(val) : escapeXml(String(val));
        return `<Cell><Data ss:Type="${type}">${data}</Data></Cell>`;
      }).join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Заказы">
  <Table>
   <Row ss:StyleID="Header">${headerCells}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function exportFilename(ext: "csv" | "xls" | "json"): string {
  const d = new Date().toISOString().slice(0, 10);
  return `jfreeze-zakazy-${d}.${ext}`;
}

export type ExportFormat = "csv" | "xls" | "json";

export const EXPORT_MIME: Record<ExportFormat, string> = {
  csv: "text/csv;charset=utf-8",
  xls: "application/vnd.ms-excel",
  json: "application/json;charset=utf-8",
};
