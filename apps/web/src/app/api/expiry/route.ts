import { NextResponse } from "next/server";
import { listExpiryAlerts, getExpirySummary } from "@/lib/services/expiry";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "7", 10);
    return NextResponse.json({
      alerts: listExpiryAlerts(days),
      summary: getExpirySummary(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
