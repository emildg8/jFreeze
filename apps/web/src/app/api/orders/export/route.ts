import { NextResponse } from "next/server";
import {
  exportFilename,
  EXPORT_MIME,
  flattenOrdersForExport,
  ordersToCsv,
  ordersToExcelXml,
  ordersToJson,
  type ExportFormat,
} from "@/lib/export/orders";
import { listOrdersWithItems } from "@/lib/services/orders";

function parseFormat(value: string | null): ExportFormat {
  if (value === "csv" || value === "json" || value === "xls") return value;
  return "xls";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = parseFormat(searchParams.get("format"));
    const sinceDays = parseInt(searchParams.get("sinceDays") ?? "0", 10);

    let orders = listOrdersWithItems();

    if (sinceDays > 0) {
      const since = new Date();
      since.setDate(since.getDate() - sinceDays);
      orders = orders.filter((o) => o.orderedAt >= since);
    }

    const rows = flattenOrdersForExport(orders);
    const filename = exportFilename(format === "xls" ? "xls" : format);

    if (format === "json") {
      const body = ordersToJson(orders);
      return new NextResponse(body, {
        headers: {
          "Content-Type": EXPORT_MIME.json,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "csv") {
      const bom = "\uFEFF";
      const body = bom + ordersToCsv(rows);
      return new NextResponse(body, {
        headers: {
          "Content-Type": EXPORT_MIME.csv,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const xml = ordersToExcelXml(rows);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": EXPORT_MIME.xls,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка экспорта" }, { status: 500 });
  }
}
